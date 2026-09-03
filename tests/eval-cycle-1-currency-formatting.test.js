const test = require('node:test');
const assert = require('node:assert/strict');
const MerCore = require('../core.js');

const normalized = value => value.replace(/\u00a0|\u202f/g, ' ');

test('evaluation cycle 1: regular currency uses exactly two decimals while zero stays compact', () => {
  assert.equal(normalized(MerCore.formatCurrency(10.5, { locale:'hr-HR', currency:'EUR' })), '10,50 €');
  assert.equal(normalized(MerCore.formatCurrency(1240, { locale:'hr-HR', currency:'EUR' })), '1.240,00 €');
  assert.equal(normalized(MerCore.formatCurrency(0, { locale:'hr-HR', currency:'EUR' })), '0 €');
  assert.equal(normalized(MerCore.formatCurrency(-0, { locale:'hr-HR', currency:'EUR' })), '0 €');
});

test('evaluation cycle 1: only round category limits omit decimals', () => {
  assert.equal(normalized(MerCore.formatCurrency(100, { locale:'hr-HR', currency:'EUR' })), '100,00 €');
  assert.equal(normalized(MerCore.formatCurrency(100, { locale:'hr-HR', currency:'EUR', categoryBudgetLimit:true })), '100 €');
  assert.equal(normalized(MerCore.formatCurrency(100.25, { locale:'hr-HR', currency:'EUR', categoryBudgetLimit:true })), '100,25 €');
});

test('evaluation cycle 1: invalid currency input fails soft as zero', () => {
  assert.equal(normalized(MerCore.formatCurrency(undefined, { locale:'hr-HR', currency:'EUR' })), '0 €');
  assert.equal(normalized(MerCore.formatCurrency(Number.NaN, { locale:'hr-HR', currency:'EUR' })), '0 €');
});
