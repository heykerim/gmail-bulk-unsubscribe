# Chrome Web Store submission guide

This file is the copy-and-check checklist for publishing **Gmail Bulk Unsubscribe v1.0.0**. Keep the listing, privacy answers, screenshots, and package behavior consistent with the code in the tagged release.

## Single purpose

**Recommended dashboard text:**

> Help users preview and automate unsubscribe actions for senders listed in Gmail's Manage subscriptions view.

The extension has one narrow purpose: it drives Gmail's existing unsubscribe controls for the senders already shown in Manage subscriptions. It does not provide inbox search, email reading, analytics, advertising, or account-management features.

## Permission justifications

### `storage`

> Stores the user's protected-sender keep-list locally in Chrome extension storage so those preferences persist between popup sessions.

### Host access: `https://mail.google.com/*`

> Required for the extension's content script to run on Gmail and interact with Gmail's Manage subscriptions UI. It also lets the popup recognize when the current page is Gmail. The content script reads sender email addresses shown in Manage subscriptions and clicks Gmail's own unsubscribe controls. It does not read message bodies or attachments.

The manifest intentionally does **not** request `activeTab`, `scripting`, `tabs`, `<all_urls>`, OAuth, identity, cookies, history, or network interception permissions.

## Remote code

**Dashboard answer:** **No remote code.**

All JavaScript, CSS, fonts, and icons used by the browser extension are packaged locally. The extension does not download or execute JavaScript or WebAssembly from a remote server.

The optional bookmarklet documented elsewhere in the repository is not part of the Chrome Web Store extension package.

## Data disclosure

Use the dashboard's current checkbox wording, but make sure the declarations communicate these exact behaviors:

- **Website content:** sender email addresses visible in Gmail's Manage subscriptions view are processed locally so the extension can count, preview, keep, skip, and unsubscribe senders. They are not transmitted to the developer or a third party.
- **User-provided content:** the protected-sender keep-list is stored locally with `chrome.storage.local`. It is not transmitted.
- **Gmail page URL/context:** when the active page is Gmail, the popup uses Gmail-only host access to recognize the page and choose the correct status/action. The URL is not retained, profiled, or transmitted, and the extension does not request access to arbitrary websites.
- **No message bodies or attachments:** the extension does not access Gmail message content, attachments, contacts, credentials, OAuth tokens, authentication cookies, or payment information.
- **No analytics or advertising:** there is no telemetry, analytics SDK, ad SDK, tracking pixel, sale of data, or personalized advertising.

**Limited Use certification:** certify only if the dashboard wording remains consistent with the behavior above and with [`PRIVACY.md`](PRIVACY.md).

**Privacy policy URL:**

`https://github.com/heykerim/gmail-bulk-unsubscribe/blob/main/PRIVACY.md`

## Store listing copy

### Name

**Gmail Bulk Unsubscribe**

### Manifest / short description

> Bulk-unsubscribe from senders in Gmail's Manage subscriptions view. Runs locally; nothing leaves your browser.

### Detailed description

> Bulk-unsubscribe from Gmail's Manage subscriptions view without clicking every sender one by one.
>
> Preview first, protect senders with a local keep-list, then unsubscribe in sequence using Gmail's own confirmation UI.
>
> • Preview senders before making changes  
> • Unsubscribe in bulk  
> • Stop an active run  
> • Protect sender substrings with a saved keep-list  
> • Runs locally in your browser  
> • No analytics, advertising, OAuth, or developer-operated server
>
> The extension only operates on `mail.google.com`. It reads sender email addresses shown in Gmail's Manage subscriptions view only for the unsubscribe workflow; it does not read Gmail message bodies or attachments.
>
> Unsubscribe actions cannot be automatically reversed. Use Preview before starting a real run.
>
> Not affiliated with or endorsed by Google. Gmail is a trademark of Google LLC.

### Suggested category

**Productivity** — confirm the closest current category offered by the dashboard before submitting.

### Homepage

`https://github.com/heykerim/gmail-bulk-unsubscribe`

### Support

`https://github.com/heykerim/gmail-bulk-unsubscribe/issues`

## Graphic assets

Chrome's current Web Store guidance requires an extension icon and listing imagery. Prepare these from the final, smoke-tested v1.0.0 build:

- **128×128 PNG store icon:** use `extension/icons/icon128.png`.
- **At least one screenshot:** 1280×800 preferred (640×400 is also accepted). Use square corners and full bleed.
- **Small promotional tile:** 440×280 PNG or JPEG.
- **Optional marquee tile:** 1400×560 PNG or JPEG.

Recommended screenshot set (use a test Gmail account or otherwise ensure no private email data is visible):

1. Popup on Gmail Manage subscriptions with the real sender count visible.
2. Preview state showing what would be unsubscribed without making changes.
3. Keep-list usage plus the Unsubscribe / Preview / Stop controls.
4. A completed run summary using non-sensitive test senders.

Do not fabricate functionality in the screenshots. Capture the current shipped UI after the final Chrome smoke test.

## Store package

Build the upload ZIP with:

```bash
bash scripts/package-extension.sh
```

Output:

```text
dist/gmail-bulk-unsubscribe-v1.0.0.zip
```

`manifest.json` is at the root of this archive, which is the layout expected for a Chrome Web Store upload. Do **not** upload GitHub's repository source ZIP as the store package.

## Submission checklist

- [ ] Load the final `main` build unpacked in Chrome.
- [ ] Confirm the custom `@` icon appears in the toolbar and `chrome://extensions`.
- [ ] Confirm the popup is the square 480×600 final UI.
- [ ] From a non-Gmail tab, click **Open Gmail to use this.** and confirm it opens `mail.google.com/mail/u/0/#sub`.
- [ ] On Gmail outside Manage subscriptions, confirm the status action navigates to Manage subscriptions.
- [ ] Confirm the example keep-list entries are placeholders, not saved values.
- [ ] Enter a custom keep-list value, close/reopen the popup, and confirm it persists.
- [ ] Run Preview and verify no unsubscribe action occurs.
- [ ] Test a real unsubscribe on 1–2 disposable/test subscriptions.
- [ ] Start a test run and verify Stop interrupts it.
- [ ] Build `dist/gmail-bulk-unsubscribe-v1.0.0.zip` and verify CI passes.
- [ ] Capture current, non-sensitive 1280×800 screenshots from this exact build.
- [ ] Fill Store Listing, Privacy, Distribution, and Test Instructions (if requested) in the developer dashboard.
- [ ] Use the permission justifications and data disclosures above.
- [ ] Link the public privacy policy.
- [ ] Recreate/move the `v1.0.0` Git tag only after the smoke test is complete, so the public release and store package correspond to the same final commit.
