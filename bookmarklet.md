# Bookmarklet install

A bookmarklet is a bookmark whose URL is JavaScript. Click it while on Gmail's
**Manage subscriptions** page and it loads the tool, then previews (dry-run) what
it would unsubscribe. It does **not** unsubscribe anything on its own — you
confirm in the console or with the injected buttons.

## Install (drag-and-drop)

1. Show your bookmarks bar (Chrome/Edge: `Cmd/Ctrl+Shift+B`).
2. Create a new bookmark. Name it **Gmail Bulk Unsubscribe**.
3. Paste the line below as the bookmark's **URL**.
4. Go to `https://mail.google.com/mail/u/0/#subscriptions`, click the bookmark.
5. Open the console (`Cmd/Ctrl+Option/Alt+J`) to see the preview and run
   `unsubAll({ dryRun: false })` when you're ready.

## Bookmarklet URL

> Replace the username in the URL below if you fork this. It loads the raw
> `unsubscribe.js` from the published repo.

```
javascript:(function(){var s=document.createElement('script');s.src='https://raw.githubusercontent.com/heykerim/gmail-bulk-unsubscribe/main/unsubscribe.js';document.body.appendChild(s);})();
```

### Note on raw GitHub + CSP

Gmail's Content-Security-Policy may block loading an external script via
`raw.githubusercontent.com`. If the bookmarklet does nothing, fall back to the
**console snippet** (copy `unsubscribe.js` and paste it directly), which always
works. The userscript version (Tampermonkey) is the most reliable one-click
option and is not subject to this restriction.
