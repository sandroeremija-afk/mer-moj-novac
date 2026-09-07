'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const between=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
const nodes=new Map();
let opens=0,notices=[];
const context=vm.createContext({state:{availableBalance:500,bills:0,savingsTarget:100,accountLabel:'personalAccount',goalBuckets:[{id:'g',name:'Rezerva',current:200,target:1000}],savingsEntries:[{id:'automatic',goalId:'g',amount:200,date:'2026-09-07',note:'Raspodjela',locked:true,sourceType:'enterprise-automation'},{id:'manual',goalId:'g',amount:20,date:'2026-09-07',note:'Uplata'}]},editingSavingsId:null,currentLang:'hr',
  $:selector=>{if(!nodes.has(selector))nodes.set(selector,{value:'10',innerHTML:'',textContent:'',focus(){}});return nodes.get(selector);},$$:()=>[],
  showToast:message=>notices.push(message),openModal:()=>opens++,updateSavingsCheck:()=>true,setTimeout:()=>0,escapeHtml:String,t:String,currency:value=>`${value} €`,locale:()=> 'hr-HR',Intl,Date});
vm.runInContext(between('function openSavingsDeposit(', 'function savingsHistoryIndexFor('),context);
vm.runInContext("openSavingsDeposit('automatic')",context);
assert.equal(opens,0,'generated deposits cannot open the manual editor');
assert.equal(context.editingSavingsId,null);
assert.match(notices[0],/izvornog prihoda ili pravila/);
vm.runInContext("openSavingsDeposit('manual')",context);
assert.equal(opens,1,'manual deposit editing remains available');
assert.equal(nodes.get('#savingsAmountInput').value,20);
vm.runInContext(between('function renderSavingsEntries()', 'function renderUpcoming()'),context);
vm.runInContext('renderSavingsEntries()',context);
assert.match(nodes.get('#savingsEntryList').innerHTML,/data-edit-savings="automatic" disabled/);
assert.doesNotMatch(nodes.get('#savingsEntryList').innerHTML,/data-edit-savings="manual" disabled/);
assert.match(nodes.get('#savingsEntryList').innerHTML,/Uredite izvorni prihod ili pravilo/);

// The delete handler must also refuse a generated entry if a stale editor was already open.
let deleteHandler;
const deletionContext=vm.createContext({state:context.state,editingSavingsId:'automatic',currentLang:'hr',showToast:message=>notices.push(message),
  $:()=>({addEventListener:(event,handler)=>{deleteHandler=handler;}}),MerCore:{applySavingsContribution:()=>{throw new Error('Generated deposit was mutated');}}});
const deleteStart="$('#deleteSavingsEntry').addEventListener";
const deletionLine=source.slice(source.indexOf(deleteStart)).split(/\r?\n/)[0];
vm.runInContext(deletionLine,deletionContext);
const before=JSON.stringify(context.state);deleteHandler();
assert.equal(JSON.stringify(context.state),before);
process.stdout.write('Generated deposits: rendered disabled actions, guarded editor and stale-delete protection passed.\n');
