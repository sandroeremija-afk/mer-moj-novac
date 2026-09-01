'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const GeminiApi = require('../api/assistant.js');
const MerAssistant = require('../assistant-core.js');

const root = path.resolve(__dirname, '..');

function responseRecorder() {
  const headers = new Map();
  return {
    statusCode:200,
    body:'',
    setHeader(name, value) { headers.set(String(name).toLowerCase(), String(value)); },
    end(value = '') { this.body = String(value); },
    json() { return JSON.parse(this.body || '{}'); }
  };
}

function routeFetch(handler) {
  return async (_url, options) => {
    const response = responseRecorder();
    await handler({
      method:options.method,
      headers:{
        host:'mer-moj-novac.vercel.app',
        origin:'https://mer-moj-novac.vercel.app',
        'content-type':options.headers['Content-Type'],
        'x-forwarded-for':'198.51.100.20'
      },
      body:options.body
    }, response);
    return {
      ok:response.statusCode >= 200 && response.statusCode < 300,
      status:response.statusCode,
      json:async () => response.json()
    };
  };
}

test('evaluation cycle 2: shared assistant client consumes the Vercel Gemini route contract', async () => {
  const route = GeminiApi.createAssistantHandler({
    env:{ GEMINI_API_KEY:'server-only-test-key' },
    fetchImpl:async () => ({
      ok:true,
      status:200,
      json:async () => ({ id:'gemini-integration', steps:[{ type:'model_output', content:[{ type:'text', text:'Dinamički Gemini odgovor' }] }] })
    })
  });
  const client = MerAssistant.createAssistantClient({ fetchImpl:routeFetch(route) });
  const result = await client.ask({
    messages:[{ role:'user', content:'Kako stojim ovaj mjesec?' }],
    locale:'hr',
    profileId:'personal',
    financialContext:{ currency:'EUR', totalIncome:1500, totalExpenses:600, safeToSpend:900 }
  });
  assert.equal(result.source, 'remote');
  assert.equal(result.id, 'gemini-integration');
  assert.equal(result.content, 'Dinamički Gemini odgovor');
});

test('evaluation cycle 2: missing server key reaches the existing deterministic local fallback', async () => {
  const route = GeminiApi.createAssistantHandler({ env:{}, fetchImpl:async () => { throw new Error('must not run'); } });
  const client = MerAssistant.createAssistantClient({ fetchImpl:routeFetch(route) });
  const input = {
    messages:[{ role:'user', content:'Kako se računa dnevni tempo?' }],
    locale:'hr',
    profileId:'business',
    financialContext:{ currency:'EUR', dailySafe:30, daysRemaining:7 }
  };
  const first = await client.ask(input);
  const second = await client.ask(input);
  assert.equal(first.source, 'local');
  assert.equal(first.content, second.content);
  assert.match(first.content, /30,00\s?€/);
});

test('evaluation cycle 2: Gemini secret is documented but absent from every browser asset', () => {
  const browserFiles = ['index.html','runtime.js','logo.js','core.js','auth-core.js','accounting-core.js','security-core.js','import-core.js','bank-provider.js','state-store.js','onboarding-core.js','assistant-core.js','layout-core.js','app.js','premium.js','onboarding.js','assistant-ui.js','layout-ui.js','responsive-ui.js','auth-ui.js'];
  for (const file of browserFiles) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.doesNotMatch(source, /GEMINI_API_KEY|x-goog-api-key/, `${file} must not reference the Gemini credential`);
  }
  const example = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
  assert.match(example, /^GEMINI_API_KEY=$/m);
  assert.doesNotMatch(example, /^GEMINI_API_KEY=.+$/m);
  const ignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
  assert.match(ignore, /\.env\.local/);
  assert.match(ignore, /\.env\.\*\.local/);
  const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  assert.equal(vercel.functions['api/assistant.js'].maxDuration, 10);
});

