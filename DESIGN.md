# Minutemen Marketing — Design System (post-hero site)

Minutemen Marketing · Long Island, New York · contact details `TODO(client)` (hidden until supplied)
Sector: web design and marketing agency for local businesses  Direction: **restrained, exact, quick**
Conversion goals: 1) Book a Free Consultation (/contact form) 2) look at the work (/portfolio)

Scope: the four pages (Home, About, Portfolio, Contact), the shared nav and footer, and everything on
Home after the hero hands off to the logo. The hero and the globe-to-logo transition follow the hero
spec in `CLAUDE.md`, not this file.

Status: the one-page version was approved by Noah on 2026-11-05. **Revised the same day to four pages
(Noah's 8-step brief): the single scrolling page and the Ready · Aim · Fire · Heard process are gone.**
Brand, palette, type, the one-ink rule and the shot line carry over unchanged. Change this file before
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
- **Flat cards, not app tiles.** Noah asked for five service cards: flat paper panels with a hairline,
  a Caslon name and one sentence. No icons, no shadows, no hover lift.
- **One navy band** (the closing consultation band) so "restrained" doesn't mean flat, and the page ends in the same navy
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
| `--paper-2` | `#EFEADF` | The mat around work screenshots — never text | — |
| `--navy-deep` | `#021733` | Dark band ground (closing band, footer) | — |
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
- **Primary buttons and text links:** on hover/focus a short line + dot slides in under the label.
- **Never used:** in the nav, in the footer, on cards or images, or as decoration in empty space —
  it marks an arrival, so it only appears where something begins.

Secondary motif (one only): **the logo's open ring** — the hero ends on the logo circle; the closing
band reuses that open ring (thin, `--on-navy-2`, broken at the bottom like the logo's ground line)
behind the closing heading, so the page ends where the hero did.

## Layout

- Shell 1240px; gutters 20px mobile → 56px desktop (`clamp(20px, 5vw, 56px)`); 12-column grid on
  desktop, 4 on mobile.
- Spacing scale 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160. Section band `clamp(88px, 10vw, 160px)`.
- **Section rhythm:** shot line + eyebrow → display heading → short lede → content.
- **Asymmetry:** headings take columns 1–5, content 6–12 on desktop; the intro statement runs 1–10
  and leaves the right edge open (the direction of travel).
- Breakpoints 375 / 720 / 1024 / 1440. No horizontal scroll at 375. `min-height: 100dvh` not `100vh`.
- No mobile action bar (removed 2026-11-05): the nav is always one tap away and every page ends in
  *Book a Free Consultation*.
- z-index scale: content 0 · hero skip 3 · nav 40 · menu sheet 100 · skip link 1000.

## Shared on every page

| Part | Spec |
|---|---|
| **Nav** | `src/partials/nav.html`, injected at build. Horizontal logo (`/brand/logo-horizontal.svg`) left; **Home · About · Portfolio · Contact**; current page underlined (`aria-current="page"`). Visible on load. On Home it fades out while you scroll down through the hero and comes back when you scroll up or the hero ends. ≥ 720px: the four tabs. Below: a 44px *Menu* button → full-height sheet (logo, Close, the four pages in large Caslon, *Book a Free Consultation*), focus-trapped, Esc closes. |
| **Footer** (navy-deep) | `src/partials/footer.html`. Light horizontal logo + italic tagline · the four pages · *Book a Free Consultation* · "Serving Long Island, New York" · © year. Email, phone and socials appear only once Noah supplies them. |
| **Every consultation button** | Links to `/contact`. Regular `<a href>` links everywhere, so each route loads on its own. |

## Pages

### Home `/`

1. **Hero** (CLAUDE.md), ending on the stacked logo.
2. **Services: five cards.** This replaces the ruled index; Noah asked for cards. Flat paper-2 panels
   with a 1px rule, no shadows, no icons. A Caslon name, one sentence, and a small 01–05 numeral:
   - **SEO:** Help local customers find you when they search for what you offer.
   - **GEO (AI search):** Structure your content so AI search tools understand what you do and surface it in answers.
   - **Website Design & Development:** A custom, mobile-friendly site that makes the next step easy.
   - **Domain Acquisition:** Find, secure and connect a domain that fits your brand.
   - **Social Media Management:** Plan, create and manage content that keeps your channels active.
   Mobile: one column. Desktop: a 3 + 2 grid.
3. **Client work carousel**, modelled on the Bang Bang Barbershop reviews carousel. The active card sits
   centred at about 44% width, its neighbours at 50% opacity and 92% scale, and the row's edges fade
   out under a gradient mask. The track slides over 900ms. Prev/next buttons and dots; swipe on
   touch; arrow keys when focused. Cards: **Beauty & Wellness *addict* NY** and **Smiles by
   Nilou**, each with a screenshot, its town or tagline, and factual project highlights only.
   **Dev only:** a sample testimonial with a visible "Draft placeholder" label, injected by JS behind
   `import.meta.env.DEV`, so it never reaches the production HTML. A prominent **View Our Portfolio**
   button sits beside the carousel on desktop and below it on mobile.
4. **Meet the Founders**, compact and typographic like the B&W founders section: heading left; a
   short paragraph and the two names on a hairline rule on the right. **Noah**: design direction,
   interface and build. **Ethan**: strategy, messaging and search. Photos `TODO(client)` (none exist;
   hidden until supplied, never generated). **Meet the Founders** button → `/about#founders`.
5. **Closing**: *"A marketing plan built around your business."* (protected), one line on tailored
   services, and **Book a Free Consultation** → `/contact`. Navy band with the open-ring motif.

### About `/about`

H1 + lede, then three parts: **Why we started** (Noah's stated belief from the Sept 2026 site),
**The founders** (`#founders`: Noah and Ethan with roles; photos and surnames `TODO(client)`),
**How we work** (you deal with the people who design and build your site; strategy first). Ends with
**Book a Free Consultation**. Only details already published by Noah; anything else `TODO(client)`.

### Portfolio `/portfolio`

Beauty & Wellness *addict* NY, then Smiles by Nilou, each with a short write-up. **Each site sits in a
browser-style window**: a paper-2 frame with three dots and the domain in a pill. Inside is an
interactive, scrollable iframe, lazy-loaded (`loading="lazy"`, loaded once it nears the viewport),
16:10 on desktop and 4:5 on phones so it stays usable. **Open Live Website ↗** sits outside the
window. Sites that refuse framing show their screenshot in the same window.
- beautyandwellnessny.com sends no frame headers → iframe.
- www.smilesbynilou.com sends `X-Frame-Options: SAMEORIGIN`. We control it, so its `preview` branch
  now allows `frame-ancestors` minutemenmarketing.com. Until that preview is promoted *and* this site
  runs on minutemenmarketing.com, the window shows the screenshot.
- Other finished sites join once each has a verified production URL (see TODO).

### Contact `/contact`

H1 *Book a free consultation*, one line, then the form: name, business name, email, five service
checkboxes (the five services above), message. Web3Forms (`api.web3forms.com/submit`), a `botcheck`
honeypot, a busy state, an inline success message, and a real error state. **Never a false success.**
Beside it: work email, other email, phone, Instagram, LinkedIn and other links. **Each one renders only
when it is filled in `src/site-config.js`; empty = `TODO(client)` and hidden.** The form needs the
Web3Forms access key. Without it the live page hides the form and says plainly that it isn't connected.

## Components

- **Buttons:** primary: navy fill, paper text, Hanken 500, 2px radius, 48px min height. On hover and
  focus a short line slides in under the label (200ms). Light variant on navy. One primary per section.
- **Service cards:** `--paper-2` fill, 1px `--rule` border, 2px radius, no shadow.
- **Carousel cards:** paper, 1px `--rule` border; the active card's border goes `--ink`.
- **Browser window:** 1px `--rule` frame, 8px radius top bar with three `--rule` dots and the domain,
  iframe or screenshot below; `title` on every iframe.
- **Forms:** visible labels above 48px inputs; validate on blur; errors under the field in `--error`
  with text + `aria-live`; checkboxes ≥ 44px rows.
- **Focus:** 2px solid ring on everything interactive (`--on-navy` on dark bands). Skip link on every
  page. Touch targets ≥ 44px.

## Motion

- `--ease: cubic-bezier(0.22, 0.61, 0.36, 1)` · `--dur: 600ms` · micro `200ms` · line draw `900ms`.
- Scroll motion outside the hero: the shot lines draw once as a section arrives. The carousel moves
  only when you ask it to (no autoplay). Nothing else fades or slides in.
- Lenis smooth scroll on every page; anchor links scroll with it and move focus.
- **`prefers-reduced-motion`:** no Lenis, lines already drawn, the carousel jumps without sliding,
  and the hero is a still. QA motion with `?motion`, because the Claude browser pane forces reduced
  motion.

## Head on every page

Unique `<title>`, meta description, canonical (`https://minutemenmarketing.com/…`), one H1, OG/Twitter
tags, favicon, `theme-color #032249`. `sitemap.xml` lists all four routes. `vercel.json` sets
`cleanUrls` so `/about` etc. serve directly.

## Facts of record

| Fact | Value | Source |
|---|---|---|
| Name | Minutemen Marketing | Noah's brief (2026-11-02) |
| Where | Long Island, New York | Noah's brief |
| Services (5) | SEO · GEO (AI search) · Website Design & Development · Domain Acquisition · Social Media Management | Noah 2026-11-05 (replaces the 8 plain-language services) |
| Founders | Noah (design direction, interface, build) · Ethan (strategy, messaging, search) | Sept 2026 site (`legacy/about.html`) |
| Why / how | Small businesses shouldn't settle for outdated sites or recycled templates; clients work directly with the people designing and building | Sept 2026 site |
| Portfolio (live) | Beauty & Wellness *addict* NY (beautyandwellnessny.com) · Smiles by Nilou (www.smilesbynilou.com) | Vercel production domains, checked 2026-11-05 |

**Never on this site:** stats, client counts, years in business, prices, awards, ratings, review
counts, turnaround times, or testimonials Noah hasn't supplied. None are verified.

`TODO(client):` needed from Noah before launch
1. **Web3Forms access key** (the form stays hidden on the live site until it exists).
2. Work email, other email, phone, Instagram, LinkedIn, other links.
3. Founder photos (real, supplied) and surnames, if wanted.
4. Real testimonials with name, business, town and permission. Until then the carousel shows project
   highlights only.
5. Other finished client sites to show, each with its live production URL and the client's OK
   (Muses Nails, Wealth Advisory Group, Gym Grindz and Bang Bang Barbershop have `.vercel.app` builds
   only; Ray Nail Spa was a pitch).
6. Promote the Smiles by Nilou `preview` deploy (frame-ancestors) and point minutemenmarketing.com at
   this project.
