'use strict';
const assert=require('node:assert/strict');
const N=require('../natural-input-core.js');
const {createTransactionParseHandler,extractDraft}=require('../api/transaction-parse.js');
const categories=[{id:'food',name:'Hrana i namirnice',type:'expense'},{id:'transport',name:'Prijevoz',type:'expense'},{id:'salary',name:'Plaća',type:'income'}];
const request=(text='Jučer sam potrošio 35,50 eura u Konzumu')=>({text,referenceDate:'2026-03-01',currency:'EUR',categories});
const response=payload=>({ok:true,status:200,headers:{get:()=>null},text:async()=>JSON.stringify({output_text:JSON.stringify(payload)})});
async function call(handler,body={...request(),consent:true},overrides={}){
  const req={method:'POST',headers:{origin:'https://mer.test',host:'mer.test','content-type':'application/json'},body,...overrides};
  const res={headers:{},setHeader(name,value){this.headers[name]=value;},end(value){this.body=JSON.parse(value);}};
  await handler(req,res);return res;
}
async function main(){
  assert.equal(N.validateRequest({...request(),text:'x'.repeat(601)}),null);assert.equal(N.validateRequest({...request(),referenceDate:'2026-02-30'}),null);
  assert.equal(N.validateRequest({...request(),categories:[...categories,categories[0]]}),null);
  let result=N.parseLocal(request());assert.equal(result.draft.amount,35.5);assert.equal(result.draft.merchant,'Konzum');assert.equal(result.draft.categoryId,'food');assert.equal(result.draft.type,'expense');assert.equal(result.draft.date,'2026-02-28');
  result=N.parseLocal({...request(),referenceDate:'2024-03-01'});assert.equal(result.draft.date,'2024-02-29');
  result=N.parseLocal(request('Sutra ću platiti 18 eura za Uber'));assert.equal(result.draft.date,'2026-03-02');assert.equal(result.draft.categoryId,'transport');
  assert.equal(N.parseLocal(request('Prekosutra 18 eura za Uber')).draft.date,'2026-03-03');
  assert.equal(N.parseLocal(request('I spent 35.50 euros at Konzum yesterday')).draft.date,'2026-02-28');
  result=N.parseLocal(request('Primio sam plaću 1.250,50 eura danas'));assert.equal(result.draft.amount,1250.5);assert.equal(result.draft.type,'income');assert.equal(result.draft.categoryId,'salary');
  assert.equal(N.parseLocal(request('Platio sam 1 250,50 eura u Konzumu')).draft.amount,1250.5);
  assert.equal(N.parseLocal(request('Platio sam 12 34 eura u Konzumu')).draft.amount,null);
  result=N.parseLocal(request('Potrošio sam pedeset eura u Lidlu'));assert.equal(result.draft.amount,50);assert.equal(result.draft.merchant,'Lidl');
  result=N.parseLocal(request('Platio sam deset eura i dvadeset centi za Uber'));assert.equal(result.draft.amount,10.2);
  result=N.parseLocal(request('Platio sam 35 eura u Konzumu i 18 eura za Uber'));assert.equal(result.draft.amount,null);assert.ok(result.warnings.includes('MULTIPLE_AMOUNTS'));
  assert.equal(N.parseLocal(request('Konzum -30 eura')).draft.amount,null);
  assert.equal(N.parseLocal(request('Konzum minus trideset eura')).draft.amount,null);
  assert.equal(N.parseLocal(request('Kupnja 2026-01-01')).draft.amount,null,'dates are not parsed as monetary amounts');
  result=N.parseLocal(request('Platio sam 10 eura trgovcu kojeg nema'));assert.equal(result.draft.categoryId,null);assert.equal(result.draft.merchant,null);
  result=N.parseLocal(request('Platio sam 10 eura 31.2.2026.'));assert.equal(result.draft.date,null);
  const good={amount:35.5,merchant:'Konzum',categoryId:'food',type:'expense',date:'2026-02-28',currency:'EUR'};
  for(const invalid of [{amount:-1},{amount:0},{amount:Infinity},{amount:NaN},{amount:1.001},{amount:1000000001},{categoryId:'unknown'},{categoryId:'salary'},{type:'transfer'},{date:'2026-02-30'},{currency:'BTC'},{merchant:'x'.repeat(101)}])assert.equal(N.validateDraft({...good,...invalid},request()),null,JSON.stringify(invalid));
  assert.equal(extractDraft({output_text:'not json'},request()),null);
  let sent;
  const handler=createTransactionParseHandler({env:{GEMINI_API_KEY:'test-server-secret',GEMINI_MODEL:'configured-model'},fetchImpl:async(url,options)=>{sent={url,options};return response(good);}});
  let res=await call(handler);assert.equal(res.statusCode,200);assert.equal(res.body.source,'gemini');assert.equal(res.body.needsReview,true);assert.equal(res.body.draft.amount,35.5);assert.equal(res.headers['Cache-Control'],'no-store');
  const payload=JSON.parse(sent.options.body);assert.equal(payload.model,'configured-model');assert.equal(payload.store,false);assert.equal(sent.options.redirect,'error');assert.equal(payload.response_format.mime_type,'application/json');assert.equal(JSON.parse(payload.input).text,request().text);assert.equal(sent.options.headers['x-goog-api-key'],'test-server-secret');assert.ok(!JSON.stringify(res.body).includes('test-server-secret'));
  assert.equal((await call(handler,undefined,{method:'GET'})).statusCode,405);
  assert.equal((await call(handler,undefined,{headers:{origin:'https://evil.test',host:'mer.test','content-type':'application/json'}})).statusCode,403);
  assert.equal((await call(handler,undefined,{headers:{origin:'https://mer.test',host:'mer.test','content-type':'text/plain'}})).statusCode,415);
  assert.equal((await call(handler,request())).body.error,'CONSENT_REQUIRED');
  assert.equal((await call(handler,{...request(),consent:true,text:'x'.repeat(601)})).statusCode,400);
  assert.equal((await call(handler,'not-json')).statusCode,400);
  assert.equal((await call(handler,undefined,{headers:{origin:'https://mer.test',host:'mer.test','content-type':'application/json','content-length':'50000'}})).statusCode,413);
  const unconfigured=createTransactionParseHandler({env:{},fetchImpl:async()=>{throw new Error('must not call');}});assert.equal((await call(unconfigured)).statusCode,503);
  const limited=createTransactionParseHandler({env:{},now:()=>100});for(let i=0;i<8;i++)await call(limited);assert.equal((await call(limited)).statusCode,429);
  for(const draft of [{...good,categoryId:'invented'},{...good,type:'income'},{...good,amount:null}]){const invalid=createTransactionParseHandler({env:{GEMINI_API_KEY:'test'},fetchImpl:async()=>response(draft)});assert.equal((await call(invalid)).statusCode,422);}
  const timeout=createTransactionParseHandler({env:{GEMINI_API_KEY:'test'},timeoutMs:50,fetchImpl:(_url,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Object.assign(new Error(),{name:'AbortError'}))))});assert.equal((await call(timeout)).statusCode,504);
  const failed=createTransactionParseHandler({env:{GEMINI_API_KEY:'test'},fetchImpl:async()=>({ok:false,status:429})});assert.equal((await call(failed)).statusCode,429);
  if(process.env.MER_LIVE_GEMINI_EVAL==='1'){
    const fs=require('node:fs'),path=require('node:path'),env={...process.env};
    for(const line of fs.readFileSync(path.join(__dirname,'../.env.local'),'utf8').split(/\r?\n/)){const match=/^\s*([A-Z_]+)\s*=\s*(.*)$/.exec(line);if(match)env[match[1]]=match[2].replace(/^['"]|['"]$/g,'');}
    const config=require('../api/gemini-config.js').resolveGeminiConfig(env);
    process.stdout.write(`Live Gemini configuration: ${JSON.stringify({configured:config.isConfigured,model:config.model})}\n`);
    const fetchImpl=async(...args)=>{try{const upstream=await fetch(...args);process.stdout.write(`Live Gemini upstream status: ${upstream.status}\n`);return upstream;}catch(error){process.stdout.write(`Live Gemini transport: ${JSON.stringify({name:error.name,code:error.cause?.code||error.code||'unknown'})}\n`);throw error;}};
    const live=await call(createTransactionParseHandler({env,fetchImpl}),{...request(),consent:true});
    process.stdout.write(`Live configured Gemini transaction parse: ${JSON.stringify({status:live.statusCode,source:live.body.source,error:live.body.error,draft:live.body.draft,model:live.body.model})}\n`);
    assert.equal(live.statusCode,200,'live configured Gemini must respond successfully');assert.equal(live.body.source,'gemini');
  }
  process.stdout.write('Natural input cycle 1 passed: Croatian amounts, merchants, categories, leap/future dates, ambiguous input rejection, strict API validation, privacy boundary, rate limits and timeout.\n');
}
main().catch(error=>{process.stderr.write(`${error.stack}\n`);process.exitCode=1;});
