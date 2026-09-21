'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Core = require('../core.js');
const Discovery = require('../discovery-core.js');
const Planning = require('../planning-core.js');
const Accounting = require('../accounting-core.js');
const Insights = require('../insight-core.js');
const Savings = require('../savings-minimal.js');
const read = file => fs.readFileSync(require.resolve('../' + file), 'utf8');
const app = read('app.js'), assistant = read('assistant-ui.js');
const between = (source, start, end) => {
  const from = source.indexOf(start), to = source.indexOf(end, from);
  assert.ok(from >= 0 && to > from, `${start} extraction boundary`);
  return source.slice(from, to);
};
function copy() {
  const context = {};
  vm.runInNewContext(app.slice(0, app.indexOf('const categoryMeta')) +
    assistant.slice(assistant.indexOf('  Object.assign'), assistant.indexOf('  applyStaticTranslations')) +
    ';this.copy=translations;', context);
  return context.copy;
}
const messages = copy();
const expense = (id, date, amount, extra = {}) => ({id, date, amount, type:'expense', category:'food', currency:'EUR', ...extra});
const amount = value => `${Number(value).toFixed(2)} EUR`;

test('budget explanations match actual income, planned-income reserve, commitments and inclusive daily divisor', () => {
  const profile = {income:2000, bills:400, savingsTarget:100, guard:.1, savingsBalance:500, financialOpeningBalance:100,
    transactions:[{id:'salary', type:'income', amount:1500, date:'2026-09-01'}, expense('spent','2026-09-20',300), expense('future','2026-09-25',999)]};
  const before = JSON.stringify(profile), result = Core.calculateFinancials(profile,'2026-09-21');
  assert.equal(result.buffer, 200, 'reserve uses planned income, not the 1500 recorded income');
  assert.equal(result.safeToSpend, 1500 - 400 - 100 - 200 - 300);
  assert.equal(result.days, 10, '21–30 September includes today');
  assert.equal(result.safeDaily, 50);
  assert.equal(result.availableBalance, 100 + 1500 - 300 - 500);
  assert.match(messages.hr.faqSafeAnswer, /prihoda.*obveze.*cilj štednje.*rezerva.*troškovi/);
  assert.match(messages.hr.faqSafeAnswer, /postotak planiranog prihoda/);
  assert.match(messages.hr.faqPaceAnswer, /uključujući danas/);
  assert.match(messages.hr.commitmentsProtected, /Ne rezervira novac u banci/);
  assert.match(messages.en.safeTooltip, /commitments.*planned savings.*buffer.*expenses/);
  assert.equal(JSON.stringify(profile), before);
});

test('expense warnings describe the real threshold boundaries without promising payment blocking', () => {
  assert.equal(Core.budgetThreshold(79,100).level,'green');
  assert.equal(Core.budgetThreshold(80,100).level,'yellow');
  assert.equal(Core.budgetThreshold(100,100).level,'red');
  assert.match(messages.hr.faqBudgetWarningAnswer,/80%.*100% ili više/);
  assert.match(messages.hr.transactionIntro,/ne sprječava spremanje stvarnog troška/);
  assert.match(messages.en.faqBudgetWarningAnswer,/save a real expense even if it exceeds/);
});

test('net and savings-rate explanations cover zero income and do not confuse goal transfers with income surplus', () => {
  const withoutIncome = Core.transactionTotals([expense('food','2026-09-20',50)],'monthly','2026-09-21');
  assert.equal(withoutIncome.net,-50);assert.equal(withoutIncome.savingsRate,null);
  const withIncome = Core.transactionTotals([{id:'income',type:'income',amount:200,date:'2026-09-01'},expense('food','2026-09-20',50)],'monthly','2026-09-21');
  assert.equal(withIncome.savingsRate,75);
  assert.match(messages.hr.noIncomeBody,/Neto iznos već uključuje evidentirane troškove/);
  assert.match(messages.hr.savingsRateTooltip,/÷ prihodi × 100/);
  assert.match(messages.hr.savingsRateTooltip,/nije zbroj uplata/);
  assert.match(messages.hr.faqSavingsRateAnswer,/bez pozitivnog prihoda ne računa se/);
  assert.match(messages.hr.netTooltip,/nije vrijednost ukupne imovine/);
  assert.match(messages.en.noIncomeBody,/net amount already includes recorded expenses/);
});

test('cash-flow explanation follows the 30-day chart layer, not only the conservative spending estimate', () => {
  const profile = {profileId:'personal', financialOpeningBalance:1000, goalBuckets:[{id:'reserve',current:100}], recurring:[],
    transactions:[expense('old','2026-09-20',100), expense('bill','2026-09-25',80),
      {id:'incoming',type:'income',name:'Salary',amount:500,date:'2026-09-25',currency:'EUR'}]};
  const before=JSON.stringify(profile), chart=Discovery.forecastChart(profile,'2026-09-21',{profileId:'personal',currency:'EUR'});
  assert.equal(chart.series.length,31);
  assert.equal(chart.series[0].balanceCents,80000);
  assert.equal(chart.series.at(-1).balanceCents,122000);
  assert.equal(chart.forecast.safeToSpendCents,72000,'projected income does not enter today’s spending estimate');
  for(const language of ['hr','en']) {
    const container={innerHTML:''};
    const context={el:()=>container, window:{}, intelligence:{},forecast:()=>chart.forecast,
      copy:(hr,en)=>language==='en'?en:hr,esc:value=>String(value),renderProjection(){},requestAnimationFrame(){},resizeProjection(){}};
    vm.createContext(context);
    vm.runInContext(between(read('enterprise-ui.js'),'  function renderForecast(','  function openIntelligence('),context);
    context.renderForecast();
    assert.match(container.innerHTML,language==='hr'?/za 30 dana.*već umanjen za štednju.*plus očekivani prihodi.*minus planirani/:/30-day estimate.*reduced by savings.*plus expected income.*minus scheduled/);
    assert.match(container.innerHTML,language==='hr'?/tek nakon knjiženja/:/only after posting/);
  }
  assert.equal(JSON.stringify(profile),before);
});

test('savings strategy and history describe stored plan values and displayed months without adequacy guarantees', () => {
  assert.equal(messages.hr.onTrackSave,'Planirana mjesečna uplata u štednju');
  assert.equal(messages.hr.thisYear,'PRIKAZANI MJESECI');
  assert.match(messages.hr.strategyCoverageBody,/podijeljena.*osnovnim mjesečnim obvezama/);
  assert.match(messages.hr.faqEmergencyFundAnswer,/manje od 1 izračun koristi 1/);
  assert.match(messages.hr.strategyBufferBody,/Planirani prihod ×/);
  assert.match(messages.hr.strategyContributionBody,/ne izvršena uplata/);
  assert.doesNotMatch(messages.hr.strategyRecommendationBody,/sigurno|zajamčeno|rizičnijih ulaganja/);
  const snapshot={profileId:'personal',profile:{savingsHistory:[0,100,200],savingsEntries:[{id:'old',date:'2020-01-01',amount:10},{id:'current',date:'2026-09-20',amount:100}]}};
  const detail=Savings.savingsDetail(snapshot);
  assert.equal(detail.total,300);assert.equal(detail.average,100,'zero months remain in the divisor');
  assert.equal(detail.entries.length,2,'record count is not restricted to displayed history months');
  const source=read('savings-minimal.js');
  assert.match(source,/prosjek uključuje i mjesece bez uplata/);
  assert.match(source,/zapisa o štednji u ovom profilu/);
  assert.doesNotMatch(source,/evidentiranih uplata u prikazanom razdoblju/);
});

test('history zero-baseline tooltip discloses the existing +100 marker without altering its calculation', () => {
  const nodes=new Map(), node=id=>{
    if(!nodes.has(id))nodes.set(id,{textContent:'',style:{},classList:{toggle(){}},setAttribute(name,value){this[name]=value;}});
    return nodes.get(id);
  };
  const state={savingsBalance:100,savingsGoal:1000,savingsTarget:50,bills:200,savingsHistory:[0,100]};
  const before=JSON.stringify(state), context={state,MerCore:Core,$:node,currency:amount,number:value=>String(value),getPlan:()=>({buffer:20}),savingsFinishDate:()=>'',
    t:key=>messages.hr[key],renderSavingsHistoryChart:()=>[{label:'kol',amount:0},{label:'ruj',amount:100}]};
  vm.createContext(context);
  vm.runInContext(between(app,'function renderSavingsView()','function renderSavingsEntries()'),context);
  context.renderSavingsView();
  assert.equal(node('#savingsTrendBadge').textContent,'+100%');
  assert.match(node('#savingsTrendBadge').title,/ne usporediv postotni rast/);
  assert.match(node('#savingsTrendBadge')['aria-label'],/Prethodni mjesec bio je 0/);
  assert.equal(JSON.stringify(state),before);
});

test('goal helper matches the rounded month estimate and its minimum one-month divisor', () => {
  const goal={current:100,target:1000,dueDate:'2026-11-21'};
  const result=Accounting.goalMetrics(goal,'2026-09-21');
  assert.equal(result.monthsRemaining,Math.ceil(61/30.4375));
  assert.equal(result.monthlyRequired,300);
  assert.equal(Accounting.goalMetrics({...goal,dueDate:'2026-09-20'},'2026-09-21').monthlyRequired,900);
  const source=read('savings-minimal.js');
  assert.match(source,/30,44 dana po mjesecu, zaokruženo naviše na najmanje 1 mjesec/);
  assert.match(source,/Prinos nije uključen/);
});

test('FIRE explanation renders both languages and matches target, real return and contribution-rate denominators', () => {
  const draft={netWorth:10000,monthlyContribution:200,monthlySpending:800,annualReturn:5,withdrawalRate:4,inflation:2};
  const before=JSON.stringify(draft), result=Planning.calculateFire(draft,{referenceDate:'2026-09-21'});
  assert.equal(result.targetCents,24000000);
  assert.equal(result.savingRatePercent,20,'summary rate uses contributions + spending, not the profile income slider');
  assert.equal(result.realAnnualRate,1.05/1.02-1);
  assert.equal(result.downside.annualReturn,3);
  const source=read('planning-ui.js');
  for(const language of ['hr','en']) {
    const nodes=new Map(), el=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',disabled:false});return nodes.get(id);};
    const context={root:{},fireDialog:{},P:Planning,fireDraft:draft,options:()=>({referenceDate:'2026-09-21'}),el,
      say:(hr,en)=>language==='en'?en:hr,english:()=>language==='en',esc:String,money:cents=>amount(cents/100),dateLabel:String,
      projectionPanel:'overview',tabs:()=>'',panel:(_id,_key,_selected,content)=>content};
    vm.createContext(context);
    vm.runInContext(between(source,'  function renderProjection()','  function renewalEditor('),context);
    context.renderProjection();
    const html=el('fireProjection').innerHTML;
    assert.match(html,language==='hr'?/Uplate ÷ \(uplate \+ troškovi\).*20,0%/:/Contributions ÷ \(contributions \+ spending\).*20\.0%/);
    assert.match(html,language==='hr'?/mjesečni troškovi × 12 ÷ godišnja stopa povlačenja/:/monthly spending × 12 ÷ annual withdrawal rate/);
    assert.match(html,language==='hr'?/Stalne stope.*pretpostavke, ne obećanje/:/Constant rates.*assumptions, not a promise/);
    assert.match(html,language==='hr'?/porezi, naknade i tržišne promjene nisu uključeni/:/taxes, fees and market swings are excluded/);
    assert.equal(el('saveFirePlan').disabled,false);
  }
  assert.equal(JSON.stringify(draft),before);
});

test('FIRE percentage labels use Croatian commas or English decimal points without changing input values', () => {
  const source=read('planning-ui.js');
  for(const language of ['hr','en']) {
    const nodes=new Map(),el=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',querySelectorAll:()=>[]});return nodes.get(id);};
    const draft={monthlyContribution:354};
    const context={el,fireDraft:draft,sliderDefinitions:[],monthlyIncome:()=>1000,document:{activeElement:null},
      say:(hr,en)=>language==='en'?en:hr,english:()=>language==='en',money:amount};
    vm.createContext(context);
    vm.runInContext(between(source,'  function syncFireInputs()','  function renderFire()'),context);
    context.syncFireInputs();
    assert.equal(el('fireSavingsRateValue').textContent,language==='hr'?'35,4%':'35.4%');
    assert.equal(el('fire-savingsRate').value,'35.4','range input keeps its machine-readable decimal value');
    assert.equal(draft.monthlyContribution,354);
  }
  assert.match(source,/Number\(Number\(event\.target\.value\)\.toFixed\(definition\.monetary\?2:1\)\)/,'input normalization is unchanged');
});

test('cash-balance titles and expense-classification wording follow the real precedence', () => {
  const profile={categories:[{id:'utilities',expenseBehavior:'fixed'}],recurring:[{id:'rent',name:'Rent'}]};
  assert.equal(Insights.classifyExpense({category:'utilities',expenseBehavior:'variable',recurringId:'rent'},profile).reason,'transaction-override');
  assert.equal(Insights.classifyExpense({category:'utilities',recurringId:'rent'},profile).reason,'category-override');
  assert.equal(Insights.classifyExpense({category:'other',recurringId:'rent'},profile).reason,'recurring');
  const context={};
  vm.runInNewContext(between(app,'const insightDetailCopy =','function insightMonthLabel(')+';this.copy=insightDetailCopy;',context);
  assert.equal(context.copy.hr.netView.title,'Kumulativno stanje novca');
  assert.equal(context.copy.en.netView.title,'Recorded cash balance trend');
  assert.match(context.copy.hr.structureView.intro,/transakcije ima prednost, zatim oznaka kategorije/);
  assert.match(context.copy.hr.cashflowView.intro,/12 mjeseci.*sažetak na vrhu odabrano razdoblje/);
  assert.match(context.copy.hr.savingsView.intro,/6 mjeseci.*prosjek za posljednjih 12/);
});
