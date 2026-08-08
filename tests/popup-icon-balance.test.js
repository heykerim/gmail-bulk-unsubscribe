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

test('header keeps 12px logo-to-title spacing and a minimal GitHub control', () => {
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

test('action order is unsubscribe, preview, stop', () => {
  const runIndex = html.indexOf('id="run"');
  const previewIndex = html.indexOf('id="preview"');
  const stopIndex = html.indexOf('id="stop"');
  assert.ok(runIndex > -1 && previewIndex > -1 && stopIndex > -1);
  assert.ok(runIndex < previewIndex, 'Unsubscribe all should be left of Preview senders');
  assert.ok(previewIndex < stopIndex, 'Preview senders should be left of Stop');
  assert.match(block('.actions'), /grid-template-columns:\s*150px\s+145px\s+103px/);
});

test('popup uses the exact requested 12x12 icon set', () => {
  for (const title of ['envelope', 'eye', 'envelope-minus', 'media-stop', 'lock']) {
    assert.match(html, new RegExp(`<title>${title}<\\/title>`));
  }
  assert.doesNotMatch(html, /data-lucide=/);
});

test('status icon and copy use the 12px envelope with a tight gap', () => {
  assert.match(block('.status-row'), /gap:\s*10px/);
  assert.match(block('.status-icon'), /width:\s*12px/);
  assert.match(block('.status-icon'), /height:\s*12px/);
  assert.match(block('.status-icon svg'), /width:\s*12px/);
  assert.match(block('.status-icon svg'), /height:\s*12px/);
  assert.match(block('.status-icon'), /transform:\s*translateY\(-0\.25px\)/);
});

test('button icons are 12px and optically centered with a 7px gap', () => {
  assert.match(block('.btn'), /gap:\s*7px/);
  assert.match(block('.btn-icon'), /width:\s*12px/);
  assert.match(block('.btn-icon'), /height:\s*12px/);
  assert.match(block('.btn-icon'), /transform:\s*translateY\(-0\.25px\)/);
  assert.match(block('.btn-icon svg'), /width:\s*12px/);
  assert.match(block('.btn-icon svg'), /height:\s*12px/);
});

test('footer uses the requested 12px lock icon and an 8px gap', () => {
  assert.match(block('.footer'), /gap:\s*8px/);
  assert.match(block('.footer-icon'), /width:\s*12px/);
  assert.match(block('.footer-icon'), /height:\s*12px/);
  assert.match(block('.footer-icon'), /transform:\s*translateY\(-0\.25px\)/);
  assert.match(block('.footer-icon svg'), /width:\s*12px/);
  assert.match(block('.footer-icon svg'), /height:\s*12px/);
});
