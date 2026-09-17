'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Api=require('../api/assistant.js');
const {resolveOpenAIConfig}=require('../server/openai-config.js');
test('cycle 1 old provider configuration never silently sends chat to another upstream',async()=>{
  assert.equal(resolveOpenAIConfig({AI_PROVIDER:'openwebui',OPEN_WEBUI_API_KEY:'old-private-key'}).isConfigured,false);
  let calls=0;
  const handler=Api.createAssistantHandler({env:{AI_PROVIDER:'openwebui',OPEN_WEBUI_API_KEY:'old-private-key'},client:{chat:{completions:{create:async()=>{calls++;}}}}});
  const response={setHeader(){},end(value){this.body=JSON.parse(value);}};
  await handler({method:'POST',headers:{host:'mer.test',origin:'https://mer.test','content-type':'application/json'},body:{messages:[{role:'user',content:'Pomoć'}]}},response);
  assert.equal(response.statusCode,503);assert.equal(response.body.error,'AI_UNAVAILABLE');assert.equal(calls,0);
});
test('cycle 1 active OpenAI configuration ignores deprecated model/baseURL selectors',()=>{
  const config=resolveOpenAIConfig({OPENAI_API_KEY:'new-key',AI_PROVIDER:'openwebui',OPEN_WEBUI_MODEL:'other',OPENAI_MODEL:'other'});
  assert.equal(config.model,'gpt-4o-mini');assert.equal(config.apiKey,'new-key');assert.equal(config.source,'OPENAI_API_KEY');
});
