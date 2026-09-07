'use strict';

const DEFAULT_OPEN_WEBUI_BASE_URL = 'https://webui.moj.eracun';
const DEFAULT_OPEN_WEBUI_MODEL = 'gemma4:26b';
const PLACEHOLDER_KEYS = new Set([
  'TVOJ_OPEN_WEBUI_API_KEY_OVDJE',
  'YOUR_OPEN_WEBUI_API_KEY_HERE'
]);

const cleanValue = (value, limit = 1024) => String(value || '')
  .trim()
  .replace(/[\u0000-\u001f\u007f]/g, '')
  .slice(0, limit);

function usableApiKey(value) {
  const key = cleanValue(value);
  return key && !PLACEHOLDER_KEYS.has(key.toUpperCase()) ? key : '';
}

function normalizeBaseUrl(value) {
  const candidate = cleanValue(value, 2048) || DEFAULT_OPEN_WEBUI_BASE_URL;
  try {
    const parsed = new URL(candidate);
    const localHttp = parsed.protocol === 'http:' && ['localhost', '127.0.0.1', '::1', '[::1]'].includes(parsed.hostname);
    if (parsed.protocol !== 'https:' && !localHttp) return '';
    if (parsed.username || parsed.password || parsed.search || parsed.hash) return '';
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

function normalizeModel(value) {
  const model = cleanValue(value, 160) || DEFAULT_OPEN_WEBUI_MODEL;
  return /^[a-z0-9][a-z0-9._:@/+\-]*$/i.test(model) ? model : DEFAULT_OPEN_WEBUI_MODEL;
}

function resolveOpenWebUiConfig(environment = process.env) {
  const source = environment && typeof environment === 'object' ? environment : {};
  const apiKey = usableApiKey(source.OPEN_WEBUI_API_KEY);
  const baseUrl = normalizeBaseUrl(source.OPEN_WEBUI_BASE_URL);
  const model = normalizeModel(source.OPEN_WEBUI_MODEL);

  return Object.freeze({
    apiKey,
    baseUrl,
    model,
    isConfigured:Boolean(apiKey && baseUrl && model)
  });
}

module.exports = Object.freeze({
  DEFAULT_OPEN_WEBUI_BASE_URL,
  DEFAULT_OPEN_WEBUI_MODEL,
  normalizeBaseUrl,
  normalizeModel,
  resolveOpenWebUiConfig
});
