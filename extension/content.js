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
  let running = false;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const getRowButtons = () =>
    [...document.querySelectorAll('button[jscontroller="PIVayb"]')];
  const senderEmail = (btn) =>
    btn.closest('[data-email]')?.dataset.email || '(unknown)';

  function isVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden'
    );
  }

  function isKept(email, keepList) {
    const e = email.toLowerCase();
    return keepList.some((k) => k && e.includes(k.toLowerCase()));
  }

  function findRowButtonByEmail(email) {
    return getRowButtons().find((btn) => senderEmail(btn) === email) || null;
  }

  async function waitForDialogOk() {
    const start = Date.now();
    while (Date.now() - start < DIALOG_TIMEOUT_MS) {
      const ok = [...document.querySelectorAll('button[data-mdc-dialog-action="ok"]')]
        .find(isVisible);
      if (ok) return ok;
      await sleep(150);
    }
    return null;
  }

  function dismissStrayDialog() {
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );
  }

  function report(sendProgress, payload) {
    try { sendProgress(payload); } catch (_) { /* popup may be closed */ }
  }

  async function run({ dryRun, keepList }, sendProgress) {
    cancelled = false;
    const initialButtons = getRowButtons();
    if (!initialButtons.length) {
      report(sendProgress, {
        type: 'error',
        message: 'Found 0 senders. Open the Manage subscriptions page (#subscriptions).',
      });
      return;
    }

    // Keep a stable list of sender identities, but re-resolve each row button
    // before clicking. Gmail can rerender the list after every unsubscribe.
    const targets = initialButtons.map((btn) => ({ email: senderEmail(btn), fallback: btn }));

    report(sendProgress, { type: 'start', total: targets.length, dryRun });
    let done = 0, kept = 0, skipped = 0;

    for (const target of targets) {
      if (cancelled) break;
      const { email } = target;

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

      const btn = email === '(unknown)'
        ? target.fallback
        : findRowButtonByEmail(email);

      if (!btn) {
        skipped++;
        report(sendProgress, {
          type: 'progress',
          status: 'skipped',
          email,
          reason: 'row disappeared after Gmail rerendered',
        });
        continue;
      }

      try {
        btn.scrollIntoView({ block: 'center' });
        btn.click();
        const ok = await waitForDialogOk();
        if (ok) {
          ok.click();
          done++;
          report(sendProgress, { type: 'progress', status: 'done', email });
        } else {
          skipped++;
          report(sendProgress, {
            type: 'progress',
            status: 'skipped',
            email,
            reason: 'no visible confirmation dialog appeared',
          });
          dismissStrayDialog();
        }
      } catch (error) {
        skipped++;
        report(sendProgress, {
          type: 'progress',
          status: 'skipped',
          email,
          reason: error?.message || 'unexpected error',
        });
        dismissStrayDialog();
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
      return;
    }
    if (msg.cmd === 'stop') {
      cancelled = true;
      sendResponse({ ok: true, running });
      return;
    }
    if (msg.cmd === 'run') {
      if (running) {
        sendResponse({ started: false, reason: 'running' });
        return;
      }

      running = true;
      run(msg.opts, (payload) => chrome.runtime.sendMessage({ from: 'content', payload }))
        .catch((error) => {
          report(
            (payload) => chrome.runtime.sendMessage({ from: 'content', payload }),
            { type: 'error', message: error?.message || 'Unexpected unsubscribe error.' }
          );
        })
        .finally(() => { running = false; });

      sendResponse({ started: true });
      return;
    }
  });
})();
