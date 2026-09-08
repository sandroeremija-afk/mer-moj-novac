'use strict';
const {createCashflowHandler} = require('./cashflow.js');
function sanitizeHealth(value) {
  if(!value || !/^[A-Z]{3}$/.test(value.currency || '') || !(value.score===null || Number.isInteger(value.score) && value.score>=0 && value.score<=100) || !Number.isFinite(value.bufferMonths) || value.bufferMonths<0)return null;
  const result={currency:value.currency,score:value.score,bufferMonths:Math.min(1200,value.bufferMonths)};
  for(const key of ['incomeCents','savedCents','shortfallCents']){if(!Number.isSafeInteger(value[key]) || Math.abs(value[key])>1e14)return null;result[key]=value[key];}
  if(!Array.isArray(value.categories)||value.categories.length>1000)return null;
  if(value.shortfallCents<0)return null;
  result.categories=value.categories.slice(0,100).map((row,index)=>{if(!row||['spentCents','limitCents','newLimitCents'].some(key=>!Number.isSafeInteger(row[key])||row[key]<0||row[key]>1e14))return null;return {category:index+1,spentCents:row.spentCents,limitCents:row.limitCents,newLimitCents:row.newLimitCents};});
  return result.categories.includes(null)?null:result;
}
function createHealthHandler(options={}) {return createCashflowHandler({...options,maxOutputTokens:4096,requireConsent:true,sanitizeAnalysis:sanitizeHealth,systemInstruction:locale=>`Explain Mer's already-calculated budget rebalancing proposal in ${locale==='en'?'English':'Croatian'} in at most 120 words of plain text. Integer money values are cents. Categories are anonymous numeric identifiers. The new limits preserve the total allocation and only use unspent limits. Explain any shortfall and three small practical steps, without inventing amounts, products, tax rules or investment recommendations. Do not change or recalculate the proposal. No action has been performed: user confirmation is required. A null score means insufficient income data, not poor financial health.`});}
module.exports=createHealthHandler();module.exports.createHealthHandler=createHealthHandler;module.exports.sanitizeHealth=sanitizeHealth;
