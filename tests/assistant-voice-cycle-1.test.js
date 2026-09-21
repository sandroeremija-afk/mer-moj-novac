'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),Voice=require('../assistant-voice.js');
class Events{constructor(){this.events=new Map();}addEventListener(name,handler){if(!this.events.has(name))this.events.set(name,new Set());this.events.get(name).add(handler);}removeEventListener(name,handler){this.events.get(name)?.delete(handler);}fire(name,event={}){[...(this.events.get(name)||[])].forEach(handler=>handler(event));}}
class Element extends Events{
  constructor(tag){super();this.tagName=tag;this.children=[];this.attributes={};this.hidden=false;this.disabled=false;this.value='';this.textContent='';this.maxLength=1000;this.isConnected=true;this.classes=new Set();this.classList={add:name=>this.classes.add(name),toggle:(name,on)=>{if(on)this.classes.add(name);else this.classes.delete(name);}};}
  append(...nodes){nodes.forEach(node=>{this.children.push(node);node.parent=this;});}
  insertBefore(node,before){const index=this.children.indexOf(before);if(index<0)this.append(node);else{this.children.splice(index,0,node);node.parent=this;}}
  after(node){if(this.parent){const index=this.parent.children.indexOf(this);this.parent.children.splice(index+1,0,node);node.parent=this.parent;}}
  setAttribute(name,value){this.attributes[name]=String(value);}getAttribute(name){return this.attributes[name];}hasAttribute(name){return Object.hasOwn(this.attributes,name);}toggleAttribute(name,on){if(on)this.attributes[name]='';else delete this.attributes[name];}
  focus(){this.focused=true;}setSelectionRange(start,end){this.selection=[start,end];}click(){if(!this.disabled)this.fire('click');}
}
function harness({supported=true,prefixed=false,language='hr',startError,tts=true}={}){
  const document=new Events();document.hidden=false;document.body=new Element('body');document.createElement=tag=>new Element(tag);document.createElementNS=(_ns,tag)=>new Element(tag);
  const host=new Events(),instances=[],utterances=[],timers=new Map();let nextTimer=0,owner='user1|personal',visible=true,cancelled=0,observer;
  host.document=document;host.setTimeout=(callback,delay)=>{timers.set(++nextTimer,{callback,delay});return nextTimer;};host.clearTimeout=id=>timers.delete(id);
  class Recognition{constructor(){instances.push(this);}start(){this.started=true;if(startError)throw startError;this.onstart?.();}stop(){this.stopped=true;}abort(){this.aborted=true;}}
  if(supported)host[prefixed?'webkitSpeechRecognition':'SpeechRecognition']=Recognition;
  host.MutationObserver=class{constructor(callback){this.callback=callback;observer=this;}observe(){}disconnect(){this.disconnected=true;}};
  const englishVoice={lang:'en-US'},croatianVoice={lang:'hr-HR'};
  if(tts){host.SpeechSynthesisUtterance=class{constructor(content){this.text=content;}};host.speechSynthesis={getVoices:()=>[englishVoice,croatianVoice],speak:utterance=>utterances.push(utterance),cancel:()=>{cancelled++;}};}
  const controller=Voice.create({host,document,getOwner:()=>owner,getLanguage:()=>language});
  function surface(id){const root=new Element('section'),form=new Element('form'),input=new Element('textarea'),send=new Element('button');input.id=id;form.append(input,send);root.append(form);document.body.append(root);const result={root,form,input,send,isVisible:()=>visible};controller.attach(result);return result;}
  const first=surface('assistantInput'),second=surface('helpAssistantInput');
  const result=(instance,parts)=>instance.onresult?.({results:parts.map(([value,isFinal=false])=>Object.assign([{transcript:value}],{isFinal}))});
  return {host,document,controller,first,second,instances,utterances,timers,result,croatianVoice,get cancelled(){return cancelled;},setOwner:value=>{owner=value;controller.refresh();},hide:()=>{visible=false;observer.callback();},disconnect:()=>{first.root.isConnected=false;observer.callback();},observe:()=>observer.callback(),tick:delay=>{[...timers].filter(([,item])=>item.delay===delay).forEach(([id,item])=>{timers.delete(id);item.callback();});}};
}

test('voice cycle 1: explicit microphone activation and Croatian interim results preserve an existing draft',()=>{
  const h=harness();assert.equal(h.instances.length,0,'mounting does not request microphone access');
  assert.equal(h.first.micButton.type,'button');assert.equal(h.first.form.children.at(-2),h.first.micButton);assert.match(h.first.voiceHint.textContent,/usluga preglednika/);
  h.first.input.value='Molim vas,';h.first.micButton.click();const recognition=h.instances[0];
  assert.equal(recognition.lang,'hr-HR');assert.equal(recognition.interimResults,true);assert.equal(recognition.continuous,false);assert.match(h.first.voiceStatus.textContent,/Slušam/);
  assert.equal(h.first.micButton.getAttribute('aria-pressed'),'true');assert.equal(h.first.stopLabel.hidden,false);
  assert.equal(h.first.micIcon.hasAttribute('hidden'),true,'SVG hiding uses a real attribute, not an unsupported SVG hidden property');
  h.result(recognition,[['koliko',false]]);assert.equal(h.first.input.value,'Molim vas, koliko');
  h.result(recognition,[['koliko novca',true],['mogu',false]]);assert.equal(h.first.input.value,'Molim vas, koliko novca mogu');
  h.result(recognition,[['koliko novca',true],['mogu potrošiti?',true]]);assert.equal(h.first.input.value,'Molim vas, koliko novca mogu potrošiti?');
  recognition.onend();assert.equal(h.first.micButton.getAttribute('aria-pressed'),'false');assert.match(h.first.voiceStatus.textContent,/pritisnite Pošalji/);assert.equal(h.timers.size,0);
  assert.equal(h.first.form.events.get('submit'),undefined,'speech never triggers form submission');h.controller.destroy();
});

test('voice cycle 1: Stop flushes the final native result; cancellation ignores late results',()=>{
  const h=harness();h.first.micButton.click();const recognition=h.instances[0];h.result(recognition,[['dodaj pet',false]]);
  h.first.micButton.click();assert.equal(recognition.stopped,true);assert.equal(recognition.aborted,undefined);assert.match(h.first.voiceStatus.textContent,/Zaustavljam/);
  h.result(recognition,[['dodaj petnaest eura',true]]);recognition.onend();assert.equal(h.first.input.value,'dodaj petnaest eura');assert.equal(h.timers.size,0);
  h.first.micButton.click();const second=h.instances[1],late=second.onresult;h.controller.stopAll();late({results:[[{transcript:'kasni tekst'}]]});assert.equal(h.first.input.value,'dodaj petnaest eura');assert.equal(second.aborted,true);
  h.first.micButton.click();h.first.micButton.click();h.tick(1500);assert.equal(h.instances[2].aborted,true,'a missing native end event cannot leave the microphone stuck');h.controller.destroy();
});

test('voice cycle 1: fallback, permission errors, no speech and service errors keep typed entry available',()=>{
  const unsupported=harness({supported:false});unsupported.first.input.value='Moj tekst';unsupported.first.micButton.click();assert.match(unsupported.first.voiceStatus.textContent,/nije podržan/);assert.equal(unsupported.first.input.value,'Moj tekst');assert.equal(unsupported.first.input.focused,true);unsupported.controller.destroy();
  for(const [error,expected] of [['not-allowed',/nije dopušten/],['service-not-allowed',/nije dopušten/],['no-speech',/nije prepoznat/],['network',/Provjerite vezu/],['audio-capture',/nije dostupan/]]){
    const h=harness();h.first.micButton.click();h.instances[0].onerror({error});assert.match(h.first.voiceStatus.textContent,expected);assert.equal(h.first.micButton.getAttribute('aria-pressed'),'false');assert.equal(h.instances[0].aborted,true);assert.equal(h.timers.size,0);h.controller.destroy();
  }
  const denied=harness({startError:Object.assign(new Error('denied'),{name:'NotAllowedError'})});denied.first.micButton.click();assert.match(denied.first.voiceStatus.textContent,/nije dopušten/);denied.controller.destroy();
  const en=harness({language:'en',prefixed:true});en.second.micButton.click();assert.equal(en.instances[0].lang,'hr-HR','recognition stays Croatian even in the separately localized English interface');assert.match(en.second.voiceStatus.textContent,/Listening/);en.controller.destroy();
});

test('voice cycle 1: both surfaces share one capture; manual typing and busy sends cancel safely',()=>{
  const h=harness();h.first.micButton.click();const first=h.instances[0];h.second.micButton.click();assert.equal(first.aborted,true);assert.equal(h.instances[1].started,true);
  h.second.input.value='Ručno promijenjeno';h.second.input.fire('input');assert.equal(h.instances[1].aborted,true);assert.equal(h.second.input.value,'Ručno promijenjeno');
  h.first.send.disabled=true;h.controller.refresh();assert.equal(h.first.micButton.disabled,true);h.first.micButton.click();assert.equal(h.instances.length,2);
  h.second.input.maxLength=20;h.second.micButton.click();h.result(h.instances[2],[['a'.repeat(100),true]]);assert.equal(h.second.input.value.length,20);h.controller.destroy();
});

test('voice cycle 1: profile, logout, hidden page, surface close and DOM disconnect cannot leak late transcript',()=>{
  for(const reason of ['profile','logout','visibility','close','disconnect','offline','pagehide']){
    const h=harness();h.first.input.value='privatni tekst';h.second.input.value='drugi nacrt';h.first.micButton.click();const recognition=h.instances[0],late=recognition.onresult;
    if(reason==='profile')h.setOwner('user1|business');if(reason==='logout')h.setOwner('');if(reason==='visibility'){h.document.hidden=true;h.document.fire('visibilitychange');}if(reason==='close')h.hide();if(reason==='disconnect')h.disconnect();if(reason==='offline'||reason==='pagehide')h.host.fire(reason);
    assert.equal(recognition.aborted,true,reason);const value=h.first.input.value;late({results:[[{transcript:'NE SMIJE SE PRENIJETI'}]]});assert.equal(h.first.input.value,value,reason);
    if(reason==='profile'||reason==='logout'){assert.equal(value,'');assert.equal(h.second.input.value,'','drafts are cleared across both profiles/surfaces');}
    assert.equal(h.timers.size,0);h.controller.destroy();
  }
});

test('voice cycle 1: optional explicit text-to-speech prefers Croatian voice, toggles Stop and cleans up',()=>{
  const h=harness(),button=h.controller.messageButton('Ostalo vam je 15 eura.',h.first);h.first.root.append(button);
  assert.equal(h.utterances.length,0,'never auto-read a financial reply');button.click();assert.equal(h.utterances[0].lang,'hr-HR');assert.equal(h.utterances[0].voice,h.croatianVoice);assert.equal(button.getAttribute('aria-pressed'),'true');button.click();assert.equal(button.getAttribute('aria-pressed'),'false');assert.equal(h.cancelled,1);
  button.click();const late=h.utterances[1].onend;h.setOwner('user1|business');assert.equal(h.cancelled,2);late();assert.equal(h.cancelled,2);
  button.click();h.document.hidden=true;h.document.fire('visibilitychange');assert.equal(h.cancelled,3);h.controller.destroy();
  const unsupported=harness({tts:false}),unavailable=unsupported.controller.messageButton('Odgovor',unsupported.first);unavailable.click();assert.match(unsupported.first.voiceStatus.textContent,/nije dostupno/);unsupported.controller.destroy();
});
