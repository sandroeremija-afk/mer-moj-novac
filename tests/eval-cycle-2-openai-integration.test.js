'use strict';
const fs=require('node:fs'),path=require('node:path'),test=require('node:test'),assert=require('node:assert/strict');
const Api=require('../api/ai/chat.js'),MerAssistant=require('../assistant-core.js');
const root=path.resolve(__dirname,'..');
function routeFetch(handler){return async(_url,options)=>{
  const response={setHeader(){},end(value){this.body=JSON.parse(value);}};
  await handler({method:options.method,headers:{host:'mer.test',origin:'https://mer.test','content-type':'application/json'},body:options.body},response);
  return {ok:response.statusCode===200,status:response.statusCode,json:async()=>response.body};
};}
test('cycle 2 shared assistant consumes new OpenAI route and keeps action arguments',async()=>{
  const action={id:'call-navigation',type:'function',function:{name:'navigate_view',arguments:JSON.stringify({target_page:'stednja'})}};
  const route=Api.createAssistantHandler({env:{OPENAI_API_KEY:'server-only-test'},client:{chat:{completions:{create:async()=>({id:'openai-integration',choices:[{finish_reason:'tool_calls',message:{tool_calls:[action]}}]})}}}});
  const client=MerAssistant.createAssistantClient({fetchImpl:routeFetch(route)});
  const result=await client.ask({messages:[{role:'user',content:'Vodi me na Štednju'}],locale:'hr',profileId:'personal',financialContext:{currency:'EUR',totalIncome:1500}});
  assert.equal(result.source,'remote');assert.equal(result.id,'openai-integration');assert.match(result.content,/Otvaram/);assert.equal(result.actions[0].name,'navigate_view');assert.equal(result.actions[0].arguments.target_page,'stednja');
});
test('cycle 2 missing server key uses honest deterministic local fallback without actions',async()=>{
  const route=Api.createAssistantHandler({env:{}});
  const client=MerAssistant.createAssistantClient({fetchImpl:routeFetch(route)});
  const input={messages:[{role:'user',content:'Kako se računa dnevni tempo?'}],locale:'hr',financialContext:{currency:'EUR',dailySafe:30,daysRemaining:7}};
  const first=await client.ask(input),second=await client.ask(input);
  assert.equal(first.source,'local');assert.equal(first.content,second.content);assert.match(first.content,/30,00\s?€/);assert.equal(first.actions?.length||0,0);
});
test('cycle 2 credentials are documented server-only and absent from browser assets',()=>{
  const browserFiles=fs.readdirSync(root).filter(file=>/\.(?:js|html)$/.test(file));
  for(const file of browserFiles){
    const source=fs.readFileSync(path.join(root,file),'utf8');
    assert.doesNotMatch(source,/OPENAI_API_KEY|OPENAI_BASE_URL|new OpenAI\(/,file);
    assert.doesNotMatch(source,/OPEN_WEBUI_(?:API_KEY|CA_CERT|CERT_SHA256)|NODE_TLS_REJECT_UNAUTHORIZED/,file);
  }
  const example=fs.readFileSync(path.join(root,'.env.example'),'utf8');assert.match(example,/^OPENAI_API_KEY=$/m);
  const ignore=fs.readFileSync(path.join(root,'.gitignore'),'utf8');assert.match(ignore,/\.env\.local/);
  const vercel=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));
  assert.equal(vercel.functions['api/ai/chat.js'].maxDuration,30);assert.equal(vercel.functions['api/ai/parse-transaction.js'].maxDuration,30);
});
test('cycle 2 legacy URL aliases share exactly the guarded new route handlers',()=>{
  assert.equal(require('../api/assistant.js'),Api);
  assert.equal(require('../api/transaction-parse.js'),require('../api/ai/parse-transaction.js'));
});
