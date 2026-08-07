# Browser extension (Manifest V3)

One-click Gmail bulk-unsubscribe with a popup UI: **Preview (dry-run)**,
**Unsubscribe all**, **Stop**, and an editable keep-list that's saved between
sessions. Works in Chrome, Edge, Brave, and Firefox (109+).

## Install

Not on the Chrome Web Store / Firefox Add-ons yet, so install it manually — it
takes about a minute:

1. **Download the code.** On the
   [repo home](https://github.com/heykerim/gmail-bulk-unsubscribe), click the
   green **Code** button → **Download ZIP**, then unzip it. (Or `git clone` it.)
2. **Load the `extension/` folder** using the steps for your browser below.

### Chrome / Edge / Brave
1. Go to `chrome://extensions`.
2. Toggle **Developer mode** (top right).
3. Click **Load unpacked** and select the `extension/` folder from the unzipped
   download.
4. Pin the extension, open **Gmail → Manage subscriptions**, click the icon.

### Firefox
1. Go to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…** and pick `manifest.json` inside `extension/`.
3. (Temporary add-ons unload on restart; that's expected until it's signed on
   AMO.)

> No "Add to Chrome" button exists yet because the extension isn't published to
> a store. Once it is, this section will link straight to the listing.

## Files

| File | Role |
|---|---|
| `manifest.json` | MV3 manifest (Chrome + Firefox via `browser_specific_settings`) |
| `content.js` | Runs on Gmail; holds the unsubscribe logic; talks to the popup |
| `popup.html` / `popup.css` / `popup.js` | The toolbar popup UI |
| `icons/` | Toolbar icons (see note below) |

## Icons

Ships with `icons/icon.svg` — the [Lucide](https://lucide.dev) `mail-x` glyph
(ISC License), which Chrome and Firefox MV3 accept directly, so no PNG export is
needed. To use your own icon, replace `icon.svg` (or point the `icons` /
`action.default_icon` keys in `manifest.json` at your own PNGs). Removing those
keys entirely makes the extension load with the browser's default icon.

> Chrome shows a console note preferring raster icons for the toolbar; the SVG
> still renders. If you want pixel-perfect toolbar icons, export `icon.svg` to
> `icon16.png` / `icon48.png` / `icon128.png` and update the manifest.

## How it works

The popup sends a message to `content.js`, which finds each sender's row button
(`button[jscontroller="PIVayb"]`), clicks it, waits for the confirmation
dialog's `button[data-mdc-dialog-action="ok"]`, clicks it, and streams progress
back to the popup. Keep-list entries (substrings of sender emails) are skipped.
Dry-run mode only reports; it changes nothing.

---

## Maintainer notes — publishing to the stores (not needed to use the extension)

These steps are for whoever maintains/forks this project, not end users:

- **Chrome Web Store:** one-time $5 developer fee, zip this folder, upload,
  fill listing, submit for review.
- **Firefox Add-ons (AMO):** free, upload the zip, automated + human review.
  A signed `.xpi` is required for permanent install.

Both stores scrutinize permissions. This extension only requests `scripting`,
`activeTab`, `storage`, and host access to `mail.google.com` — keep it that
minimal to speed review.

