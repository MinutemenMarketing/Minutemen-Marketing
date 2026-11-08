# QA scripts (Playwright)

Not part of the site build. Run them from any folder that has Playwright installed
(`npm i playwright && npx playwright install chromium webkit`), passing an output folder:

- `node qa/cross-browser.mjs <outDir>`: live-domain run in Chromium, Edge (`channel: 'msedge'`),
  WebKit desktop, iPhone 14 (WebKit) and Galaxy S9+ (Chromium): hero plays and reaches all three
  lines, nav fade, carousel (button / touch swipe, centring), fonts, layout shift, portfolio windows
  live and scrollable, contact form (validation, success and error states, intercepted so nothing
  is sent), menu and links, console errors.
- `node qa/mobile-audit.mjs <outDir> <tag> [baseUrl]`: 375 / 390 / 430px full-page screenshots of
  every page plus a report of horizontal scroll, content within 12px of an edge, tap targets under
  44px and off-centre headings, photos and buttons.

Firefox: Playwright's Firefox build is blocked from running on Noah's Windows machine (unsigned
executable), so Firefox wasn't covered in the 2026-11-07 run.
- `node qa/hero-pass.mjs [baseUrl] [--collide-only] [--shots <dir>] [--selftest]`: the full hero
  scroll pass (wheel, trackpad, touch, slow 4G) and then the collision check: every beat at
  375×812, 375×667, 390, 430, 768, 1280 and 1920px, with the controls under the nav and up in its
  space, asserts that no control (Reduce motion, Skip intro, Scroll cue, progress line) overlaps any
  word and that the text is centred. `--selftest` pins the controls onto beat 1 and must fail.
