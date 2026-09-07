'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const OpenWebUiConfig = require('../api/open-webui-config.js');
const AssistantApi = require('../api/assistant.js');

function responseRecorder() {
  const headers = new Map();
  return {
    statusCode:200,
    body:'',
    setHeader(name, value) { headers.set(String(name).toLowerCase(), String(value)); },
    getHeader(name) { return headers.get(String(name).toLowerCase()); },
    end(value = '') { this.body = String(value); },
    json() { return JSON.parse(this.body || '{}'); }
  };
}

function request() {
  return {
    method:'POST',
    headers:{
      host:'mer-moj-novac.vercel.app',
      origin:'https://mer-moj-novac.vercel.app',
      'content-type':'application/json',
      'x-forwarded-for':`198.51.100.${Math.floor(Math.random() * 200) + 1}`
    },
    body:{ messages:[{ role:'user', content:'Kako mogu bolje štedjeti?' }] }
  };
}

async function invoke(fetchImpl) {
  const handler = AssistantApi.createAssistantHandler({
    env:{ AI_PROVIDER:'openwebui', OPEN_WEBUI_API_KEY:'server-key' },
    fetchImpl
  });
  const response = responseRecorder();
  await handler(request(), response);
  return response;
}

test('evaluation cycle 2: Open WebUI config provides safe defaults and supports real model identifiers', () => {
  const config = OpenWebUiConfig.resolveOpenWebUiConfig({ OPEN_WEBUI_API_KEY:'server-key' });
  assert.deepEqual(config, {
    apiKey:'server-key',
    baseUrl:'https://webui.moj.eracun',
    model:'gemma4:26b',
    isConfigured:true
  });
  assert.equal(OpenWebUiConfig.normalizeModel('registry/team/model:latest'), 'registry/team/model:latest');
  assert.equal(OpenWebUiConfig.normalizeModel('invalid model name'), OpenWebUiConfig.DEFAULT_OPEN_WEBUI_MODEL);
  assert.equal(OpenWebUiConfig.resolveOpenWebUiConfig({ OPEN_WEBUI_API_KEY:'TVOJ_OPEN_WEBUI_API_KEY_OVDJE' }).isConfigured, false);
});

test('evaluation cycle 2: Open WebUI config rejects unsafe remote URLs and embedded credentials', () => {
  assert.equal(OpenWebUiConfig.normalizeBaseUrl('http://webui.example.test'), '');
  assert.equal(OpenWebUiConfig.normalizeBaseUrl('https://user:pass@webui.example.test'), '');
  assert.equal(OpenWebUiConfig.normalizeBaseUrl('https://webui.example.test?token=secret'), '');
  assert.equal(OpenWebUiConfig.normalizeBaseUrl('https://webui.example.test/#secret'), '');
  assert.equal(OpenWebUiConfig.normalizeBaseUrl('http://localhost:8080/'), 'http://localhost:8080');
  assert.equal(OpenWebUiConfig.normalizeBaseUrl('https://webui.example.test/prefix/'), 'https://webui.example.test/prefix');
});

test('evaluation cycle 2: Open WebUI authentication, model and rate failures map to stable errors', async () => {
  for (const [upstreamStatus, expectedStatus, expectedError, retryable] of [
    [401, 503, 'AI_AUTH_FAILED', false],
    [403, 503, 'AI_AUTH_FAILED', false],
    [404, 502, 'AI_MODEL_NOT_FOUND', false],
    [500, 502, 'AI_UPSTREAM_UNAVAILABLE', true],
    [503, 502, 'AI_UPSTREAM_UNAVAILABLE', true]
  ]) {
    const response = await invoke(async () => ({ ok:false, status:upstreamStatus, headers:{ get:() => '' } }));
    assert.equal(response.statusCode, expectedStatus);
    assert.deepEqual(response.json(), { error:expectedError, retryable });
  }

  const limited = await invoke(async () => ({ ok:false, status:429, headers:{ get:name => name === 'retry-after' ? '19' : '' } }));
  assert.equal(limited.statusCode, 429);
  assert.deepEqual(limited.json(), { error:'AI_RATE_LIMITED', retryable:true });
  assert.equal(limited.getHeader('retry-after'), '19');
});

test('evaluation cycle 2: malformed, empty and timed-out Open WebUI responses fail safely', async () => {
  const malformed = await invoke(async () => ({ ok:true, status:200, json:async () => { throw new SyntaxError('bad json'); } }));
  assert.equal(malformed.statusCode, 502);
  assert.deepEqual(malformed.json(), { error:'AI_INVALID_RESPONSE', retryable:true });

  const empty = await invoke(async () => ({ ok:true, status:200, json:async () => ({ id:'empty', choices:[] }) }));
  assert.equal(empty.statusCode, 502);
  assert.deepEqual(empty.json(), { error:'AI_EMPTY_RESPONSE', retryable:true });

  const timedOut = await invoke(async () => {
    const error = new Error('timeout');
    error.name = 'AbortError';
    throw error;
  });
  assert.equal(timedOut.statusCode, 504);
  assert.deepEqual(timedOut.json(), { error:'AI_TIMEOUT', retryable:true });
});
