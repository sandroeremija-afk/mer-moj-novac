'use strict';
// Local production preview. Never serves source, environment files or user caches.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../dist');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
const handlers={'/api/cashflow':require('../api/cashflow.js'),'/api/assistant':require('../api/assistant.js')};
http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(handlers[url.pathname]){
    const parts=[];let size=0;
    for await(const part of req){size+=part.length;if(size>64000){res.writeHead(413).end();return;}parts.push(part);}
    try{req.body=JSON.parse(Buffer.concat(parts).toString()||'{}');res.status=code=>{res.statusCode=code;return res;};res.json=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};await handlers[url.pathname](req,res);}catch{if(!res.headersSent)res.writeHead(500);res.end('{"error":"preview-request-failed"}');}return;
  }
  let decoded;try{decoded=decodeURIComponent(url.pathname);}catch{res.writeHead(400).end();return;}
  const file=path.resolve(root,'.'+(decoded==='/'?'/index.html':decoded));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{const bytes=fs.readFileSync(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);}catch{res.writeHead(404).end('Not found');}
}).listen(Number(process.env.PORT)||4188,'127.0.0.1',()=>process.stdout.write('Mer production preview: http://127.0.0.1:4188\n'));
