'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { minify } = require('terser');
const { createHash } = require('node:crypto');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const jsFiles = ['runtime.js','logo.js','core.js','demo-data.js','auth-core.js','accounting-core.js','security-core.js','import-core.js','bank-provider.js','state-store.js','onboarding-core.js','assistant-core.js','layout-core.js','app.js','premium.js','onboarding.js','assistant-ui.js','layout-ui.js','responsive-ui.js','auth-ui.js'];
jsFiles.push('enterprise-core.js','enterprise-ui.js','vault-core.js','security-enterprise.js','invoice-core.js','invoice-ui.js');
jsFiles.push('discovery-core.js','receipt-core.js','receipt-ui.js','planning-core.js','planning-ui.js','household-core.js','household-ui.js','app-update.js');
const suiteCss=['enterprise.css','invoice.css','security-enterprise.css','receipt.css','planning.css','household.css','app-update.css'];
jsFiles.push('circle-text.js','plan-navigation.js','export-core.js','export-pdf.js','export-ui.js');
suiteCss.push('export-ui.css','header-actions.css');
jsFiles.push('vaults-core.js','vaults-ui.js','bill-split-core.js','bill-split-ui.js','natural-input-core.js','natural-input-ui.js','engagement-core.js','engagement-ui.js');
suiteCss.push('vaults-ui.css','bill-split.css','natural-input-ui.css','engagement.css');
jsFiles.push('engagement-init.js');
jsFiles.push('popup-layout.js');
suiteCss.push('ui-consistency.css','recommendation-refresh.css','popup-layout.css');
const cssDescendantToken = '__MER_CSS_DESCENDANT__';

const compactCss = source => source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+(?=:(?:is|where|not|has)\()/g, cssDescendantToken)
  .replace(/\s+/g, ' ')
  .replace(/\s*([{}:;,>])\s*/g, '$1')
  .replaceAll(cssDescendantToken, ' ')
  .replace(/;}/g, '}')
  .trim();
const compactHtml = source => source
  .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
  .replace(/>\s+</g, '><')
  .trim();
const compactSvg = source => compactHtml(source).replace(/\s{2,}/g, ' ');

async function main() {
  await fs.rm(output, { recursive:true, force:true });
  await fs.mkdir(path.join(output, 'assets'), { recursive:true });
  const report = { generatedAt:new Date().toISOString(), files:[], sourceBytes:0, outputBytes:0 };

  for (const file of jsFiles) {
    const source = await fs.readFile(path.join(root, file), 'utf8');
    const result = await minify(source, {
      compress:{ passes:2, unsafe:false },
      mangle:{ toplevel:false, keep_classnames:true, keep_fnames:true },
      format:{ comments:false, ascii_only:false }
    });
    if (!result.code) throw new Error(`Terser produced no output for ${file}`);
    const target = file.replace(/\.js$/, '.min.js');
    await fs.writeFile(path.join(output, target), result.code, 'utf8');
    report.files.push({ source:file, output:target, sourceBytes:Buffer.byteLength(source), outputBytes:Buffer.byteLength(result.code) });
  }

  const css = await fs.readFile(path.join(root, 'styles.css'), 'utf8');
  const minifiedCss = compactCss(css);
  const sourceFunctionalDescendants=(css.match(/\s+:(?:is|where|not|has)\(/g)||[]).length;
  const outputFunctionalDescendants=(minifiedCss.match(/\s+:(?:is|where|not|has)\(/g)||[]).length;
  if(outputFunctionalDescendants!==sourceFunctionalDescendants)throw new Error(`CSS descendant selector integrity failed: ${outputFunctionalDescendants}/${sourceFunctionalDescendants}`);
  await fs.writeFile(path.join(output, 'styles.min.css'), minifiedCss, 'utf8');
  report.files.push({ source:'styles.css', output:'styles.min.css', sourceBytes:Buffer.byteLength(css), outputBytes:Buffer.byteLength(minifiedCss) });

  let html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
  for (const file of jsFiles) html = html.replace(new RegExp(`${file.replace('.', '\\.')}[^"']*`, 'g'), file.replace(/\.js$/, '.min.js'));
  html = html.replace(/styles\.css[^"']*/g, 'styles.min.css');

  for (const entry of await fs.readdir(path.join(root, 'assets'), { withFileTypes:true })) {
    if (!entry.isFile()) continue;
    const sourcePath=path.join(root,'assets',entry.name),targetPath=path.join(output,'assets',entry.name);
    if (entry.name.endsWith('.svg')) await fs.writeFile(targetPath, compactSvg(await fs.readFile(sourcePath,'utf8')), 'utf8');
    else await fs.copyFile(sourcePath,targetPath);
  }

  for(const file of suiteCss) {
    const source=await fs.readFile(path.join(root,file),'utf8');
    await fs.writeFile(path.join(output,file),compactCss(source),'utf8');
  }
  const manifest=JSON.parse(await fs.readFile(path.join(root,'manifest.webmanifest'),'utf8'));
  for(const icon of manifest.icons||[]){
    const url=new URL(icon.src,'https://mer.invalid/');
    if(url.origin!=='https://mer.invalid')continue;
    const bytes=await fs.readFile(path.join(output,url.pathname.slice(1)));
    icon.src=`${url.pathname}?v=${createHash('sha256').update(bytes).digest('hex').slice(0,16)}`;
  }
  await fs.writeFile(path.join(output,'manifest.webmanifest'),JSON.stringify(manifest),'utf8');
  const staticFiles=['/styles.min.css',...suiteCss.map(file=>'/'+file),'/manifest.webmanifest',...jsFiles.map(file=>'/'+file.replace(/\.js$/,'.min.js')),...(await fs.readdir(path.join(output,'assets'))).filter(file=>/\.(svg|png|js|ttf|woff2?)$/.test(file)).map(file=>'/assets/'+file)];
  // A fresh HTML response must never share script/style cache keys with an older shell.
  // Exact query matching also bypasses already-installed legacy cache-first workers.
  const assetUrls=new Map();
  for(const file of staticFiles){
    const digest=createHash('sha256').update(await fs.readFile(path.join(output,file.slice(1)))).digest('hex').slice(0,16);
    assetUrls.set(file,`${file}?v=${digest}`);
  }
  html=html.replace(/\b(src|href)=(["'])([^"']+)\2/g,(match,attribute,quote,value)=>{
    if(/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value))return match;
    const url=new URL(value,'https://mer.invalid/'),versioned=assetUrls.get(url.pathname);
    if(!versioned){
      if(/\.(?:js|css|svg|png|ttf|woff2?|webmanifest)$/.test(url.pathname))throw new Error(`Unversioned or missing shell asset: ${value}`);
      return match;
    }
    return `${attribute}=${quote}${value.startsWith('/')?'':'./'}${value.startsWith('/')?versioned:versioned.slice(1)}${url.hash}${quote}`;
  });
  const workerSource=await fs.readFile(path.join(root,'service-worker.js'),'utf8');
  const shellHash=createHash('sha256').update(html).update(workerSource);
  for(const file of staticFiles.slice().sort())shellHash.update(file).update(await fs.readFile(path.join(output,file.slice(1))));
  const buildId=shellHash.digest('hex').slice(0,16);
  html=compactHtml(html.replace('</head>',`<meta name="mer-build-id" content="${buildId}"></head>`));
  await fs.writeFile(path.join(output,'index.html'),html,'utf8');
  report.files.push({source:'index.html',output:'index.html',sourceBytes:(await fs.stat(path.join(root,'index.html'))).size,outputBytes:Buffer.byteLength(html)});
  report.sourceBytes=report.files.reduce((sum,file)=>sum+file.sourceBytes,0);
  report.buildId=buildId;
  const shellFiles=['/index.html',...assetUrls.values()];
  const worker=workerSource.replaceAll('__MER_BUILD_ID__',buildId).replace('/*__MER_SHELL_ASSETS__*/ null',JSON.stringify(shellFiles));
  await fs.writeFile(path.join(output,'service-worker.js'),worker,'utf8');
  await fs.writeFile(path.join(output,'sw-assets.json'),JSON.stringify(shellFiles),'utf8');
  report.outputBytes=report.files.reduce((sum,file)=>sum+file.outputBytes,0);
  report.reductionPercent=Math.round((1-report.outputBytes/report.sourceBytes)*1000)/10;
  await fs.writeFile(path.join(output,'build-report.json'),JSON.stringify(report,null,2),'utf8');
  process.stdout.write(`Production build complete: ${report.outputBytes} bytes (${report.reductionPercent}% smaller).\n`);
}

if(require.main===module)main().catch(error => { process.stderr.write(`${error.stack || error}\n`); process.exit(1); });
module.exports={main,compactCss,compactHtml};
