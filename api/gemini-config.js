'use strict';

const DEFAULT_GEMINI_MODEL = 'gemini-3.7-flash';
const PLACEHOLDER_KEYS = new Set([
  'TVOJ_GEMINI_API_KEY_OVDJE',
  'YOUR_GEMINI_API_KEY_HERE'
]);

const cleanValue = (value, limit = 512) => String(value || '')
  .trim()
  .replace(/[\u0000-\u001f\u007f]/g, '')
  .slice(0, limit);

function usableApiKey(value) {
  const key = cleanValue(value);
  return key && !PLACEHOLDER_KEYS.has(key.toUpperCase()) ? key : '';
}

function resolveGeminiConfig(environment = process.env) {
  const source = environment && typeof environment === 'object' ? environment : {};
  const primaryKey = usableApiKey(source.GEMINI_API_KEY);
  const fallbackKey = usableApiKey(source.GOOGLE_GENERATIVE_AI_API_KEY);
  const apiKey = primaryKey || fallbackKey;
  const configuredModel = cleanValue(source.GEMINI_MODEL, 80);
  const model = /^[a-z0-9._-]+$/i.test(configuredModel) ? configuredModel : DEFAULT_GEMINI_MODEL;

  return Object.freeze({
    apiKey,
    model,
    isConfigured:Boolean(apiKey),
    source:primaryKey ? 'GEMINI_API_KEY' : fallbackKey ? 'GOOGLE_GENERATIVE_AI_API_KEY' : null
  });
}

module.exports = Object.freeze({
  DEFAULT_GEMINI_MODEL,
  resolveGeminiConfig
});
