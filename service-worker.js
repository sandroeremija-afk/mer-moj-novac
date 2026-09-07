'use strict';
// Increment on every changed shell, or replace __MER_BUILD_ID__ during production build.
const CACHE = 'mer-shell-enterprise-20260907-__MER_BUILD_ID__';
const SHELL = '/index.html';
const safePath = url => url.origin === self.location.origin && !url.pathname.startsWith('/api/') && !url.pathname.includes('/.env') && (/\.(?:js|css|svg|png|woff2?|webmanifest)$/.test(url.pathname) || ['/',SHELL].includes(url.pathname));
async function shellAssets() {
  try {
    const manifest = await fetch('/sw-assets.json',{cache:'no-store',credentials:'omit'});
    if (manifest.ok) { const files=await manifest.json();if(Array.isArray(files))return files.filter(file=>typeof file==='string'&&safePath(new URL(file,self.location.origin))); }
  } catch {}
  const response=await fetch(SHELL,{cache:'no-store',credentials:'omit'});
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
  await Promise.all(files.map(async file=>{const response=await fetch(file,{cache:'reload',credentials:'omit'});if(!response.ok)throw new Error('SHELL_ASSET_UNAVAILABLE');await cache.put(file,response);}));
  // Wait for existing tabs to close before activating a new shell version.
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const names=await caches.keys();await Promise.all(names.filter(name=>name.startsWith('mer-shell-')&&name!==CACHE).map(name=>caches.delete(name)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||!safePath(url)||request.headers.has('authorization'))return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).catch(async()=>await caches.match(SHELL)||new Response('Mer nije još spremljen za rad izvan mreže.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}})));
    return;
  }
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE),cached=await cache.match(request);
    if(cached)return cached;
    // Dynamic requests are never added to the shell cache.
    return fetch(request);
  })());
});
