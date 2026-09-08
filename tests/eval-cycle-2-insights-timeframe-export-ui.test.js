'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const premium = fs.readFileSync(path.join(root, 'premium.js'), 'utf8');
const exportUI = fs.readFileSync(path.join(root, 'export-ui.js'), 'utf8');

test('evaluation cycle 2: Insights exposes the four canonical timeframes in the intended order', () => {
  const start = html.indexOf('id="insightsFilters"');
  const end = html.indexOf('</div>', start);
  assert.ok(start >= 0 && end > start, 'Insights timeframe control exists');
  const filters = html.slice(start, end);
  const options = [...filters.matchAll(/<button\b([^>]*)data-timeframe="([^"]+)"([^>]*)data-i18n="([^"]+)"[^>]*>([^<]+)<\/button>/g)]
    .map(match => ({ attributes:`${match[1]}${match[3]}`, value:match[2], key:match[4], label:match[5] }));

  assert.match(filters, /role="group"/);
  assert.match(filters, /data-i18n-aria="reportTimeframe"/);
  assert.deepEqual(options.map(option => option.value), ['daily','monthly','ytd','all']);
  assert.deepEqual(options.map(option => option.key), ['daily','monthly','yearToDate','allTime']);
  assert.deepEqual(options.map(option => option.label), ['Danas','Ovaj mjesec','Ova godina','Sve ukupno']);
  assert.deepEqual(options.filter(option => /\bclass="[^"]*\bactive\b/.test(option.attributes)).map(option => option.value), ['monthly']);
  assert.match(app, /let insightsTimeframe = 'monthly'/);
  assert.match(app, /\$\$\('#insightsFilters \[data-timeframe\]'\)\.forEach\(button=>button\.addEventListener\('click',\(\)=>\{insightsTimeframe=button\.dataset\.timeframe;renderInsights\(\);\}\)\)/);
});

test('evaluation cycle 2: the Insights toolbar uses the requested export report copy', () => {
  const start = html.indexOf('id="insightsView"');
  const filters = html.indexOf('id="insightsFilters"', start);
  const heading = html.slice(start, filters);
  assert.match(heading, /data-export-insights[\s\S]*?data-i18n="exportInsightsReport">Izvoz izvještaja<\/span>/);
  assert.doesNotMatch(heading, /Izvezi izvješće|Izvezi izvještaj/);
  assert.match(app, /exportInsightsReport:'Izvoz izvještaja'/);
});

test('evaluation cycle 2: the modal starts from the active Insights timeframe and exports the user-confirmed selection', () => {
  const bridgeStart = premium.indexOf('window.MerExportBridge=Object.freeze({');
  const bridgeEnd = premium.indexOf('function openGlobalImport', bridgeStart);
  assert.ok(bridgeStart >= 0 && bridgeEnd > bridgeStart);
  const bridge = premium.slice(bridgeStart, bridgeEnd);
  assert.match(bridge, /profile:state,profileId:appState\.activeAccount/);
  assert.match(bridge, /referenceDate:appReferenceDate/);
  assert.match(bridge, /timezone:appState\.settings\.timezone,insightsTimeframe/);
  assert.match(premium, /\$\$\('\[data-export-insights\]'\)\.forEach\(button=>button\.addEventListener\('click',\(\)=>window\.MerExportUI\?\.open\('insights',\{timeframe:insightsTimeframe\}\)\)\)/);
  assert.match(exportUI, /const chosenTimeframe = options\.timeframe \|\| \(context === 'insights' \? state\.insightsTimeframe : 'monthly'\)/);
  assert.match(exportUI, /selection\.timeframe = el\('exportTimeframe'\)\.value/);
  assert.match(exportUI, /MerExportCore\.buildReport\(\{\.\.\.state, context:selection\.context, timeframe:selection\.timeframe, month:selection\.month[,}]/);
  assert.match(exportUI, /MerExportCore\.toCsv\(report\)/);
  assert.match(exportUI, /MerExportPdf\.create\(report\)/);
  assert.match(exportUI, /JSON\.stringify\(report, null, 2\)/);
  assert.match(exportUI, /anchor\.download = `\$\{report\.filenameStem\}\.\$\{format\}`/);
  assert.doesNotMatch(premium, /function exportInsightsReportCsv|exportInsightsReportCsv\(/);
});

test('evaluation cycle 2: every Insights consumer follows the selected timeframe', () => {
  assert.match(app, /filterTransactions\(state\.transactions,insightsTimeframe,reference\)/);
  assert.match(app, /derivedTotals\(insightsTimeframe\)/);
  assert.match(app, /topExpenseCategory\(state\.transactions,insightsTimeframe,reference\)/);
  assert.match(app, /groupCashflow\(state\.transactions,insightsTimeframe,reference\)/);
  assert.match(app, /categoryExpenseTotals\(state\.transactions,insightsTimeframe,reference\)/);
  assert.match(app, /button\.dataset\.timeframe===insightsTimeframe[\s\S]*?aria-pressed/);
});
