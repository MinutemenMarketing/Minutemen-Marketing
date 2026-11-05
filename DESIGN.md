# Minutemen Marketing — Design System (post-hero site)

Minutemen Marketing · Long Island, New York (and remote) · hello@minutemenmarketing.com · `TODO(client):` phone
Sector: web design agency for local businesses  Direction: **restrained, exact, quick**
Conversion goals: 1) start a project (form) 2) email 3) look at the work

Scope: everything after the hero hands off to the logo circle — nav, intro, services, process, work,
contact, footer. The hero and the globe-to-logo transition follow the hero spec in `CLAUDE.md`, not
this file. Status: **approved by Noah 2026-11-05** with his changes (four-chapter process, plain
service names, turnaround TODO, hidden testimonials slot, gold shot-line dot). Change this file before
the build deviates from it.

## Anti-default stance

The generic AI look this brief could collapse into is **warm cream + a bold high-contrast serif + one
warm accent, three icon cards for services, centered everything** — and our brief (navy on warm
off-white, a serif + sans) sits right next to it. We deliberately deviate:

- **One ink, one spark.** Navy is the only color on the page, the way a 1775 broadside was printed in
  a single ink. The single exception is the shot-line dot, in a muted musket-flash gold — the spark
  of the shot, never text, never buttons, never fills. No terracotta, no gradients. Hierarchy comes
  from size, weight, italic and space — not from a second color.
- **Caslon at regular weight, set large, with real italics** for the turn of a sentence — never a
  bold display serif. Caslon is the face the Declaration was printed in; it carries the period so
  the layout doesn't need costume (no parchment, no ornaments, no faux-aged textures).
- **Services as an index, not cards.** A ruled list you read down, grouped by what the client gets.
- **One navy band** (contact) so "restrained" doesn't mean flat, and the page ends in the same navy
  the hero lives in.
- **Structural move:** the musket ball's path from the hero continues down the page as the
  signature line (below), so the site reads as the end of the same story, not a template bolted on.

## Palette

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `--paper` | `#F7F4EC` | Page background | — |
| `--ink` | `#032249` | Navy — headings, body, buttons, the signature line (sampled from the logo) | 14.4:1 on paper |
| `--ink-2` | `#4A5A72` | Secondary text — captions, meta, helper text | 6.3:1 on paper |
| `--rule` | `#D9D3C4` | Hairlines only — too pale for text | — |
| `--navy-deep` | `#021733` | Dark band ground (contact, footer) | — |
| `--on-navy` | `#F7F4EC` | Text on the dark band | 16.3:1 on navy-deep |
| `--on-navy-2` | `#A9B6C9` | Secondary text on the dark band | 8.7:1 on navy-deep |
| `--flash` | `#A67C2E` | Muted musket-flash gold — **the shot-line dot only.** Never text, borders, fills or buttons | 3.4:1 on paper, 4.7:1 on navy-deep (non-text, ≥ 3:1) |
| `--error` | `#9B1C1C` | Form errors only, always with text | 7.4:1 on paper |

Tokens only in components, never raw hex. Body text ≥ 7:1 (it is 14.4:1). No dark mode.

## Typography

- **Display:** Libre Caslon Text 400 + 400 italic (700 unused). Italic marks the turn in a
  headline ("Ready *at a minute's notice.*"), never whole paragraphs. Optical feel at size comes from
  tight tracking (−0.015em ≥ 40px), not weight.
- **Body/UI:** Hanken Grotesk variable, 400 body / 500 labels / 600 eyebrows. Not Inter.
- **Eyebrow:** Hanken 600, 12–13px, 0.16em tracking, uppercase, `--ink-2`.
- **Scale desktop → mobile:** display 88 → 44 · h2 56 → 34 · h3 30 → 24 · lede 22 → 19 ·
  body 18 → 17 · small 14 · eyebrow 12. Line-height: display 1.04, h2 1.1, body 1.6.
  Measure ≤ 34rem for running text.
- **Figures:** tabular-nums for process stage numbers, the phone number and the year.
- Self-hosted via `@fontsource` (already in `package.json`); `font-display: swap`, latin subset only.

## Signature element — the shot line

The ball leaves the muzzle travelling screen-right; after the hero it keeps going. **Every section
opens with a single 1px navy line that draws left → right across the shell and ends in a small solid
dot (the ball, 7px, `--flash` gold).** The section's eyebrow sits on the line where the dot stops.
The line is navy; only the dot is gold.

- **Section openers:** the line draws once when the section enters (900ms), then stays.
- **Process:** one long line runs through the four chapters — Ready, Aim, Fire, Heard; each chapter
  is a stop on it (the dot travels stop to stop as you scroll). This is the only place the dot moves
  after it lands.
- **Primary buttons and text links:** on hover/focus a short line + dot slides in under the label.
- **Never used:** in the nav, in the footer, on cards or images, or as decoration in empty space —
  it marks an arrival, so it only appears where something begins.

Secondary motif (one only): **the logo's open ring** — the hero ends on the logo circle; the contact
band reuses that open ring (thin, `--on-navy-2`, broken at the bottom like the logo's ground line)
behind the "Start a project" heading, so the page ends where the hero did.

## Layout

- Shell 1240px; gutters 20px mobile → 56px desktop (`clamp(20px, 5vw, 56px)`); 12-column grid on
  desktop, 4 on mobile.
- Spacing scale 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160. Section band `clamp(88px, 10vw, 160px)`.
- **Section rhythm:** shot line + eyebrow → display heading → short lede → content.
- **Asymmetry:** headings take columns 1–5, content 6–12 on desktop; the intro statement runs 1–10
  and leaves the right edge open (the direction of travel).
- **Full-bleed:** work plates break the shell to the gutter edge; the contact band is full-bleed navy.
- Breakpoints 375 / 768 / 1024 / 1440. No horizontal scroll at 375. `min-height: 100dvh` not `100vh`.
- **Mobile:** sticky bottom action bar after the hero — *Email us* · *Start a project* (adds *Call*
  once a phone number exists). Content reserves space for it.
- z-index scale: content 0 · sticky bar 20 · nav 40 · menu sheet 100 · skip link 1000.

## Sections (single page after the hero)

| Section | Job | Content |
|---|---|---|
| **Nav** | Get anywhere in one tap | Fades in when the hero settles. Wordmark left; Services · Ready · Aim · Fire · Heard · Work; *Start a project* button (→ Contact). The four chapter names link to their process chapters, same names as on the page. Current section underlined. Mobile: menu button (44px) → full-height sheet, focus-trapped, Esc closes; in the sheet the chapters sit under a small "How we work" label so first-time visitors know what they are. |
| **Intro** | Say what we do in one breath | The logo circle (end of the hero) above one Caslon statement at display size, then a one-line lede. Copy drafted below for approval. |
| **Services** | Show the offer plainly | Index of the real services in plain words a local owner uses, in three groups. **Your website:** Website design · Building your website · Logo and brand · More calls and bookings from your site. **Getting found:** Showing up on Google · Google Maps and local search · Showing up in AI answers (ChatGPT, Google's AI). **Keeping it running:** Updates, fixes and upkeep. Each row: Caslon name left, one plain sentence right, hairline between rows. No icons, no jargon labels ("GEO", "Conversion", "SEO" only inside a sentence if at all). |
| **Process** | Show how a project runs | Four chapters on the shot line, numbered 01–04 (a true sequence), same names as the nav. **Ready** — *We learn your business, your customers and what the site has to do.* **Aim** — *We plan the pages and design them around the people you want to reach.* **Fire** — *We build it, test it on every screen and put it live.* **Heard** — *We keep it fast, found and up to date after launch.* (Covers the seven Sept-site stages: Discovery + Strategy, Design, Development + Launch, Optimization + Growth.) No durations except the turnaround figure Noah supplies. |
| **Speed line** | Back the speed promise with a real number | One line under the process: *"Most sites go live in `TODO(client): turnaround`."* Hidden until Noah supplies the figure — never estimated. |
| **Work** | Prove it | Real sites, photographed from the real builds (`legacy/tools/capture.mjs` method). Large plates, one per row, alternating text left/right: client name, town, what we built. Each plate links to the live site. See facts below for what may be shown. |
| **Testimonials** | Let clients say it | Slot after Work: up to three quotes, Caslon italic, client name + business + town. Built with `TODO(client):` placeholders and **hidden (not rendered, not in the DOM) until real, attributed quotes exist.** No invented quotes, no star ratings, no review counts. |
| **Team** | Who you'll talk to | Noah — design. Ethan — strategy. Names and roles only; set typographically, no stock portraits. |
| **Contact** (navy band) | Start a project | Open-ring motif, Caslon heading, short form (name, email, business, current website optional, what you need), plus the email address as a plain alternative. |
| **Footer** (navy-deep) | Close | Wordmark, section links, email, socials, "Serving Long Island, New York — and remote", © year. |

**Draft copy direction** (for approval — not final): intro *"Websites for Long Island businesses,
built quickly and built properly."* Services lede *"Everything a local business needs to be found
and chosen online."* Contact *"Tell us what you need. We answer quickly."* No "elevate", "seamless",
"journey", no invented numbers, no triads.

## Components

- **Buttons:** primary — navy fill, paper text, Hanken 500 16px, 2px radius, 48px min height, 24px
  side padding; hover/focus: shot line + dot slides in under the label (200ms), fill unchanged.
  Secondary — text link with a trailing → that moves 4px on hover. One primary per section.
- **Rows instead of cards:** services, process and team are ruled rows (`--rule` hairlines). No
  shadows anywhere; no rounded cards.
- **Work plates:** screenshot at true aspect with `width`/`height` set (no CLS), AVIF/WebP via
  `srcset`, lazy below the fold; 1px `--rule` frame; hover on desktop lifts the caption's shot line,
  not the image.
- **Forms:** visible labels above 48px inputs, 1px `--ink-2` border, 2px navy focus ring with 3px
  offset; validate on blur; errors below the field in `--error` with text + `aria-live`; submit shows
  a busy state; **never a false success** — if the endpoint is not configured, say so and show the
  email address.
- **Focus:** 2px solid ring on everything interactive (`--on-navy` on the dark band). Skip link
  (already in `index.html`). Touch targets ≥ 44px with ≥ 8px between.
- **Icons:** none needed beyond → and the menu glyph; if any are added, one SVG set, 1.5px stroke.

## Motion

- `--ease: cubic-bezier(0.22, 0.61, 0.36, 1)` · `--dur: 600ms` · micro `200ms` · line draw `900ms`.
- **Scroll motion is limited to three things** (Noah, 2026-11-05 — "no other scroll tricks"):
  the shot lines drawing once as a section arrives, one brief pinned moment per chapter (Ready, Aim,
  Fire, Heard) where its headline fades in on the shot line, and one image cross-fade between Work
  and Contact. Headings, plates and body text do not fade or slide in.
- Lenis smooth scroll continues from the hero; anchor links scroll with it and move focus to the
  target heading.
- **`prefers-reduced-motion`:** no Lenis, lines already drawn, reveals resolve instantly, the process
  dot sits at its final stop. QA motion in a real browser — the Claude browser pane forces reduced
  motion.

## Pages

| Page | Purpose | Sections |
|---|---|---|
| `index.html` | Everything | Hero → Nav, Intro, Services, Process (Ready · Aim · Fire · Heard) + speed line, Work, Testimonials (hidden until real), Team, Contact, Footer |
| `404.html` | Lost visitor | Shot line, one sentence, link home |
| `privacy.html` | Form data notice | Plain text — only if the form goes live (`TODO(client)`) |

Head boilerplate on every page: title, description, canonical, OG/Twitter image, favicon set,
`theme-color #032249`, JSON-LD `ProfessionalService` with `areaServed` (no invented fields).

## Facts of record

| Fact | Value | Source |
|---|---|---|
| Name | Minutemen Marketing | Noah's brief (2026-11-02) |
| What we do | Premium websites for local businesses | Noah's brief |
| Where | Long Island, New York — and remote | Sept 2026 site (`legacy/`), inferred there; confirm |
| Services (8) | Web Design, Development, SEO, Local SEO, GEO, Branding, Conversion, Website Management — shown under plain-language names (see Sections) | Sept 2026 site brief; names per Noah 2026-11-05 |
| Process | Four chapters: Ready, Aim, Fire, Heard | Noah 2026-11-05 (replaces the seven Sept stages) |
| Turnaround | `TODO(client)` — Noah will supply | Noah 2026-11-05 |
| Team | Noah (design), Ethan (strategy) | Sept 2026 site brief |
| Email | hello@minutemenmarketing.com — placeholder | Sept 2026 site, still `TODO(client)` |
| Portfolio | Smiles by Nilou, Beauty & Wellness addict NY, Muses Nails, Wealth Advisory Group, Gym Grindz, Ray Nail Spa | Builds in `C:\Claude Code` |

**Never on this site:** stats, client counts, years in business, prices, awards, ratings, review
counts, or any turnaround time or testimonial Noah hasn't supplied — none are verified. The speed
line and testimonials stay hidden until he does.

`TODO(client):` — needed from Noah before launch
1. Real email address and a phone number (or confirm there is none).
2. Instagram / LinkedIn URLs.
3. Founder surnames (optional) — roles only until then.
4. **Portfolio permissions and status:** which clients have OK'd being shown, and which sites are live.
   **Ray Nail Spa was a spec/pitch site** — show it labelled as a concept or leave it out. Gym Grindz
   and Wealth Advisory Group need their finished builds captured.
5. Inquiry endpoint (Resend keys or a webhook) — until then the form explains and shows the email.
6. Production domain confirmation (`minutemenmarketing.com`).
7. Approve or rewrite the draft copy lines above.
8. **Real turnaround time** for the speed line ("Most sites go live in …").
9. **Testimonials:** up to three real quotes, each with the client's name, business, town and
   permission. The section stays hidden until at least one exists.
