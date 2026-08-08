# Bulk Unsubscribe Popup Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the extension popup to the approved 480×600 reference while preserving current unsubscribe behavior and adding a hidden-by-default results panel that appears after actions.

**Architecture:** Keep the content script and message protocol unchanged. Replace only the popup HTML/CSS presentation and adapt popup.js to map existing progress messages into the new status row and results panel. Bundle the supplied Clarity City font files inside the extension so the approved typography is deterministic.

**Tech Stack:** Manifest V3, HTML, CSS, vanilla JavaScript, Node built-in test runner.

## Global Constraints
- Popup viewport exactly 480×600 px.
- Visible card inset 6 px on all sides; no designed outer white canvas.
- Clarity City Medium/SemiBold and `letter-spacing: -0.02em` globally.
- Approved copy must match the reference word-for-word.
- Existing destructive confirmation, saved keep-list, run guard, and Stop behavior remain intact.
- Results panel hidden in idle state and revealed after Preview or Unsubscribe starts.

---

### Task 1: Add regression coverage for the approved popup contract

**Files:**
- Modify: `tests/release-hardening.test.js`

**Interfaces:**
- Consumes: `extension/popup.html`, `extension/popup.css`, `extension/popup.js`
- Produces: regression assertions for layout, fonts, copy, dynamic status, and hidden results.

- [ ] **Step 1:** Add tests asserting 480×600 viewport, 6 px card inset, font-face references, `-0.02em`, approved button/copy strings, `.results.is-hidden`, and new dynamic status strings.
- [ ] **Step 2:** Run `node --test tests/release-hardening.test.js` and confirm the new tests fail against the old popup.
- [ ] **Step 3:** Commit the red tests.

### Task 2: Rebuild popup markup and styles

**Files:**
- Modify: `extension/popup.html`
- Modify: `extension/popup.css`
- Create: `extension/fonts/ClarityCity-Medium.woff2`
- Create: `extension/fonts/ClarityCity-SemiBold.woff2`

**Interfaces:**
- Consumes: existing element IDs used by popup.js: `status`, `keeplist`, `preview`, `run`, `stop`, `summary`, `lines`.
- Produces: new IDs/classes `statusBar`, `help`, `resultsPanel`, and the approved visual structure.

- [ ] **Step 1:** Replace popup markup with header, dynamic status row, protect-senders form, three action buttons, hidden results panel, and fixed footer.
- [ ] **Step 2:** Add supplied Clarity City fonts under `extension/fonts/`.
- [ ] **Step 3:** Replace CSS with exact 480×600 geometry scaled from the approved reference and set global `letter-spacing: -0.02em`.
- [ ] **Step 4:** Run the regression tests and confirm layout/font/copy assertions pass.

### Task 3: Adapt popup behavior to the redesigned states

**Files:**
- Modify: `extension/popup.js`

**Interfaces:**
- Consumes content-script messages `{type:'start'}`, `{type:'progress', status, email}`, `{type:'done'}`, `{type:'error'}`.
- Produces dynamic status-row tone/text, hidden/revealed results panel, and safe button states.

- [ ] **Step 1:** Add status tone handling and results show/hide helpers.
- [ ] **Step 2:** Preserve existing keep-list storage format and `confirm()` before destructive runs.
- [ ] **Step 3:** Map existing progress events into the visible results list and update status text for running/completed/error states.
- [ ] **Step 4:** Add help-button behavior to open the repository README.
- [ ] **Step 5:** Run `node --check extension/popup.js` and the full regression suite.

### Task 4: Verify branch and merge

**Files:**
- Review all changed files.

- [ ] **Step 1:** Run the repository GitHub Actions verification workflow through a pull request.
- [ ] **Step 2:** Confirm regression tests, JS syntax, manifest JSON, and PNG checks pass.
- [ ] **Step 3:** Review the complete PR diff for unintended logic changes.
- [ ] **Step 4:** Squash-merge to `main` only after all checks pass.
