'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const GeminiConfig = require('../api/gemini-config.js');
const GeminiApi = require('../api/assistant.js');

function responseRecorder() {
  return {
    statusCode:200,
    body:'',
    setHeader() {},
    end(value = '') { this.body = String(value); },
    json() { return JSON.parse(this.body || '{}'); }
  };
}

function validRequest() {
  return {
    method:'POST',
    headers:{
      host:'mer-moj-novac.vercel.app',
      origin:'https://mer-moj-novac.vercel.app',
      'content-type':'application/json',
      'x-forwarded-for':'203.0.113.25'
    },
    body:{ messages:[{ role:'user', content:'Kako mogu bolje štedjeti?' }] }
  };
}

test('evaluation cycle 2: Gemini config prefers the primary server key and validates model overrides', () => {
  const config = GeminiConfig.resolveGeminiConfig({
    GEMINI_API_KEY:'primary-server-key',
    GOOGLE_GENERATIVE_AI_API_KEY:'fallback-server-key',
    GEMINI_MODEL:'gemini-custom_2.0'
  });
  assert.deepEqual(config, {
    apiKey:'primary-server-key',
    model:'gemini-custom_2.0',
    isConfigured:true,
    source:'GEMINI_API_KEY'
  });
});

test('evaluation cycle 2: Gemini config uses the server-only compatibility fallback', () => {
  const config = GeminiConfig.resolveGeminiConfig({
    GEMINI_API_KEY:'TVOJ_GEMINI_API_KEY_OVDJE',
    GOOGLE_GENERATIVE_AI_API_KEY:'fallback-server-key'
  });
  assert.equal(config.apiKey, 'fallback-server-key');
  assert.equal(config.source, 'GOOGLE_GENERATIVE_AI_API_KEY');
  assert.equal(config.model, GeminiConfig.DEFAULT_GEMINI_MODEL);
  assert.equal(config.isConfigured, true);
});

test('evaluation cycle 2: documented placeholders remain safely unconfigured', async () => {
  const config = GeminiConfig.resolveGeminiConfig({ GEMINI_API_KEY:'TVOJ_GEMINI_API_KEY_OVDJE' });
  assert.equal(config.apiKey, '');
  assert.equal(config.source, null);
  assert.equal(config.isConfigured, false);

  let fetchCalls = 0;
  const handler = GeminiApi.createAssistantHandler({
    env:{ GEMINI_API_KEY:'TVOJ_GEMINI_API_KEY_OVDJE' },
    fetchImpl:async () => { fetchCalls += 1; }
  });
  const response = responseRecorder();
  await handler(validRequest(), response);
  assert.equal(response.statusCode, 503);
  assert.equal(response.json().error, 'AI_UNAVAILABLE');
  assert.equal(fetchCalls, 0);
});
