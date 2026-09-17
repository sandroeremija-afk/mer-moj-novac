'use strict';
const assert=require('node:assert/strict');
const N=require('../natural-input-core.js');
const {createTransactionParseHandler,extractDraft}=require('../api/transaction-parse.js');
const categories=[{id:'food',name:'Hrana i namirnice',type:'expense'},{id:'transport',name:'Prijevoz',type:'expense'},{id:'salary',name:'Plaća',type:'income'}];
const request=(text='Jučer sam potrošio 35,50 eura u Konzumu')=>({text,referenceDate:'2026-03-01',currency:'EUR',categories});
const response=payload=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(payload)}}]});
const client=fn=>({chat:{completions:{create:fn}}});
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
  const parsed={amount:35.5,merchant:'Konzum',category:'Hrana i namirnice',type:'expense'};
  const handler=createTransactionParseHandler({env:{OPENAI_API_KEY:'test-server-secret'},rateLimit:100,client:client(async(payload)=>{sent=payload;return response(parsed);})});
  let res=await call(handler);assert.equal(res.statusCode,200);assert.equal(res.body.source,'openai');assert.equal(res.body.needsReview,true);assert.deepEqual(res.body.draft,good);assert.equal(res.headers['Cache-Control'],'no-store, max-age=0');
  assert.equal(sent.model,'gpt-4o-mini');assert.equal(sent.store,false);assert.equal(sent.response_format.type,'json_object');assert.equal(JSON.parse(sent.messages[1].content).text,request().text);assert.ok(!JSON.stringify(res.body).includes('test-server-secret'));
  assert.equal((await call(handler,undefined,{method:'GET'})).statusCode,405);
  assert.equal((await call(handler,undefined,{headers:{origin:'https://evil.test',host:'mer.test','content-type':'application/json'}})).statusCode,403);
  assert.equal((await call(handler,undefined,{headers:{origin:'https://mer.test',host:'mer.test','content-type':'text/plain'}})).statusCode,415);
  assert.equal((await call(handler,request())).body.error,'CONSENT_REQUIRED');
  assert.equal((await call(handler,{...request(),consent:true,text:'x'.repeat(601)})).statusCode,400);
  assert.equal((await call(handler,'not-json')).statusCode,400);
  assert.equal((await call(handler,undefined,{headers:{origin:'https://mer.test',host:'mer.test','content-type':'application/json','content-length':'50000'}})).statusCode,413);
  const unconfigured=createTransactionParseHandler({env:{},client:client(async()=>{throw new Error('must not call');})});assert.equal((await call(unconfigured)).statusCode,503);
  const limited=createTransactionParseHandler({env:{},now:()=>100});for(let i=0;i<8;i++)await call(limited);assert.equal((await call(limited)).statusCode,429);
  for(const draft of [{...parsed,amount:null},{...parsed,amount:-15},{...parsed,amount:1.005},{...parsed,type:'transfer'},{...parsed,merchant:''},{...parsed,profileId:'business'},{...parsed,amount:'35.50'}]){
    const invalid=createTransactionParseHandler({env:{OPENAI_API_KEY:'test'},client:client(async()=>response(draft))});assert.equal((await call(invalid)).statusCode,422);
  }
  const unknownInput={...request('Platio sam 35,50 eura trgovcu Acme'),consent:true,categories:[{id:'salary',name:'Plaća',type:'income'}]};
  const unknown=createTransactionParseHandler({env:{OPENAI_API_KEY:'test'},client:client(async()=>response({...parsed,merchant:'Acme',category:'Invented'}))});
  assert.equal((await call(unknown,unknownInput)).body.draft.categoryId,null,'unknown categories stay for review and never cross income/expense types');
  for(const text of ['Konzum -35,50 eura','Platio sam 35 eura u Konzumu i 18 eura za Uber','Konzum 35,50 eura 31.2.2026.']){
    const invalid=createTransactionParseHandler({env:{OPENAI_API_KEY:'test'},client:client(async()=>response(parsed))});assert.equal((await call(invalid,{...request(text),consent:true})).statusCode,422);
  }
  const timeout=createTransactionParseHandler({env:{OPENAI_API_KEY:'test'},timeoutMs:50,client:client((_payload,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Object.assign(new Error(),{name:'AbortError'})))))});
  assert.equal((await call(timeout)).statusCode,504);
  const failed=createTransactionParseHandler({env:{OPENAI_API_KEY:'test'},client:client(async()=>{throw Object.assign(new Error('secret provider text'),{status:429});})});
  assert.equal((await call(failed)).statusCode,429);
  process.stdout.write('Natural input cycle 1 passed: Croatian amounts, merchants, categories, leap/future dates, ambiguous input rejection, strict OpenAI JSON validation, privacy boundary, rate limits and timeout.\n');
}
main().catch(error=>{process.stderr.write(error.stack+'\n');process.exitCode=1;});
