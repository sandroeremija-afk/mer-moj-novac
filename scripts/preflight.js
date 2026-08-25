'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const jsFiles = ['runtime.js','logo.js','core.js','auth-core.js','accounting-core.js','security-core.js','import-core.js','bank-provider.js','state-store.js','app.js','premium.js','auth-ui.js'];
const errors = [];

for (const file of jsFiles) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) { errors.push(`Missing ${file}`); continue; }
  const source = fs.readFileSync(fullPath, 'utf8');
  try { new vm.Script(source, { filename:file }); } catch(error) { errors.push(`${file}: ${error.message}`); }
  if (/\bconsole\.(?:log|debug|warn|error)\s*\(|\bdebugger\b/.test(source)) errors.push(`${file}: debug logging remains`);
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
if (duplicateIds.length) errors.push(`Duplicate HTML ids: ${duplicateIds.join(', ')}`);

for (const match of html.matchAll(/(?:src|href)="([^"#?]+)(?:\?[^"#]*)?"/g)) {
  const reference = match[1];
  if (/^(?:https?:|mailto:)/.test(reference) || reference.startsWith('#')) continue;
  if (!fs.existsSync(path.join(root, reference))) errors.push(`Missing local asset: ${reference}`);
}

for (const dialog of html.matchAll(/<dialog\b([^>]*)>/g)) {
  if (!/aria-labelledby=/.test(dialog[1])) errors.push(`Dialog missing aria-labelledby: ${dialog[0].slice(0,80)}`);
}

if (!/runtime\.js/.test(html)) errors.push('Runtime error boundary is not loaded');
if (!/Content-Security-Policy/.test(fs.readFileSync(path.join(root,'vercel.json'),'utf8'))) errors.push('Production CSP is missing');

if (errors.length) {
  process.stderr.write(`Preflight failed:\n- ${errors.join('\n- ')}\n`);
  process.exit(1);
}
process.stdout.write(`Preflight passed: ${jsFiles.length} scripts, ${ids.length} unique ids, local assets and modal labels verified.\n`);
