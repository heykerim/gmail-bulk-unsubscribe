# Bookmarklet install

A bookmarklet is a bookmark whose URL is JavaScript. Click it while on Gmail's
**Manage subscriptions** page and it loads the tool from GitHub, then runs the
safe preview (`unsubAll()`). It does **not** unsubscribe anything on its own —
you still explicitly run `unsubAll({ dryRun: false })` in the console to act.

## Install (drag-and-drop)

1. Show your bookmarks bar (Chrome/Edge: `Cmd/Ctrl+Shift+B`).
2. Create a new bookmark. Name it **Gmail Bulk Unsubscribe**.
3. Paste the line below as the bookmark's **URL**.
4. Go to `https://mail.google.com/mail/u/0/#sub`, click the bookmark.
5. Open the console (`Cmd/Ctrl+Option/Alt+J`) to see the preview and run
   `unsubAll({ dryRun: false })` when you're ready.

## Bookmarklet URL

> Replace the username in the URL below if you fork this. It retrieves the
> public `unsubscribe.js` file from the immutable `v1.0.0` release tag when you
> click the bookmark, so a future change to `main` cannot silently change a v1
> bookmarklet install.

```
javascript:(function(){var s=document.createElement('script');s.src='https://raw.githubusercontent.com/heykerim/gmail-bulk-unsubscribe/v1.0.0/unsubscribe.js';s.onload=function(){unsubAll();s.remove();};s.onerror=function(){console.error('Gmail Bulk Unsubscribe: GitHub script load was blocked. Use the console or userscript method instead.');};document.body.appendChild(s);})();
```

### Privacy and Content-Security-Policy

The bookmarklet makes one third-party request to `raw.githubusercontent.com` to
retrieve the public script. It does **not** upload Gmail data, message content,
credentials, or OAuth tokens to GitHub (or anywhere else).

Gmail's Content-Security-Policy may block loading that external script. If the
bookmarklet does nothing, fall back to the **console snippet** (copy
`unsubscribe.js` and paste it directly). The userscript version (Tampermonkey)
is the most reliable one-click option and is not subject to this restriction.
