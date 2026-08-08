const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const css = fs.readFileSync(path.resolve(__dirname, '../extension/popup.css'), 'utf8');

function block(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 's'));
  assert.ok(match, `Missing CSS block for ${selector}`);
  return match[1];
}

test('header icon system is smaller and tighter', () => {
  assert.match(block('.brand-icon'), /width:\s*31px/);
  assert.match(block('.brand-icon'), /height:\s*31px/);
  assert.match(block('.header-left'), /gap:\s*16px/);
  assert.match(block('.icon-help'), /width:\s*31px/);
  assert.match(block('.icon-help'), /height:\s*31px/);
  assert.match(block('.icon-help svg'), /width:\s*18px/);
  assert.match(block('.icon-help svg'), /height:\s*18px/);
});

test('status icon and gap are visually tighter', () => {
  assert.match(block('.status-row'), /gap:\s*11px/);
  assert.match(block('.status-icon'), /width:\s*16px/);
  assert.match(block('.status-icon'), /height:\s*16px/);
  assert.match(block('.status-icon svg'), /width:\s*16px/);
  assert.match(block('.status-icon svg'), /height:\s*16px/);
});

test('button icon system uses 17px icons and an 8px gap', () => {
  assert.match(block('.btn'), /gap:\s*8px/);
  assert.match(block('.btn-icon'), /width:\s*17px/);
  assert.match(block('.btn-icon'), /height:\s*17px/);
  assert.match(block('.btn-icon svg'), /width:\s*17px/);
  assert.match(block('.btn-icon svg'), /height:\s*17px/);
});

test('footer icon system uses 16px icons and a 9px gap', () => {
  assert.match(block('.footer'), /gap:\s*9px/);
  assert.match(block('.footer-icon'), /width:\s*16px/);
  assert.match(block('.footer-icon'), /height:\s*16px/);
  assert.match(block('.footer-icon svg'), /width:\s*16px/);
  assert.match(block('.footer-icon svg'), /height:\s*16px/);
});
