'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const MerAssistant = require('../assistant-core.js');

test('evaluation cycle 1: assistant payload keeps only profile-scoped aggregate data', async () => {
  let payload;
  const client = MerAssistant.createAssistantClient({
    fetchImpl: async (_url, options) => {
      payload = JSON.parse(options.body);
      return { ok:true, json:async () => ({ id:'reply-1', message:'Aggregate response' }) };
    }
  });
  const response = await client.ask({
    messages:[{ role:'user', content:'How am I doing?' }],
    locale:'en',
    profileId:'business',
    financialContext:{ currency:'EUR', totalIncome:1200, totalExpenses:450, safeToSpend:750, transactions:[{ name:'Secret merchant' }], iban:'HR123', otherProfile:{ totalIncome:9999 } }
  });

  assert.equal(response.source, 'remote');
  assert.equal(payload.profileId, 'business');
  assert.deepEqual(payload.financialContext, { currency:'EUR', totalIncome:1200, totalExpenses:450, safeToSpend:750 });
  assert.equal(JSON.stringify(payload).includes('Secret merchant'), false);
  assert.equal(JSON.stringify(payload).includes('HR123'), false);
  assert.equal(JSON.stringify(payload).includes('9999'), false);
});

test('evaluation cycle 1: unavailable endpoint falls back to deterministic local guidance', async () => {
  const client = MerAssistant.createAssistantClient({ fetchImpl:async () => ({ ok:false, status:404 }), timeoutMs:100 });
  const request = { messages:[{ role:'user', content:'Kako se računa dnevni tempo?' }], locale:'hr', profileId:'personal', financialContext:{ currency:'EUR', dailySafe:25, daysRemaining:10 } };
  const first = await client.ask(request);
  const second = await client.ask(request);
  assert.equal(first.source, 'local');
  assert.equal(first.content, second.content);
  assert.match(first.content, /25,00\s?€/);
  assert.match(first.content, /10 dana/);
});

test('evaluation cycle 1: message validation caps history and rejects an empty prompt', async () => {
  const sanitized = MerAssistant.sanitizeMessages(Array.from({ length:20 }, (_,index) => ({ role:index % 2 ? 'assistant' : 'user', content:`message ${index}` })));
  assert.equal(sanitized.length, MerAssistant.MAX_HISTORY);
  const client = MerAssistant.createAssistantClient({ fetchImpl:null });
  await assert.rejects(() => client.ask({ messages:[{ role:'user', content:'   ' }] }), /non-empty user message/);
});
