'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');

function request(body){return {method:'POST',headers:{host:'mer.test',origin:'https://mer.test','content-type':'application/json'},body,socket:{remoteAddress:'127.0.0.1'}};}
function response(){return {headers:{},statusCode:200,setHeader(key,value){this.headers[key.toLowerCase()]=value;},end(raw){this.body=JSON.parse(raw);}};}
function sdkFetch(message,inspect){return async(url,options)=>{
  assert.equal(String(url),'https://api.openai.com/v1/chat/completions');
  assert.equal(new Headers(options.headers).get('Authorization'),'Bearer local-sdk-test-key');
  const body=JSON.parse(options.body);assert.equal(body.model,'gpt-4o-mini');inspect(body);
  return new Response(JSON.stringify({id:'test-completion',object:'chat.completion',created:1,model:'gpt-4o-mini',choices:[{index:0,finish_reason:message.tool_calls?'tool_calls':'stop',message}]}),{status:200,headers:{'Content-Type':'application/json'}});
};}

test('actual OpenAI SDK serializes chat tools and returns validated prepared action',async()=>{
  const {createAssistantHandler}=require('../api/ai/chat.js');
  let called=false;
  const handler=createAssistantHandler({env:{OPENAI_API_KEY:'local-sdk-test-key'},fetchImpl:sdkFetch({role:'assistant',content:null,tool_calls:[{id:'call-test',type:'function',function:{name:'add_transaction',arguments:JSON.stringify({amount:15,merchant:'Konzum',category:'Hrana',type:'expense'})}}]},body=>{
    called=true;assert.equal(body.parallel_tool_calls,false);assert.equal(body.tools.length,3);
    assert.equal(body.tools[0].type,'function');assert.match(body.messages[0].content,/Mer AI/);
  })});
  const res=response();await handler(request({messages:[{role:'user',content:'Dodaj transakciju 15 eura u Konzumu za hranu'}],locale:'hr',financialContext:{currency:'EUR'}}),res);
  assert.ok(called);assert.equal(res.statusCode,200);assert.equal(res.body.actions[0].name,'add_transaction');
  assert.equal(res.body.actions[0].arguments.amount,15);assert.ok(res.body.message);
  assert.doesNotMatch(JSON.stringify(res.body),/local-sdk-test-key/);
});

test('actual OpenAI SDK requests JSON mode and maps extracted category into active profile categories',async()=>{
  const {createTransactionParseHandler}=require('../api/ai/parse-transaction.js');
  let called=false;
  const handler=createTransactionParseHandler({env:{OPENAI_API_KEY:'local-sdk-test-key'},fetchImpl:sdkFetch({role:'assistant',content:JSON.stringify({amount:15,merchant:'Konzum',category:'Hrana',type:'expense'})},body=>{
    called=true;assert.deepEqual(body.response_format,{type:'json_object'});assert.match(body.messages[0].content,/JSON/);
  })});
  const res=response();await handler(request({text:'Potrošio sam 15 eura u Konzumu',consent:true,referenceDate:'2026-09-17',currency:'EUR',categories:[{id:'food-personal',name:'Hrana',type:'expense'}]}),res);
  assert.ok(called);assert.equal(res.statusCode,200);assert.equal(res.body.source,'openai');
  assert.equal(res.body.draft.categoryId,'food-personal');assert.equal(res.body.draft.amount,15);assert.equal(res.body.needsReview,true);
});
