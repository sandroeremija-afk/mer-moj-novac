'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {jsPDF}=require('../assets/jspdf-4.2.1.min.js');
const pdf=require('../export-pdf.js');
const core=require('../export-core.js');
const fontBytes=fs.readFileSync(path.join(__dirname,'../assets/mer-export-font.ttf'));
test('real PDF export embeds Croatian text and paginates 520 transaction records',async()=>{
  const profile={accountName:'Moj eRačun',categories:[{id:'food',name:'Hrana i režije',limit:1000}],incomeCategories:[],transactions:Array.from({length:520},(_,i)=>({id:`t-${i}`,date:'2026-09-08',name:`Račun Željko Šimić ${i}`,amount:10.5,type:'expense',category:'food',currency:'EUR'})),savingsEntries:[]};
  const report=core.buildReport({profile,profileId:'personal',context:'activity',timeframe:'all',referenceDate:'2026-09-08',currency:'EUR',language:'hr'});
  const bytes=await pdf.create(report,{jsPDF,fontBytes});
  assert.ok(bytes instanceof Uint8Array);
  const content=Buffer.from(bytes).toString('latin1');
  assert.ok(content.startsWith('%PDF-1.'));
  assert.match(content,/\/FontFile2/);
  assert.match(content,/\/ToUnicode/);
  assert.ok((content.match(/\/Type \/Page\b/g)||[]).length>10);
  if(process.env.MER_EXPORT_PDF_QA){const directory=path.resolve(process.env.MER_EXPORT_PDF_QA);fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'Aktivnost_520_Transakcija.pdf'),bytes);}
});
test('PDF rejects malformed reports rather than downloading an empty document',async()=>{
  await assert.rejects(pdf.create(null,{jsPDF,fontBytes}),/INVALID_EXPORT_REPORT/);
});
