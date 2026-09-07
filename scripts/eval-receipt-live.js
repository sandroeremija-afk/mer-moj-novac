'use strict';
// Explicit live evaluation. Sends ONLY the synthetic receipt drawn below.
// Usage: node scripts/eval-receipt-live.js [absolute-path-to-sharp]
const fs=require('node:fs/promises');
const path=require('node:path');
const assert=require('node:assert/strict');
const sharp=require(process.argv[2]||'sharp');
const {createReceiptHandler}=require('../api/receipt.js');
async function main(){
  const root=path.resolve(__dirname,'..'),env={...process.env};
  try{
    const source=await fs.readFile(path.join(root,'.env.local'),'utf8');
    for(const key of ['GEMINI_API_KEY','GOOGLE_GENERATIVE_AI_API_KEY','GEMINI_MODEL','RECEIPT_GEMINI_MODEL']){
      const value=source.match(new RegExp(`^${key}=(.*)$`,'m'))?.[1]?.trim();
      if(value)env[key]=value.replace(/^(['"])(.*)\1$/,'$2');
    }
  }catch{}
  if(!env.GEMINI_API_KEY&&!env.GOOGLE_GENERATIVE_AI_API_KEY)throw new Error('Live OCR evaluation requires a server-side Gemini key.');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><rect width="800" height="1000" fill="white"/><g font-family="Arial,sans-serif" fill="black"><text x="80" y="110" font-size="40" font-weight="bold">MER TEST TRGOVINA</text><text x="80" y="170" font-size="24">SYNTHETIC TEST RECEIPT - NO REAL PURCHASE</text><text x="80" y="260" font-size="30">RACUN: TEST-001</text><text x="80" y="320" font-size="30">Datum: 07.09.2026.</text><text x="80" y="430" font-size="27">Mlijeko       2 x 2,25 EUR        4,50 EUR</text><text x="80" y="500" font-size="27">Kruh          2 x 4,00 EUR        8,00 EUR</text><path d="M80 550H720" stroke="black"/><text x="80" y="635" font-size="38" font-weight="bold">UKUPNO: 12,50 EUR</text><text x="80" y="715" font-size="28">Placeno karticom: 12,50 EUR</text><text x="80" y="850" font-size="23">Fictional fixture for automated OCR verification.</text></g></svg>`;
  const image=await sharp(Buffer.from(svg)).png().toBuffer();
  const fixtureDirectory=path.join(root,'.tmp-receipt');
  await fs.mkdir(fixtureDirectory,{recursive:true});
  await fs.writeFile(path.join(fixtureDirectory,'synthetic-receipt.png'),image);
  const response={headers:{},setHeader(k,v){this.headers[k]=v;},end(raw){this.body=JSON.parse(raw);}};
  const fetchImpl=async(url,options)=>{
    try{
      const upstream=await fetch(url,options);
      if(!upstream.ok){
        const problem=await upstream.clone().json().catch(()=>({}));
        let message=String(problem.error?.message||'').slice(0,800);
        for(const value of [env.GEMINI_API_KEY,env.GOOGLE_GENERATIVE_AI_API_KEY].filter(Boolean))message=message.split(value).join('[REDACTED]');
        process.stdout.write(`${JSON.stringify({providerStatus:upstream.status,providerError:problem.error?.status,message})}\n`);
      }
      return upstream;
    }catch(error){process.stdout.write(`${JSON.stringify({networkError:error.name,networkCode:error.cause?.code})}\n`);throw error;}
  };
  await createReceiptHandler({env,fetchImpl})({method:'POST',headers:{host:'mer.test',origin:'https://mer.test','content-type':'application/json'},body:{consent:true,image:{mimeType:'image/png',data:image.toString('base64')}}},response);
  const summary={status:response.statusCode,source:response.body.source,error:response.body.error,merchant:response.body.receipt?.merchant,date:response.body.receipt?.date,totalCents:response.body.receipt?.totalCents,lineCount:response.body.receipt?.lines?.length};
  process.stdout.write(`${JSON.stringify(summary)}\n`);
  assert.equal(response.statusCode,200,'Live OCR did not return a successful extraction');
  assert.equal(response.body.receipt.totalCents,1250);assert.equal(response.body.receipt.date,'2026-09-07');
  assert.equal(response.body.receipt.lines.length,2);assert.equal(response.body.receipt.lines.reduce((sum,line)=>sum+line.totalCents,0),1250);
  process.stdout.write('Live synthetic Gemini OCR passed: total, date and both item lines are correct.\n');
}
main().catch(error=>{process.stderr.write(`${error.message}\n`);process.exitCode=1;});
