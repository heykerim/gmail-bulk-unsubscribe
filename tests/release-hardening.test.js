const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function makeRowButton(email, onClick = () => {}) {
  return {
    closest: () => ({ dataset: { email } }),
    scrollIntoView: () => {},
    click: onClick,
  };
}

function makeDialogButton({ visible = true, onClick = () => {} } = {}) {
  return {
    getBoundingClientRect: () => ({ width: visible ? 20 : 0, height: visible ? 20 : 0 }),
    click: onClick,
  };
}

function loadContentScript({ getRows, getDialogs, now } = {}) {
  const progress = [];
  let listener;
  let doneResolve;
  const done = new Promise((resolve) => { doneResolve = resolve; });

  const document = {
    querySelectorAll(selector) {
      if (selector === 'button[jscontroller="PIVayb"]') return getRows ? getRows() : [];
      if (selector === 'button[data-mdc-dialog-action="ok"]') return getDialogs ? getDialogs() : [];
      return [];
    },
    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    },
    body: { dispatchEvent() {} },
  };

  const chrome = {
    runtime: {
      onMessage: { addListener(fn) { listener = fn; } },
      sendMessage(message) {
        progress.push(message);
        if (message?.payload?.type === 'done') doneResolve(message.payload);
      },
    },
  };

  const DateShim = now ? { now } : Date;
  const context = {
    window: {},
    document,
    chrome,
    location: { hash: '#subscriptions' },
    KeyboardEvent: class KeyboardEvent {},
    getComputedStyle: () => ({ display: 'block', visibility: 'visible' }),
    Date: DateShim,
    setTimeout: (fn) => setImmediate(fn),
    console,
  };

  vm.runInNewContext(read('extension/content.js'), context, { filename: 'extension/content.js' });
  return { listener, progress, done };
}

test('Manifest does not declare SVG toolbar icons for Chromium', () => {
  const manifest = JSON.parse(read('extension/manifest.json'));
  const declared = JSON.stringify({ icons: manifest.icons, action: manifest.action?.default_icon });
  assert.doesNotMatch(declared, /\.svg/i);
});

test('Content script rejects a second run while one is already active', () => {
  const row = makeRowButton('one@example.com');
  const ok = makeDialogButton();
  const { listener } = loadContentScript({ getRows: () => [row], getDialogs: () => [ok] });

  let first;
  let second;
  listener({ cmd: 'run', opts: { dryRun: false, keepList: [] } }, null, (r) => { first = r; });
  listener({ cmd: 'run', opts: { dryRun: false, keepList: [] } }, null, (r) => { second = r; });

  assert.equal(first?.started, true);
  assert.equal(second?.started, false);
  assert.equal(second?.reason, 'running');
});

test('Content script ignores hidden stale dialog buttons', async () => {
  let hiddenClicks = 0;
  let visibleClicks = 0;
  const row = makeRowButton('one@example.com');
  const hidden = makeDialogButton({ visible: false, onClick: () => { hiddenClicks += 1; } });
  const visible = makeDialogButton({ visible: true, onClick: () => { visibleClicks += 1; } });
  const { listener, done } = loadContentScript({ getRows: () => [row], getDialogs: () => [hidden, visible] });

  listener({ cmd: 'run', opts: { dryRun: false, keepList: [] } }, null, () => {});
  await done;

  assert.equal(hiddenClicks, 0);
  assert.equal(visibleClicks, 1);
});

test('Content script re-resolves row buttons after Gmail rerenders', async () => {
  let currentRows;
  let pendingDialog = false;
  let staleClicked = false;
  let freshClicked = false;
  let fakeNow = 0;

  const rowA = makeRowButton('a@example.com', () => { pendingDialog = true; });
  const staleB = makeRowButton('b@example.com', () => { staleClicked = true; });
  const freshB = makeRowButton('b@example.com', () => { freshClicked = true; pendingDialog = true; });
  currentRows = [rowA, staleB];

  const ok = makeDialogButton({
    onClick: () => {
      pendingDialog = false;
      if (currentRows.includes(rowA)) currentRows = [freshB];
    },
  });

  const { listener, done } = loadContentScript({
    getRows: () => currentRows,
    getDialogs: () => (pendingDialog ? [ok] : []),
    now: () => { fakeNow += 1000; return fakeNow; },
  });

  listener({ cmd: 'run', opts: { dryRun: false, keepList: [] } }, null, () => {});
  const result = await done;

  assert.equal(staleClicked, false);
  assert.equal(freshClicked, true);
  assert.equal(result.done, 2);
  assert.equal(result.skipped, 0);
});

test('Popup disables destructive controls while a run is active', () => {
  const popup = read('extension/popup.js');
  assert.match(popup, /previewBtn\.disabled\s*=\s*running/);
  assert.match(popup, /runBtn\.disabled\s*=\s*running/);
  assert.match(popup, /stopBtn\.disabled\s*=\s*!running/);
});

test('Bookmarklet previews after loading and docs do not claim injected UI', () => {
  const bookmarklet = read('bookmarklet.md');
  assert.match(bookmarklet, /onload[^\n]*unsubAll\(\)/);
  assert.doesNotMatch(bookmarklet, /injected buttons/i);
});

test('Privacy wording distinguishes local logic from bookmarklet code fetch', () => {
  const readme = read('README.md');
  assert.doesNotMatch(readme, /It makes \*\*no network requests\*\*/);
  assert.match(readme, /bookmarklet/i);
  assert.match(readme, /raw\.githubusercontent\.com/i);
});

test('Lucide third-party license notice is included', () => {
  const notice = read('THIRD_PARTY_LICENSES.md');
  assert.match(notice, /ISC License/);
  assert.match(notice, /Lucide Icons and Contributors/);
});
