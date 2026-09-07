'use strict';

const https = require('node:https');
const tls = require('node:tls');
const { X509Certificate, createHash, timingSafeEqual } = require('node:crypto');

const PINNED_OPEN_WEBUI_HOST = 'webui.moj.eracun';
const PINNED_OPEN_WEBUI_CERT_SHA256 = 'CEA9BC1B6F4F72835F5D7F4DE123633122667F58BA9C019BFD4180B2697E39A6';
const PINNED_OPEN_WEBUI_CERTIFICATE_PEM = `-----BEGIN CERTIFICATE-----
MIIESjCCAzKgAwIBAgIUI2JtTSQoo48bQUi/Dgd3Xsthr58wDQYJKoZIhvcNAQEL
BQAwga8xCzAJBgNVBAYTAkhSMRAwDgYDVQQIDAdDcm9hdGlhMQ8wDQYDVQQHDAZa
YWdyZWIxKTAnBgNVBAoMIEVMRUtUUk9OScOEwoxLSSBSQcOEwoxVTkkgZC5vLm8u
MR8wHQYDVQQLDBZtZXIgSW5mb3NlYyBEZXBhcnRtZW50MRUwEwYDVQQDDAwqLm1v
ai5lcmFjdW4xGjAYBgkqhkiG9w0BCQEWC2Npc29AbWVyLmhyMB4XDTI2MDYzMDEw
NTAzOFoXDTI3MDYzMDEwNTAzOFowga8xCzAJBgNVBAYTAkhSMRAwDgYDVQQIDAdD
cm9hdGlhMQ8wDQYDVQQHDAZaYWdyZWIxKTAnBgNVBAoMIEVMRUtUUk9OScOEwoxL
SSBSQcOEwoxVTkkgZC5vLm8uMR8wHQYDVQQLDBZtZXIgSW5mb3NlYyBEZXBhcnRt
ZW50MRUwEwYDVQQDDAwqLm1vai5lcmFjdW4xGjAYBgkqhkiG9w0BCQEWC2Npc29A
bWVyLmhyMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxoNb6hJTS8NU
+AvFKShkFm5mZ9JJGIanPN53W8vbqQhwQUI0heCHdT3bMed2wbugIVM6D6qWRZwh
7jCQQYBXX3SDdpXCP/m2W3ibNSUGR6O85//BB/yxHchaOUXbUE0EHdYxxXue8F7w
dTbW88di5qSsbrIz7E3xWBNQ5AzCHheF+LjM00RadV7JmMLljxG0S36u/XkhcfNR
UHBwNq3e3hZ7NHfnYsTfLRKUUmR8ZxDgx7vs0iq6xFAxcMY534jkwhjosWGKt+Pa
N9GLR17bojdWV3iNflAZHSpgssxYkQAM/DS9L8lkzZz/idEvyVc1/tsoEly5BTt4
wrdE7Pr2YwIDAQABo1wwWjALBgNVHQ8EBAMCBaAwEwYDVR0lBAwwCgYIKwYBBQUH
AwEwFwYDVR0RBBAwDoIMKi5tb2ouZXJhY3VuMB0GA1UdDgQWBBSVCk/3UHcyON3U
0hjCv8JrVGHRZjANBgkqhkiG9w0BAQsFAAOCAQEAEd2hD/mZKBK97wN20RgoDC5F
zVebbx0cysZE3gY0m3VTaqL2k9qVSDVQQMm+tgZpqA72aZW43QCT/mJ97mpgxHlU
1Dcu41UOgTAieBwFWUi5Qf4UEtc5BTsO4e8H0uWDithpfBTxxwvEuv+2yVUyslRT
VU0imo45bSVJifpCsVrklzgZbmaSziWxpKVhVPc5LUgMJeOhDdgHZeLYAq6XgsDF
jfRiAFMyPFQ0ctQLmqOfQanyFsJxWYel7Q7qM0vpKWm8dhaZvJNKY+GUVkE+lMZw
sdV+8uHnvnp+WDKKLmYQ3qB6QQ+gYhXI8c2A7/s6XC00Z9CpePfC82Ikz9vHxA==
-----END CERTIFICATE-----`;

const MAX_RESPONSE_BYTES = 1024 * 1024;

class PinnedTlsError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = 'PinnedTlsError';
    this.code = code;
  }
}

function normalizeFingerprint(value) {
  const fingerprint = String(value || '').replace(/[^a-f0-9]/gi, '').toUpperCase();
  return /^[A-F0-9]{64}$/.test(fingerprint) ? fingerprint : '';
}

function normalizeCertificatePem(value) {
  const expanded = String(value || '').trim().replace(/\\n/g, '\n');
  const certificates = expanded.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) || [];
  if (certificates.length !== 1 || certificates[0].trim() !== expanded) return '';
  return `${certificates[0].trim()}\n`;
}

function fingerprintsMatch(left, right) {
  const first = normalizeFingerprint(left);
  const second = normalizeFingerprint(right);
  if (!first || !second) return false;
  return timingSafeEqual(Buffer.from(first, 'hex'), Buffer.from(second, 'hex'));
}

function certificateFingerprint(certificate) {
  if (Buffer.isBuffer(certificate?.raw)) return createHash('sha256').update(certificate.raw).digest('hex').toUpperCase();
  return normalizeFingerprint(certificate?.fingerprint256);
}

function pinnedTlsError(code) {
  return new PinnedTlsError(code);
}

function resolvePinnedTlsConfig(environment = process.env, options = {}) {
  const source = environment && typeof environment === 'object' ? environment : {};
  const targetUrl = new URL(options.targetUrl || `https://${PINNED_OPEN_WEBUI_HOST}`);
  if (targetUrl.protocol !== 'https:') throw pinnedTlsError('PINNED_TLS_HTTPS_REQUIRED');

  const suppliedPem = String(source.OPEN_WEBUI_CA_CERT || '').trim();
  const suppliedFingerprint = String(source.OPEN_WEBUI_CERT_SHA256 || '').trim();
  const hasPem = Boolean(suppliedPem);
  const hasFingerprint = Boolean(suppliedFingerprint);
  if (hasPem !== hasFingerprint) throw pinnedTlsError('PINNED_TLS_INCOMPLETE');

  const useBundledPin = !hasPem && targetUrl.hostname.toLowerCase() === PINNED_OPEN_WEBUI_HOST;
  if (!hasPem && !useBundledPin) return null;

  const ca = normalizeCertificatePem(useBundledPin ? PINNED_OPEN_WEBUI_CERTIFICATE_PEM : suppliedPem);
  const expectedFingerprint = normalizeFingerprint(useBundledPin ? PINNED_OPEN_WEBUI_CERT_SHA256 : suppliedFingerprint);
  if (!ca || !expectedFingerprint) throw pinnedTlsError('PINNED_TLS_INVALID_CONFIG');

  const Certificate = options.X509CertificateImpl || X509Certificate;
  let certificate;
  try {
    certificate = new Certificate(ca);
  } catch {
    throw pinnedTlsError('PINNED_TLS_INVALID_CERTIFICATE');
  }

  const validFrom = Date.parse(certificate.validFrom);
  const validTo = Date.parse(certificate.validTo);
  const now = Number(options.now ?? Date.now());
  if (!Number.isFinite(validFrom) || !Number.isFinite(validTo) || !Number.isFinite(now)) {
    throw pinnedTlsError('PINNED_TLS_INVALID_VALIDITY');
  }
  if (now < validFrom) throw pinnedTlsError('PINNED_TLS_NOT_YET_VALID');
  if (now > validTo) throw pinnedTlsError('PINNED_TLS_EXPIRED');

  const actualFingerprint = certificateFingerprint(certificate);
  if (!fingerprintsMatch(expectedFingerprint, actualFingerprint)) throw pinnedTlsError('PINNED_TLS_FINGERPRINT_MISMATCH');

  let selfSigned = false;
  try {
    selfSigned = certificate.subject === certificate.issuer && certificate.verify(certificate.publicKey);
  } catch {
    selfSigned = false;
  }
  if (!selfSigned) throw pinnedTlsError('PINNED_TLS_NOT_SELF_SIGNED');
  if (!certificate.checkHost(targetUrl.hostname)) throw pinnedTlsError('PINNED_TLS_HOSTNAME_MISMATCH');

  return Object.freeze({
    ca,
    fingerprint:expectedFingerprint,
    hostname:targetUrl.hostname,
    validFrom:new Date(validFrom).toISOString(),
    validTo:new Date(validTo).toISOString(),
    source:useBundledPin ? 'bundled' : 'environment'
  });
}

function createPinnedCheckServerIdentity(expectedFingerprint, tlsImpl = tls) {
  return (hostname, certificate) => {
    const hostnameError = tlsImpl.checkServerIdentity(hostname, certificate);
    if (hostnameError) return hostnameError;
    const actualFingerprint = certificateFingerprint(certificate);
    if (fingerprintsMatch(expectedFingerprint, actualFingerprint)) return undefined;
    return pinnedTlsError('PINNED_TLS_PEER_MISMATCH');
  };
}

function responseHeaders(headers = {}) {
  const normalized = new Map(Object.entries(headers).map(([name, value]) => [name.toLowerCase(), Array.isArray(value) ? value.join(', ') : String(value || '')]));
  return Object.freeze({ get:name => normalized.get(String(name).toLowerCase()) || null });
}

function createPinnedHttpsTransport(options = {}) {
  const httpsImpl = options.httpsImpl || https;
  const tlsImpl = options.tlsImpl || tls;

  return function requestJsonHttps(url, requestOptions = {}) {
    const target = new URL(url);
    const tlsConfig = requestOptions.tlsConfig;
    if (target.protocol !== 'https:' || !tlsConfig?.ca || !tlsConfig?.fingerprint) {
      return Promise.reject(pinnedTlsError('PINNED_TLS_REQUIRED'));
    }
    if (target.hostname.toLowerCase() !== String(tlsConfig.hostname || '').toLowerCase()) {
      return Promise.reject(pinnedTlsError('PINNED_TLS_HOSTNAME_MISMATCH'));
    }

    const body = String(requestOptions.body || '');
    const headers = { ...requestOptions.headers, 'Content-Length':Buffer.byteLength(body) };
    const timeoutMs = Math.max(500, Number(requestOptions.timeoutMs) || 25_000);

    return new Promise((resolve, reject) => {
      let settled = false;
      let sent = false;
      let request;
      const finish = callback => value => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        requestOptions.signal?.removeEventListener?.('abort', abort);
        callback(value);
      };
      const succeed = finish(resolve);
      const fail = finish(reject);
      const abort = () => {
        const error = new Error('Request aborted');
        error.name = 'AbortError';
        request?.destroy?.(error);
        fail(error);
      };
      const timer = setTimeout(abort, timeoutMs);

      try {
        request = httpsImpl.request(target, {
          method:requestOptions.method || 'POST',
          headers,
          ca:tlsConfig.ca,
          rejectUnauthorized:true,
          servername:target.hostname,
          agent:false,
          checkServerIdentity:createPinnedCheckServerIdentity(tlsConfig.fingerprint, tlsImpl)
        }, response => {
          const chunks = [];
          let size = 0;
          response.on('data', chunk => {
            const buffer = Buffer.from(chunk);
            size += buffer.length;
            if (size > MAX_RESPONSE_BYTES) {
              const error = new Error('Upstream response is too large');
              error.code = 'AI_RESPONSE_TOO_LARGE';
              response.destroy?.(error);
              fail(error);
              return;
            }
            chunks.push(buffer);
          });
          response.once('error', fail);
          response.once('end', () => {
            const raw = Buffer.concat(chunks).toString('utf8');
            succeed(Object.freeze({
              ok:Number(response.statusCode) >= 200 && Number(response.statusCode) < 300,
              status:Number(response.statusCode) || 502,
              headers:responseHeaders(response.headers),
              json:async () => JSON.parse(raw || '{}')
            }));
          });
        });
      } catch (error) {
        fail(error);
        return;
      }

      request.once('error', fail);
      request.once('socket', socket => {
        socket.once('secureConnect', () => {
          if (sent || settled) return;
          if (!socket.authorized) {
            const error = pinnedTlsError('PINNED_TLS_UNAUTHORIZED');
            request.destroy(error);
            fail(error);
            return;
          }
          sent = true;
          request.end(body);
        });
      });
      requestOptions.signal?.addEventListener?.('abort', abort, { once:true });
      if (requestOptions.signal?.aborted) abort();
    });
  };
}

function isPinnedTlsError(error) {
  const code = String(error?.code || '');
  return error instanceof PinnedTlsError
    || code.startsWith('PINNED_TLS_')
    || /^(?:CERT_|ERR_TLS_CERT_|DEPTH_ZERO_SELF_SIGNED_CERT|SELF_SIGNED_CERT_IN_CHAIN|UNABLE_TO_VERIFY_LEAF_SIGNATURE)/.test(code);
}

module.exports = Object.freeze({
  PINNED_OPEN_WEBUI_HOST,
  PINNED_OPEN_WEBUI_CERT_SHA256,
  PINNED_OPEN_WEBUI_CERTIFICATE_PEM,
  PinnedTlsError,
  normalizeFingerprint,
  normalizeCertificatePem,
  resolvePinnedTlsConfig,
  createPinnedCheckServerIdentity,
  createPinnedHttpsTransport,
  isPinnedTlsError
});
