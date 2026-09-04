const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const MerCore = require('../core.js');
const MerStateStore = require('../state-store.js');

const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const assessment = source.slice(source.indexOf('function setAssessmentStep('), source.indexOf('function openBudgetEditor('));

function harness(overrides = {}) {
  const element = () => ({ value:'', checked:false, hidden:false, disabled:false, textContent:'', classList:{toggle(){}} });
  const ids = ['incomeInput','billsInput','savingsInput','savingsBalanceInput','assessmentSave','assessmentBack','assessmentNext','recommendedBudget','assessmentNotice','assessmentModal','savingsBalancePlanHint'];
  const elements = Object.fromEntries(ids.map(id => [`#${id}`,element()]));
  elements['.plan-preview'] = element();
  const radios = [.15,.1,.05].map(value=>({...element(),value:String(value)}));
  const state = {
    income:3000,bills:500,savingsTarget:450,savingsBalance:1000,guard:.1,spent:5000,
    categories:[{id:'food',limit:600,spent:3500},{id:'transport',limit:400,spent:1500}],
    goalBuckets:[{id:'primary',primary:true,current:1000}],
    transactions:[{id:'recorded',type:'expense',amount:5000}],
    ...overrides
  };
  const calls = [];
  const context = {
    state,MerCore,assessmentStep:1,currentLang:'hr',
    $: selector => selector === '#assessmentForm input[name="guard"]:checked' ? radios.find(input=>input.checked) : elements[selector],
    $$: selector => selector === '#assessmentForm input[name="guard"]' ? radios : selector === '#assessmentForm input[type="number"]' ? ids.slice(0,4).map(id=>elements[`#${id}`]) : [],
    t:(key,values={})=>key==='planPerMonth'?`${values.amount} / mjesec`:key,
    currency: value => `${value} €`,
    openModal:()=>calls.push('open'),closeModal:()=>calls.push('close'),save:reason=>calls.push(reason),showToast:message=>calls.push(message)
  };
  vm.createContext(context);
  vm.runInContext(assessment,context);
  context.openAssessment();
  // Native input.value setters stringify numeric state assignments.
  ids.slice(0,4).forEach(id=>{elements[`#${id}`].value=String(elements[`#${id}`].value);});
  calls.length=0;
  return {context,state,elements,radios,calls};
}

test('evaluation cycle 1: missing or unsupported reserve restores the balanced 10 percent card', () => {
  for(const guard of [undefined,null,.2,NaN]) {
    const {context,radios}=harness({guard});
    assert.equal(radios.filter(input=>input.checked).length,1);
    assert.equal(Number(radios.find(input=>input.checked).value),.1);
    assert.equal(context.readAssessmentPlan().valid,true);
  }
});

test('evaluation cycle 1: every valid reserve enables Apply despite higher recorded spending', () => {
  const {context,radios,elements}=harness();
  for(const radio of radios) {
    radios.forEach(input=>{input.checked=input===radio;});
    context.setAssessmentStep(3);
    assert.equal(elements['#assessmentSave'].disabled,false);
    assert.match(elements['#assessmentNotice'].textContent,/postojeće transakcije ostaju nepromijenjene/);
  }
});

test('evaluation cycle 1: applying updates category calculations, saves, closes, and reports success', () => {
  const {context,state,calls}=harness();
  const transactions=JSON.stringify(state.transactions);
  context.applyAssessmentPlan({preventDefault(){}});
  assert.equal(state.categories.reduce((sum,cat)=>sum+cat.limit,0),1750);
  assert.deepEqual(state.categories.map(cat=>cat.limit),[1050,700]);
  assert.equal(JSON.stringify(state.transactions),transactions);
  assert.deepEqual(state.categories.map(cat=>cat.spent),[3500,1500]);
  assert.deepEqual(calls,['plan-update','close','planReady']);
});

test('evaluation cycle 1: zero or overcommitted plans are warnings, not a disabled dead end', () => {
  const {context,elements,state}=harness({income:500,bills:500,savingsTarget:450});
  context.setAssessmentStep(3);
  assert.equal(elements['#assessmentSave'].disabled,false);
  assert.match(elements['#assessmentNotice'].textContent,/kategorije trenutačno ostaje 0 €/);
  context.applyAssessmentPlan({preventDefault(){}});
  assert.equal(state.categories.reduce((sum,cat)=>sum+cat.limit,0),0);
  assert.equal(state.transactions.length,1);
});

test('evaluation cycle 1: malformed or negative input does not persist a plan', () => {
  for(const value of ['', '-5', 'NaN', 'Infinity', '9007199254740991']) {
    const {context,elements,calls}=harness();
    elements['#incomeInput'].value=value;
    context.updateRecommendation();
    assert.equal(elements['#assessmentSave'].disabled,true);
    context.applyAssessmentPlan({preventDefault(){}});
    assert.ok(!calls.includes('plan-update'));
  }
});

test('evaluation cycle 1: missing radio cannot throw or submit malformed state', () => {
  const {context,radios,elements}=harness();
  radios.forEach(input=>{input.checked=false;});
  assert.doesNotThrow(()=>context.updateRecommendation());
  assert.equal(elements['#assessmentSave'].disabled,true);
});

test('evaluation cycle 1: category budgets distribute exact cents including empty allocations', () => {
  const {context,state}=harness({categories:[{id:'one',limit:0},{id:'two',limit:0},{id:'three',limit:0}]});
  context.scaleCategoryLimits(100.01);
  assert.deepEqual(state.categories.map(cat=>cat.limit),[33.34,33.34,33.33]);
  assert.equal(Math.round(state.categories.reduce((sum,cat)=>sum+cat.limit,0)*100),10001);
  state.categories=[];
  assert.doesNotThrow(()=>context.scaleCategoryLimits(100));
});

test('evaluation cycle 1: changing planned income does not manufacture posted income or change net balance', () => {
  const {context,state,elements}=harness({transactions:[
    {id:'salary',type:'income',amount:3000,date:'2026-09-01',category:'salary'},
    {id:'expense',type:'expense',amount:820,date:'2026-09-02',category:'food'}
  ]});
  const before=MerCore.FinancialEngine.calculate(state,'2026-09-04');
  elements['#incomeInput'].value='6000';
  context.applyAssessmentPlan({preventDefault(){}});
  const after=MerCore.FinancialEngine.calculate(state,'2026-09-04');
  assert.equal(state.income,6000);
  assert.equal(after.plannedIncome,6000);
  assert.equal(after.monthlyIncome,3000);
  assert.equal(after.cashFlowNet,before.cashFlowNet);
  assert.equal(after.availableBalance,before.availableBalance);
  assert.equal(state.transactions.length,2);
});

test('evaluation cycle 1: native radio change as well as input refreshes Apply immediately', () => {
  assert.match(source,/\['input','change'\]\.forEach\(eventName=>input\.addEventListener\(eventName/);
  assert.match(source,/assessmentForm'\)\.addEventListener\('submit',applyAssessmentPlan\)/);
  assert.doesNotMatch(assessment,/disabled\s*=.*state\.spent/);
});

test('evaluation cycle 1: changing a plan preserves aggregate savings and cash with multiple goals', () => {
  const {context,state,elements}=harness({
    goalBuckets:[{id:'primary',primary:true,current:1000,target:3000},{id:'holiday',current:500,target:2000}],
    savingsBalance:1500,financialOpeningBalance:10000,
    transactions:[{id:'salary',type:'income',amount:3000,date:'2026-09-01'},{id:'expense',type:'expense',amount:820,date:'2026-09-02',category:'food'}],
    savingsEntries:[{id:'deposit',amount:450,date:'2026-09-01',goalId:'primary'}]
  });
  MerStateStore.recalculateProfile(state,'2026-09-04');
  const before={savings:state.savingsBalance,cash:state.availableBalance,goals:JSON.stringify(state.goalBuckets),entries:JSON.stringify(state.savingsEntries)};
  elements['#incomeInput'].value='4000';
  context.applyAssessmentPlan({preventDefault(){}});
  MerStateStore.recalculateProfile(state,'2026-09-04');
  assert.equal(state.savingsBalance,before.savings);
  assert.equal(state.availableBalance,before.cash);
  assert.equal(JSON.stringify(state.goalBuckets),before.goals);
  assert.equal(JSON.stringify(state.savingsEntries),before.entries);
  // Repeated Apply must be idempotent for all actual money balances.
  context.applyAssessmentPlan({preventDefault(){}});
  MerStateStore.recalculateProfile(state,'2026-09-04');
  assert.equal(state.savingsBalance,1500);
  assert.equal(state.availableBalance,before.cash);
});

test('evaluation cycle 1: aggregate savings is an accessible read-only display in plan configuration', () => {
  const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  assert.match(html,/id="savingsBalanceInput"[^>]*readonly[^>]*aria-describedby="savingsBalancePlanHint"/);
  assert.match(html,/id="savingsBalancePlanHint">Ukupno u svim ciljevima/);
  assert.doesNotMatch(assessment,/primaryGoal\.current\s*=/);
});

test('evaluation cycle 1: proportional budget cents render no phantom zero-euro over-allocation', () => {
  const {context,state}=harness({categories:[480,200,240,80,120,400,120].map((limit,index)=>({id:`category-${index}`,limit,spent:0}))});
  context.scaleCategoryLimits(1900);
  // The original floating sum produces 1900.0000000000002 for these real plan shares.
  assert.ok(state.categories.reduce((sum,category)=>sum+category.limit,0)>1900);
  assert.equal(state.categories.reduce((sum,category)=>sum+Math.round(category.limit*100),0),190000);
  const elements=new Map();
  context.$=selector=>{
    if(!elements.has(selector)){
      const classes=new Set();
      elements.set(selector,{textContent:'',innerHTML:'',hidden:false,open:false,style:{},dataset:{},classList:{
        toggle(name,enabled){if(enabled)classes.add(name);else classes.delete(name);},
        contains:name=>classes.has(name)
      }});
    }
    return elements.get(selector);
  };
  context.getPlan=()=>({monthlyBudget:1900,safeRemaining:1080});
  context.budgetCategoryRow=()=>'';
  context.notificationFingerprint=()=> 'test-budget-fingerprint';
  context.isNotificationResolved=()=>false;
  const render=source.slice(source.indexOf('function renderBudgetView('),source.indexOf('function budgetCategoryPercent('));
  vm.runInContext(render,context);
  context.renderBudgetView();
  assert.equal(elements.get('#unallocatedValue').textContent,'allocated');
  assert.equal(elements.get('[data-layout-card="budget-allocation"]').classList.contains('is-over-allocated'),false);
  assert.equal(elements.get('.allocation-bar').classList.contains('over'),false);
  assert.equal(elements.get('#budgetRecovery').hidden,true);
  assert.equal(elements.get('#autoBalanceBudget').hidden,true);
  // Real cent over-allocation is still surfaced; only binary floating noise is removed.
  state.categories[0].limit=MerCore.roundMoney(state.categories[0].limit+.01);
  context.renderBudgetView();
  assert.equal(elements.get('#unallocatedValue').textContent,'overAllocated');
  assert.equal(elements.get('[data-layout-card="budget-allocation"]').classList.contains('is-over-allocated'),true);
  assert.equal(elements.get('#budgetRecovery').hidden,false);
});
