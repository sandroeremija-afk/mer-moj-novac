'use strict';

const { createProviderClient, isProviderTimeout } = require('./provider-client.js');

const cleanText = (value, limit) => typeof value === 'string'
  ? value.trim().replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').slice(0, limit) : '';

function header(request, name) {
  const value = typeof request.headers?.get === 'function' ? request.headers.get(name) : request.headers?.[name];
  return Array.isArray(value) ? String(value[0] || '') : String(value || '');
}

function sameOrigin(request) {
  try {
    const origin = new URL(header(request, 'origin'));
    const host = (header(request, 'x-forwarded-host') || header(request, 'host')).split(',')[0].trim().toLowerCase();
    return /^https?:$/.test(origin.protocol) && origin.host.toLowerCase() === host;
  } catch { return false; }
}

function send(response, status, body, extra = {}) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Vary', 'Origin');
  for (const [name, value] of Object.entries(extra)) response.setHeader(name, String(value));
  response.end(JSON.stringify(body));
}

async function readBody(request, maximum = 32 * 1024) {
  const tooLarge = () => Object.assign(new Error('PAYLOAD_TOO_LARGE'), { status:413 });
  if (Number(header(request, 'content-length')) > maximum) throw tooLarge();
  if (request.body && typeof request.body === 'object' && !Buffer.isBuffer(request.body)) {
    if (Buffer.byteLength(JSON.stringify(request.body)) > maximum) throw tooLarge();
    return request.body;
  }
  let raw = request.body ? String(request.body) : '';
  if (!raw && request[Symbol.asyncIterator]) {
    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += bytes.byteLength;
      if (size > maximum) throw tooLarge();
      chunks.push(bytes);
    }
    raw = Buffer.concat(chunks).toString('utf8');
  }
  if (Buffer.byteLength(raw) > maximum) throw tooLarge();
  return JSON.parse(raw || '{}');
}

function createGuard({ rateLimit = 10, rateWindowMs = 60000, now = Date.now, prefix = 'AI', maxBody = 32 * 1024 } = {}) {
  const buckets = new Map();
  return async function guard(request, response) {
    if (request.method !== 'POST') { send(response, 405, { error:'METHOD_NOT_ALLOWED' }, { Allow:'POST' }); return null; }
    if (!sameOrigin(request)) { send(response, 403, { error:'ORIGIN_NOT_ALLOWED' }); return null; }
    if (!/^application\/json(?:\s*;|$)/i.test(header(request, 'content-type'))) { send(response, 415, { error:'UNSUPPORTED_MEDIA_TYPE' }); return null; }
    const time = Number(now());
    for (const [key, entry] of buckets) if (entry.resetAt <= time) buckets.delete(key);
    const ip = (header(request, 'x-forwarded-for').split(',')[0] || request.socket?.remoteAddress || 'unknown').slice(0, 120);
    const bucket = buckets.get(ip) || { count:0, resetAt:time + rateWindowMs };
    if (bucket.count >= rateLimit || (!buckets.has(ip) && buckets.size >= 2000)) {
      send(response, 429, { error:`${prefix}_RATE_LIMITED`, retryable:true }, { 'Retry-After':Math.max(1, Math.ceil((bucket.resetAt - time) / 1000)) });
      return null;
    }
    bucket.count += 1;
    buckets.set(ip, bucket);
    try {
      const body = await readBody(request, maxBody);
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('INVALID_REQUEST');
      return body;
    } catch (error) {
      send(response, error.status || 400, { error:error.status === 413 ? 'PAYLOAD_TOO_LARGE' : 'INVALID_REQUEST' });
      return null;
    }
  };
}

function createClient(config, options, timeoutMs) {
  return createProviderClient(options, config, timeoutMs, 64 * 1024);
}

function providerFailure(error, prefix = 'AI') {
  const status = Number(error?.status);
  if (isProviderTimeout(error)) {
    return { status:504, body:{ error:`${prefix}_TIMEOUT`, retryable:true } };
  }
  if (status === 429) return { status:429, body:{ error:`${prefix}_RATE_LIMITED`, retryable:true }, headers:{ 'Retry-After':'30' } };
  if (status === 401 || status === 403) return { status:503, body:{ error:`${prefix}_AUTH_FAILED`, retryable:false } };
  if (status === 404) return { status:502, body:{ error:`${prefix}_MODEL_NOT_FOUND`, retryable:false } };
  return { status:502, body:{ error:prefix === 'AI' ? 'AI_UPSTREAM_UNAVAILABLE' : `${prefix}_UNAVAILABLE`, retryable:true } };
}

module.exports = { cleanText, header, sameOrigin, send, readBody, createGuard, createClient, providerFailure };
