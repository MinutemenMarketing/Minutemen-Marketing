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

gsap.registerPlugin(ScrollTrigger);

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
// `?motion` forces the motion path for QA (the Claude browser pane always reports reduced motion).
const reduceMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches && !new URLSearchParams(location.search).has('motion');
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

/* ---------- Motion (skipped entirely with reduced motion) ---------- */
if (!reduceMotion) {
  document.documentElement.classList.add('motion');
  initMotion();
}

function initMotion() {
  const lenis = new Lenis({ lerp: CHOREO.lenisLerp });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  if (import.meta.env.DEV) window.__lenis = lenis;

  // In-page anchor links (#main, #founders) travel with Lenis and land focus on the target heading.
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const target = $(a.hash);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -navH(), onComplete: () => focusHeading(target) });
    }),
  );
  // Arriving with a hash (/about#founders): land under the nav.
  if (location.hash && $(location.hash)) {
    requestAnimationFrame(() => lenis.scrollTo($(location.hash), { immediate: true, offset: -navH() }));
  }

  // The hero (home only) loads its own module, so other pages never download it.
  if ($('.hero')) import('./home-hero.js').then((m) => m.initHero({ lenis, nav, navH }));

  // Shot lines draw once as a section arrives.
  $$('.opener').forEach((op) => {
    gsap.from($('.shot', op), {
      scaleX: 0,
      duration: 0.9,
      ease: 'power2.out',
      scrollTrigger: { trigger: op, start: 'top 85%', once: true },
    });
  });

  // Fonts and lazy images change heights; re-measure once they settle.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

function focusHeading(target) {
  const h = $('h1, h2', target) || target;
  h.setAttribute('tabindex', '-1');
  h.focus({ preventScroll: true });
}
