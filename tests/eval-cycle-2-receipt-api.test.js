'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createReceiptHandler,validateImage,extractReceipt,MAX_IMAGE_BYTES}=require('../api/receipt.js');
const image={mimeType:'image/png',data:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZPZ4AAAAASUVORK5CYII='};
const extracted={merchant:'Konzum',date:'2026-09-07',currency:'EUR',totalCents:1250,invoiceNumber:'123',lines:[{description:'Mlijeko',quantity:2,totalCents:1250}]};
const output=value=>({steps:[{type:'model_output',content:[{type:'text',text:JSON.stringify(value)}]}]});
const request=overrides=>({method:'POST',headers:{host:'mer.test',origin:'https://mer.test','content-type':'application/json'},body:{image,consent:true},...overrides});
async function call(handler,req=request()) {const response={headers:{},setHeader(k,v){this.headers[k]=v;},end(value){this.body=JSON.parse(value);}};await handler(req,response);return response;}
test('OCR sends only the consented image server-side with structured schema and never bank data or key in response',async()=>{
  let sent;
  const handler=createReceiptHandler({env:{GEMINI_API_KEY:'test-server-secret'},fetchImpl:async(url,options)=>{sent={url,options};return new Response(JSON.stringify(output(extracted)),{status:200});}});
  const res=await call(handler,request({body:{image,consent:true,transactions:[{amount:999,iban:'private-bank-iban'}],profileId:'business'}}));
  assert.equal(res.statusCode,200);assert.equal(res.body.source,'gemini');assert.equal(res.body.needsReview,true);assert.equal(res.body.receipt.totalCents,1250);
  assert.equal(res.headers['Cache-Control'],'no-store');assert.equal(sent.options.headers['x-goog-api-key'],'test-server-secret');assert.equal(sent.options.redirect,'error');
  const body=JSON.parse(sent.options.body);assert.equal(body.store,false);assert.equal(body.response_format.mime_type,'application/json');assert.equal(body.input[1].type,'image');
  assert.ok(!sent.options.body.includes('private-bank-iban'));assert.ok(!sent.options.body.includes('business'));assert.ok(!JSON.stringify(res.body).includes('test-server-secret'));
});
test('file validation blocks SVG, URLs, mislabeled images, malformed base64 and overlarge bodies',async()=>{
  assert.ok(validateImage(image));assert.equal(validateImage({...image,mimeType:'image/svg+xml'}),null);assert.equal(validateImage({...image,data:'https://private.local/receipt'}),null);assert.equal(validateImage({...image,mimeType:'image/jpeg'}),null);
  assert.equal(validateImage({...image,data:Buffer.alloc(MAX_IMAGE_BYTES+1).toString('base64')}),null);
  const handler=createReceiptHandler({env:{}});
  assert.equal((await call(handler,request({body:{consent:true,image:{mimeType:'image/png',data:'AAAA'}}}))).body.error,'INVALID_IMAGE');
  assert.equal((await call(handler,request({headers:{host:'mer.test',origin:'https://mer.test','content-type':'application/json','content-length':'5000000'}}))).statusCode,413);
});
test('missing consent/origin and cross-site uploads are rejected before any provider call',async()=>{
  let count=0;const handler=createReceiptHandler({env:{GEMINI_API_KEY:'test'},fetchImpl:async()=>{count++;throw new Error('must not run');}});
  assert.equal((await call(handler,request({body:{image,consent:false}}))).body.error,'CONSENT_REQUIRED');
  assert.equal((await call(handler,request({headers:{host:'mer.test',origin:'https://evil.test','content-type':'application/json'}}))).statusCode,403);
  assert.equal((await call(handler,request({headers:{host:'mer.test','content-type':'application/json'}}))).statusCode,403);
  assert.equal((await call(handler,request({method:'GET'}))).statusCode,405);assert.equal(count,0);
});
test('unconfigured, rate-limited, malformed and unreadable OCR clearly request manual review, never fake extraction',async()=>{
  assert.equal((await call(createReceiptHandler({env:{}}))).body.error,'OCR_NOT_CONFIGURED');
  const provider=status=>createReceiptHandler({env:{GEMINI_API_KEY:'test'},fetchImpl:async()=>new Response('{}',{status})});
  const limited=await call(provider(429));assert.equal(limited.statusCode,429);assert.equal(limited.body.source,'manual');assert.equal(limited.body.receipt,undefined);
  const unreadable=createReceiptHandler({env:{GEMINI_API_KEY:'test'},fetchImpl:async()=>new Response(JSON.stringify(output({merchant:null,date:null,currency:null,totalCents:null,invoiceNumber:null,lines:[]})),{status:200})});
  assert.equal((await call(unreadable)).body.error,'OCR_UNREADABLE');
  const malformed=createReceiptHandler({env:{GEMINI_API_KEY:'test'},fetchImpl:async()=>new Response('not json',{status:200})});assert.equal((await call(malformed)).statusCode,502);
  assert.equal(extractReceipt(output({...extracted,lines:Array.from({length:101},()=>extracted.lines[0])})),null);
  const unknown=extractReceipt(output({...extracted,date:null,currency:null,totalCents:'12.5'}));assert.equal(unknown.receipt.totalCents,null);assert.equal(unknown.currencyAssumed,true);assert.ok(unknown.missingFields.includes('date'));
});
test('OCR enforces timeout, response bound and per-instance request limit',async()=>{
  const timeout=createReceiptHandler({env:{GEMINI_API_KEY:'test'},timeoutMs:50,fetchImpl:async(url,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Object.assign(new Error('abort'),{name:'AbortError'}))))});
  assert.equal((await call(timeout)).statusCode,504);
  const big=createReceiptHandler({env:{GEMINI_API_KEY:'test'},fetchImpl:async()=>new Response('x'.repeat(100000),{status:200})});assert.equal((await call(big)).statusCode,502);
  const limiter=createReceiptHandler({env:{}});for(let i=0;i<5;i++)await call(limiter);assert.equal((await call(limiter)).statusCode,429);
});
