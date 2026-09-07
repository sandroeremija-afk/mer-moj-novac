(function exposeHouseholds(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.MerHouseholds=api;})(typeof globalThis!=='undefined'?globalThis:this,function createHouseholdApi(){
  'use strict';
  const ROLES=Object.freeze(['owner','editor','viewer']);
  const MAX_CENTS=99999999999;
  const error=code=>Object.assign(new Error(code),{code});
  const clone=value=>JSON.parse(JSON.stringify(value));
  const clean=value=>String(value||'').trim().replace(/\s+/g,' ');
  const identifier=value=>typeof value==='string'&&/^[a-z0-9][a-z0-9:_-]{0,119}$/i.test(value);
  const id=prefix=>`${prefix}-${typeof globalThis.crypto?.randomUUID==='function'?globalThis.crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
  const name=value=>{const result=clean(value);if(result.length<2||result.length>80)throw error('INVALID_NAME');return result;};
  function validDate(value){const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value||''));if(!match)return false;const date=new Date(`${value}T12:00:00Z`);return Number(match[1])>=1900&&Number(match[1])<=2200&&!Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value;}
  function parseAmountCents(value){const raw=String(value??'').trim();if(!/^\d{1,10}(?:[.,]\d{1,2})?$/.test(raw))throw error('INVALID_AMOUNT');const [whole,fraction='']=raw.replace(',','.').split('.');const result=Number(whole)*100+Number(fraction.padEnd(2,'0'));if(!Number.isSafeInteger(result)||result<=0||result>MAX_CENTS)throw error('INVALID_AMOUNT');return result;}
  function cents(value){if(!Number.isSafeInteger(value)||value<=0||value>MAX_CENTS)throw error('INVALID_AMOUNT');return value;}
  function currency(value){const normalized=String(value||'EUR').toUpperCase();if(!['EUR','USD','GBP','CHF'].includes(normalized))throw error('INVALID_CURRENCY');return normalized;}
  function permissions(role){return Object.freeze({view:ROLES.includes(role),manageBills:role==='owner'||role==='editor',contribute:role==='owner'||role==='editor',manageMembers:role==='owner',manageSpace:role==='owner'});}
  function assertSpace(space){
    if(!space||!identifier(space.id)||!identifier(space.ownerUserId)||!['personal','business'].includes(space.profileId)||!Array.isArray(space.members)||!space.members.length||space.members.length>12||!Array.isArray(space.bills)||space.bills.length>1000||!Array.isArray(space.contributions)||space.contributions.length>1000)throw error('INVALID_SPACE');
    if(new Set(space.members.map(member=>member?.id)).size!==space.members.length||space.members.some(member=>!identifier(member?.id)||!ROLES.includes(member.role)||typeof member.name!=='string')||space.members.filter(member=>member.role==='owner').length!==1||!space.members.some(member=>member.id===space.ownerUserId&&member.role==='owner'))throw error('INVALID_SPACE');
    currency(space.currency);
    if(space.bills.some(bill=>!identifier(bill?.id)||!['open','paid'].includes(bill.status)||!validDate(bill.dueDate)||!Number.isSafeInteger(bill.amountCents)||bill.amountCents<=0||bill.amountCents>MAX_CENTS||!Array.isArray(bill.memberIds)||!bill.memberIds.length||new Set(bill.memberIds).size!==bill.memberIds.length||bill.memberIds.some(memberId=>!space.members.some(member=>member.id===memberId))||(bill.status==='paid'&&!validDate(bill.paidDate))))throw error('INVALID_SPACE');
    if(space.contributions.some(entry=>!identifier(entry?.id)||!space.members.some(member=>member.id===entry.memberId)||!Number.isSafeInteger(entry.amountCents)||entry.amountCents<=0||entry.amountCents>MAX_CENTS||!validDate(entry.date)))throw error('INVALID_SPACE');
    return space;
  }
  function actor(space,actorId){assertSpace(space);const member=space.members.find(member=>member.id===actorId);if(!member||!ROLES.includes(member.role))throw error('ACCESS_DENIED');return member;}
  function requirePermission(space,actorId,permission){const member=actor(space,actorId);if(!permissions(member.role)[permission])throw error('PERMISSION_DENIED');return member;}
  function splitEvenly(amountCents,memberIds){cents(amountCents);if(!Array.isArray(memberIds)||!memberIds.length||new Set(memberIds).size!==memberIds.length||memberIds.some(value=>!identifier(value)))throw error('INVALID_MEMBERS');const base=Math.floor(amountCents/memberIds.length),remainder=amountCents%memberIds.length;return Object.fromEntries(memberIds.map((memberId,index)=>[memberId,base+(index<remainder?1:0)]));}
  function memberIds(space,input){const values=Array.isArray(input)?input:space.members.map(member=>member.id);if(!values.length||new Set(values).size!==values.length||values.some(memberId=>!space.members.some(member=>member.id===memberId)))throw error('INVALID_MEMBERS');return [...values];}
  function uniqueId(value,prefix,existing){const next=value||id(prefix);if(!identifier(next)||existing.some(item=>item.id===next))throw error('DUPLICATE_ID');return next;}
  function createSpace(input={},context={}){
    if(!identifier(context.userId)||!['personal','business'].includes(context.profileId))throw error('AUTH_REQUIRED');
    return {version:1,id:identifier(input.id)?input.id:id('household'),ownerUserId:context.userId,profileId:context.profileId,name:name(input.name),currency:currency(input.currency),createdAt:new Date().toISOString(),members:[{id:context.userId,name:name(context.displayName||'Vlasnik prostora'),role:'owner'}],bills:[],contributions:[],audit:[],mode:'local-only'};
  }
  function reduceSpace(source,actorId,command={}){
    const space=clone(assertSpace(source));
    const billCommand=['addBill','editBill','markPaid','reopenBill','deleteBill'].includes(command.type);
    requirePermission(space,actorId,billCommand?'manageBills':['addContribution','deleteContribution'].includes(command.type)?'contribute':['addMember','editMember','removeMember'].includes(command.type)?'manageMembers':'manageSpace');
    const input=command.payload||{};
    if(input.currency&&currency(input.currency)!==space.currency)throw error('CURRENCY_MISMATCH');
    if(command.type==='rename')space.name=name(input.name);
    else if(command.type==='addMember'){
      if(space.members.length>=12)throw error('MEMBER_LIMIT');if(!['editor','viewer'].includes(input.role))throw error('INVALID_ROLE');
      space.members.push({id:uniqueId(input.id,'member',space.members),name:name(input.name),role:input.role});
    }else if(['editMember','removeMember'].includes(command.type)){
      const member=space.members.find(member=>member.id===input.id);if(!member)throw error('MEMBER_NOT_FOUND');if(member.role==='owner')throw error('OWNER_PROTECTED');
      if(command.type==='editMember'){if(!['editor','viewer'].includes(input.role))throw error('INVALID_ROLE');member.name=input.name?name(input.name):member.name;member.role=input.role;}
      else{if(space.bills.some(bill=>bill.memberIds.includes(member.id))||space.contributions.some(entry=>entry.memberId===member.id))throw error('MEMBER_IN_USE');space.members=space.members.filter(item=>item.id!==member.id);}
    }else if(command.type==='addBill'||command.type==='editBill'){
      if(space.bills.length>=1000&&command.type==='addBill')throw error('BILL_LIMIT');
      if(!validDate(input.dueDate))throw error('INVALID_DATE');const amount=cents(input.amountCents),participants=memberIds(space,input.memberIds);
      const fields={name:name(input.name),amountCents:amount,dueDate:input.dueDate,memberIds:participants,shares:splitEvenly(amount,participants),note:clean(input.note).slice(0,300)};
      if(command.type==='addBill')space.bills.push({id:uniqueId(input.id,'bill',space.bills),...fields,status:'open',createdBy:actorId,createdAt:new Date().toISOString()});
      else{const bill=space.bills.find(bill=>bill.id===input.id);if(!bill)throw error('BILL_NOT_FOUND');if(bill.status==='paid')throw error('PAID_BILL_LOCKED');Object.assign(bill,fields);}
    }else if(['markPaid','reopenBill','deleteBill'].includes(command.type)){
      const bill=space.bills.find(bill=>bill.id===input.id);if(!bill)throw error('BILL_NOT_FOUND');
      if(command.type==='markPaid'){if(bill.status==='paid')throw error('ALREADY_PAID');if(!validDate(input.date))throw error('INVALID_DATE');bill.status='paid';bill.paidDate=input.date;bill.recordedBy=actorId;}
      else if(command.type==='reopenBill'){bill.status='open';delete bill.paidDate;delete bill.recordedBy;}
      else{if(bill.status==='paid')throw error('PAID_BILL_LOCKED');space.bills=space.bills.filter(item=>item.id!==bill.id);}
    }else if(command.type==='addContribution'){
      if(space.contributions.length>=1000)throw error('CONTRIBUTION_LIMIT');if(!space.members.some(member=>member.id===input.memberId))throw error('MEMBER_NOT_FOUND');if(!validDate(input.date))throw error('INVALID_DATE');
      space.contributions.push({id:uniqueId(input.id,'contribution',space.contributions),memberId:input.memberId,amountCents:cents(input.amountCents),date:input.date,recordedBy:actorId});
    }else if(command.type==='deleteContribution'){
      if(!space.contributions.some(entry=>entry.id===input.id))throw error('CONTRIBUTION_NOT_FOUND');space.contributions=space.contributions.filter(entry=>entry.id!==input.id);
    }else throw error('UNKNOWN_COMMAND');
    space.audit=[...(Array.isArray(space.audit)?space.audit:[]),{actorId,action:command.type,at:new Date().toISOString()}].slice(-100);
    return space;
  }
  function listSpaces(profile,context){if(!identifier(context?.userId)||!['personal','business'].includes(context.profileId))return[];return (Array.isArray(profile?.enterprise?.households)?profile.enterprise.households:[]).filter(space=>{if(space?.ownerUserId!==context.userId||space.profileId!==context.profileId)return false;try{assertSpace(space);return true;}catch{return false;}}).map(clone);}
  function createInProfile(profile,input,context){const space=createSpace(input,context),existing=Array.isArray(profile?.enterprise?.households)?profile.enterprise.households:[];if(existing.length>=12)throw error('SPACE_LIMIT');if(existing.some(item=>item.id===space.id))throw error('DUPLICATE_ID');profile.enterprise||={};profile.enterprise.households=[...existing,space];return space;}
  function applyCommand(profile,context,spaceId,command){const space=listSpaces(profile,context).find(space=>space.id===spaceId);if(!space)throw error('ACCESS_DENIED');const next=reduceSpace(space,context.userId,command);profile.enterprise.households=profile.enterprise.households.map(item=>item.id===spaceId?next:item);return clone(next);}
  function summary(space,referenceDate=new Date().toISOString().slice(0,10)){
    assertSpace(space);if(!validDate(referenceDate))throw error('INVALID_DATE');
    const paid=space.bills.filter(bill=>bill.status==='paid'&&bill.paidDate<=referenceDate),open=space.bills.filter(bill=>bill.status!=='paid'||bill.paidDate>referenceDate),postedContributions=space.contributions.filter(entry=>entry.date<=referenceDate);
    const totalContributionsCents=postedContributions.reduce((total,entry)=>total+cents(entry.amountCents),0),paidCents=paid.reduce((total,bill)=>total+cents(bill.amountCents),0),upcomingCents=open.reduce((total,bill)=>total+cents(bill.amountCents),0);
    const availableCents=totalContributionsCents-paidCents;
    return {totalContributionsCents,paidCents,upcomingCents,availableCents,afterBillsCents:availableCents-upcomingCents,overdueCount:open.filter(bill=>bill.dueDate<referenceDate).length,coveragePercent:upcomingCents?Math.max(0,Math.min(100,availableCents/upcomingCents*100)):availableCents>0?100:0,members:space.members.map(member=>({...member,contributedCents:postedContributions.filter(entry=>entry.memberId===member.id).reduce((sum,entry)=>sum+entry.amountCents,0),openShareCents:open.reduce((sum,bill)=>sum+(splitEvenly(bill.amountCents,bill.memberIds)[member.id]||0),0),paidShareCents:paid.reduce((sum,bill)=>sum+(splitEvenly(bill.amountCents,bill.memberIds)[member.id]||0),0)}))};
  }
  return Object.freeze({ROLES,MAX_CENTS,permissions,validDate,parseAmountCents,splitEvenly,createSpace,reduceSpace,listSpaces,createInProfile,applyCommand,summary});
});
