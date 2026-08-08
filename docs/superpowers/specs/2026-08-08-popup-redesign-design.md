# Bulk Unsubscribe Popup Redesign

## Goal
Rebuild the browser-extension popup to match the approved 480×600 reference as closely as the browser allows while preserving the existing unsubscribe behavior.

## Visual contract
- Popup viewport is exactly 480×600 px.
- The visible card begins at the faint rounded border; the surrounding browser canvas is transparent and is not part of the design.
- The card is inset 6 px from the viewport on all sides, producing a 468×588 px surface.
- Copy is exactly: “Bulk Unsubscribe”, “Protect senders”, “One per line. Use email substrings.”, “Any sender whose email contains one of these is skipped.”, “Preview senders”, “Unsubscribe all”, “Stop”, and “Private by default. Runs entirely in your browser.”
- Use the existing custom @ icon at top left.
- Use the supplied Clarity City Medium and SemiBold fonts.
- Apply letter-spacing: -0.02em globally.
- Idle state matches the reference composition: header, status row, protection form, three action buttons, footer.
- Results are hidden by default. After Preview or Unsubscribe begins, reveal a compact results panel below the buttons. The main content may scroll while the footer remains fixed.

## Dynamic status behavior
- Outside Gmail: “Open Gmail to use this.” in red.
- Gmail, wrong page: “Open Manage subscriptions to use this.” in red.
- Correct page: “N sender(s) found.” in dark/neutral.
- Running preview: “Previewing N senders…” in dark/neutral.
- Running unsubscribe: “Unsubscribing from N…” in dark/neutral.
- Errors: red.

## Behavior constraints
- Preserve the existing content-script protocol and destructive-action confirmation.
- Preserve saved keep-list behavior.
- Preserve single-run protection and Stop behavior.
- Preview and Unsubscribe are disabled while a batch is running; Stop is enabled only while running.
- Help button opens the repository README.

## Testing
Regression tests must verify the 480×600 contract, 6 px card inset, Clarity City font declarations, -0.02em tracking, approved copy, dynamic status wording, hidden-by-default results panel, and existing run-state safety behavior.
