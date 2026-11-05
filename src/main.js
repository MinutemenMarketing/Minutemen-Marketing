import '@fontsource/libre-caslon-text/latin-400.css';
import '@fontsource/libre-caslon-text/latin-400-italic.css';
import '@fontsource-variable/hanken-grotesk';
import './styles/main.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { CHOREO } from './hero/choreography.js';
import { createStage } from './hero/stage.js';

gsap.registerPlugin(ScrollTrigger);

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
// `?motion` forces the motion path for QA (the Claude browser pane always reports reduced motion).
const reduceMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches && !new URLSearchParams(location.search).has('motion');
const nav = $('[data-nav]');
const navH = () => nav.offsetHeight;

$('[data-year]').textContent = new Date().getFullYear();

/* ---------- Menu sheet ---------- */
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

/* ---------- Form: validate on blur, never report a false success ---------- */
const form = $('[data-form]');
const status = $('[data-status]');
if (form) initForm();
function initForm() {
function check(field) {
  const input = $('input, textarea', field);
  let msg = '';
  if (input.required && !input.value.trim()) msg = `Please add your ${$('label', field).firstChild.textContent.trim().toLowerCase()}.`;
  else if (input.value && !input.checkValidity()) msg = input.type === 'email' ? 'Please enter an email like name@business.com.' : 'Please enter a full web address, starting with https://.';
  let err = $('.err', field);
  if (msg && !err) {
    err = document.createElement('p');
    err.className = 'err';
    err.id = `${input.id}-err`;
    field.append(err);
  }
  if (err) err.textContent = msg;
  input.setAttribute('aria-invalid', String(Boolean(msg)));
  if (msg) input.setAttribute('aria-describedby', err.id);
  else input.removeAttribute('aria-describedby');
  return !msg;
}
$$('.field', form).forEach((f) => $('input, textarea', f).addEventListener('blur', () => check(f)));
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const fields = $$('.field', form);
  const bad = fields.filter((f) => !check(f));
  if (bad.length) {
    $('input, textarea', bad[0]).focus();
    return;
  }
  // TODO(client): inquiry endpoint. Until one exists, say so plainly and point to email.
  status.textContent = "Our form isn't connected yet. Please email hello@minutemenmarketing.com and we'll reply quickly.";
});
}

/* ---------- Reduced motion: static page, nav always visible, no scroll effects ---------- */
if (!reduceMotion) {
  document.documentElement.classList.add('motion');
  initMotion();
}

function initMotion() {
  const lenis = new Lenis({ lerp: CHOREO.lenisLerp });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Anchor links travel with Lenis and land focus on the target's heading.
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const target = $(a.hash);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, {
        offset: a.hash === '#top' ? 0 : -navH(),
        onComplete: () => {
          const h = $('h1, h2', target) || target;
          h.setAttribute('tabindex', '-1');
          h.focus({ preventScroll: true });
        },
      });
    }),
  );

  /* ---------- Hero ---------- */
  const hero = $('.hero');
  hero.style.setProperty('--grain', `url(${grainTile()})`);
  $$('[data-words]').forEach(splitWords);

  const HIDDEN = { autoAlpha: 0, y: 16, filter: 'blur(6px)' };
  const SHOWN = { autoAlpha: 1, y: 0, filter: 'blur(0px)' };
  const fade = CHOREO.textFade;
  const words = (beat) => $$(`[data-beat="${beat}"] .w`);

  // Preloader: the ring draws with the opening frames, then lifts. The story's later frames keep
  // loading behind the scenes in story order, so nobody waits for the globe to see the battlefield.
  const preload = $('.preload');
  const ring = $('.preload__ring');
  const shownAt = performance.now();
  let lifted = false;
  const lift = () => {
    if (lifted) return;
    lifted = true;
    gsap.to(ring, { strokeDashoffset: 0, duration: 0.4, ease: 'power2.out' });
    setTimeout(() => {
      preload.classList.add('is-done');
      gsap.fromTo(words(1), HIDDEN, { ...SHOWN, duration: 1.1, ease: 'power2.out', stagger: 0.06, delay: 0.35 });
    }, 450);
  };
  let haveFirst = false;
  const stage = createStage($('.hero__canvas'), (f, first) => {
    if (first) haveFirst = true;
    const shown = Math.min(1, f / 0.3);
    if (!lifted) gsap.to(ring, { strokeDashoffset: 1 - shown, duration: 0.5, ease: 'power1.out', overwrite: true });
    // Lift once the battlefield is in and enough of the opening has arrived (never sooner than 0.9s).
    if (haveFirst && shown >= 1) setTimeout(lift, Math.max(0, 900 - (performance.now() - shownAt)));
  });
  setTimeout(() => haveFirst && lift(), 4000); // slow connections: show the battlefield anyway
  if (import.meta.env.DEV) window.__hero = stage;

  // Scroll cue fades after the first move; the trail line tracks progress through the hero.
  const cue = $('.hero__cue');
  const trail = $('.hero__trail span');

  // Beat 3 sits below the globe circle, never over it.
  const placeBeat3 = () => {
    const c = stage.circle();
    $('.beat--3').style.setProperty('--below', `${Math.round(c.y + c.d / 2 + 24)}px`);
  };
  placeBeat3();
  window.addEventListener('resize', placeBeat3);

  // Beat 1 fades in, word by word, when the preloader lifts; the timeline only fades it out.
  gsap.set('[data-beat="1"]', { autoAlpha: 1 });
  gsap.set(words(1), HIDDEN);

  const mm = gsap.matchMedia();
  mm.add({ desktop: '(min-width: 768px)', mobile: '(max-width: 767px)' }, (ctx) => {
    const length = ctx.conditions.desktop ? CHOREO.pin.desktop : CHOREO.pin.mobile;
    const state = { p: 0 };
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: `+=${length}%`,
        id: 'hero',
        pin: '.hero__stage',
        scrub: CHOREO.scrub,
        invalidateOnRefresh: true,
      },
    });
    // One linear progress track (0–100) drives the canvas; holds are simply ranges where the
    // scene logic keeps the same frame.
    tl.to(
      state,
      {
        p: 100,
        duration: 100,
        onUpdate: () => {
          stage.set(state.p);
          gsap.set(trail, { scaleX: state.p / 100 });
          if (state.p > 0.4) cue.classList.add('is-gone');
        },
      },
      0,
    );

    // Each beat: its words rise into place with a slight stagger; the whole line fades out.
    const b = CHOREO.beats;
    tl.to('[data-beat="1"]', { ...HIDDEN, duration: fade }, b[1].out);
    for (const n of [2, 3]) {
      const el = `[data-beat="${n}"]`;
      const ws = words(n);
      tl.set(el, { autoAlpha: 1, y: 0, filter: 'blur(0px)' }, b[n].in);
      tl.fromTo(ws, HIDDEN, { ...SHOWN, duration: fade, stagger: (fade * 0.5) / ws.length }, b[n].in);
      tl.to(el, { ...HIDDEN, duration: fade }, b[n].out);
    }
    gsap.set(['[data-beat="2"]', '[data-beat="3"]'], { autoAlpha: 0 });
  });

  // Nav: on at load; fades out as the reader scrolls down into the hero, back on scroll-up and for
  // good once the hero ends. Keyboard focus always brings it back.
  let lastY = 0;
  lenis.on('scroll', ({ scroll: y }) => {
    const pin = ScrollTrigger.getById('hero');
    const inHero = pin && y > 24 && y < pin.end - 1;
    if (!inHero || y < lastY - 2) nav.classList.remove('is-hidden');
    else if (y > lastY + 2) nav.classList.add('is-hidden');
    lastY = y;
  });
  nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));

  /* ---------- Shot lines draw once as a section arrives ---------- */
  $$('.opener').forEach((op) => {
    if (op.closest('.chapter')) return; // chapters animate their own
    gsap.from($('.shot', op), {
      scaleX: 0,
      duration: 0.9,
      ease: 'power2.out',
      scrollTrigger: { trigger: op, start: 'top 85%', once: true },
    });
  });

  /* ---------- Chapters: one brief pinned moment each ---------- */
  // The whole chapter holds (headline + its sentence), so there is no gap between them.
  $$('.chapter').forEach((ch) => {
    const head = $('.chapter__head', ch);
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ch,
        start: () => `top top+=${navH()}`,
        end: '+=55%',
        pin: ch,
        scrub: CHOREO.scrub,
      },
    });
    tl.from($('.shot', head), { scaleX: 0, duration: 1, ease: 'power2.out' })
      .from($('.eyebrow', head), { autoAlpha: 0, duration: 0.5 }, 0.5)
      .fromTo($('.chapter__h', head), HIDDEN, { ...SHOWN, duration: 1 }, 0.7)
      .to({}, { duration: 0.8 }); // short hold before the content scrolls up
  });

  /* ---------- Work → Contact cross-fade ---------- */
  gsap.timeline({
    scrollTrigger: { trigger: '.bridge__frame', start: 'top top', end: '+=70%', pin: true, scrub: CHOREO.scrub },
  })
    .to('.bridge__a', { opacity: 0, ease: 'none', duration: 1 }, 0)
    .to('.bridge__b', { opacity: 1, ease: 'none', duration: 1 }, 0);

  // Fonts and lazy images change heights; re-measure once they settle.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

// Wrap each word in a span (keeping <em> and other inline markup) so words can reveal in turn.
function splitWords(el) {
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.append(part);
          const span = document.createElement('span');
          span.className = 'w';
          span.textContent = part;
          frag.append(span);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    }
  };
  walk(el);
}

// A small tile of film grain, generated once (no image request).
function grainTile() {
  const c = document.createElement('canvas');
  c.width = c.height = 160;
  const x = c.getContext('2d');
  const id = x.createImageData(160, 160);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 120;
    id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
    id.data[i + 3] = 255;
  }
  x.putImageData(id, 0, 0);
  return c.toDataURL('image/png');
}
