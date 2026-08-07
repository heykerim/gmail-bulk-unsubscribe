# Gmail Bulk Unsubscribe

Bulk-unsubscribe from newsletters in Gmail's **Manage subscriptions** view
(`mail.google.com/mail/u/0/#subscriptions`), which has no bulk-select — so
normally you'd click through hundreds of them one at a time.

This tool clicks each sender's *Unsubscribe* button and confirms the popup for
you. It runs entirely in your browser. **Nothing leaves your machine** — no
account access, no OAuth, no server, no third party. Contrast that with hosted
unsubscribe services, which connect to your mailbox and monetize the data.

> ⚠️ **Safety first.** This tool works by driving Gmail's own buttons. It is
> **dry-run by default** — the first run only *shows* what it would do. You have
> to explicitly opt in to actually unsubscribe. Read the code before you run it;
> never paste console code you don't understand (see [Security](#security)).

---

## Four ways to use it

Pick whichever fits. All share the same logic and the same safety defaults.

### 1. Browser extension (best for non-devs — popup UI)

**Install (no store account needed):**

1. On this repo, click the green **Code** button → **Download ZIP**, then unzip.
   (Or use a [release ZIP](https://github.com/heykerim/gmail-bulk-unsubscribe/releases) if one is attached.)
2. **Chrome / Edge / Brave:** go to `chrome://extensions`, turn on
   **Developer mode**, click **Load unpacked**, and select the `extension/`
   folder from the unzip.
3. **Firefox:** go to `about:debugging#/runtime/this-firefox`, click **Load
   Temporary Add-on…**, and pick `extension/manifest.json`.
4. Open **Gmail → Manage subscriptions** and click the extension icon. You get a
   popup with **Preview**, **Unsubscribe all**, **Stop**, and a saved keep-list.

Full details in [`extension/README.md`](extension/README.md). There's no "Add to
Chrome" button because it isn't published to a store (see
[Maintenance](#maintenance)).

### 2. Userscript (one click, most reliable without an extension)

1. Install [Tampermonkey](https://www.tampermonkey.net/) (Chrome/Firefox/Edge/Safari).
2. Create a new script and paste [`bulk-unsubscribe.user.js`](bulk-unsubscribe.user.js).
3. Open **Manage subscriptions**. Three buttons appear bottom-right:
   **Preview** (dry-run), **Unsubscribe all**, **Stop**.

### 3. Console snippet (no install)

1. Open `mail.google.com/mail/u/0/#subscriptions`.
2. Open DevTools console: `Cmd+Option+J` (Mac) / `Ctrl+Shift+J` (Win/Linux).
3. Paste all of [`unsubscribe.js`](unsubscribe.js), press Enter.
4. Preview safely, then commit:
   ```js
   unsubAll();                          // dry-run: logs what it WOULD do
   unsubAll({ dryRun: false, limit: 3 }); // test on 3 for real
   unsubAll({ dryRun: false });         // unsubscribe from all
   stopUnsub();                         // abort a running batch
   ```

### 4. Bookmarklet (one click, no extension)

See [`bookmarklet.md`](bookmarklet.md).

---

## Protecting senders (keep-list)

Some senders you almost certainly want to keep: account **security** notices,
**receipts/orders**, **travel** confirmations. Add substrings of their email
addresses to `KEEP_LIST` at the top of the script:

```js
const KEEP_LIST = [
  'security', 'no-reply@accounts', 'receipt', 'order', 'invoice',
  'instagram.com', 'linkedin.com', 'github.com', 'kiwi.com',
];
```

Any sender whose email contains one of these (case-insensitive) is skipped.

---

## Troubleshooting

**"Found 0 senders."**
- Confirm you're on the `#subscriptions` page, not the inbox or a search.
- Gmail obfuscates and periodically rotates its markup. This tool targets two
  stable, language-independent hooks:
  - Row button: `button[jscontroller="PIVayb"]`
  - Dialog confirm: `button[data-mdc-dialog-action="ok"]`
- If Google rotates `PIVayb`, find the new value: right-click an Unsubscribe
  icon → **Inspect** → read the `jscontroller="..."` on the `<button>`, and
  update the selector. PRs with updated selectors are very welcome.

**It clicks but nothing unsubscribes.**
- You're probably still in dry-run. Pass `{ dryRun: false }`.

**Some senders were skipped ("no dialog appeared").**
- A few senders unsubscribe without a popup, or the dialog was slow. Re-run;
  the skipped ones will be retried.

**Works in English but not another language.**
- It shouldn't matter — the tool does **not** match on the word "Unsubscribe".
  If you hit a locale issue, open an issue with your Gmail language.

---

## How it works

Gmail renders one Unsubscribe icon button per sender row. Clicking it opens a
confirmation dialog with an OK/Unsubscribe button. The script:

1. Collects every row button (`button[jscontroller="PIVayb"]`).
2. Skips any sender matched by `KEEP_LIST`.
3. For each remaining sender: clicks the row button, waits (polls up to 3s) for
   the dialog's `button[data-mdc-dialog-action="ok"]`, clicks it, then pauses
   ~0.9s before the next one.
4. Logs each sender's email and a final `done / kept / skipped` summary.

Note: after unsubscribing, senders can take a few days to actually stop, per
Gmail's own notice. That lag is normal, not a failed unsubscribe.

---

## Security

This is console/userscript code that drives your live Gmail session. That's
also the exact shape of the **"self-XSS"** scam Google warns about when it says
*"Don't paste anything here."* So:

- **Read every line before running.** It's ~150 lines and does one thing.
- It makes **no network requests** and accesses **no** message content — only
  the Unsubscribe buttons on the subscriptions page.
- Never paste a *minified* or obfuscated version someone hands you. If you can't
  read it, don't run it.

---

## Maintenance

This is a community drop, shared as-is. It isn't actively maintained and isn't
published to any extension store. Gmail changes its markup from time to time, so
a selector may eventually need updating — the fix is documented under
[Troubleshooting](#troubleshooting) (find the new `jscontroller` value and
update one line).

**Pull requests welcome**, especially for updated selectors or icons — see
[CONTRIBUTING.md](CONTRIBUTING.md) for the two-minute selector-fix guide. If it
breaks and no PR has fixed it yet, the Troubleshooting section tells you how to
patch it yourself.

---

## Disclaimer

Not affiliated with or endorsed by Google. Gmail is a trademark of Google LLC.
This tool automates clicks on Gmail's own UI and may break when Google changes
that UI. Use at your own risk; unsubscribing cannot be undone.

## Credits

Extension icon is the `mail-x` glyph from [Lucide](https://lucide.dev)
(ISC License).

## License

[MIT](LICENSE)
