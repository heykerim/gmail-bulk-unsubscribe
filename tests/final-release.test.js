const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('manifest uses only permissions needed by the current popup', () => {
  const manifest = JSON.parse(read('extension/manifest.json'));
  assert.deepEqual(manifest.permissions, ['activeTab', 'storage']);
  assert.deepEqual(manifest.host_permissions, ['https://mail.google.com/*']);
});

test('bookmarklet docs use the current Gmail route and immutable v1 script URL', () => {
  const bookmarklet = read('bookmarklet.md');
  assert.match(bookmarklet, /mail\.google\.com\/mail\/u\/0\/#sub/);
  assert.doesNotMatch(bookmarklet, /#subscriptions/);
  assert.match(
    bookmarklet,
    /raw\.githubusercontent\.com\/heykerim\/gmail-bulk-unsubscribe\/v1\.0\.0\/unsubscribe\.js/
  );
  assert.doesNotMatch(
    bookmarklet,
    /raw\.githubusercontent\.com\/heykerim\/gmail-bulk-unsubscribe\/main\/unsubscribe\.js/
  );
});

test('README maintenance wording reflects active maintenance', () => {
  const readme = read('README.md');
  assert.doesNotMatch(readme, /isn't actively maintained/i);
  assert.match(readme, /maintained as a small open-source utility/i);
});

test('Chrome Web Store submission guide includes required release fields', () => {
  const guide = read('CHROME_WEB_STORE.md');
  for (const heading of [
    'Single purpose',
    'Permission justifications',
    'Remote code',
    'Data disclosure',
    'Store listing copy',
    'Graphic assets',
    'Submission checklist',
  ]) {
    assert.match(guide, new RegExp(`## ${heading}`));
  }
  assert.match(guide, /activeTab/);
  assert.match(guide, /storage/);
  assert.match(guide, /mail\.google\.com/);
  assert.match(guide, /No remote code/i);
  assert.match(guide, /1280\s*[x×]\s*800/);
  assert.match(guide, /440\s*[x×]\s*280/);
});

test('public privacy policy explains local processing and storage', () => {
  const privacy = read('PRIVACY.md');
  assert.match(privacy, /sender email addresses/i);
  assert.match(privacy, /keep-list/i);
  assert.match(privacy, /stored locally/i);
  assert.match(privacy, /not transmitted/i);
  assert.match(privacy, /no analytics/i);
  assert.match(privacy, /no advertising/i);
});

test('store package script zips extension contents with manifest at archive root', () => {
  const script = read('scripts/package-extension.sh');
  assert.match(script, /extension/);
  assert.match(script, /dist\/gmail-bulk-unsubscribe-v1\.0\.0\.zip/);
  assert.match(script, /zip/);
  assert.match(script, /manifest\.json/);
});
