(function exposeMerVaults(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./core.js'):root.MerCore);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.MerVaults=api;
})(typeof globalThis!=='undefined'?globalThis:this,function createMerVaults(Core){
  'use strict';
  const list=value=>Array.isArray(value)?value:[];
  const keyFor=(profile,options={})=>options.profileId||profile?.profileId||(profile?.accountLabel==='businessAccount'?'business':'personal');
  const scoped=(item,key)=>item&&(!item.profileId||item.profileId===key);
  const cents=value=>Number.isFinite(Number(value))?Math.round((Number(value)+Math.sign(Number(value))*Number.EPSILON)*100):0;
  const identity=tx=>String(tx?.id||tx?.importHash||tx?.bankTransactionId||'');
  const fingerprint=tx=>tx?.importHash?`import:${tx.importHash}`:tx?.bankTransactionId?`bank:${tx.connectionId||tx.bankConnectionId||''}:${tx.bankTransactionId}`:`id:${identity(tx)}`;
  const referenceDay=value=>Core.transactionDate({date:value instanceof Date?value.toISOString():value});
  const goalsFor=(profile,key)=>list(profile?.goalBuckets).filter(goal=>scoped(goal,key));
  const cardTransaction=tx=>{
    const method=String(tx?.paymentMethod||tx?.paymentInstrument||tx?.instrument||'').toLowerCase();
    if(['cash','transfer','bank-transfer','direct-debit','cash-withdrawal','atm'].includes(method))return false;
    return ['card','debit-card','credit-card','card-payment','pos'].includes(method)||tx?.isCardPayment===true||tx?.cardTransaction===true||Boolean(tx?.cardId);
  };
  function roundUpAmount(value,increment=1){
    const amount=cents(value),unit=Number(increment)===5?500:100;
    return amount>0&&Number.isSafeInteger(amount)?((unit-amount%unit)%unit)/100:0;
  }
  function configureRoundUps(profile,input,reference,options={}){
    const key=keyFor(profile,options),day=referenceDay(reference);
    if(!profile||profile.profileId&&profile.profileId!==key||!day)return {valid:false,reason:'profile-or-date'};
    const goals=goalsFor(profile,key),goal=goals.find(item=>item.id===input?.goalId),increment=Number(input?.increment||1);
    if(input?.enabled&&(!goal||goal.taxVault)||![1,5].includes(increment))return {valid:false,reason:'invalid-goal-or-increment'};
    profile.enterprise||={};
    const previous=profile.enterprise.roundUps;
    const config={enabled:input.enabled===true,goalId:goal?.id||previous?.goalId||null,increment,currency:'EUR',profileId:key,startDate:day,revision:(previous?.revision||0)+1,
      excludedTransactionIds:list(profile.transactions).filter(tx=>scoped(tx,key)&&Core.transactionDate(tx)&&Core.transactionDate(tx)<=day).map(fingerprint)};
    profile.enterprise.roundUps=config;
    goals.forEach(item=>{item.roundUpsEnabled=config.enabled&&item.id===config.goalId;item.roundUpIncrement=item.id===config.goalId?increment:(item.roundUpIncrement||1);});
    return {valid:true,config};
  }
  function reconcileRoundUps(profile,reference,options={}){
    const key=keyFor(profile,options),day=referenceDay(reference);
    if(!profile||profile.profileId&&profile.profileId!==key||!day)return {changed:false,count:0,totalCents:0};
    const goals=goalsFor(profile,key),rows=list(profile.transactions).filter(tx=>scoped(tx,key)),old=list(profile.savingsEntries).filter(entry=>scoped(entry,key)&&entry.sourceType==='round-up');
    let config=profile.enterprise?.roundUps,metadataChanged=false;
    // Preserve opted-in legacy settings and funded entries, but never sweep the
    // user's old transaction history when the new engine first loads.
    if(!config&&goals.some(goal=>goal.roundUpsEnabled)){
      const goal=goals.find(item=>item.roundUpsEnabled);configureRoundUps(profile,{enabled:true,goalId:goal.id,increment:goal.roundUpIncrement||1},day,{profileId:key});config=profile.enterprise.roundUps;metadataChanged=true;
    }
    if(!config&&!old.length)return {changed:false,count:0,totalCents:0};
    const existing=new Map(old.map(entry=>[String(entry.roundUpForTransactionId),entry]));
    const excluded=new Set(list(config?.excludedTransactionIds));
    const seen=new Set(),desired=[];
    rows.forEach(tx=>{
      const id=identity(tx),transactionKey=fingerprint(tx);if(!id||seen.has(transactionKey))return;seen.add(transactionKey);
      const prior=existing.get(id),date=Core.transactionDate(tx);
      if(!tx.roundUpAssignment&&prior){tx.roundUpAssignment={profileId:key,goalId:prior.goalId,increment:prior.roundUpIncrement||1,currency:prior.currency||'EUR',legacy:true};metadataChanged=true;}
      let assignment=tx.roundUpAssignment;
      if(!assignment&&config?.enabled&&config.profileId===key&&!excluded.has(transactionKey)&&date>=config.startDate&&cardTransaction(tx)&&Core.transactionType(tx)==='expense'){
        assignment={profileId:key,goalId:config.goalId,increment:config.increment,currency:config.currency,revision:config.revision};tx.roundUpAssignment=assignment;metadataChanged=true;
      }
      if(!assignment||assignment.profileId!==key||!goals.some(goal=>goal.id===assignment.goalId)||!date||!Core.isTransactionEffective(tx,day)||Core.transactionType(tx)!=='expense'||tx.status==='pending'&&tx.scheduled!==true||['cancelled','canceled','rejected'].includes(tx.status))return;
      const knownCash=['cash','transfer','bank-transfer','direct-debit','atm'].includes(String(tx.paymentMethod||'').toLowerCase());
      if(!cardTransaction(tx)&&(!assignment.legacy||knownCash))return;
      if((tx.currency||'EUR')!==assignment.currency)return;
      const amount=roundUpAmount(tx.amount,assignment.increment);if(!amount)return;
      desired.push({id:prior?.id||`roundup:${key}:${id}`,profileId:key,amount,currency:assignment.currency,note:`Zaokruživanje · ${String(tx.name||tx.title||'')}`,goalId:assignment.goalId,date:tx.date,source:'Round-up',sourceType:'round-up',roundUpForTransactionId:id,roundUpIncrement:assignment.increment,locked:true});
    });
    const before=new Map(),after=new Map();
    old.forEach(entry=>before.set(entry.goalId,(before.get(entry.goalId)||0)+cents(entry.amount)));
    desired.forEach(entry=>after.set(entry.goalId,(after.get(entry.goalId)||0)+cents(entry.amount)));
    let changed=metadataChanged||JSON.stringify(old)!==JSON.stringify(desired);
    goals.forEach(goal=>{const delta=(after.get(goal.id)||0)-(before.get(goal.id)||0);if(delta){goal.current=Math.max(0,cents(goal.current)+delta)/100;changed=true;}});
    if(changed)profile.savingsEntries=[...list(profile.savingsEntries).filter(entry=>!old.includes(entry)),...desired];
    const byTransaction=new Map(desired.map(entry=>[entry.roundUpForTransactionId,entry]));
    rows.forEach(tx=>{const entry=byTransaction.get(identity(tx));if(entry){tx.roundUpAmount=entry.amount;tx.roundUpGoalId=entry.goalId;}else{delete tx.roundUpAmount;delete tx.roundUpGoalId;}});
    profile.savingsBalance=goals.reduce((total,goal)=>total+Math.max(0,cents(goal.current)),0)/100;
    return {changed,count:desired.length,totalCents:desired.reduce((sum,entry)=>sum+cents(entry.amount),0)};
  }
  return Object.freeze({configureRoundUps,reconcileRoundUps,roundUpAmount,isCardTransaction:cardTransaction});
});
