import '@fontsource/libre-caslon-text/latin-400.css';
import '@fontsource/libre-caslon-text/latin-400-italic.css';
import '@fontsource-variable/hanken-grotesk';
import './styles/main.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { CHOREO } from './hero/choreography.js';
import { initCarousel } from './carousel.js';
import { initContact } from './contact.js';
import { initFrames } from './portfolio.js';
import { inject as injectAnalytics } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { SITE } from './site-config.js';

// Vercel Web Analytics + Speed Insights (free tier), production builds only, after the page has
// loaded so they never compete with the hero. Web Analytics must be switched on once in the Vercel
// dashboard (Project → Analytics → Enable), then `vercelAnalytics: true` in src/site-config.js;
// until then its script would 404 and log a console error, so it stays off.
if (import.meta.env.PROD) {
  addEventListener('load', () => {
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1500));
    idle(() => {
      injectSpeedInsights();
      if (SITE.vercelAnalytics) injectAnalytics();
    });
  });
}

gsap.registerPlugin(ScrollTrigger);
// Mobile address bars resize the viewport while scrolling; the hero is sized to the large viewport,
// so ScrollTrigger doesn't need to re-measure (that would jump the scrubbed story).
ScrollTrigger.config({ ignoreMobileResize: true });

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
// Reduced-motion preference. QA switches: `?motion` ignores it, `?reduced` forces it.
const qs = new URLSearchParams(location.search);
const reduceMotion =
  (window.matchMedia('(prefers-reduced-motion: reduce)').matches && !qs.has('motion')) || qs.has('reduced');
const nav = $('[data-nav]');
const navH = () => nav.offsetHeight;

$('[data-year]').textContent = new Date().getFullYear();

/* ---------- Menu sheet (every page) ---------- */
const sheet = $('[data-sheet]');
const menuBtn = $('[data-menu]');
function setMenu(open) {
  sheet.hidden = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
  document.documentElement.classList.toggle('is-locked', open);
  if (open) $('.sheet__links a', sheet).focus();
  else menuBtn.focus();
}
menuBtn.addEventListener('click', () => setMenu(true));
$('[data-close]', sheet).addEventListener('click', () => setMenu(false));
sheet.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setMenu(false);
  if (e.key !== 'Tab') return;
  const items = $$('a, button', sheet);
  const [first, last] = [items[0], items[items.length - 1]];
  if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
  else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
});
$$('a', sheet).forEach((a) => a.addEventListener('click', () => setMenu(false)));

/* ---------- Page parts (each runs only where its markup exists) ---------- */
const carousel = $('[data-carousel]');
if (carousel) initCarousel(carousel, { reduceMotion });
initFrames($$('[data-frame]'));
const form = $('[data-form]');
if (form) initContact(form);

/* ---------- Motion ----------
   The hero story plays for everyone: it only moves when the visitor scrolls. Reduced motion drops
   the extras (Lenis smoothing, word staggers, blur, grain, the section line draws). The still
   version is the visitor's own choice (the hero's "Reduce motion" toggle, remembered) or the
   automatic fallback when the story fails to load. */
const html = document.documentElement;
const wantsStill = readPref() === 'still';
let lenis = null;
if (reduceMotion) html.classList.add('reduced');
else initSmooth();

// One scroll interface for the page, with or without Lenis.
const scroller = {
  on: (cb) =>
    lenis ? lenis.on('scroll', ({ scroll }) => cb(scroll)) : addEventListener('scroll', () => cb(scrollY), { passive: true }),
  to: (y) => {
    if (lenis) {
      lenis.resize(); // the pin may have grown the page since Lenis last measured
      lenis.scrollTo(y, { immediate: true, force: true });
    } else window.scrollTo({ top: y, behavior: 'instant' });
  },
  resize: () => lenis?.resize(),
};
initPage();

function readPref() {
  try {
    return localStorage.getItem('mm-hero');
  } catch {
    return null;
  }
}

function initSmooth() {
  lenis = new Lenis({ lerp: CHOREO.lenisLerp });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  if (import.meta.env.DEV) window.__lenis = lenis;
}

function initPage() {
  // In-page anchor links (#main, #founders) land under the nav and move focus to the heading.
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const target = $(a.hash);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + scrollY - navH();
      if (lenis) lenis.scrollTo(y, { onComplete: () => focusHeading(target) });
      else (window.scrollTo({ top: y, behavior: 'instant' }), focusHeading(target));
    }),
  );
  // Arriving with a hash (/about#founders): land under the nav.
  if (location.hash && $(location.hash)) {
    requestAnimationFrame(() => scroller.to($(location.hash).getBoundingClientRect().top + scrollY - navH()));
  }

  // Home: the hero opens at the top, full-screen, every time (no restored mid-story position).
  if ($('.hero')) {
    if (!location.hash) {
      history.scrollRestoration = 'manual';
      window.scrollTo(0, 0);
    }
    initMotionToggle();
    if (!wantsStill) {
      html.classList.add('motion');
      // The hero loads its own module (Home preloads it in the head, so it downloads alongside the
      // main script). If it fails to load or throws, the hero becomes the still version.
      const qa = new URLSearchParams(location.search).get('herofail'); // ?herofail=script simulates it
      (qa === 'script' ? Promise.reject(new Error('QA: hero script failure')) : import('./home-hero.js'))
        .then((m) => m.initHero({ scroller, nav, navH, reduced: reduceMotion }))
        .catch(() => {
          html.classList.remove('motion');
          html.classList.add('hero-failed');
          ScrollTrigger.refresh();
          scroller.resize();
        });
    }
  }

  // Shot lines draw once as a section arrives (with reduced motion they are simply there).
  if (!reduceMotion) {
    $$('.opener').forEach((op) => {
      gsap.from($('.shot', op), {
        scaleX: 0,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: { trigger: op, start: 'top 85%', once: true },
      });
    });
  }

  // Fonts and lazy images change heights; re-measure once they settle.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

// The hero's discreet "Reduce motion" / "Play animation" toggle, remembered on this device.
function initMotionToggle() {
  const btn = $('[data-motion-toggle]');
  if (!btn) return;
  btn.textContent = wantsStill ? 'Play animation' : 'Reduce motion';
  btn.setAttribute('aria-pressed', String(wantsStill));
  btn.addEventListener('click', () => {
    try {
      if (wantsStill) localStorage.removeItem('mm-hero');
      else localStorage.setItem('mm-hero', 'still');
    } catch {
      // storage blocked: the choice lasts for this visit only
    }
    window.scrollTo(0, 0);
    location.reload();
  });
}

function focusHeading(target) {
  const h = $('h1, h2', target) || target;
  h.setAttribute('tabindex', '-1');
  h.focus({ preventScroll: true });
}
