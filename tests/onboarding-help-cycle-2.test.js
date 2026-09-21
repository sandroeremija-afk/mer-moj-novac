'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Core=require('../onboarding-core.js');
const source=fs.readFileSync(require.resolve('../assistant-ui.js'),'utf8');

class Element {
  constructor(tag='div') {this.tagName=tag;this.children=[];this.parent=null;this.dataset={};this.attributes={};this.hidden=false;this.open=false;this.listeners={};this.classList={toggle(){}};}
  append(...children) {for(const child of children){child.parent=this;this.children.push(child);}}
  setAttribute(key,value) {this.attributes[key]=value;}
  addEventListener(event,callback) {this.listeners[event]=callback;}
  descendants() {return this.children.flatMap(child=>[child,...child.descendants()]);}
  visible() {for(let node=this;node;node=node.parent)if(node.hidden)return false;return true;}
}

function realHelp() {
  const modal=new Element('dialog'),helpBody=new Element(),helpFaqPanel=new Element(),calls=[],voiceCalls=[];
  modal.append(helpBody);helpBody.append(helpFaqPanel);
  const context={document:{createElement:tag=>new Element(tag)},voice:{stopAll:()=>voiceCalls.push('stop')},helpBody,helpFaqPanel,modal,assistantWidget:{hidden:true},t:key=>key,svgIcon:()=>new Element('svg'),$$:()=>[],renderMessages:()=>calls.push('render'),selectFaqModule:()=>calls.push('faq'),closeAssistant:()=>calls.push('close-widget'),setTimeout:()=>{throw new Error('Opening tour Help must not schedule a request');},openModal:dialog=>{dialog.open=true;calls.push('open-help');},activeRequest:{abort:()=>calls.push('abort')},setAssistantBusy:()=>calls.push('idle')};
  vm.createContext(context);
  const panelStart=source.indexOf('    const aiPanel = document.createElement(');
  const panelEnd=source.indexOf('    helpBody.append(aiPanel);',panelStart)+'    helpBody.append(aiPanel);'.length;
  assert.ok(panelStart>0&&panelEnd>panelStart);
  vm.runInContext(`${source.slice(panelStart,panelEnd)}\nglobalThis.helpUi={aiPanel,input};`,context);
  const modeStart=source.indexOf('  function selectHelpMode('),modeEnd=source.indexOf('  function bindRovingTabs(',modeStart);
  const openStart=source.indexOf('  function openHelp('),openEnd=source.indexOf("  $('#openHelpAssistant').addEventListener",openStart);
  const closeStart=source.indexOf("  modal.addEventListener('close', () => {"),closeEnd=source.indexOf('  reactiveStore.subscribe(',closeStart);
  vm.runInContext([source.slice(modeStart,modeEnd),source.slice(openStart,openEnd),source.slice(closeStart,closeEnd)].join('\n'),context);
  return {context,modal,helpBody,helpFaqPanel,calls,voiceCalls};
}

test('step 9 opens the production Help mode containing real chat input and three localized sample questions',()=>{
  const step=Core.DEFAULT_STEPS[8],{context,modal,helpBody,helpFaqPanel,calls}=realHelp();
  context.openHelp(step.helpMode);
  assert.equal(step.surface,'help');assert.equal(step.target,'#helpTourConversation');
  assert.equal(modal.open,true);assert.equal(helpFaqPanel.hidden,true);assert.equal(context.helpUi.aiPanel.hidden,false);
  const conversation=helpBody.descendants().find(node=>`#${node.id}`===step.target);
  assert.ok(conversation);assert.equal(conversation.visible(),true);
  const input=conversation.descendants().find(node=>node.id==='helpAssistantInput');
  assert.equal(input.tagName,'textarea');assert.equal(input.visible(),true);
  const prompts=conversation.descendants().filter(node=>node.dataset.aiPrompt);
  assert.equal(prompts.length,3);
  assert.ok(prompts.every(node=>node.visible()&&node.dataset.aiPromptEn&&node.type==='button'));
  assert.deepEqual(calls,['render','open-help'],'tour opens the real mode without sending a message or running a prompt');
});

test('a queued native Help close event cannot reset reopened tour chat to FAQ or abort newer work',()=>{
  const {context,modal,helpFaqPanel,calls,voiceCalls}=realHelp();
  context.openHelp('assistant');modal.open=false;context.openHelp('assistant');
  calls.length=0;modal.listeners.close();
  assert.equal(context.helpUi.aiPanel.hidden,false);assert.equal(helpFaqPanel.hidden,true);
  assert.deepEqual(calls,[]);assert.ok(context.activeRequest);
  assert.deepEqual(voiceCalls,[],'a stale close event cannot stop microphone activity in reopened Help');
  modal.open=false;modal.listeners.close();
  assert.equal(context.helpUi.aiPanel.hidden,true);assert.equal(helpFaqPanel.hidden,false);
  assert.equal(context.activeRequest,null);assert.deepEqual(calls,['abort','idle']);
  assert.deepEqual(voiceCalls,['stop','stop'],'real close and FAQ mode both stop private voice activity');
});

test('hosted phone Help overrides hidden prompts while keeping the real composer inside a compact tour lane',()=>{
  const css=fs.readFileSync(require.resolve('../single-page-popups.css'),'utf8');
  const prefix='#helpAssistantModal.tour-modal-host[data-tour-step="help"]';
  const rule=selector=>{
    const full=`${prefix} ${selector}`,start=css.indexOf(`${full} {`);
    assert.ok(start>=0,`${full} has a step-specific rule`);
    return css.slice(start+full.length,css.indexOf('}',start)+1);
  };
  assert.match(css.slice(css.indexOf('/* Step 9')) , /@media\(max-width:1024px\)/);
  assert.match(rule('.assistant-suggestions'),/display:grid;.*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(rule('.assistant-suggestion'),/min-height:44px;.*white-space:normal/);
  assert.match(rule('.assistant-suggestion:last-child'),/grid-column:1 \/ -1/);
  assert.match(rule('#helpModalAiPanel'),/height:auto; min-height:0;.*overflow:hidden/);
  assert.match(rule('.help-assistant-body'),/flex:0 1 auto; overflow:hidden/);
  assert.match(rule('#helpAssistantMessages'),/max-height:80px/);
  const input=rule('#helpAssistantInput');
  assert.match(input,/box-sizing:border-box; height:64px; min-height:64px; max-height:64px/);
  assert.match(input,/padding:8px 10px; font-size:16px; line-height:22px/);
  assert.ok(64-8*2>=22*2,'the empty input has room for two lines of placeholder text');
});
