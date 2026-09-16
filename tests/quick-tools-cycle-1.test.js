'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const core=require('../quick-tools-core.js');

test('calculator handles arithmetic precedence, grouped expressions, unary signs and localized decimal input',()=>{
  for(const [expression,value] of [
    ['2+3*4',14],['(2+3)*4',20],['18/3/2',3],['9-3-2',4],
    ['-2 * (-3 + 1)',4],['+(2-5)',-3],['5×(2+3)÷2',12.5],
    ['125,50 + 20',145.5],['.5 + ,25',.75],['0.1+0.2',.3],['4−7',-3],['-0',0]
  ])assert.deepEqual(core.calculate(expression),{ok:true,value},expression);
  assert.equal(Object.is(core.calculate('-0').value,-0),false);
});

test('calculator rejects incomplete expressions, unsupported operations and executable input',()=>{
  for(const expression of [
    '',null,undefined,' ','.','1.2.3','(1+2','1+2)','2(3)','()','1+','*2',
    '2**3','2%3','1,234.56','alert(1)','globalThis.process.exit()',
    '1; throw new Error("executed")','(()=>7)()','<img src=x onerror=alert(1)>',
    'constructor.constructor("return process")()','Infinity','NaN'
  ])assert.deepEqual(core.calculate(expression),{ok:false,error:'expression'},String(expression));
});

test('calculator reports zero division and bounds oversized expressions and intermediate results',()=>{
  for(const expression of ['1/0','0/0','1/-0','1/(3-3)'])
    assert.deepEqual(core.calculate(expression),{ok:false,error:'zero'},expression);
  for(const expression of ['1000000000000001','1000000000*1000000000','-1000000000000001','1/.0000000000000001'])
    assert.deepEqual(core.calculate(expression),{ok:false,error:'range'},expression);
  assert.deepEqual(core.calculate('1'.repeat(121)),{ok:false,error:'expression'});
  assert.deepEqual(core.calculate('1000000000000000'),{ok:true,value:1e15});
});


test('forecast picking scales viewport coordinates into the plot and clamps either edge',()=>{
  const viewWidth=660,left=84,plotWidth=560;
  for(const rect of [{left:100,width:330},{left:-25,width:660},{left:40,width:990}]){
    for(const index of [0,1,7,15,21,29,30]){
      const clientX=rect.left+(left+index/30*plotWidth)*rect.width/viewWidth;
      assert.equal(core.chartIndex(clientX,rect,viewWidth,left,plotWidth),index);
    }
    assert.equal(core.chartIndex(rect.left-1000,rect,viewWidth,left,plotWidth),0);
    assert.equal(core.chartIndex(rect.left+rect.width+1000,rect,viewWidth,left,plotWidth),30);
  }
  assert.equal(core.chartIndex(50,{left:0,width:100},100,0,100,4),2);
});

test('forecast picking safely ignores unavailable or non-finite chart geometry',()=>{
  for(const args of [
    [10,null,100,0,100],[10,{left:0,width:0},100,0,100],
    [10,{left:0,width:-1},100,0,100],[10,{left:0,width:100},100,0,0],
    [NaN,{left:0,width:100},100,0,100],[10,{left:0},100,0,100],
    [10,{left:0,width:100},Infinity,0,100],[10,{left:NaN,width:100},100,0,100]
  ])assert.equal(core.chartIndex(...args),0,String(args));
});

test('quick tools are packaged and loaded before consumers, with redraw hooks for account and language changes',()=>{
  const read=file=>fs.readFileSync(require.resolve('../'+file),'utf8');
  const html=read('index.html'),build=read('scripts/build.js'),app=read('app.js');
  for(const asset of ['quick-tools-core.js','quick-tools-ui.js','quick-tools.css']){
    assert.ok(html.includes(asset),asset+' is loaded');assert.ok(build.includes(asset),asset+' is packaged');
  }
  assert.ok(html.indexOf('src="quick-tools-core.js"')<html.indexOf('src="enterprise-ui.js"'));
  assert.ok(html.indexOf('src="enterprise-ui.js"')<html.indexOf('src="quick-tools-ui.js"'));
  assert.doesNotMatch(app,/MerBudgetPagination/);
  assert.match(app,/window\.MerQuickTools\?\.render\(\)/);
});
