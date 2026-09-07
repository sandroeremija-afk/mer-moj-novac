'use strict';

const { EventEmitter } = require('node:events');
const { X509Certificate } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const AssistantApi = require('../api/assistant.js');
const PrivatePki = require('../api/private-pki-transport.js');

function responseRecorder() {
  return {
    statusCode:200,
    body:'',
    setHeader() {},
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
      'x-forwarded-for':'203.0.113.92'
    },
    body:{ messages:[{ role:'user', content:'Kako mogu povećati štednju?' }], locale:'hr' }
  };
}

test('evaluation cycle 1: verified Open WebUI leaf is a host-bound pin with an enforced expiry', () => {
  const config = PrivatePki.resolvePinnedTlsConfig({}, {
    targetUrl:'https://webui.moj.eracun/api/chat/completions',
    now:Date.parse('2026-09-07T12:00:00Z')
  });
  assert.equal(config.source, 'bundled');
  assert.equal(config.hostname, 'webui.moj.eracun');
  assert.equal(config.fingerprint, 'CEA9BC1B6F4F72835F5D7F4DE123633122667F58BA9C019BFD4180B2697E39A6');
  assert.equal(config.validTo, '2027-06-30T10:50:38.000Z');
  assert.match(config.ca, /^-----BEGIN CERTIFICATE-----/);

  assert.throws(() => PrivatePki.resolvePinnedTlsConfig({}, {
    targetUrl:'https://webui.moj.eracun/api/chat/completions',
    now:Date.parse('2027-06-30T10:50:39Z')
  }), error => error.code === 'PINNED_TLS_EXPIRED');
});

test('evaluation cycle 1: partial, mismatched and wrong-host certificate overrides fail closed', () => {
  const certificate = PrivatePki.PINNED_OPEN_WEBUI_CERTIFICATE_PEM;
  const fingerprint = PrivatePki.PINNED_OPEN_WEBUI_CERT_SHA256;
  assert.throws(() => PrivatePki.resolvePinnedTlsConfig({ OPEN_WEBUI_CA_CERT:certificate }, {
    targetUrl:'https://webui.moj.eracun'
  }), error => error.code === 'PINNED_TLS_INCOMPLETE');
  assert.throws(() => PrivatePki.resolvePinnedTlsConfig({
    OPEN_WEBUI_CA_CERT:certificate,
    OPEN_WEBUI_CERT_SHA256:'00'.repeat(32)
  }, { targetUrl:'https://webui.moj.eracun' }), error => error.code === 'PINNED_TLS_FINGERPRINT_MISMATCH');
  assert.throws(() => PrivatePki.resolvePinnedTlsConfig({
    OPEN_WEBUI_CA_CERT:certificate,
    OPEN_WEBUI_CERT_SHA256:fingerprint
  }, { targetUrl:'https://attacker.example' }), error => error.code === 'PINNED_TLS_HOSTNAME_MISMATCH');
  assert.throws(() => PrivatePki.resolvePinnedTlsConfig({
    OPEN_WEBUI_CA_CERT:'-----BEGIN CERTIFICATE-----\ninvalid\n-----END CERTIFICATE-----',
    OPEN_WEBUI_CERT_SHA256:fingerprint
  }, { targetUrl:'https://webui.moj.eracun' }), error => error.code === 'PINNED_TLS_INVALID_CERTIFICATE');
});

test('evaluation cycle 1: peer verification retains Node hostname checks and exact leaf matching', () => {
  const certificate = new X509Certificate(PrivatePki.PINNED_OPEN_WEBUI_CERTIFICATE_PEM).toLegacyObject();
  const verify = PrivatePki.createPinnedCheckServerIdentity(PrivatePki.PINNED_OPEN_WEBUI_CERT_SHA256);
  assert.equal(verify('webui.moj.eracun', certificate), undefined);
  assert.match(String(verify('attacker.example', certificate)?.code), /CERT|ALTNAME/);

  const wrongPin = PrivatePki.createPinnedCheckServerIdentity('00'.repeat(32));
  assert.equal(wrongPin('webui.moj.eracun', certificate).code, 'PINNED_TLS_PEER_MISMATCH');
});

test('evaluation cycle 1: pinned transport sends authorization and body only after secure TLS', async () => {
  let capturedOptions;
  let secure = false;
  let sentBody = '';
  const httpsImpl = {
    request(_target, options, onResponse) {
      capturedOptions = options;
      const clientRequest = new EventEmitter();
      clientRequest.destroy = error => queueMicrotask(() => clientRequest.emit('error', error));
      clientRequest.end = body => {
        assert.equal(secure, true, 'HTTP data cannot be released before secureConnect');
        sentBody = body;
        const response = new EventEmitter();
        response.statusCode = 200;
        response.headers = { 'content-type':'application/json' };
        response.destroy = error => response.emit('error', error);
        onResponse(response);
        queueMicrotask(() => {
          response.emit('data', Buffer.from('{"choices":[]}'));
          response.emit('end');
        });
      };
      const socket = new EventEmitter();
      socket.authorized = true;
      queueMicrotask(() => {
        clientRequest.emit('socket', socket);
        assert.equal(sentBody, '', 'request remains buffered while the certificate is unchecked');
        queueMicrotask(() => {
          secure = true;
          socket.emit('secureConnect');
        });
      });
      return clientRequest;
    }
  };
  const tlsConfig = PrivatePki.resolvePinnedTlsConfig({}, { targetUrl:'https://webui.moj.eracun/api/chat/completions' });
  const transport = PrivatePki.createPinnedHttpsTransport({ httpsImpl });
  const response = await transport('https://webui.moj.eracun/api/chat/completions', {
    method:'POST',
    headers:{ Authorization:'Bearer hidden-key', 'Content-Type':'application/json' },
    body:'{"model":"gemma4:26b"}',
    tlsConfig,
    timeoutMs:1000
  });

  assert.equal(response.status, 200);
  assert.equal(capturedOptions.rejectUnauthorized, true);
  assert.equal(capturedOptions.servername, 'webui.moj.eracun');
  assert.equal(capturedOptions.agent, false);
  assert.equal(capturedOptions.ca, tlsConfig.ca);
  assert.equal(capturedOptions.Authorization, undefined);
  assert.equal(capturedOptions.headers.Authorization, 'Bearer hidden-key');
  assert.equal(sentBody, '{"model":"gemma4:26b"}');
});

test('evaluation cycle 1: assistant selects pinned HTTPS without invoking fetch and rejects bad pin config before I/O', async () => {
  let fetchCalls = 0;
  let pinnedCalls = 0;
  const handler = AssistantApi.createAssistantHandler({
    env:{ AI_PROVIDER:'openwebui', OPEN_WEBUI_API_KEY:'private-key' },
    fetchImpl:async () => { fetchCalls += 1;throw new Error('fetch must not run'); },
    pinnedHttpsTransport:async (_url, options) => {
      pinnedCalls += 1;
      assert.equal(options.tlsConfig.source, 'bundled');
      return {
        ok:true,
        status:200,
        headers:{ get:() => null },
        json:async () => ({ id:'pinned-response', choices:[{ message:{ content:'Siguran odgovor.' } }] })
      };
    }
  });
  const response = responseRecorder();
  await handler(request(), response);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { id:'pinned-response', message:'Siguran odgovor.' });
  assert.equal(pinnedCalls, 1);
  assert.equal(fetchCalls, 0);

  const invalidHandler = AssistantApi.createAssistantHandler({
    env:{ AI_PROVIDER:'openwebui', OPEN_WEBUI_API_KEY:'private-key', OPEN_WEBUI_CA_CERT:PrivatePki.PINNED_OPEN_WEBUI_CERTIFICATE_PEM },
    fetchImpl:async () => { fetchCalls += 1; },
    pinnedHttpsTransport:async () => { pinnedCalls += 1; }
  });
  const invalidResponse = responseRecorder();
  await invalidHandler(request(), invalidResponse);
  assert.equal(invalidResponse.statusCode, 503);
  assert.deepEqual(invalidResponse.json(), { error:'AI_TLS_CONFIGURATION_INVALID', retryable:false });
  assert.equal(pinnedCalls, 1);
  assert.equal(fetchCalls, 0);
});

test('evaluation cycle 1: pinned timeout is stable and global TLS verification is never bypassed', async () => {
  let fetchCalls = 0;
  const handler = AssistantApi.createAssistantHandler({
    env:{ AI_PROVIDER:'openwebui', OPEN_WEBUI_API_KEY:'private-key' },
    fetchImpl:async () => { fetchCalls += 1; },
    pinnedHttpsTransport:async () => {
      const error = new Error('private upstream timed out');
      error.name = 'AbortError';
      throw error;
    }
  });
  const response = responseRecorder();
  await handler(request(), response);
  assert.equal(response.statusCode, 504);
  assert.deepEqual(response.json(), { error:'AI_TIMEOUT', retryable:true });
  assert.equal(fetchCalls, 0);

  const source = fs.readFileSync(path.resolve(__dirname, '../api/private-pki-transport.js'), 'utf8');
  assert.match(source, /rejectUnauthorized:true/);
  assert.doesNotMatch(source, /rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED/);
});
