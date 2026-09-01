'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const onboarding = fs.readFileSync(path.join(root, 'onboarding.js'), 'utf8');

test('evaluation cycle 2: senior-friendly tour uses legible controls and Croatian microcopy', () => {
  assert.match(html, /id="onboardingPrevious"[^>]*data-i18n="onboardingBack"[^>]*>Natrag</);
  assert.match(html, /id="onboardingNext"[^>]*data-i18n="onboardingNext"[^>]*>Dalje</);
  assert.match(html, /id="onboardingSkip"[^>]*>Preskoči</);
  assert.match(onboarding, /onboardingBack:'Natrag'/);
  assert.match(onboarding, /onboardingNext:'Dalje'/);
  assert.match(onboarding, /Ovdje možete pronaći, filtrirati i urediti svaku transakciju\./);
  assert.match(css, /\.onboarding-popover > p:not\(\.overline\) \{[^}]*font-size:1rem;[^}]*line-height:1\.6;/);
  assert.match(css, /\.onboarding-actions button \{[^}]*min-height:44px;[^}]*font-size:1rem;/);
});

test('evaluation cycle 2: spotlight and popover glide for 500ms with reduced-motion fallback', () => {
  assert.match(css, /\.onboarding-spotlight \{[\s\S]*?transition:left \.5s ease-in-out,top \.5s ease-in-out,width \.5s ease-in-out,height \.5s ease-in-out;/);
  assert.match(css, /\.onboarding-popover \{[\s\S]*?transition:left \.5s ease-in-out,top \.5s ease-in-out/);
  assert.match(onboarding, /scrollIntoView\(\{ behavior:reducedMotion\(\)\?'auto':'smooth'/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\.onboarding-spotlight,[\s\S]*?transition:none;/);
});

test('evaluation cycle 2: category and transaction visuals use semantic inline SVG icons', () => {
  for (const id of ['icon-shopping-cart', 'icon-car', 'icon-fuel', 'icon-utensils', 'icon-home', 'icon-heart-pulse', 'icon-wallet']) {
    assert.match(html, new RegExp(`<symbol id="${id}"`), `${id} is in the local SVG sprite`);
  }
  assert.match(app, /food:\{ icon:'H', iconId:'icon-utensils'/);
  assert.match(app, /transport:\{ icon:'P', iconId:'icon-car'/);
  assert.match(app, /shopping:\{ icon:'K', iconId:'icon-shopping-cart'/);
  assert.match(app, /healthBeauty:\{ icon:'N', iconId:'icon-heart-pulse'/);
  assert.match(app, /utilities:\{ icon:'R', iconId:'icon-home'/);
  assert.match(app, /incomeCategoryVisual[^\n]+iconId:'icon-wallet'/);
  assert.match(app, /categoryIconMarkup\(meta\)/);
  assert.match(app, /categoryIconMarkup\(visual\)/);
  assert.doesNotMatch(app, /class="category-icon \$\{meta\.className\}">\$\{escapeHtml\(meta\.icon\)\}/);
});

test('evaluation cycle 2: imported or custom category names receive a safe semantic fallback', () => {
  const inferenceStart = app.indexOf('function inferredCategoryIconId');
  const visualStart = app.indexOf('const categoryVisual', inferenceStart);
  const inference = app.slice(inferenceStart, visualStart);
  for (const icon of ['icon-heart-pulse', 'icon-home', 'icon-fuel', 'icon-car', 'icon-utensils', 'icon-shopping-cart']) {
    assert.match(inference, new RegExp(`return '${icon}'`));
  }
  assert.match(app, /iconId:inferredCategoryIconId\(cat\)/);
  assert.match(app, /visual\?\.icon\|\|'\?'/, 'unknown custom categories keep a safe text fallback');
});
