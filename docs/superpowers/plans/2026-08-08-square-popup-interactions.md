# Square Popup Interaction Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Chrome extension popup a native-feeling 480×600 rectangular surface, add actionable Gmail navigation and button hover states, make the protected-sender examples placeholder-only, and verify the packaged `@` extension icon assets.

**Architecture:** Keep the existing popup/content-script messaging and unsubscribe safety behavior unchanged. Restrict changes to popup presentation/interaction, keep-list initialization/migration, and icon packaging tests. Use static inline SVGs and existing local assets only; no new runtime dependencies or network requests.

**Tech Stack:** Manifest V3 Chrome extension, HTML/CSS/JavaScript, Node built-in test runner, GitHub Actions.

## Global Constraints

- Popup viewport remains exactly `480px × 600px`.
- Remove the inset/rounded outer card; the popup surface itself is rectangular and fills the viewport.
- Preserve horizontal section dividers and the textarea's own subtle input border.
- Outside Gmail, clicking the status row opens `https://mail.google.com/mail/u/0/#sub`.
- On Gmail but outside Manage subscriptions, clicking the status row navigates the active Gmail tab to `#sub`.
- On the correct Manage subscriptions page, the status row is informational and non-clickable.
- `security`, `receipt`, `instagram.com`, and `github.com` appear only as textarea placeholder examples, never as initial real values.
- Preserve genuinely user-entered keep-list values; migrate the exact legacy four-line default string to empty.
- Add hover/pressed states for primary, outline, enabled Stop, GitHub, and actionable status controls.
- Preserve dry-run, confirmation, Stop, single-run guard, keep-list semantics, and all existing Gmail selectors.
- The extension icon set must remain local PNGs at 16/32/48/128 and must visibly derive from the canonical `@` source asset.

---

### Task 1: Lock the new popup shell and interaction contract

**Files:**
- Modify: `tests/popup-icon-balance.test.js`
- Modify: `tests/release-hardening.test.js`

**Interfaces:**
- Consumes: current popup HTML/CSS/JS and manifest.
- Produces: regression assertions for rectangular shell, hover states, clickable status behavior, placeholder-only defaults, and icon packaging.

- [ ] **Step 1: Write failing tests**
  - Assert `.popup-card` is `480px × 600px`, `margin: 0`, `border: 0`, `border-radius: 0`.
  - Assert action hover/active selectors exist for `.btn-primary`, `.btn-outline`, `.btn-stop:not(:disabled)`, `.icon-github`, and `.status-row.is-actionable`.
  - Assert textarea uses a `placeholder` containing the four examples and has no literal default text content.
  - Assert popup JS contains the Gmail subscriptions URL and legacy-default migration logic.
  - Assert status control is keyboard-accessible when actionable and inactive when informational.
  - Assert manifest icon paths exist and PNG signature/dimension checks remain in CI.

- [ ] **Step 2: Run the regression suite and confirm the new assertions fail on the current implementation.**

### Task 2: Implement square shell and hover/pressed states

**Files:**
- Modify: `extension/popup.css`

**Interfaces:**
- Consumes: existing popup DOM classes.
- Produces: native 480×600 rectangular popup surface and interaction styling.

- [ ] **Step 1: Make `.popup-card` fill the full viewport with no margin, outer border, or radius.**
- [ ] **Step 2: Keep horizontal dividers and textarea border unchanged.**
- [ ] **Step 3: Add subtle hover/active styles for primary, outline, enabled Stop, GitHub, and actionable status controls.**
- [ ] **Step 4: Add cursor/focus-visible affordances only where controls are actionable.**
- [ ] **Step 5: Run targeted UI contract tests.**

### Task 3: Make the status row navigate to Gmail subscriptions

**Files:**
- Modify: `extension/popup.html`
- Modify: `extension/popup.js`

**Interfaces:**
- Consumes: `activeGmailTab()`, `refreshStatus()`, current status DOM.
- Produces: `setStatusAction(mode)` behavior and Gmail subscriptions navigation.

- [ ] **Step 1: Make the status row keyboard-focusable only when actionable.**
- [ ] **Step 2: Outside Gmail, status activation creates a tab at `https://mail.google.com/mail/u/0/#sub`.**
- [ ] **Step 3: On Gmail but wrong page, status activation updates the active Gmail tab URL to `https://mail.google.com/mail/u/0/#sub`.**
- [ ] **Step 4: On the correct page, remove actionable state, tabindex, and click/keyboard behavior.**
- [ ] **Step 5: Preserve existing status copy/tone and button enable/disable behavior.**
- [ ] **Step 6: Run JS syntax and regression tests.**

### Task 4: Convert keep-list examples to placeholders with legacy migration

**Files:**
- Modify: `extension/popup.html`
- Modify: `extension/popup.js`

**Interfaces:**
- Consumes: Chrome local storage key `keepList`.
- Produces: empty initial textarea unless a genuine user value exists.

- [ ] **Step 1: Replace textarea literal content with placeholder lines `security`, `receipt`, `instagram.com`, `github.com`.**
- [ ] **Step 2: Define the exact legacy default string and clear/remove it if found in storage.**
- [ ] **Step 3: Preserve any other non-empty stored keep-list value exactly.**
- [ ] **Step 4: Continue persisting subsequent user edits.**
- [ ] **Step 5: Run regression tests.**

### Task 5: Verify and harden extension icon packaging

**Files:**
- Verify/modify if needed: `extension/icons/icon-source.png`
- Verify/modify if needed: `extension/icons/icon16.png`
- Verify/modify if needed: `extension/icons/icon32.png`
- Verify/modify if needed: `extension/icons/icon48.png`
- Verify/modify if needed: `extension/icons/icon128.png`
- Modify if needed: `.github/workflows/test.yml`
- Modify if needed: `tests/release-hardening.test.js`

**Interfaces:**
- Consumes: canonical `@` source artwork and manifest icon references.
- Produces: valid PNG assets for Chrome extension management and toolbar surfaces.

- [ ] **Step 1: Inspect the current icon source and PNG assets.**
- [ ] **Step 2: If any PNG is stale/corrupt/not derived from the `@` source, regenerate all four sizes from the canonical source.**
- [ ] **Step 3: Ensure tests validate signatures and exact dimensions.**
- [ ] **Step 4: Ensure manifest still references only the PNG set.**

### Task 6: Full verification and merge

**Files:**
- No new implementation files.

**Interfaces:**
- Consumes: completed branch.
- Produces: verified PR merged to `main`.

- [ ] **Step 1: Run full GitHub Actions verification.**
- [ ] **Step 2: Review the PR diff for unrelated changes.**
- [ ] **Step 3: Merge only if regression, syntax, manifest, and PNG checks are green.**
- [ ] **Step 4: Verify merged `main` contains the square shell and interaction changes.**
