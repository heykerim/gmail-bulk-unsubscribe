# Gmail Bulk Unsubscribe

Bulk-unsubscribe from newsletters in Gmail's **Manage subscriptions** view
(`mail.google.com/mail/u/0/#sub`), which has no bulk-select — so normally you'd
click through hundreds of them one at a time.

This tool clicks each sender's *Unsubscribe* button and confirms the popup for
you. The unsubscribe logic runs in your browser: **no Gmail message content,
account credentials, or OAuth tokens are sent anywhere**. The extension,
userscript, and console versions add no third-party requests. The bookmarklet
retrieves the public script from `raw.githubusercontent.com` when launched, but
it does not send Gmail data back to GitHub.

> ⚠️ **Safety first.** This tool works by driving Gmail's own buttons. It is
> **dry-run by default** — the first run only *shows* what it would do. You have
> to explicitly opt in to actually unsubscribe. Read the code before you run it;
> never paste console code you don't understand (see [Security](#security)).

---

## Four ways to use it

Pick whichever fits. All share the same logic and the same safety defaults.

### 1. Browser extension (best for non-devs — popup UI)

**Install manually:**

1. On this repo, click the green **Code** button → **Download ZIP**, then unzip.
   (Or use a [release ZIP](https://github.com/heykerim/gmail-bulk-unsubscribe/releases) if one is attached.)
2. **Chrome / Edge / Brave:** go to `chrome://extensions`, turn on
   **Developer mode**, click **Load unpacked**, and select the `extension/`
   folder from the unzip.
3. **Firefox:** go to `about:debugging#/runtime/this-firefox`, click **Load
   Temporary Add-on…**, and pick `extension/manifest.json`.
4. Open **Gmail → Manage subscriptions** and click the extension icon. You get a
   popup with **Preview**, **Unsubscribe all**, **Stop**, and a saved keep-list.

Full details are in [`extension/README.md`](extension/README.md). Chrome Web
Store submission material is in [`CHROME_WEB_STORE.md`](CHROME_WEB_STORE.md);
until the store listing is live, use the manual install above.

### 2. Userscript (one click, most reliable without an extension)

1. Install [Tampermonkey](https://www.tampermonkey.net/) (Chrome/Firefox/Edge/Safari).
2. Create a new script and paste [`bulk-unsubscribe.user.js`](bulk-unsubscribe.user.js).
3. Open **Manage subscriptions**. Three buttons appear bottom-right:
   **Preview** (dry-run), **Unsubscribe all**, **Stop**.

### 3. Console snippet (no install)

1. Open `mail.google.com/mail/u/0/#sub`.
2. Open DevTools console: `Cmd+Option+J` (Mac) / `Ctrl+Shift+J` (Win/Linux).
3. Paste all of [`unsubscribe.js`](unsubscribe.js), press Enter.
4. Preview safely, then commit:
   ```js
   unsubAll();                            // dry-run: logs what it WOULD do
   unsubAll({ dryRun: false, limit: 3 }); // test on 3 for real
   unsubAll({ dryRun: false });           // unsubscribe from all
   stopUnsub();                           // abort a running batch
   ```

### 4. Bookmarklet (one click, no extension)

See [`bookmarklet.md`](bookmarklet.md). The v1 bookmarklet downloads the public
`unsubscribe.js` from the immutable `v1.0.0` tag when clicked, then
automatically runs the safe preview.

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
The extension stores its keep-list locally in browser extension storage.

---

## Troubleshooting

**"Found 0 senders."**
- Confirm you're on **Gmail → Manage subscriptions** (currently `#sub`), not the
  inbox or a search. The extension/userscript also recognize the older
  `#subscriptions` route and treat actual unsubscribe rows as page evidence, so
  a future route rename alone should not disable them.
- Gmail obfuscates and periodically rotates its markup. This tool targets two
  language-independent hooks:
  - Row button: `button[jscontroller="PIVayb"]`
  - Dialog confirm: `button[data-mdc-dialog-action="ok"]`
- If Google rotates `PIVayb`, find the new value: right-click an Unsubscribe
  icon → **Inspect** → read the `jscontroller="..."` on the `<button>`, and
  update the selector. PRs with updated selectors are very welcome.

**It clicks but nothing unsubscribes.**
- You're probably still in dry-run. Pass `{ dryRun: false }`.

**Some senders were skipped ("no visible dialog appeared").**
- A few senders may behave differently, or Gmail may have been slow to render
  the confirmation dialog. Re-run; skipped senders can be retried.

**Works in English but not another language.**
- It shouldn't matter — the tool does **not** match on the word "Unsubscribe".
  If you hit a locale issue, open an issue with your Gmail language.

---

## How it works

Gmail renders one Unsubscribe icon button per sender row. Clicking it opens a
confirmation dialog with an OK/Unsubscribe button. The script:

1. Collects the current sender identities from
   `button[jscontroller="PIVayb"]`.
2. Skips any sender matched by `KEEP_LIST`.
3. Re-resolves each sender's row button immediately before clicking it, so a
   Gmail rerender does not leave the tool holding a stale DOM node.
4. Waits (polls up to 3s) for a **visible**
   `button[data-mdc-dialog-action="ok"]`, clicks it, then pauses ~0.9s before the
   next sender.
5. Rejects a second batch while one is already running and logs a final
   `done / kept / skipped` summary.

Note: after unsubscribing, senders can take a few days to actually stop, per
Gmail's own notice. That lag is normal, not a failed unsubscribe.

---

## Security

This is console/userscript code that drives your live Gmail session. That's
also the exact shape of the **"self-XSS"** scam Google warns about when it says
*"Don't paste anything here."* So:

- **Read every line before running.** It's deliberately kept readable.
- The unsubscribe logic accesses no message content and sends no Gmail/account
  data anywhere. The extension/userscript/console versions add no third-party
  requests. The bookmarklet makes one request to `raw.githubusercontent.com`
  to retrieve the tagged public `unsubscribe.js` before running the same logic.
- Never paste a *minified* or obfuscated version someone hands you. If you can't
  read it, don't run it.

See [`PRIVACY.md`](PRIVACY.md) for the packaged extension's privacy policy.

---

## Maintenance

This project is **maintained as a small open-source utility** with regression
checks for the Gmail selectors, popup behavior, manifest, and extension icons.
Gmail can still change its markup without notice, so a selector may eventually
need updating — the fix is documented under [Troubleshooting](#troubleshooting).

**Pull requests welcome**, especially for updated selectors or browser fixes —
see [CONTRIBUTING.md](CONTRIBUTING.md) for the two-minute selector-fix guide. If
it breaks and no PR has fixed it yet, the Troubleshooting section tells you how
to patch it yourself.

---

## Disclaimer

Not affiliated with or endorsed by Google. Gmail is a trademark of Google LLC.
This tool automates clicks on Gmail's own UI and may break when Google changes
that UI. Use at your own risk; unsubscribing cannot be undone.

## Icon

The browser extension uses the custom `@` artwork in
`extension/icons/icon-source.png`, with 16/32/48/128 px PNG exports for browser
manifests.

## License

[MIT](LICENSE)
