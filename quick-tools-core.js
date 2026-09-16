(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.MerQuickToolsCore=api;})(typeof globalThis==='undefined'?null:globalThis,function(){
  'use strict';
  // A small arithmetic grammar, never JavaScript evaluation or network execution.
  function calculate(expression){
    const source=String(expression??'').replaceAll('−','-').replaceAll('×','*').replaceAll('÷','/').replaceAll(',','.').replace(/\s/g,'');
    if(!source||source.length>120||/[^\d.+*/()\-]/.test(source))return{ok:false,error:'expression'};
    let index=0;
    const checked=value=>{if(!Number.isFinite(value)||Math.abs(value)>1e15)throw Error('range');return value;};
    function atom(){
      if(source[index]==='+'||source[index]==='-'){const sign=source[index++];return checked((sign==='-'?-1:1)*atom());}
      if(source[index]==='('){index++;const value=sum();if(source[index++]!==')')throw Error('expression');return value;}
      const match=source.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);if(!match)throw Error('expression');index+=match[0].length;return checked(Number(match[0]));
    }
    function product(){let value=atom();while(source[index]==='*'||source[index]==='/'){const operator=source[index++],right=atom();if(operator==='/'&&right===0)throw Error('zero');value=checked(operator==='*'?value*right:value/right);}return value;}
    function sum(){let value=product();while(source[index]==='+'||source[index]==='-'){const operator=source[index++],right=product();value=checked(operator==='+'?value+right:value-right);}return value;}
    try{const value=sum();if(index!==source.length)throw Error('expression');return{ok:true,value:Object.is(value,-0)?0:Number(value.toPrecision(14))};}catch(error){return{ok:false,error:error.message};}
  }
  function pageModel(total,page=1,size=8){const finite=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;total=Math.max(0,Math.floor(finite(total,0)));size=Math.max(1,Math.floor(finite(size,8)||8));const pages=Math.max(1,Math.ceil(total/size)),current=Math.max(1,Math.min(pages,Math.floor(finite(page,1)||1)));return{page:current,pages,start:(current-1)*size,end:Math.min(total,current*size),total};}
  function chartIndex(clientX,rect,width,left,plotWidth,last=30){if(!rect||![clientX,rect.left,rect.width,width,left,plotWidth,last].every(Number.isFinite)||rect.width<=0||width<=0||plotWidth<=0||last<0)return 0;const local=(clientX-rect.left)*width/rect.width;return Math.min(last,Math.max(0,Math.round((local-left)/plotWidth*last)));}
  return Object.freeze({calculate,pageModel,chartIndex});
});
