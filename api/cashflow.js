'use strict';

const { resolveGeminiConfig } = require('./gemini-config.js');
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const MAX_BODY_BYTES = 16 * 1024;
const MAX_RESPONSE_BYTES = 64 * 1024;
const DEFAULT_MODEL = 'gemini-3.8-flash';
const integer = (value, minimum = 0, maximum = 100000000000000) => Number.isSafeInteger(value) && value >= minimum && value <= maximum ? value : null;

function sanitizeAnalysis(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const result = { currency:/^[A-Z]{3}$/.test(value.currency || '') ? value.currency : 'EUR', horizonDays:30 };
  for (const key of ['availableCents', 'safeToSpendCents', 'predictedBillsCents', 'reservedCents']) {
    const number = integer(value[key], key === 'availableCents' || key === 'safeToSpendCents' ? -100000000000000 : 0);
    if (number === null) return null;
    result[key] = number;
  }
  result.patterns = (Array.isArray(value.patterns) ? value.patterns : []).slice(0, 30).flatMap((pattern, index) => {
    if (!pattern || integer(pattern.amountCents) === null || integer(pattern.previousCents) === null || integer(pattern.observations, 2, 90) === null || integer(pattern.daysUntil, 0, 31) === null) return [];
    return [{ pattern:index + 1, amountCents:pattern.amountCents, previousCents:pattern.previousCents, observations:pattern.observations, daysUntil:pattern.daysUntil, confidence:pattern.confidence === 'high' ? 'high' : 'medium' }];
  });
  result.scheduled = (Array.isArray(value.scheduled) ? value.scheduled : []).slice(0, 30).flatMap(item => item && integer(item.amountCents) !== null && integer(item.daysUntil, 0, 30) !== null ? [{ amountCents:item.amountCents, daysUntil:item.daysUntil }] : []);
  return result;
}

const header = (request, key) => {
  const value = typeof request.headers?.get === 'function' ? request.headers.get(key) : request.headers?.[key];
  return Array.isArray(value) ? value[0] : String(value || '');
};
function send(response, status, body, extra = {}) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  for (const [key, value] of Object.entries(extra)) response.setHeader(key, value);
  response.end(JSON.stringify(body));
}
async function readBody(request) {
  if (Number(header(request, 'content-length')) > MAX_BODY_BYTES) throw Object.assign(new Error('PAYLOAD_TOO_LARGE'), { status:413 });
  if (request.body && typeof request.body === 'object' && !Buffer.isBuffer(request.body)) {
    if (Buffer.byteLength(JSON.stringify(request.body)) > MAX_BODY_BYTES) throw Object.assign(new Error('PAYLOAD_TOO_LARGE'), { status:413 });
    return request.body;
  }
  let raw = request.body ? String(request.body) : '';
  if (!raw && request[Symbol.asyncIterator]) {
    for await (const chunk of request) {
      raw += chunk.toString();
      if (Buffer.byteLength(raw) > MAX_BODY_BYTES) throw Object.assign(new Error('PAYLOAD_TOO_LARGE'), { status:413 });
    }
  }
  if (Buffer.byteLength(raw) > MAX_BODY_BYTES) throw Object.assign(new Error('PAYLOAD_TOO_LARGE'), { status:413 });
  return JSON.parse(raw || '{}');
}
async function readUpstream(upstream) {
  if (Number(upstream.headers?.get?.('content-length')) > MAX_RESPONSE_BYTES) throw new Error('RESPONSE_TOO_LARGE');
  if (upstream.body?.getReader) {
    const reader = upstream.body.getReader();
    let size = 0; const chunks = [];
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_RESPONSE_BYTES) { await reader.cancel(); throw new Error('RESPONSE_TOO_LARGE'); }
        chunks.push(Buffer.from(value));
      }
    } finally { reader.releaseLock(); }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }
  const text = await upstream.text();
  if (Buffer.byteLength(text) > MAX_RESPONSE_BYTES) throw new Error('RESPONSE_TOO_LARGE');
  return JSON.parse(text);
}
function extractMessage(payload) {
  const step = (Array.isArray(payload?.steps) ? [...payload.steps] : []).reverse().find(item => item?.type === 'model_output');
  return String(step?.content?.filter(item => item?.type === 'text').map(item => item.text || '').join('') || payload?.output_text || '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, 3000);
}

function createCashflowHandler(options = {}) {
  const env = options.env || process.env, fetchImpl = options.fetchImpl || globalThis.fetch;
  const now = options.now || Date.now, buckets = new Map();
  const timeoutMs = Math.max(50, Math.min(25000, Number(options.timeoutMs) || 20000));
  return async function cashflowHandler(request, response) {
    if (request.method !== 'POST') return send(response, 405, { error:'METHOD_NOT_ALLOWED' }, { Allow:'POST' });
    const origin = header(request, 'origin'), host = header(request, 'x-forwarded-host') || header(request, 'host');
    if (origin) {
      try { if (new URL(origin).host !== host.split(',')[0].trim()) return send(response, 403, { error:'ORIGIN_NOT_ALLOWED' }); }
      catch { return send(response, 403, { error:'ORIGIN_NOT_ALLOWED' }); }
    }
    if (!/^application\/json(?:\s*;|$)/i.test(header(request, 'content-type'))) return send(response, 415, { error:'UNSUPPORTED_MEDIA_TYPE' });
    const ip = (header(request, 'x-forwarded-for').split(',')[0] || request.socket?.remoteAddress || 'unknown').slice(0, 120);
    const timestamp = now();
    for (const [key, bucket] of buckets) if (bucket.until <= timestamp) buckets.delete(key);
    const bucket = buckets.get(ip) || { count:0, until:timestamp + 60000 };
    if (bucket.count >= 6 || (!buckets.has(ip) && buckets.size >= 2000)) return send(response, 429, { source:'deterministic', error:'AI_RATE_LIMITED' }, { 'Retry-After':'60' });
    bucket.count += 1; buckets.set(ip, bucket);
    let body;
    try { body = await readBody(request); }
    catch (error) { return send(response, error.status || 400, { error:error.status === 413 ? 'PAYLOAD_TOO_LARGE' : 'INVALID_JSON' }); }
    const analysis = sanitizeAnalysis(body?.analysis);
    if (!analysis) return send(response, 400, { error:'INVALID_ANALYSIS' });
    const config = resolveGeminiConfig(env);
    if (!config.isConfigured || typeof fetchImpl !== 'function') return send(response, 503, { source:'deterministic', error:'GEMINI_NOT_CONFIGURED' });
    const configuredModel = String(env.CASHFLOW_GEMINI_MODEL || env.GEMINI_MODEL || DEFAULT_MODEL);
    const model = /^[a-z0-9._-]{1,80}$/i.test(configuredModel) ? configuredModel : DEFAULT_MODEL;
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const upstream = await fetchImpl(ENDPOINT, {
        method:'POST', redirect:'error', signal:controller.signal,
        headers:{ 'Content-Type':'application/json', 'x-goog-api-key':config.apiKey },
        body:JSON.stringify({ model, store:false,
          system_instruction:`You explain a deterministic cash-flow forecast in ${body.locale === 'en' ? 'English' : 'Croatian'}. All monetary fields are integer cents. Describe upcoming 30-day recurring bills inferred from a 90-day observation window, confidence and possible price increases. Use supplied figures only. Do not recalculate or replace ledger balances; do not invent merchants, dates, taxes, missing salary, or bank access. No investment recommendations. A pattern is an estimate, not a confirmed bill. Return at most 150 words in plain text.`,
          input:JSON.stringify({...analysis,displayInstruction:'For human-readable money, convert cents to currency units by dividing by 100 and format two decimals. For example 65000 cents EUR is 650,00 €. Never show raw cent counts to the user.'}), generation_config:{ max_output_tokens:2000 }
        })
      });
      if (!upstream.ok) return send(response, upstream.status === 429 ? 429 : 502, { source:'deterministic', error:upstream.status === 429 ? 'AI_RATE_LIMITED' : 'GEMINI_UNAVAILABLE' });
      const message = extractMessage(await readUpstream(upstream));
      if (!message) return send(response, 502, { source:'deterministic', error:'AI_EMPTY_RESPONSE' });
      return send(response, 200, { source:'gemini', message, model });
    } catch (error) {
      return send(response, error?.name === 'AbortError' ? 504 : 502, { source:'deterministic', error:error?.name === 'AbortError' ? 'AI_TIMEOUT' : 'GEMINI_UNAVAILABLE' });
    } finally { clearTimeout(timer); }
  };
}
module.exports = createCashflowHandler();
module.exports.createCashflowHandler = createCashflowHandler;
module.exports.sanitizeAnalysis = sanitizeAnalysis;
module.exports.extractMessage = extractMessage;
module.exports.DEFAULT_MODEL = DEFAULT_MODEL;
