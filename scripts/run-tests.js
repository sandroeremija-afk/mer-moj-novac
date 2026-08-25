'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const filter = String(process.argv[2] || '').trim();
const files = fs.readdirSync(path.join(root, 'tests'))
  .filter(file => file.endsWith('.test.js') && (!filter || file.includes(filter)))
  .sort();

if (!files.length) {
  process.stderr.write(`No evaluation files matched "${filter}".\n`);
  process.exit(1);
}

let failed = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, [path.join(root, 'tests', file)], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) failed += 1;
}

if (failed) {
  process.stderr.write(`\n${failed} of ${files.length} evaluation files failed.\n`);
  process.exit(1);
}
process.stdout.write(`\nAll ${files.length} evaluation files passed.\n`);
