# Browser extension (Manifest V3)

One-click Gmail bulk-unsubscribe with a popup UI: **Preview (dry-run)**,
**Unsubscribe all**, **Stop**, and an editable keep-list that's saved between
sessions. Works in Chrome, Edge, Brave, and Firefox (109+).

## Files

| File | Role |
|---|---|
| `manifest.json` | MV3 manifest (Chrome + Firefox via `browser_specific_settings`) |
| `content.js` | Runs on Gmail; holds the unsubscribe logic; talks to the popup |
| `popup.html` / `popup.css` / `popup.js` | The toolbar popup UI |
| `icons/` | Toolbar icons (see note below) |

## Load it unpacked (for testing / personal use)

### Chrome / Edge / Brave
1. Go to `chrome://extensions`.
2. Toggle **Developer mode** (top right).
3. Click **Load unpacked** and select this `extension/` folder.
4. Pin the extension, open **Gmail → Manage subscriptions**, click the icon.

### Firefox
1. Go to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…** and pick `manifest.json`.
3. (Temporary add-ons unload on restart; that's expected for dev.)

## Icons

This folder needs `icon16.png`, `icon48.png`, and `icon128.png`. They're not
committed (binary). Drop in any simple mail/slash icon at those sizes, or the
extension still loads with a default icon if you remove the `icons` / `action.default_icon`
keys from `manifest.json`.

## How it works

The popup sends a message to `content.js`, which finds each sender's row button
(`button[jscontroller="PIVayb"]`), clicks it, waits for the confirmation
dialog's `button[data-mdc-dialog-action="ok"]`, clicks it, and streams progress
back to the popup. Keep-list entries (substrings of sender emails) are skipped.
Dry-run mode only reports; it changes nothing.

## Publishing to the stores (optional, later)

- **Chrome Web Store:** one-time $5 developer fee, zip this folder, upload,
  fill listing, submit for review.
- **Firefox Add-ons (AMO):** free, upload the zip, automated + human review.
  A signed `.xpi` is required for permanent install.

Both stores scrutinize permissions. This extension only requests `scripting`,
`activeTab`, `storage`, and host access to `mail.google.com` — keep it that
minimal to speed review.
