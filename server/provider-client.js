'use strict';

const OpenAI = require('openai');

// Keep the SDK on the official origin and bound every upstream response before
// the SDK parses it. API keys are never sent to redirects or configurable URLs.
function createProviderClient(options, config, timeout, maxResponseBytes = 64 * 1024) {
  if (options.client) return options.client;
  const clientOptions = { apiKey:config.apiKey, baseURL:'https://api.openai.com/v1', timeout, maxRetries:0, logLevel:'off' };
  if (options.createClient) return options.createClient(clientOptions);
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  return new OpenAI({ ...clientOptions, fetch:async (url, request) => {
    const response = await fetchImpl(url, { ...request, redirect:'error' });
    if (Number(response.headers?.get?.('content-length')) > maxResponseBytes) throw new Error('RESPONSE_TOO_LARGE');
    let text;
    if (response.body?.getReader) {
      const reader = response.body.getReader(), chunks = [];
      let size = 0;
      try {
        while (true) {
          const {done,value} = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > maxResponseBytes) { await reader.cancel(); throw new Error('RESPONSE_TOO_LARGE'); }
          chunks.push(Buffer.from(value));
        }
      } finally { reader.releaseLock(); }
      text = Buffer.concat(chunks).toString('utf8');
    } else {
      text = await response.text();
      if (Buffer.byteLength(text) > maxResponseBytes) throw new Error('RESPONSE_TOO_LARGE');
    }
    return new Response(text, { status:response.status, headers:response.headers });
  }});
}

function isProviderTimeout(error) {
  const timeoutNames = ['AbortError','APIUserAbortError','APIConnectionTimeoutError'];
  return timeoutNames.includes(error?.name) || timeoutNames.includes(error?.constructor?.name) || Boolean(error?.cause && timeoutNames.includes(error.cause.name));
}

module.exports = { createProviderClient, isProviderTimeout };
