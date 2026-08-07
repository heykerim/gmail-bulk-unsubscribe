# Contributing

This is an unmaintained community project, shared as-is. It still very much
welcomes contributions — especially since Gmail changes its markup over time.

## The most common fix: a broken selector

Gmail rotates its obfuscated attributes without notice. When the tool suddenly
finds 0 senders, it's almost always because the row button's `jscontroller`
value changed. To fix:

1. Open Gmail → **Manage subscriptions**.
2. Right-click an Unsubscribe icon → **Inspect**.
3. On the highlighted `<button>`, read the `jscontroller="..."` value.
4. Update the selector in all four places it appears:
   - `unsubscribe.js`
   - `bulk-unsubscribe.user.js`
   - `extension/content.js`
   - the `README.md` troubleshooting note
5. Open a PR with the old → new value in the description. That's it.

The dialog confirm button uses `data-mdc-dialog-action="ok"`, which has been
stable; you usually won't need to touch it.

## Ground rules

- **No new permissions** in the extension without a strong reason — minimal
  permissions are a feature here.
- **No network calls.** The whole pitch is that nothing leaves the browser.
- Keep it readable. People are pasting this into their own console; obfuscated
  or minified code defeats the point.

## Reporting a break

Open an issue with your browser, Gmail language, and what the console/popup
showed (e.g. "Found 0 senders"). A screenshot of the Inspected button helps a
lot. No guarantee of a fix — but a good report makes a community PR easy.
