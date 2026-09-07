'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const qr = require('../assets/qrcode.js');
const root = path.join(__dirname, '..');
test('vendored QR generator is the exact reviewed upstream blob with MIT attribution', () => {
  const bytes = fs.readFileSync(path.join(root, 'assets/qrcode.js'));
  const sha = crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  assert.equal(sha, 'df13f829bf41f36b82f0ed85751ed3b4c39cfeb8');
  assert.match(fs.readFileSync(path.join(root, 'assets/qrcode-LICENSE.txt'), 'utf8'), /MIT License[\s\S]*Copyright \(c\) 2009 Kazuhiko Arase/);
});
test('offline QR encoder generates a real version-appropriate scannable SVG matrix', () => {
  const encoder = qr(0, 'M');
  encoder.addData(JSON.stringify({ kind:'MER_INVOICE_DRAFT', number:'1-P1-1', amount:'250.00', iban:'HR1210010051863000160' }), 'Byte');
  encoder.make();
  const size = encoder.getModuleCount();
  assert.ok(size >= 21 && (size - 17) % 4 === 0);
  // Top-left finder includes the dark perimeter, white ring and 3x3 centre.
  assert.equal(encoder.isDark(0, 0), true);
  assert.equal(encoder.isDark(1, 1), false);
  assert.equal(encoder.isDark(3, 3), true);
  const svg = encoder.createSvgTag({ cellSize:3, margin:12, scalable:true });
  assert.match(svg, /viewBox="0 0 \d+ \d+"/);
  assert.match(svg, /<path d="M/);
  assert.ok(!/https?:\/\//.test(svg.replace('http://www.w3.org/2000/svg', '')));
});
