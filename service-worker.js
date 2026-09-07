'use strict';
// Production builds replace this token with a hash of the complete app shell.
const CACHE = 'mer-shell-enterprise-20260907-__MER_BUILD_ID__';
const BUILD_ID = '__MER_BUILD_ID__';
const SHELL = '/index.html';
const BUILD_ASSETS = /*__MER_SHELL_ASSETS__*/ null;
const safePath = url => url.origin === self.location.origin && !url.username && !url.password &&
  [...url.searchParams.keys()].every(key => key === 'v') &&
  (['/', SHELL, '/manifest.webmanifest'].includes(url.pathname) ||
    /^\/[a-z][a-z0-9-]*(?:\.min)?\.(?:js|css)$/.test(url.pathname) ||
    /^\/assets\/[a-zA-Z0-9_./-]+\.(?:js|svg|png|jpe?g|webp|ico|woff2?)$/.test(url.pathname));
async function shellAssets() {
  if(Array.isArray(BUILD_ASSETS))return BUILD_ASSETS;
  try {
    const manifest = await fetch('/sw-assets.json',{cache:'no-store',credentials:'omit'});
    if (manifest.ok) {
      const files = await manifest.json();
      if (Array.isArray(files)) return [...new Set([SHELL, ...files.filter(file => typeof file === 'string' && safePath(new URL(file, self.location.origin))).map(file=>{const url=new URL(file,self.location.origin);return url.pathname+url.search;})])];
    }
  } catch {}
  const response=await fetch('/',{cache:'no-store',credentials:'omit'});
  if(!response.ok)throw new Error('APP_SHELL_UNAVAILABLE');
  const html=await response.text(),files=[SHELL,'/manifest.webmanifest','/assets/mer-mark-full-color.svg'];
  for(const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
    const url=new URL(match[1],self.location.origin);
    if(safePath(url)&&!files.includes(url.pathname+url.search))files.push(url.pathname+url.search);
  }
  return files;
}
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE),files=await shellAssets();
  // Only static same-origin shell assets; no API, auth response, user payload, or cross-origin cache.
  await Promise.all(files.map(async file=>{
    // cleanUrls redirects /index.html. Cache the canonical response under our stable offline key.
    const response=await fetch(file === SHELL ? '/' : file,{cache:'no-store',credentials:'omit'});
    if(!response.ok || response.redirected)throw new Error('SHELL_ASSET_UNAVAILABLE');
    if(/^[a-f0-9]{16}$/.test(BUILD_ID)){
      if(file === SHELL){
        const html=await response.clone().text();
        const meta=[...html.matchAll(/<meta\b[^>]*>/gi)].map(match=>match[0]).find(tag=>/\bname=["']mer-build-id["']/i.test(tag));
        if(!meta || meta.match(/\bcontent=["']([^"']+)["']/i)?.[1] !== BUILD_ID)throw new Error('SHELL_VERSION_MISMATCH');
      }
      const expected=new URL(file,self.location.origin).searchParams.get('v');
      if(expected){
        const digest=await crypto.subtle.digest('SHA-256',await response.clone().arrayBuffer());
        const actual=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('').slice(0,16);
        if(actual !== expected)throw new Error('SHELL_ASSET_VERSION_MISMATCH');
      }
    }
    await cache.put(file,response);
  }));
  // Wait for existing tabs to close before activating a new shell version.
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const names=await caches.keys();await Promise.all(names.filter(name=>name.startsWith('mer-shell-')&&name!==CACHE).map(name=>caches.delete(name)));
  await self.clients.claim();
})()));
self.addEventListener('message',event=>{
  if(event.data?.type !== 'MER_ACTIVATE_UPDATE' || event.data.userInitiated !== true ||
    event.origin !== self.location.origin || !event.source?.id || event.source.type !== 'window')return;
  event.waitUntil((async()=>{
    const client=await self.clients.get(event.source.id);
    if(!client || client.type !== 'window' || new URL(client.url).origin !== self.location.origin)return;
    await self.skipWaiting();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||!safePath(url)||request.headers.has('authorization'))return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request,{cache:'no-store'}).catch(async()=>{
      const cache=await caches.open(CACHE);
      return await cache.match(SHELL)||new Response('Mer nije još spremljen za rad izvan mreže.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});
    }));
    return;
  }
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE),cached=await cache.match(request);
    if(cached)return cached;
    // Dynamic requests are never added to the shell cache.
    return fetch(request);
  })());
});
