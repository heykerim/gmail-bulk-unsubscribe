// ==UserScript==
// @name         Gmail Bulk Unsubscribe
// @namespace    https://github.com/heykerim/gmail-bulk-unsubscribe
// @version      1.0.0
// @description  Adds a "Bulk unsubscribe" button to Gmail's Manage subscriptions page. Dry-run by default.
// @author       Kerim
// @match        https://mail.google.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  // ---- config ----
  const KEEP_LIST = [
    // substrings of sender emails to PROTECT (case-insensitive), e.g.:
    // 'instagram.com', 'linkedin.com', 'github.com', 'security', 'receipt',
  ];
  const DELAY_MS = 900;
  const DIALOG_TIMEOUT_MS = 3000;

  let cancelled = false;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const onSubsPage = () => location.hash.includes('subscriptions');

  const getRowButtons = () =>
    [...document.querySelectorAll('button[jscontroller="PIVayb"]')];
  const senderEmail = (btn) =>
    btn.closest('[data-email]')?.dataset.email || '(unknown)';
  const isKept = (email) =>
    KEEP_LIST.some((k) => email.toLowerCase().includes(k.toLowerCase()));

  async function waitForDialogOk() {
    const start = Date.now();
    while (Date.now() - start < DIALOG_TIMEOUT_MS) {
      const ok = document.querySelector('button[data-mdc-dialog-action="ok"]');
      if (ok) return ok;
      await sleep(150);
    }
    return null;
  }

  async function run({ dryRun }) {
    cancelled = false;
    const all = getRowButtons();
    if (!all.length) {
      alert('Found 0 senders. Are you on the Manage subscriptions page?');
      return;
    }
    if (!dryRun) {
      const ok = confirm(
        `Unsubscribe from ${all.length} senders?\n\n` +
          `${KEEP_LIST.length} keep-list rule(s) active. This cannot be undone.`
      );
      if (!ok) return;
    }

    let done = 0, kept = 0, skipped = 0;
    for (const btn of all) {
      if (cancelled) break;
      const email = senderEmail(btn);
      if (isKept(email)) { kept++; console.log(`⏭ kept: ${email}`); continue; }
      if (dryRun) { done++; console.log(`○ would unsubscribe: ${email}`); continue; }

      btn.scrollIntoView({ block: 'center' });
      btn.click();
      const okBtn = await waitForDialogOk();
      if (okBtn) { okBtn.click(); done++; console.log(`✔ ${done}. ${email}`); }
      else {
        skipped++; console.log(`⚠ skipped: ${email}`);
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      }
      await sleep(DELAY_MS);
    }
    const msg = `${dryRun ? 'Would unsubscribe' : 'Unsubscribed'} ${done}, kept ${kept}, skipped ${skipped}.`;
    console.log(`%c${msg}`, 'color:#0a0;font-size:14px');
    if (!dryRun) alert(msg);
  }

  function injectButton() {
    if (!onSubsPage() || document.getElementById('gbu-btn')) return;

    const bar = document.createElement('div');
    bar.id = 'gbu-btn';
    bar.style.cssText =
      'position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;' +
      'gap:8px;font-family:Roboto,Arial,sans-serif;';

    const mk = (label, bg, handler) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText =
        `background:${bg};color:#fff;border:none;border-radius:8px;` +
        'padding:10px 14px;font-size:13px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.3);';
      b.onclick = handler;
      return b;
    };

    bar.appendChild(mk('Preview', '#5f6368', () => run({ dryRun: true })));
    bar.appendChild(mk('Unsubscribe all', '#c5221f', () => run({ dryRun: false })));
    bar.appendChild(mk('Stop', '#3c4043', () => { cancelled = true; }));
    document.body.appendChild(bar);
  }

  // Gmail is a SPA; re-check on hash changes and periodically.
  window.addEventListener('hashchange', injectButton);
  setInterval(injectButton, 1500);
  injectButton();
})();
