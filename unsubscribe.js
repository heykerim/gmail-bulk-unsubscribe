// ============================================================================
// gmail-bulk-unsubscribe — console version
// ----------------------------------------------------------------------------
// Bulk-unsubscribe from senders in Gmail's "Manage subscriptions" view
// (https://mail.google.com/mail/u/0/#subscriptions), which has no bulk-select.
//
// HOW IT WORKS
//   Each sender row has an "Unsubscribe" icon button. Clicking it opens a
//   confirmation dialog with an "Unsubscribe" button. This script clicks the
//   row button, waits for the dialog, then clicks confirm — one sender at a
//   time, with a delay, logging each sender's email as it goes.
//
// SAFETY
//   - Runs in DRY-RUN by default: it only LOGS what it would do. Nothing is
//     unsubscribed until you pass { dryRun: false }.
//   - KEEP_LIST lets you protect senders (security, receipts, travel, etc.).
//   - stopUnsub() aborts a run at any time.
//
// SELECTORS (why this keeps working across locales)
//   Gmail's class names are obfuscated and rotate, and the button LABELS are
//   translated per locale ("Abbestellen", "Odhlásiť", ...). So we do NOT match
//   on visible text. We match on stable, language-independent hooks:
//     - Row button:   button[jscontroller="PIVayb"]
//     - Dialog OK:     button[data-mdc-dialog-action="ok"]
//   If Google rotates "PIVayb", update it here (see README troubleshooting).
// ============================================================================

(() => {
  'use strict';

  // --- Configuration ---------------------------------------------------------
  const KEEP_LIST = [
    // Add substrings of sender emails to PROTECT. Case-insensitive.
    // Examples of senders people usually regret unsubscribing from:
    // 'instagram.com', 'linkedin.com', 'github.com', 'kiwi.com',
    // 'no-reply', 'security', 'receipt', 'invoice', 'order',
  ];

  const DELAY_MS = 900;   // pause between senders (be gentle; avoids throttling)
  const DIALOG_TIMEOUT_MS = 3000;

  // --- Internal state --------------------------------------------------------
  let cancelled = false;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function getRowButtons() {
    // One icon button per sender. Avoids the duplicate text-button that shares
    // the same aria-label.
    return [...document.querySelectorAll('button[jscontroller="PIVayb"]')];
  }

  function senderEmail(btn) {
    return btn.closest('[data-email]')?.dataset.email || '(unknown)';
  }

  function isKept(email) {
    const e = email.toLowerCase();
    return KEEP_LIST.some((k) => e.includes(k.toLowerCase()));
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

  function dismissStrayDialog() {
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );
  }

  // --- Public API ------------------------------------------------------------
  window.stopUnsub = () => {
    cancelled = true;
    console.log('%cStopping after the current sender…', 'color:#c00');
  };

  /**
   * @param {Object}  [opts]
   * @param {boolean} [opts.dryRun=true]  When true, only logs. Set false to act.
   * @param {number}  [opts.limit]        Only process the first N senders.
   */
  window.unsubAll = async function unsubAll(opts = {}) {
    const { dryRun = true, limit } = opts;
    cancelled = false;

    const all = getRowButtons();
    if (!all.length) {
      console.log(
        '%cFound 0 unsubscribe buttons.',
        'color:#c00;font-size:14px'
      );
      console.log(
        'Make sure you are on the Manage subscriptions page ' +
          '(#subscriptions). If you are and it still says 0, Gmail may have ' +
          'changed its markup — see the README troubleshooting section.'
      );
      return;
    }

    const list = limit ? all.slice(0, limit) : all;

    console.log(
      `%cFound ${all.length} senders. Processing ${list.length}.` +
        (dryRun ? '  [DRY RUN — nothing will be unsubscribed]' : ''),
      'color:#0a0;font-size:14px'
    );
    if (dryRun) {
      console.log(
        '%cThis is a preview. To actually unsubscribe, run:  ' +
          'unsubAll({ dryRun: false })',
        'color:#a60'
      );
    }

    let done = 0, kept = 0, skipped = 0;

    for (const btn of list) {
      if (cancelled) break;
      const email = senderEmail(btn);

      if (isKept(email)) {
        kept++;
        console.log(`  ⏭  kept (in KEEP_LIST): ${email}`);
        continue;
      }

      if (dryRun) {
        done++;
        console.log(`  ○ would unsubscribe: ${email}`);
        continue;
      }

      btn.scrollIntoView({ block: 'center' });
      btn.click();

      const ok = await waitForDialogOk();
      if (ok) {
        ok.click();
        done++;
        console.log(`  ✔ ${done}. ${email}`);
      } else {
        skipped++;
        console.log(`  ⚠ skipped (no dialog appeared): ${email}`);
        dismissStrayDialog();
      }
      await sleep(DELAY_MS);
    }

    const verb = dryRun ? 'Would unsubscribe' : 'Unsubscribed';
    console.log(
      `%cDone. ${verb} ${done}, kept ${kept}, skipped ${skipped}.` +
        (cancelled ? ' (stopped early)' : ''),
      'color:#0a0;font-size:14px'
    );
  };

  console.log(
    '%cgmail-bulk-unsubscribe loaded.',
    'color:#0a0;font-weight:bold'
  );
  console.log('Preview (safe):     unsubAll()');
  console.log('Test on 3:          unsubAll({ dryRun: false, limit: 3 })');
  console.log('Unsubscribe all:    unsubAll({ dryRun: false })');
  console.log('Abort a run:        stopUnsub()');
  console.log('Protect senders:    edit KEEP_LIST at the top of the script.');
})();
