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

function loadContentScript({ getRows, getDialogs, now, hash = '#subscriptions' } = {}) {
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
    location: { hash },
    KeyboardEvent: class KeyboardEvent {},
    getComputedStyle: () => ({ display: 'block', visibility: 'visible' }),
    Date: DateShim,
    setTimeout: (fn) => setImmediate(fn),
    console,
  };

  vm.runInNewContext(read('extension/content.js'), context, { filename: 'extension/content.js' });
  return { listener, progress, done };
}

function loadUserscript({ getRows, hash = '#sub' } = {}) {
  let appended = 0;
  const makeElement = () => ({
    style: {},
    appendChild() {},
    onclick: null,
    textContent: '',
    id: '',
  });

  const document = {
    querySelectorAll(selector) {
      if (selector === 'button[jscontroller="PIVayb"]') return getRows ? getRows() : [];
      return [];
    },
    getElementById() { return null; },
    createElement: makeElement,
    body: {
      appendChild() { appended += 1; },
      dispatchEvent() {},
    },
  };

  const context = {
    window: { addEventListener() {} },
    document,
    location: { hash },
    setInterval() {},
    setTimeout: (fn) => setImmediate(fn),
    alert() {},
    confirm() { return false; },
    KeyboardEvent: class KeyboardEvent {},
    getComputedStyle: () => ({ display: 'block', visibility: 'visible' }),
    console,
  };

  vm.runInNewContext(read('bulk-unsubscribe.user.js'), context, { filename: 'bulk-unsubscribe.user.js' });
  return { appended: () => appended };
}

test('Manifest declares PNG toolbar icons for Chromium', () => {
  const manifest = JSON.parse(read('extension/manifest.json'));
  const declared = JSON.stringify({ icons: manifest.icons, action: manifest.action?.default_icon });
  assert.doesNotMatch(declared, /\.svg/i);
  assert.match(declared, /icon16\.png/);
  assert.match(declared, /icon32\.png/);
  assert.match(declared, /icon48\.png/);
  assert.match(declared, /icon128\.png/);
});

test('Custom @ icon source is preserved and old Lucide SVG is gone', () => {
  assert.equal(fs.existsSync(path.join(root, 'extension/icons/icon-source.png')), true);
  assert.equal(fs.existsSync(path.join(root, 'extension/icons/icon.svg')), false);
});

test('Content script recognizes Gmail current #sub route', () => {
  const row = makeRowButton('one@example.com');
  const { listener } = loadContentScript({ getRows: () => [row], hash: '#sub' });
  let response;

  listener({ cmd: 'count' }, null, (r) => { response = r; });

  assert.equal(response?.onPage, true);
  assert.equal(response?.count, 1);
});

test('Content script treats unsubscribe rows as page evidence even if Gmail renames the route', () => {
  const row = makeRowButton('one@example.com');
  const { listener } = loadContentScript({ getRows: () => [row], hash: '#future-route-name' });
  let response;

  listener({ cmd: 'count' }, null, (r) => { response = r; });

  assert.equal(response?.onPage, true);
  assert.equal(response?.count, 1);
});

test('Userscript shows controls on #sub and relies on rows if the route changes again', () => {
  const row = makeRowButton('one@example.com');
  const onCurrentRoute = loadUserscript({ getRows: () => [row], hash: '#sub' });
  const onFutureRoute = loadUserscript({ getRows: () => [row], hash: '#future-route-name' });

  assert.equal(onCurrentRoute.appended(), 1);
  assert.equal(onFutureRoute.appended(), 1);
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

test('Popup matches the approved 480 by 600 reference geometry', () => {
  const css = read('extension/popup.css');

  assert.match(css, /html,\s*body\s*{[^}]*width:\s*480px[^}]*height:\s*600px/s);
  assert.match(css, /\.popup-card\s*{[^}]*width:\s*468px[^}]*height:\s*588px[^}]*margin:\s*6px/s);
  assert.match(css, /\.popup-card\s*{[^}]*border-radius:\s*24px/s);
  assert.match(css, /background:\s*transparent/);
});

test('Popup uses bundled Clarity City fonts and global minus 0.02em tracking', () => {
  const css = read('extension/popup.css');
  const popup = read('extension/popup.js');
  const medium = Buffer.from(
    read('extension/fonts/medium.b64').trim() + read('extension/fonts/medium.b64.2').trim(),
    'base64'
  );
  const semibold = Buffer.from(
    read('extension/fonts/semibold.b64').trim() + read('extension/fonts/semibold.b64.2').trim(),
    'base64'
  );

  assert.match(css, /font-family:\s*"Clarity City"/);
  assert.match(css, /letter-spacing:\s*-0\.02em/);
  assert.match(popup, /new FontFace\(['"]Clarity City['"]/);
  assert.match(popup, /fonts\/medium\.b64\.2/);
  assert.match(popup, /fonts\/semibold\.b64\.2/);
  assert.equal(medium.subarray(0, 4).toString(), 'wOF2');
  assert.equal(semibold.subarray(0, 4).toString(), 'wOF2');
  assert.equal(medium.length, 8640);
  assert.equal(semibold.length, 8736);
});

test('Popup preserves the approved copy word for word', () => {
  const html = read('extension/popup.html');

  for (const copy of [
    'Bulk Unsubscribe',
    'Protect senders',
    'One per line. Use email substrings.',
    'Any sender whose email contains one of these is skipped.',
    'Preview senders',
    'Unsubscribe all',
    'Stop',
    'Private by default. Runs entirely in your browser.',
  ]) {
    assert.match(html, new RegExp(copy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('Popup results stay hidden by default and are revealed by popup logic', () => {
  const html = read('extension/popup.html');
  const popup = read('extension/popup.js');

  assert.match(html, /id="resultsPanel"[^>]*class="results is-hidden"/);
  assert.match(popup, /classList\.remove\(['"]is-hidden['"]\)/);
  assert.match(popup, /classList\.add\(['"]is-hidden['"]\)/);
});

test('Popup has the approved dynamic status messages', () => {
  const popup = read('extension/popup.js');

  assert.match(popup, /Open Gmail to use this\./);
  assert.match(popup, /Open Manage subscriptions to use this\./);
  assert.match(popup, /sender.*found\./s);
  assert.match(popup, /Previewing/);
  assert.match(popup, /Unsubscribing/);
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
