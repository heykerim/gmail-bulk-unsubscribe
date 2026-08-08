const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const css = fs.readFileSync(path.resolve(__dirname, '../extension/popup.css'), 'utf8');
const html = fs.readFileSync(path.resolve(__dirname, '../extension/popup.html'), 'utf8');
const popup = fs.readFileSync(path.resolve(__dirname, '../extension/popup.js'), 'utf8');
const manifest = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../extension/manifest.json'), 'utf8')
);

function block(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 's'));
  assert.ok(match, `Missing CSS block for ${selector}`);
  return match[1];
}

test('popup fills the native 480x600 extension surface without an inset card', () => {
  const card = block('.popup-card');
  assert.match(card, /width:\s*480px/);
  assert.match(card, /height:\s*600px/);
  assert.match(card, /margin:\s*0/);
  assert.match(card, /border:\s*0/);
  assert.match(card, /border-radius:\s*0/);
  assert.doesNotMatch(card, /width:\s*468px/);
  assert.doesNotMatch(card, /height:\s*588px/);
});

test('interactive controls have explicit hover and pressed states', () => {
  for (const selector of [
    '.btn-primary:not(:disabled):hover',
    '.btn-primary:not(:disabled):active',
    '.btn-outline:not(:disabled):hover',
    '.btn-outline:not(:disabled):active',
    '.btn-stop:not(:disabled):hover',
    '.btn-stop:not(:disabled):active',
    '.icon-github:hover',
    '.icon-github:active',
    '.status-row.is-actionable:hover',
    '.status-row.is-actionable:active',
  ]) {
    assert.ok(css.includes(`${selector} {`), `Missing interaction style: ${selector}`);
  }
});

test('protected sender examples are placeholder-only, not real initial values', () => {
  assert.match(
    html,
    /placeholder="security&#10;receipt&#10;instagram\.com&#10;github\.com"/
  );
  assert.match(html, /<textarea[^>]*id="keeplist"[^>]*><\/textarea>/s);
  assert.doesNotMatch(html, /<textarea[^>]*>\s*security\s*receipt\s*instagram\.com\s*github\.com\s*<\/textarea>/s);
});

test('popup migrates only the exact legacy default keep-list and preserves custom values', () => {
  assert.match(
    popup,
    /const LEGACY_DEFAULT_KEEP_LIST = 'security\\nreceipt\\ninstagram\.com\\ngithub\.com';/
  );
  assert.match(
    popup,
    /if \(!r\.keepListPlaceholderMigrated && r\.keepList === LEGACY_DEFAULT_KEEP_LIST\)/
  );
  assert.match(popup, /chrome\.storage\.local\.remove\(\['keepList'\]\)/);
  assert.match(popup, /else if \(typeof r\.keepList === 'string'\)/);
  assert.match(popup, /keepEl\.value = r\.keepList/);
  assert.match(popup, /keepListPlaceholderMigrated:\s*true/);
});

test('status row navigates directly to Gmail Manage subscriptions when actionable', () => {
  assert.match(
    popup,
    /const SUBSCRIPTIONS_URL = 'https:\/\/mail\.google\.com\/mail\/u\/0\/#sub';/
  );
  assert.match(popup, /chrome\.tabs\.create\(\{ url: SUBSCRIPTIONS_URL \}\)/);
  assert.match(
    popup,
    /chrome\.tabs\.update\(statusActionTab\.id, \{ url: SUBSCRIPTIONS_URL \}\)/
  );
  assert.match(popup, /statusBar\.classList\.toggle\('is-actionable', actionable\)/);
  assert.match(popup, /statusBar\.setAttribute\('role', 'button'\)/);
  assert.match(popup, /statusBar\.setAttribute\('tabindex', '0'\)/);
  assert.match(popup, /event\.key === 'Enter'/);
  assert.match(popup, /event\.key === ' '/);
});

test('manifest exposes the local @ PNG icon set for Chrome surfaces', () => {
  const expected = {
    16: 'icons/icon16.png',
    32: 'icons/icon32.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
  };
  assert.deepEqual(manifest.icons, expected);
  assert.deepEqual(manifest.action.default_icon, expected);
  assert.ok(fs.existsSync(path.resolve(__dirname, '../extension/icons/icon-source.png')));
  for (const name of Object.values(expected)) {
    assert.ok(fs.existsSync(path.resolve(__dirname, `../extension/${name}`)), `${name} missing`);
  }
});
