const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const css = fs.readFileSync(path.resolve(__dirname, '../extension/popup.css'), 'utf8');
const html = fs.readFileSync(path.resolve(__dirname, '../extension/popup.html'), 'utf8');
const popup = fs.readFileSync(path.resolve(__dirname, '../extension/popup.js'), 'utf8');

function block(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 's'));
  assert.ok(match, `Missing CSS block for ${selector}`);
  return match[1];
}

test('header uses 12px logo-to-title spacing and a minimal GitHub control', () => {
  assert.match(block('.header-left'), /gap:\s*12px/);
  assert.match(block('.icon-github'), /width:\s*31px/);
  assert.match(block('.icon-github'), /height:\s*31px/);
  assert.match(block('.github-mark'), /width:\s*15px/);
  assert.match(block('.github-mark'), /height:\s*15px/);
  assert.match(html, /id="githubLink"/);
  assert.match(html, /src="data:image\/png;base64,/);
  assert.doesNotMatch(html, /id="help"/);
  assert.doesNotMatch(popup, /helpBtn/);
});

test('popup functional icons use the Lucide icon family', () => {
  for (const icon of ['mail', 'eye', 'mail-x', 'square', 'shield-check']) {
    assert.match(html, new RegExp(`data-lucide="${icon}"`));
  }
});

test('status icon and copy are optically centered with a tighter gap', () => {
  assert.match(block('.status-row'), /gap:\s*10px/);
  assert.match(block('.status-icon'), /width:\s*16px/);
  assert.match(block('.status-icon'), /height:\s*16px/);
  assert.match(block('.status-icon'), /transform:\s*translateY\(-0\.25px\)/);
});

test('button icon system uses 16px Lucide icons and a 7px gap', () => {
  assert.match(block('.btn'), /gap:\s*7px/);
  assert.match(block('.btn-icon'), /width:\s*16px/);
  assert.match(block('.btn-icon'), /height:\s*16px/);
  assert.match(block('.btn-icon'), /transform:\s*translateY\(-0\.25px\)/);
  assert.match(block('.btn-icon svg'), /width:\s*16px/);
  assert.match(block('.btn-icon svg'), /height:\s*16px/);
});

test('footer icon system uses a 15px Lucide icon and an 8px gap', () => {
  assert.match(block('.footer'), /gap:\s*8px/);
  assert.match(block('.footer-icon'), /width:\s*15px/);
  assert.match(block('.footer-icon'), /height:\s*15px/);
  assert.match(block('.footer-icon'), /transform:\s*translateY\(-0\.25px\)/);
  assert.match(block('.footer-icon svg'), /width:\s*15px/);
  assert.match(block('.footer-icon svg'), /height:\s*15px/);
});
