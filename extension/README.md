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
| `icons/icon16.png` / `icon32.png` / `icon48.png` / `icon128.png` | Raster toolbar/extension icons |
| `icons/icon.svg` | Lucide source artwork kept for future icon exports |

## Icons

The manifest uses PNG icons at 16, 32, 48, and 128 px for Chromium
compatibility. `icons/icon.svg` is kept as the editable source artwork, but it
is not referenced by the manifest because Chromium extension manifests do not
support SVG files for declared extension icons.

The artwork is the [Lucide](https://lucide.dev) `mail-x` glyph. See
[`../THIRD_PARTY_LICENSES.md`](../THIRD_PARTY_LICENSES.md) for its ISC license
notice.

## How it works

The popup sends a message to `content.js`, which collects sender identities from
`button[jscontroller="PIVayb"]`, then re-resolves each sender's row button before
clicking it. That avoids stale DOM nodes if Gmail rerenders the list after an
unsubscribe. It waits for a **visible** confirmation dialog button
(`button[data-mdc-dialog-action="ok"]`), clicks it, and streams progress back to
the popup. Keep-list entries (substrings of sender emails) are skipped. Dry-run
mode only reports; it changes nothing.

Only one run can be active at a time. While a batch is running, Preview and
Unsubscribe all are disabled and Stop is enabled.

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
