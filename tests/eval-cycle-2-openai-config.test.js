'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Config = require('../server/openai-config.js');

test('OpenAI config reads only the backend key and preserves the requested model', () => {
  assert.deepEqual(Config.resolveOpenAIConfig({OPENAI_API_KEY:' server-secret ',OPENAI_MODEL:'unrequested-model'}), {
    apiKey:'server-secret',model:'gpt-4o-mini',isConfigured:true,source:'OPENAI_API_KEY'
  });
  assert.equal(Config.DEFAULT_OPENAI_MODEL,'gpt-4o-mini');
  assert.equal(Config.resolveOpenAIConfig({VITE_OPENAI_API_KEY:'public-key',NEXT_PUBLIC_OPENAI_API_KEY:'public-key'}).isConfigured,false);
});

test('OpenAI config leaves placeholders and missing server keys unconfigured', () => {
  for (const key of ['', 'TVOJ_OPENAI_API_KEY_OVDJE','YOUR_OPENAI_API_KEY_HERE','sk-...','placeholder']) {
    assert.deepEqual(Config.resolveOpenAIConfig({OPENAI_API_KEY:key}), {apiKey:'',model:'gpt-4o-mini',isConfigured:false,source:null});
  }
  assert.equal(Config.resolveOpenAIConfig(null).isConfigured,false);
});
