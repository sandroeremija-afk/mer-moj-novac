'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { X509Certificate } = require('node:crypto');
const test = require('node:test');
const assert = require('node:assert/strict');
const PrivatePki = require('../api/private-pki-transport.js');

const root = path.resolve(__dirname, '..');

test('evaluation cycle 2: private PKI remains an exact scoped pin with no global TLS bypass', () => {
  const source = fs.readFileSync(path.join(root, 'api/private-pki-transport.js'), 'utf8');
  assert.match(source, /OPEN_WEBUI_CA_CERT/);
  assert.match(source, /OPEN_WEBUI_CERT_SHA256/);
  assert.match(source, /rejectUnauthorized\s*:\s*true/);
  assert.match(source, /checkServerIdentity/);
  assert.doesNotMatch(source, /NODE_TLS_REJECT_UNAUTHORIZED\s*=/);
  assert.doesNotMatch(source, /rejectUnauthorized\s*:\s*false/);
});

test('evaluation cycle 2: bundled Open WebUI leaf matches the reviewed public certificate', () => {
  assert.equal(PrivatePki.PINNED_OPEN_WEBUI_HOST, 'webui.moj.eracun');
  assert.equal(PrivatePki.PINNED_OPEN_WEBUI_CERT_SHA256, 'CEA9BC1B6F4F72835F5D7F4DE123633122667F58BA9C019BFD4180B2697E39A6');
  const certificate = new X509Certificate(PrivatePki.PINNED_OPEN_WEBUI_CERTIFICATE_PEM);
  assert.equal(Date.parse(certificate.validTo), Date.parse('2027-06-30T10:50:38Z'));
  assert.match(certificate.subjectAltName, /DNS:\*\.moj\.eracun/);
});

test('evaluation cycle 2: deployment documentation covers exact-pair pinning and certificate rotation', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const example = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
  assert.match(readme, /Both variables are required together/);
  assert.match(readme, /2027-06-30/);
  assert.match(readme, /CE:A9:BC:1B:6F:4F:72:83:5F:5D:7F:4D:E1:23:63:31:22:66:7F:58:BA:9C:01:9B:FD:41:80:B2:69:7E:39:A6/);
  assert.match(readme, /public verification material, not credentials/);
  assert.match(readme, /Never set `NODE_TLS_REJECT_UNAUTHORIZED=0`/);
  assert.match(readme, /publicly trusted TLS certificate/);
  assert.match(example, /^OPEN_WEBUI_CA_CERT=$/m);
  assert.match(example, /^OPEN_WEBUI_CERT_SHA256=$/m);
  assert.match(example, /2027-06-30/);
});
