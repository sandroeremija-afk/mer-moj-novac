'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=name=>fs.readFileSync(require.resolve('../'+name),'utf8');
const ui=read('assistant-ui.js'),voice=read('assistant-voice.js'),css=read('assistant-voice.css');
test('voice cycle 2: both chat surfaces attach the native controller and clean up on every lifecycle transition',()=>{
  assert.match(ui,/assistantSurfaces\.forEach\(surface=>\{[\s\S]*?voice\?\.attach\(surface\)/);
  assert.match(ui,/function closeAssistant\([^)]*\)[\s\S]*?voice\?\.stopAll\(\)/);
  assert.match(ui,/function resetAssistantSession\(\)[\s\S]*?voice\?\.stopAll\(\{clearDrafts:true\}\)/);
  assert.match(ui,/reactiveStore\.subscribe\(event => \{\s*voice\?\.refresh\(\)/);
  assert.match(ui,/message\.source==='remote'&&voice[\s\S]*voice\.messageButton\(message\.content,surface\)/);
  assert.match(voice,/SpeechRecognition\|\|host\.webkitSpeechRecognition/);assert.match(voice,/recognition\.lang='hr-HR'/);assert.match(voice,/utterance\.lang='hr-HR'/);
  assert.doesNotMatch(voice,/fetch\(|requestSubmit\(|getUserMedia\(|localStorage|apiKey/);
});
test('voice cycle 2: controls are labelled, touch-sized and bounded; recording animation respects reduced motion',()=>{
  assert.match(voice,/mic\.type='button'/);assert.match(voice,/setAttribute\('aria-pressed'/);assert.match(voice,/setAttribute\('aria-describedby'/);assert.match(voice,/setAttribute\('aria-live','polite'\)/);
  assert.match(css,/grid-template-columns:minmax\(0,1fr\) 44px 44px/);assert.match(css,/min-width:44px;height:44px/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);assert.match(css,/\.assistant-mic-button \[hidden\]\{display:none\}/);
  assert.match(voice,/Glas obrađuje usluga preglednika\. Poruku šaljete sami\./);assert.match(ui,/Pomoć i AI asistent/);assert.match(ui,/guideFaq:'Vodič i česta pitanja'/);
  assert.match(css,/textarea\{box-sizing:border-box;height:44px;min-height:44px;max-height:44px;font-size:16px;line-height:22px;padding:10px 5px;overflow-y:hidden\}/);
  assert.ok(44-10*2>=22,'the mobile empty composer fits its 22px line without a native scrollbar');
});
