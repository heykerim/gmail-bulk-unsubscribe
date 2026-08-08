# Privacy Policy — Gmail Bulk Unsubscribe

Last updated: 8 August 2026

Gmail Bulk Unsubscribe is a browser extension that helps users preview and automate unsubscribe actions in Gmail's **Manage subscriptions** view. The extension is designed to run locally in the browser and does not operate a backend service.

## Data the extension handles

The extension handles only the information needed for its user-facing purpose:

- **Sender email addresses shown in Gmail's Manage subscriptions page.** These are read from the page so the extension can count senders, preview what would be affected, match the keep-list, and click Gmail's own unsubscribe controls.
- **Your protected-sender keep-list.** Text that you enter in the popup is stored locally using Chrome extension storage so it is available the next time you open the extension.
- **The Gmail tab URL when the current tab is Gmail.** The popup uses the Gmail-only host permission to determine whether you are on Gmail and whether Manage subscriptions is available. It does not request permission to inspect arbitrary websites.

The extension does **not** read Gmail message bodies, attachments, passwords, authentication cookies, OAuth tokens, payment information, or contacts.

## Storage and retention

The keep-list is stored locally in your browser with `chrome.storage.local`. It remains there until you edit or clear it, clear the extension's storage, or remove the extension.

Sender email addresses and the Gmail tab URL are processed transiently for the current action. They are not written to a remote database or sent to the developer.

## Data transmission and sharing

Gmail Bulk Unsubscribe has no analytics, no advertising, no tracking SDK, and no developer-operated server. Gmail data, sender email addresses, keep-list contents, and browsing data are **not transmitted** to the developer or sold or shared with third parties.

The popup contains a user-initiated link to this project's GitHub repository and a user-initiated action that can open Gmail's Manage subscriptions page. Following those links causes normal browser navigation to GitHub or Gmail, but the extension does not attach Gmail data or keep-list data to those requests.

All fonts, icons, JavaScript, and CSS used by the extension are bundled in the extension package; the extension does not execute remotely hosted code.

## Permissions

- **`storage`** — stores your protected-sender keep-list locally.
- **`https://mail.google.com/*`** — allows the content script to run on Gmail and allows the popup to recognize Gmail so it can interact with the Manage subscriptions UI.

The extension intentionally requests only these permissions. It does not request `activeTab`, `tabs`, `scripting`, `<all_urls>`, OAuth, identity, cookies, history, or network-interception permissions.

## Bookmarklet note

This policy describes the packaged browser extension. The optional bookmarklet documented in this repository is separate: when clicked, it retrieves the public `unsubscribe.js` file from `raw.githubusercontent.com`. The bookmarklet does not upload Gmail data to GitHub.

## Changes

If the extension's data practices change, this policy will be updated before the changed behavior is released.

## Contact

For questions or issues, use the public GitHub issue tracker for this project. Do not post private Gmail content, account credentials, or other sensitive information in a public issue.
