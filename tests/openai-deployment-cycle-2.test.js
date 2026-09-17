'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');

test('OpenAI runtime is a server dependency and both endpoints have production duration limits',()=>{
  const pkg=require('../package.json'),config=require('../vercel.json');
  assert.ok(pkg.dependencies.openai);
  for(const route of ['api/ai/chat.js','api/ai/parse-transaction.js']){
    assert.equal(config.functions[route].maxDuration,30);
    assert.equal(typeof require(path.join(root,route)),'function');
  }
});

test('local preview loads server-only environment and exposes both new AI paths',()=>{
  const preview=fs.readFileSync(path.join(root,'scripts/preview.js'),'utf8');
  assert.match(preview,/process\.loadEnvFile\(localEnv\)/);
  assert.match(preview,/'\/api\/ai\/chat'/);
  assert.match(preview,/'\/api\/ai\/parse-transaction'/);
  assert.match(fs.readFileSync(path.join(root,'.gitignore'),'utf8'),/\.env\.local/);
});

test('browser sources contain no provider key or SDK import and service worker excludes API responses',()=>{
  const build=fs.readFileSync(path.join(root,'scripts/build.js'),'utf8');
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const files=[...html.matchAll(/<script[^>]+src="([^"?]+)(?:\?[^" ]*)?"/g)].map(match=>match[1]);
  assert.ok(files.length>20);
  for(const file of files){
    if(/^https?:/.test(file))continue;
    const source=fs.readFileSync(path.join(root,file),'utf8');
    assert.doesNotMatch(source,/OPENAI_API_KEY|require\(['"]openai['"]\)|dangerouslyAllowBrowser/);
  }
  assert.doesNotMatch(build,/readFile[^\n]*\.env/);
  const worker=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
  assert.match(worker,/request\.method!=='GET'/);
  assert.match(worker,/!safePath\(url\)/);
});
