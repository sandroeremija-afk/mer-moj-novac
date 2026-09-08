(function exposeExportPdf(root, factory) {
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.MerExportPdf=api;
})(typeof globalThis!=='undefined'?globalThis:this,function createExportPdf(root){
  'use strict';
  let assetsPromise=null;
  async function assets(){
    if(assetsPromise)return assetsPromise;
    assetsPromise=(async()=>{
      const library=root.document.getElementById('exportPdfLibrary');
      const font=root.document.getElementById('exportPdfFont');
      if(!library||!font)throw new Error('PDF_ASSETS_UNAVAILABLE');
      if(!root.jspdf?.jsPDF)await new Promise((resolve,reject)=>{
        const script=root.document.createElement('script');script.src=library.href;
        const timer=setTimeout(()=>{script.remove();reject(new Error('PDF_LOAD_TIMEOUT'));},20000);
        script.onload=()=>{clearTimeout(timer);resolve();};
        script.onerror=()=>{clearTimeout(timer);script.remove();reject(new Error('PDF_LOAD_FAILED'));};
        root.document.head.append(script);
      });
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
      try{
        const response=await fetch(font.href,{signal:controller.signal,credentials:'same-origin'});
        if(!response.ok)throw new Error('PDF_FONT_UNAVAILABLE');
        return {jsPDF:root.jspdf.jsPDF,fontBytes:new Uint8Array(await response.arrayBuffer())};
      }finally{clearTimeout(timer);}
    })().catch(error=>{assetsPromise=null;throw error;});
    return assetsPromise;
  }
  function base64(bytes){
    let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
    return btoa(binary);
  }
  const clean=value=>String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/\u00a0|\u202f/g,' ');
  async function create(report,options={}){
    if(!report||!Array.isArray(report.sections))throw new Error('INVALID_EXPORT_REPORT');
    const {jsPDF,fontBytes}=options.jsPDF&&options.fontBytes?options:await assets();
    const wide=report.sections.some(section=>section.columns.length>5);
    const doc=new jsPDF({orientation:wide?'landscape':'portrait',unit:'pt',format:'a4',compress:true,putOnlyUsedFonts:true});
    doc.addFileToVFS('MerExport.ttf',base64(new Uint8Array(fontBytes)));
    doc.addFont('MerExport.ttf','MerExport','normal');doc.setFont('MerExport','normal');
    doc.setProperties({title:clean(report.title),subject:clean(report.period?.label),creator:'MER Moj novac',author:clean(report.profileName)});
    const W=doc.internal.pageSize.getWidth(),H=doc.internal.pageSize.getHeight(),M=36,BOTTOM=H-42;
    const ink=[25,53,42],muted=[72,92,82],blue=[0,169,228],green=[147,200,65];
    let y=36,pageNumber=0;
    const text=(value,x,baseline,size=9,color=ink)=>{doc.setFontSize(size);doc.setTextColor(...color);doc.text(clean(value),x,baseline);};
    function lines(value,width,size){doc.setFontSize(size);return doc.splitTextToSize(clean(value),Math.max(12,width));}
    function newPage(){
      if(pageNumber)doc.addPage();pageNumber++;y=36;
      doc.setFillColor(...blue);doc.rect(M,20,35,3,'F');doc.setFillColor(...green);doc.rect(M+37,20,16,3,'F');
      text('MER · Moj novac',M,y,10,muted);y+=23;
    }
    function paragraph(value,size=10,color=muted){
      const wrapped=lines(value,W-2*M,size);
      for(const line of wrapped){if(y+size+7>BOTTOM)newPage();text(line,M,y,size,color);y+=size+5;}y+=6;
    }
    function table(section){
      if(!section.columns.length)return;
      const fontSize=section.columns.length>8?8:9,lineHeight=fontSize+4;
      const weights=section.columns.map((label,index)=>{
        const longest=Math.max(clean(label).length,...section.rows.slice(0,80).map(row=>clean(row[index]).length));
        return Math.min(27,Math.max(9,longest));
      });
      const sum=weights.reduce((a,b)=>a+b,0),widths=weights.map(weight=>(W-2*M)*weight/sum);
      let xs=[M];for(let i=1;i<widths.length;i++)xs.push(xs[i-1]+widths[i-1]);
      const headingLines=section.columns.map((label,i)=>lines(label,widths[i]-12,fontSize));
      const headHeight=Math.max(...headingLines.map(a=>a.length))*lineHeight+14;
      function header(){
        doc.setFillColor(234,244,239);doc.rect(M,y,W-2*M,headHeight,'F');
        headingLines.forEach((parts,i)=>parts.forEach((part,j)=>text(part,xs[i]+6,y+fontSize+7+j*lineHeight,fontSize)));
        y+=headHeight;
      }
      if(y+headHeight+55>BOTTOM)newPage();
      paragraph(section.title,12,ink);header();
      if(!section.rows.length){paragraph('—',10);return;}
      section.rows.forEach((row,rowIndex)=>{
        const cells=section.columns.map((_,i)=>lines(row[i],widths[i]-12,fontSize));
        const count=Math.max(1,...cells.map(parts=>parts.length));
        let offset=0;
        while(offset<count){
          if(y+lineHeight+14>BOTTOM){newPage();header();}
          const take=Math.min(count-offset,Math.max(1,Math.floor((BOTTOM-y-14)/lineHeight)));
          const height=take*lineHeight+14;
          if(rowIndex%2===0){doc.setFillColor(248,250,249);doc.rect(M,y,W-2*M,height,'F');}
          cells.forEach((parts,i)=>parts.slice(offset,offset+take).forEach((part,j)=>text(part,xs[i]+6,y+fontSize+7+j*lineHeight,fontSize)));
          y+=height;doc.setDrawColor(224,233,228);doc.setLineWidth(.4);doc.line(M,y,W-M,y);
          offset+=take;
        }
      });y+=18;
    }
    newPage();paragraph(report.title,19,ink);
    paragraph(`${report.profileName} · ${report.period?.label||''} · ${report.currency}`,10);
    for(const metric of report.summary||[])paragraph(`${metric.label}: ${metric.value}`,11,ink);
    for(const note of report.notes||[])paragraph(note,9);
    for(const section of report.sections)table(section);
    const pages=doc.getNumberOfPages();
    for(let i=1;i<=pages;i++){
      doc.setPage(i);doc.setDrawColor(224,233,228);doc.line(M,H-31,W-M,H-31);
      text('MER · '+clean(report.profileName),M,H-18,8,muted);
      doc.setFontSize(8);const label=`${i} / ${pages}`;text(label,W-M-doc.getTextWidth(label),H-18,8,muted);
    }
    return new Uint8Array(doc.output('arraybuffer'));
  }
  return Object.freeze({create});
});
