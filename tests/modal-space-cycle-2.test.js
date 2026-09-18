'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=file=>fs.readFileSync(require.resolve('../'+file),'utf8');
test('static popup sizing releases physical and logical legacy heights without touching chat or tour hosts',()=>{
  const css=read('modal-space.css');
  assert.match(css,/height:fit-content; block-size:fit-content/);
  assert.match(css,/:not\(\.tour-modal-host\)/);
  assert.match(css,/max-block-size:min\(90dvh,calc\(var\(--ui-visual-height,100dvh\) - 20px\)\)/);
  assert.doesNotMatch(css,/\.assistant-messages|#insightsView|#savingsView/);
  assert.match(css,/#helpAssistantModal\[open\]:not\(\.tour-modal-host\):has\(#helpFaqMode\[aria-selected="true"\]\)/,'only the FAQ tab shrinks; chat and tour remain bounded');
});
test('strategy uses content-sized rows and paginated list footers keep a deliberate gap',()=>{
  const css=read('modal-space.css');
  assert.match(css,/flex:0 1 auto; align-content:start; grid-auto-rows:max-content/);
  assert.match(css,/\.mer-generated-footer\s*\{\s*margin-top:16px/);
  assert.match(css,/#budgetCategoriesModal \.budget-category-modal-list \{ flex:0 1 auto; min-height:0/);
});
test('modal space refinement is delivered after the historical style cascade and bundled offline',()=>{
  const html=read('index.html');
  assert.ok(html.indexOf('modal-space.css')>html.indexOf('financial-polish.css'));
  assert.match(read('scripts/build.js'),/suiteCss\.push\('modal-space.css'\)/);
});
