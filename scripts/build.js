'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { minify } = require('terser');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const jsFiles = ['runtime.js','logo.js','core.js','auth-core.js','accounting-core.js','security-core.js','import-core.js','bank-provider.js','state-store.js','onboarding-core.js','assistant-core.js','layout-core.js','app.js','premium.js','onboarding.js','assistant-ui.js','layout-ui.js','responsive-ui.js','auth-ui.js'];
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
  html = compactHtml(html);
  await fs.writeFile(path.join(output, 'index.html'), html, 'utf8');
  report.files.push({ source:'index.html', output:'index.html', sourceBytes:(await fs.stat(path.join(root,'index.html'))).size, outputBytes:Buffer.byteLength(html) });

  for (const entry of await fs.readdir(path.join(root, 'assets'), { withFileTypes:true })) {
    if (!entry.isFile()) continue;
    const sourcePath=path.join(root,'assets',entry.name),targetPath=path.join(output,'assets',entry.name);
    if (entry.name.endsWith('.svg')) await fs.writeFile(targetPath, compactSvg(await fs.readFile(sourcePath,'utf8')), 'utf8');
    else await fs.copyFile(sourcePath,targetPath);
  }

  report.sourceBytes=report.files.reduce((sum,file)=>sum+file.sourceBytes,0);
  report.outputBytes=report.files.reduce((sum,file)=>sum+file.outputBytes,0);
  report.reductionPercent=Math.round((1-report.outputBytes/report.sourceBytes)*1000)/10;
  await fs.writeFile(path.join(output,'build-report.json'),JSON.stringify(report,null,2),'utf8');
  process.stdout.write(`Production build complete: ${report.outputBytes} bytes (${report.reductionPercent}% smaller).\n`);
}

main().catch(error => { process.stderr.write(`${error.stack || error}\n`); process.exit(1); });
