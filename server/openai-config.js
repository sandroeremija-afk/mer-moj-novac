'use strict';

const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

function resolveOpenAIConfig(environment = process.env) {
  const raw = typeof environment?.OPENAI_API_KEY === 'string' ? environment.OPENAI_API_KEY.trim() : '';
  const apiKey = /^(?:your[-_ ]|tvoj[-_ ]|replace[-_ ]|changeme|placeholder|sk-\.\.\.)/i.test(raw) ? '' : raw;
  return Object.freeze({ apiKey, model:DEFAULT_OPENAI_MODEL, isConfigured:Boolean(apiKey), source:apiKey ? 'OPENAI_API_KEY' : null });
}

module.exports = { DEFAULT_OPENAI_MODEL, resolveOpenAIConfig };
