(function exposeNaturalInput(root, factory) {
  'use strict'; const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.MerNaturalInput=api;
})(typeof globalThis==='undefined'?this:globalThis,function createNaturalInput(){
  'use strict';
  const MAX_TEXT=600,MAX_CATEGORIES=160,MAX_AMOUNT=999999999;
  const clean=value=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim();
  const fold=value=>clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(new Date(`${value}T00:00:00Z`).getTime())&&new Date(`${value}T00:00:00Z`).toISOString().slice(0,10)===value;
  function validateRequest(input){
    if(!input||typeof input!=='object'||Array.isArray(input))return null;
    const text=clean(input.text);
    if(!text||text.length>MAX_TEXT||!validDate(input.referenceDate)||!['EUR','USD','GBP','CHF'].includes(input.currency)||!Array.isArray(input.categories)||input.categories.length>MAX_CATEGORIES)return null;
    const categories=[],seen=new Set();
    for(const category of input.categories){
      if(!category||typeof category.id!=='string'||!category.id||category.id.length>80||typeof category.name!=='string'||!clean(category.name)||category.name.length>100||!['income','expense'].includes(category.type))return null;
      const key=`${category.type}:${category.id}`;if(seen.has(key))return null;seen.add(key);
      categories.push({id:category.id,name:clean(category.name),type:category.type});
    }
    return {text,referenceDate:input.referenceDate,currency:input.currency,categories};
  }
  function validateDraft(input,request){
    if(!input||typeof input!=='object'||Array.isArray(input)||!request)return null;
    const nullable=(value,predicate)=>value===null||value===undefined||predicate(value);
    if(!nullable(input.amount,value=>typeof value==='number'&&Number.isFinite(value)&&value>0&&value<=MAX_AMOUNT&&Math.abs(value*100-Math.round(value*100))<.0001)||!nullable(input.merchant,value=>typeof value==='string'&&clean(value).length<=100)||!nullable(input.date,validDate)||!nullable(input.type,value=>['income','expense'].includes(value))||!nullable(input.currency,value=>['EUR','USD','GBP','CHF'].includes(value)))return null;
    const type=input.type||null,categoryId=input.categoryId||null;
    if(categoryId!==null&&(!type||typeof categoryId!=='string'||!request.categories.some(category=>category.type===type&&category.id===categoryId)))return null;
    return {amount:input.amount??null,merchant:clean(input.merchant)||null,type,categoryId,date:input.date||null,currency:input.currency||request.currency};
  }
  const groups=[
    {merchants:['Konzum','Lidl','Spar','Interspar','Plodine','Studenac','Tommy','Eurospin','Kaufland'],category:/food|grocer|namirnic|hrana/},
    {merchants:['Uber','Bolt','INA','Petrol','Lukoil','Crodux','Shell','HAC','ZET'],category:/transport|prijevoz|gorivo/},
    {merchants:['HEP','A1','Telemach','Hrvatski Telekom','Vodovod','Holding'],category:/utilit|rezij|stanov/},
    {merchants:['Wolt','Glovo','KFC','Mlinar','Dubravica'],category:/restoran|food|hrana|entertainment|zabava/},
    {merchants:['DM','Bipa','Müller','Ljekarna','Farmacia'],category:/health|zdrav|njega|droger/},
    {merchants:['Amazon','AliExpress','Zara','IKEA','Tisak'],category:/shopping|kupov/},
    {merchants:['Netflix','Spotify','CineStar','Eventim'],category:/entertainment|zabava/}
  ];
  const words={jedan:1,jedna:1,jednu:1,dva:2,dvije:2,tri:3,cetiri:4,pet:5,sest:6,sedam:7,osam:8,devet:9,deset:10,jedanaest:11,dvanaest:12,trinaest:13,cetrnaest:14,petnaest:15,sesnaest:16,sedamnaest:17,osamnaest:18,devetnaest:19,dvadeset:20,trideset:30,cetrdeset:40,pedeset:50,sezdeset:60,sedamdeset:70,osamdeset:80,devedeset:90,sto:100,dvjesto:200,tristo:300,cetiristo:400,petsto:500,sesto:600,sedamsto:700,osamsto:800,devetsto:900,tisucu:1000,tisuca:1000};
  function numberValue(raw){
    let value=raw.trim();
    if(/^[\d.,\s]+$/.test(value)){
      value=value.replace(/\s/g,'');
      if(value.includes(',')&&value.includes('.'))value=value.lastIndexOf(',')>value.lastIndexOf('.')?value.replace(/\./g,'').replace(',','.'):value.replace(/,/g,'');
      else if(value.includes(','))value=value.replace(',','.');
      else if(/^\d{1,3}(?:\.\d{3})+$/.test(value))value=value.replace(/\./g,'');
      return /^\d+(?:\.\d{1,2})?$/.test(value)?Number(value):null;
    }
    let sum=0,part=0;const tokens=fold(value).split(/\s+/).filter(token=>token!=='i');
    if(!tokens.length||tokens.some(token=>!Object.hasOwn(words,token)))return null;
    for(const token of tokens){const number=words[token];if(number===1000){sum+=(part||1)*1000;part=0;}else part+=number;}
    return sum+part;
  }
  function parseLocal(input){
    const request=validateRequest(input);if(!request)return {source:'local',draft:null,warnings:['INVALID_INPUT']};
    const text=fold(request.text),warnings=[];
    // Local heuristics intentionally refuse multiple money amounts instead of
    // silently inventing a total or interpreting a date as a purchase amount.
    const units='(?:€|eur(?:a|o)?|euros?|dolar(?:a|i)?|dollars?|usd|gbp|chf)';
    const numberTokens=Object.keys(words).join('|');
    const pattern=new RegExp(`((?:\\d[\\d.,]*(?:[ \\u00a0]\\d{3})*(?:[.,]\\d{1,2})?|(?:(?:${numberTokens}|i)\\s+)*(?:${numberTokens})))\\s*(${units})(?=\\s|[.,!?]|$)`,'gi');
    const matches=[...text.matchAll(pattern)];let amount=matches.length===1?numberValue(matches[0][1]):null;
    if(matches.length>1)warnings.push('MULTIPLE_AMOUNTS');
    if(matches.length===1&&matches[0].index>0&&/(?:[-−]|\bminus)\s*$/.test(text.slice(0,matches[0].index))){amount=null;warnings.push('NEGATIVE_AMOUNT');}
    if(matches.length===1&&matches[0].index>0&&/\d\s+$/.test(text.slice(0,matches[0].index))){amount=null;warnings.push('REVIEW_AMOUNT');}
    const cents=text.match(/\bi\s+(\d{1,2}|[a-z\s]+)\s+cent(?:i|a)?\b/);
    if(amount!==null&&cents){const fraction=numberValue(cents[1]);if(fraction!==null&&fraction<100)amount=Math.round((amount+fraction/100)*100)/100;}
    let date=request.referenceDate;
    const iso=text.match(/\b\d{4}-\d{2}-\d{2}\b/),croatian=text.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\.?/);
    if(iso)date=iso[0];else if(croatian)date=`${croatian[3]}-${croatian[2].padStart(2,'0')}-${croatian[1].padStart(2,'0')}`;
    else {const offset=/\b(prekjucer|day before yesterday)\b/.test(text)?-2:/\b(jucer|yesterday)\b/.test(text)?-1:/\b(preksutra|prekosutra|day after tomorrow)\b/.test(text)?2:/\b(sutra|tomorrow)\b/.test(text)?1:0;const shifted=new Date(`${date}T12:00:00Z`);shifted.setUTCDate(shifted.getUTCDate()+offset);date=shifted.toISOString().slice(0,10);}
    if(!validDate(date)){date=null;warnings.push('INVALID_DATE');}
    const type=/\b(prihod|placa|placu|primio|primila|dobio|dobila|zaradio|zaradila|salary|income|received)\b/.test(text)?'income':'expense';
    let merchant=null,categoryRule=null;
    if(type==='expense')for(const group of groups){const match=group.merchants.find(item=>new RegExp(`(?:^|[^a-z0-9])${fold(item).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?:[a-z]*)(?=$|[^a-z])`).test(text));if(match){merchant=match;categoryRule=group.category;break;}}
    if(type==='income'){
      if(/plac[au]?|salary/.test(text)){merchant='Plaća';categoryRule=/salary|plac/;}
      else if(/poklon|dar|gift/.test(text)){merchant='Poklon';categoryRule=/gift|poklon|dar/;}
      else if(/honorar|freelanc/.test(text)){merchant='Honorar';categoryRule=/freelanc|honorar/;}
    }
    if(!merchant){const quote=request.text.match(/["„“]([^"„“”]{1,100})["“”]/);if(quote)merchant=clean(quote[1]);}
    if(!merchant)warnings.push('REVIEW_MERCHANT');
    const category=request.categories.find(item=>item.type===type&&categoryRule?.test(fold(`${item.id} ${item.name}`)));
    if(!category)warnings.push('REVIEW_CATEGORY');
    const currency=matches[0]?/usd|dolar|dollar/.test(matches[0][2])?'USD':/gbp/.test(matches[0][2])?'GBP':/chf/.test(matches[0][2])?'CHF':'EUR':request.currency;
    const draft=validateDraft({amount,merchant,type,categoryId:category?.id||null,date,currency},request);
    if(!amount)warnings.push('REVIEW_AMOUNT');
    return {source:'local',draft,needsReview:true,warnings};
  }
  return {MAX_TEXT,MAX_CATEGORIES,MAX_AMOUNT,validDate,validateRequest,validateDraft,parseLocal};
});
