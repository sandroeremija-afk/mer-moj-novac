'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const OpenWebUiConfig=require('../api/open-webui-config.js');
const AssistantApi=require('../api/ai/chat.js');
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


test('evaluation cycle 2: OpenAI authentication, model, rate and timeout failures expose only safe errors',async()=>{
  for(const [upstreamStatus,expectedStatus,expectedError,retryable]of [
    [401,503,'AI_AUTH_FAILED',false],[403,503,'AI_AUTH_FAILED',false],
    [404,502,'AI_MODEL_NOT_FOUND',false],[500,502,'AI_UPSTREAM_UNAVAILABLE',true],
    [503,502,'AI_UPSTREAM_UNAVAILABLE',true],[429,429,'AI_RATE_LIMITED',true]
  ]){
    const handler=AssistantApi.createAssistantHandler({env:{OPENAI_API_KEY:'secret'},client:{chat:{completions:{create:async()=>{throw Object.assign(new Error('provider secret private message'),{status:upstreamStatus});}}}}});
    const response={headers:{},setHeader(name,value){this.headers[name]=value;},end(value){this.body=JSON.parse(value);}};
    await handler({method:'POST',headers:{host:'mer.test',origin:'https://mer.test','content-type':'application/json'},body:{messages:[{role:'user',content:'Pomoć'}]}},response);
    assert.equal(response.statusCode,expectedStatus);assert.deepEqual(response.body,{error:expectedError,retryable});assert.doesNotMatch(JSON.stringify(response.body),/secret|private/);
    if(upstreamStatus===429)assert.equal(response.headers['Retry-After'],'30');
  }
});
