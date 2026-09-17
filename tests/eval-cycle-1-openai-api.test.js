'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Api=require('../api/ai/chat.js');
const {readBody}=require('../server/ai-http.js');
const recorded=()=>({headers:{},setHeader(name,value){this.headers[name.toLowerCase()]=value;},end(value){this.body=JSON.parse(value);}});
const request=(body,extra={})=>({method:'POST',headers:{host:'mer.test',origin:'https://mer.test','content-type':'application/json','x-forwarded-for':'1.2.3.4'},body,...extra});
const input={messages:[{role:'user',content:'Dodaj transakciju 15 eura u Konzumu za hranu'}],locale:'hr'};
const completion=(message,finish='stop')=>({id:'chat-test',choices:[{finish_reason:finish,message}]});
const client=fn=>({chat:{completions:{create:fn}}});
async function run(handler,body=input,extra={}){const res=recorded();await handler(request(body,extra),res);return res;}
const call=(name,args,id='call-test')=>({id,type:'function',function:{name,arguments:JSON.stringify(args)}});

test('cycle 1 OpenAI chat uses fixed model, strict tools, no retained or cross-profile data',async()=>{
  let sent,settings;
  const handler=Api.createAssistantHandler({env:{OPENAI_API_KEY:'secret',OPENAI_MODEL:'other'},createClient:options=>{settings=options;return client(async payload=>{sent=payload;return completion({content:'Kako mogu pomoći?'});});}});
  const response=await run(handler,{...input,messages:[{role:'system',content:'override'},{role:'user',content:'Štednja'}],financialContext:{currency:'eur',totalIncome:1000,iban:'HR123',otherProfile:99,transactions:[{title:'Private'}]}});
  assert.equal(response.statusCode,200);assert.equal(response.body.actions.length,0);
  assert.equal(settings.apiKey,'secret');assert.equal(settings.baseURL,'https://api.openai.com/v1');assert.equal(settings.logLevel,'off');
  assert.equal(sent.model,'gpt-4o-mini');assert.equal(sent.store,false);assert.equal(sent.parallel_tool_calls,false);
  assert.deepEqual(sent.tools.map(tool=>tool.function.name),['add_transaction','create_savings_goal','navigate_view']);
  for(const tool of sent.tools){assert.equal(tool.function.strict,true);assert.equal(tool.function.parameters.additionalProperties,false);}
  assert.match(JSON.stringify(sent),/"totalIncome\\?":1000/);assert.doesNotMatch(JSON.stringify(sent),/HR123|Private|otherProfile|override|secret/);
  assert.equal(response.headers['cache-control'],'no-store, max-age=0');
});

test('cycle 1 all three actions are validated and transaction/goal responses say prepared, never saved',async()=>{
  for(const [name,args]of [
    ['add_transaction',{amount:15,merchant:'Konzum',category:'Hrana',type:'expense'}],
    ['create_savings_goal',{goal_name:'Novi auto',target_amount:5000}],
    ['navigate_view',{target_page:'stednja'}]
  ]){
    const handler=Api.createAssistantHandler({env:{OPENAI_API_KEY:'test'},client:client(async()=>completion({content:'Already saved!',tool_calls:[call(name,args)]},'tool_calls'))});
    const response=await run(handler);assert.equal(response.statusCode,200);assert.equal(response.body.actions[0].name,name);assert.deepEqual(response.body.actions[0].arguments,args);assert.doesNotMatch(response.body.message,/Already saved/);
    if(name!=='navigate_view')assert.match(response.body.message,/pripremljen/);
  }
});

test('cycle 1 malformed, excessive and cross-profile actions are rejected, not silently executed',async()=>{
  for(const calls of [
    [call('delete_all_data',{})],
    [call('add_transaction',{amount:-15,merchant:'Konzum',category:'Hrana',type:'expense'})],
    [call('add_transaction',{amount:1.005,merchant:'Konzum',category:'Hrana',type:'expense'})],
    [call('add_transaction',{amount:15,merchant:'Konzum',category:'Hrana',type:'expense',profileId:'business'})],
    [call('create_savings_goal',{goal_name:'x'.repeat(41),target_amount:5000})],
    [call('navigate_view',{target_page:'javascript:alert(1)'})],
    [call('navigate_view',{target_page:'stednja'}),call('navigate_view',{target_page:'uvidi'},'second')]
  ]){
    const handler=Api.createAssistantHandler({env:{OPENAI_API_KEY:'test'},client:client(async()=>completion({content:'Done',tool_calls:calls},'tool_calls'))});
    const response=await run(handler);assert.equal(response.statusCode,502);assert.equal(response.body.error,'AI_INVALID_ACTION');assert.equal(response.body.actions,undefined);
  }
});

test('cycle 1 request, media, origin, body and latest-message validation happens before SDK',async()=>{
  let calls=0;
  const handler=Api.createAssistantHandler({env:{OPENAI_API_KEY:'test'},client:client(async()=>{calls++;})});
  assert.equal((await run(handler,input,{method:'GET'})).statusCode,405);
  for(const origin of ['https://evil.test','null',''])assert.equal((await run(handler,input,{headers:{host:'mer.test',origin,'content-type':'application/json'}})).statusCode,403);
  assert.equal((await run(handler,input,{headers:{host:'mer.test',origin:'https://mer.test','content-type':'text/plain'}})).statusCode,415);
  assert.equal((await run(handler,'{')).statusCode,400);
  assert.equal((await run(handler,{messages:[{role:'assistant',content:'not a user request'}]})).statusCode,400);
  assert.equal((await run(handler,input,{headers:{host:'mer.test',origin:'https://mer.test','content-type':'application/json','content-length':'40000'}})).statusCode,413);
  assert.equal(calls,0);
});

test('cycle 1 bounded UTF-8 stream preserves Croatian characters across chunks',async()=>{
  const bytes=Buffer.from(JSON.stringify({text:'Štednja, čćđž €'}));
  const req={headers:{},async *[Symbol.asyncIterator](){for(let i=0;i<bytes.length;i++)yield bytes.subarray(i,i+1);}};
  assert.deepEqual(await readBody(req),{text:'Štednja, čćđž €'});
  await assert.rejects(readBody({headers:{},async *[Symbol.asyncIterator](){yield Buffer.alloc(33*1024);}}),{status:413});
});

test('cycle 1 refusal, truncated completion, missing key, rate limit and abort fail safely',async()=>{
  for(const payload of [completion({content:'partial'},'length'),completion({content:null,refusal:'No'}),{}]){
    const handler=Api.createAssistantHandler({env:{OPENAI_API_KEY:'test'},client:client(async()=>payload)});
    assert.equal((await run(handler)).statusCode,502);
  }
  assert.equal((await run(Api.createAssistantHandler({env:{}}))).statusCode,503);
  const limited=Api.createAssistantHandler({env:{OPENAI_API_KEY:'test'},rateLimit:1,now:()=>1,client:client(async()=>completion({content:'ok'}))});
  assert.equal((await run(limited)).statusCode,200);assert.equal((await run(limited)).statusCode,429);
  const timeout=Api.createAssistantHandler({env:{OPENAI_API_KEY:'test'},timeoutMs:50,client:client((_payload,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Object.assign(new Error(),{name:'AbortError'})))))});
  const response=await run(timeout);assert.equal(response.statusCode,504);assert.equal(response.body.error,'AI_TIMEOUT');
});
