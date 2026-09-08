'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const source=fs.readFileSync(require.resolve('../engagement-ui.js'),'utf8'),css=fs.readFileSync(require.resolve('../popup-layout.css'),'utf8');
assert.doesNotMatch(source,/wrappedButton|Moj mjesec/);
assert.match(source,/function openWrapped\(/);assert.match(source,/shouldAutoOpen/);
assert.match(fs.readFileSync(require.resolve('../enterprise-ui.js'),'utf8'),/Mjesečni osvrt — Financial Wrapped/);
assert.match(css,/data-content-fits="true"/);assert.match(css,/active-session-list[^}]+overflow-y:auto/);
assert.match(css,/#transactionModal\[data-content-fits="false"\][^}]+overflow-y:auto/);
assert.match(css,/data-topic-hidden[^}]+display:none !important/);
assert.match(css,/\.tour-modal-host[^}]+overflow:visible/);
const html=fs.readFileSync(require.resolve('../index.html'),'utf8'),build=fs.readFileSync(require.resolve('../scripts/build.js'),'utf8');
for(const name of ['ui-consistency.css','recommendation-refresh.css','popup-layout.css','popup-layout.js']){assert.ok(html.includes(name));assert.ok(build.includes(name));}
process.stdout.write('Popup cycle 2: clean Insights filters, retained wrapped command, bounded lists, tour and build integration passed.\n');
