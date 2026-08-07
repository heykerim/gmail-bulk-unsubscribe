// content.js — runs on mail.google.com. Holds the unsubscribe logic and
// listens for messages from the popup. Uses stable, locale-independent
// selectors (not the word "Unsubscribe").

(() => {
  'use strict';
  if (window.__gbuLoaded) return;
  window.__gbuLoaded = true;

  const DELAY_MS = 900;
  const DIALOG_TIMEOUT_MS = 3000;
  let cancelled = false;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const getRowButtons = () =>
    [...document.querySelectorAll('button[jscontroller="PIVayb"]')];
  const senderEmail = (btn) =>
    btn.closest('[data-email]')?.dataset.email || '(unknown)';

  function isKept(email, keepList) {
    const e = email.toLowerCase();
    return keepList.some((k) => k && e.includes(k.toLowerCase()));
  }

  async function waitForDialogOk() {
    const start = Date.now();
    while (Date.now() - start < DIALOG_TIMEOUT_MS) {
      const ok = document.querySelector('button[data-mdc-dialog-action="ok"]');
      if (ok) return ok;
      await sleep(150);
    }
    return null;
  }

  function report(sendProgress, payload) {
    try { sendProgress(payload); } catch (_) { /* popup may be closed */ }
  }

  async function run({ dryRun, keepList }, sendProgress) {
    cancelled = false;
    const all = getRowButtons();
    if (!all.length) {
      report(sendProgress, { type: 'error', message: 'Found 0 senders. Open the Manage subscriptions page (#subscriptions).' });
      return;
    }

    report(sendProgress, { type: 'start', total: all.length, dryRun });
    let done = 0, kept = 0, skipped = 0;

    for (const btn of all) {
      if (cancelled) break;
      const email = senderEmail(btn);

      if (isKept(email, keepList)) {
        kept++;
        report(sendProgress, { type: 'progress', status: 'kept', email });
        continue;
      }
      if (dryRun) {
        done++;
        report(sendProgress, { type: 'progress', status: 'would', email });
        continue;
      }

      btn.scrollIntoView({ block: 'center' });
      btn.click();
      const ok = await waitForDialogOk();
      if (ok) {
        ok.click();
        done++;
        report(sendProgress, { type: 'progress', status: 'done', email });
      } else {
        skipped++;
        report(sendProgress, { type: 'progress', status: 'skipped', email });
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      }
      await sleep(DELAY_MS);
    }

    report(sendProgress, {
      type: 'done', done, kept, skipped, dryRun, stopped: cancelled,
    });
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.cmd === 'count') {
      sendResponse({ count: getRowButtons().length, onPage: location.hash.includes('subscriptions') });
      return; // sync response
    }
    if (msg.cmd === 'stop') {
      cancelled = true;
      sendResponse({ ok: true });
      return;
    }
    if (msg.cmd === 'run') {
      // Stream progress back via runtime messages; ack immediately.
      run(msg.opts, (payload) => chrome.runtime.sendMessage({ from: 'content', payload }));
      sendResponse({ started: true });
      return;
    }
  });
})();
