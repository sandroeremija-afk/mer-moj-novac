'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const origin = 'https://mer.example';
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const staticPath = pathname => /\.(?:js|css|svg|png|woff2?|webmanifest)$/.test(pathname);
const urlKey = value => {
  const url = new URL(typeof value === 'string' ? value : value.url, origin);
  return url.pathname + url.search;
};

// Run the actual production builder against isolated memory-backed output. Tiny
// JS/CSS fixtures make this quick and never race another process building dist/.
async function fixtureBuild(revision = 'one', overrides = {}) {
  const files = new Map();
  const sourceBytes = file => {
    const relative = path.relative(root, file).replaceAll('\\', '/');
    if (Object.hasOwn(overrides, relative)) return Buffer.from(overrides[relative]);
    if (/^[^/]+\.js$/.test(relative) && relative !== 'service-worker.js') {
      return Buffer.from(`globalThis.fixture_${relative.replaceAll(/[^a-zA-Z0-9]/g, '_')}=${JSON.stringify(relative === 'core.js' ? revision : relative)};`);
    }
    if (/^[^/]+\.css$/.test(relative)) return Buffer.from(`/* ${relative} */ .fixture :is(button, input) { color: red; }`);
    return fs.readFileSync(file);
  };
  const bytes = file => {
    const resolved = path.resolve(file);
    if (resolved.startsWith(output + path.sep)) {
      if (!files.has(resolved)) throw new Error(`Missing fixture output: ${resolved}`);
      return files.get(resolved);
    }
    return sourceBytes(resolved);
  };
  const memoryFs = {
    async rm() {},
    async mkdir() {},
    async readFile(file, encoding) { const value = bytes(file); return encoding ? value.toString(encoding) : Buffer.from(value); },
    async writeFile(file, value) { files.set(path.resolve(file), Buffer.from(value)); },
    async copyFile(from, to) { files.set(path.resolve(to), Buffer.from(bytes(from))); },
    async stat(file) { return { size: bytes(file).length, isFile: () => true, isDirectory: () => false }; },
    async readdir(directory, options) {
      const resolved = path.resolve(directory);
      if (!resolved.startsWith(output)) return fs.readdirSync(directory, options);
      const names = [...new Set([...files.keys()].filter(file => path.dirname(file) === resolved).map(file => path.basename(file)))];
      return options?.withFileTypes ? names.map(name => ({ name, isFile: () => true, isDirectory: () => false })) : names;
    }
  };
  const moduleFixture = { exports: {} };
  const fixtureRequire = id => id === 'node:fs/promises' ? memoryFs : require(id);
  const context = vm.createContext({
    require: fixtureRequire, module: moduleFixture, exports: moduleFixture.exports,
    __dirname: path.join(root, 'scripts'), __filename: path.join(root, 'scripts', 'build.js'),
    Buffer, URL, URLSearchParams,
    process: {
      env: {}, argv: [process.execPath, path.join(root, 'scripts', 'build.js')],
      stdout: { write() {} },
      stderr: { write() {} },
      exit(code) { throw new Error(`Fixture build exited ${code}`); }
    }
  });
  vm.runInContext(read('scripts/build.js'), context, { filename: 'scripts/build.js' });
  await moduleFixture.exports.main();
  return {
    files,
    text(file) { return files.get(path.join(output, file.replace(/^\//, '')))?.toString('utf8'); },
    asset(file) { return files.get(path.join(output, new URL(file, origin).pathname.slice(1))); }
  };
}

function htmlAssets(html) {
  return [...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)]
    .map(match => new URL(match[1].replaceAll('&amp;', '&'), origin))
    .filter(url => url.origin === origin && staticPath(url.pathname));
}

function workerHarness(workerSource, initialCache, network) {
  const handlers = {}, cache = new Map(initialCache);
  const match = async (key, options = {}) => {
    const requested = urlKey(key);
    const entry = options.ignoreSearch
      ? [...cache.entries()].find(([stored]) => stored.split('?')[0] === requested.split('?')[0])?.[1]
      : cache.get(requested);
    return entry?.clone();
  };
  const context = vm.createContext({
    self: { location: { origin }, addEventListener: (name, callback) => { handlers[name] = callback; }, clients: { claim: async () => {} } },
    URL, URLSearchParams, Response, Request, Headers, crypto: crypto.webcrypto, TextEncoder, TextDecoder,
    fetch: network,
    caches: {
      match,
      open: async () => ({ match, put: async (key, response) => { cache.set(urlKey(key), response); } }),
      keys: async () => [], delete: async () => true
    }
  });
  vm.runInContext(workerSource, context, { filename: 'service-worker.js' });
  return {
    handlers, cache,
    request(url, mode = 'cors', headers = new Headers()) {
      let response;
      handlers.fetch({ request: { method: 'GET', url: new URL(url, origin).href, mode, redirect: mode === 'navigate' ? 'manual' : 'follow', headers }, respondWith: promise => { response = promise; } });
      return response;
    }
  };
}

test('cycle 2: production HTML and precache use exact hashes of emitted bytes', async () => {
  const build = await fixtureBuild();
  const assets = htmlAssets(build.text('index.html'));
  const manifest = JSON.parse(build.text('sw-assets.json'));
  for(const icon of JSON.parse(build.text('manifest.webmanifest')).icons){
    assert.ok(manifest.includes(icon.src),'PWA icon shares the exact offline precache key');
  }
  assert.ok(assets.length > 30, 'Exercise all application scripts, styles and HTML assets');
  assert.equal(new Set(manifest).size, manifest.length, 'Precache entries are unique');
  for (const url of assets) {
    const version = url.searchParams.get('v');
    assert.match(version || '', /^[a-f0-9]{12,64}$/, `${url.pathname} has a content version`);
    assert.equal(url.searchParams.getAll('v').length, 1, `${url.pathname} has exactly one version`);
    const emitted = build.asset(url.href);
    assert.ok(emitted, `${url.pathname} exists in the build`);
    assert.equal(version, crypto.createHash('sha256').update(emitted).digest('hex').slice(0, version.length), `${url.pathname} version hashes output bytes`);
    assert.ok(manifest.includes(urlKey(url.href)), `${url.pathname} is precached with the exact HTML query`);
    assert.ok(!manifest.includes(url.pathname), `${url.pathname} has no stale unversioned precache alias`);
  }
  for (const reference of manifest) {
    const url = new URL(reference, origin);
    assert.equal(url.origin, origin);
    assert.ok(!url.pathname.startsWith('/api/'));
    assert.ok(url.pathname === '/' || build.asset(reference), `Precache asset ${reference} exists`);
    if (staticPath(url.pathname)) assert.ok(url.searchParams.get('v'), `Precache asset ${reference} has a version`);
  }
  const sourceExternal = [...read('index.html').matchAll(/\b(?:src|href)=["'](https?:\/\/[^"']+)["']/g)].map(match => match[1]);
  for (const external of sourceExternal) assert.ok(build.text('index.html').includes(external), `External URL remains valid: ${external}`);
});

test('cycle 2: an old active shell cannot satisfy a changed script from fresh HTML', async () => {
  const oldBuild = await fixtureBuild('old-content');
  const newBuild = await fixtureBuild('new-content');
  const oldUrl = htmlAssets(oldBuild.text('index.html')).find(url => url.pathname === '/core.min.js');
  const newUrl = htmlAssets(newBuild.text('index.html')).find(url => url.pathname === '/core.min.js');
  assert.ok(oldUrl && newUrl);
  assert.notEqual(urlKey(oldUrl.href), urlKey(newUrl.href), 'A content change creates a new request key');
  const stableOld = htmlAssets(oldBuild.text('index.html')).find(url => url.pathname === '/runtime.min.js');
  const stableNew = htmlAssets(newBuild.text('index.html')).find(url => url.pathname === '/runtime.min.js');
  assert.equal(stableOld.href, stableNew.href, 'Unchanged bytes keep their content version');
  const requests = [];
  const harness = workerHarness(oldBuild.text('service-worker.js'), [
    [urlKey(oldUrl.href), new Response(oldBuild.asset(oldUrl.href))],
    ['/core.min.js', new Response('stale unversioned script')],
    ['/index.html', new Response(oldBuild.text('index.html'))]
  ], async request => {
    const key = urlKey(request);
    requests.push(key);
    if (key === '/') return new Response(newBuild.text('index.html'), { headers: { 'Content-Type': 'text/html' } });
    if (key === urlKey(newUrl.href)) return new Response(newBuild.asset(newUrl.href), { headers: { 'Content-Type': 'text/javascript' } });
    throw new Error(`Unexpected network request: ${key}`);
  });
  const page = await harness.request('/', 'navigate');
  assert.equal(await page.text(), newBuild.text('index.html'), 'Navigation receives fresh network HTML');
  const script = await harness.request(newUrl.href);
  assert.equal(await script.text(), newBuild.asset(newUrl.href).toString('utf8'), 'Fresh query reaches network despite old cached script');
  assert.ok(requests.includes(urlKey(newUrl.href)), 'Fresh script was not satisfied by old cache');
  assert.equal(await (await harness.request(oldUrl.href)).text(), oldBuild.asset(oldUrl.href).toString('utf8'), 'Existing pages retain their matching cached script');
  assert.equal(harness.request('/api/assistant'), undefined, 'API requests bypass the shell cache');
  assert.equal(harness.request(newUrl.href, 'cors', new Headers({ Authorization: 'Bearer fixture' })), undefined, 'Authenticated requests bypass the shell cache');
});

test('cycle 2: identical builds stay stable and worker changes invalidate the shell', async () => {
  const first = await fixtureBuild();
  const repeat = await fixtureBuild();
  const changedWorker = await fixtureBuild('one', { 'service-worker.js': read('service-worker.js') + '\n// Worker implementation changed.\n' });
  assert.equal(first.text('index.html'), repeat.text('index.html'), 'Repeated output has stable HTML and versions');
  assert.equal(first.text('service-worker.js'), repeat.text('service-worker.js'), 'Repeated output has stable worker bytes');
  assert.equal(first.text('sw-assets.json'), repeat.text('sw-assets.json'), 'Repeated output has stable precache URLs');
  const firstId = JSON.parse(first.text('build-report.json')).buildId;
  const changedId = JSON.parse(changedWorker.text('build-report.json')).buildId;
  assert.match(firstId, /^[a-f0-9]{16}$/);
  assert.notEqual(firstId, changedId, 'A worker-only change creates a distinct cache version');
  assert.equal(first.text('sw-assets.json'), changedWorker.text('sw-assets.json'), 'Unchanged static bytes retain their exact cache keys');
});

test('cycle 2: a missing local HTML asset fails the build', async () => {
  const html = read('index.html').replace('</head>', '<link rel="icon" href="./assets/missing-build-fixture.svg"></head>');
  await assert.rejects(fixtureBuild('one', { 'index.html': html }), /missing|unknown|unversioned|not.*(?:found|built)|asset/i);
});

test('cycle 2: installation uses the pinned exact manifest and the canonical nonredirected shell', async () => {
  const build = await fixtureBuild();
  const manifest = JSON.parse(build.text('sw-assets.json'));
  const requests = [];
  const harness = workerHarness(build.text('service-worker.js'), [], async (request, options) => {
    const key = urlKey(request);
    requests.push(key);
    assert.notEqual(key, '/sw-assets.json', 'A generated worker pins its manifest instead of reading a later deployment');
    assert.notEqual(key, '/index.html', 'cleanUrls redirects are avoided by fetching the canonical root');
    assert.equal(options.credentials, 'omit');
    const body = key === '/' ? build.text('index.html') : build.asset(key);
    assert.ok(body, `Installer requests an emitted asset: ${key}`);
    return new Response(body, { headers: { 'Content-Type': key === '/' ? 'text/html' : 'application/octet-stream' } });
  });
  let install;
  harness.handlers.install({ waitUntil: promise => { install = promise; } });
  await install;
  assert.deepEqual([...harness.cache.keys()].sort(), manifest.slice().sort(), 'Every pinned query is installed exactly');
  assert.ok(requests.includes('/'));
  assert.equal(harness.cache.get('/index.html').redirected, false, 'Offline navigation receives a usable nonredirected response');
  assert.equal(await harness.cache.get('/index.html').clone().text(), build.text('index.html'));
});

test('cycle 2: crossed deployment HTML and tampered versioned bytes reject installation', async () => {
  const build = await fixtureBuild();
  for (const corruption of ['shell', 'script']) {
    const harness = workerHarness(build.text('service-worker.js'), [], async request => {
      const key = urlKey(request);
      let body = key === '/' ? build.text('index.html') : build.asset(key);
      if (corruption === 'shell' && key === '/') body = body.replace(/(<meta name="mer-build-id" content=")[^"]+/, '$1aaaaaaaaaaaaaaaa');
      if (corruption === 'script' && key.startsWith('/core.min.js?')) body = 'globalThis.wrongDeployment=true;';
      return new Response(body);
    });
    let install;
    harness.handlers.install({ waitUntil: promise => { install = promise; } });
    await assert.rejects(install, /shell|asset|build|version|integrity|mismatch/i, `${corruption} from another deployment cannot install under this worker`);
  }
});
