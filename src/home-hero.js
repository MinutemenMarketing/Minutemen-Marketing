// Home hero: the pinned, scroll-scrubbed canvas story (see CLAUDE.md), its text beats, preloader,
// progress trail, skip control, and the nav fading out while you scroll down through it.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CHOREO } from './hero/choreography.js';
import { createStage } from './hero/stage.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// `reduced`: the visitor prefers reduced motion. The story still plays (it only moves when they
// scroll), but without the extras: plain opacity fades, no word stagger, no grain, no scrub lag.
export function initHero({ scroller, nav, navH, reduced }) {
  const hero = $('.hero');
  if (!reduced) hero.style.setProperty('--grain', `url(${grainTile()})`);
  $$('[data-words]').forEach(splitWords);

  const HIDDEN = reduced ? { autoAlpha: 0 } : { autoAlpha: 0, y: 16, filter: 'blur(6px)' };
  const SHOWN = reduced ? { autoAlpha: 1 } : { autoAlpha: 1, y: 0, filter: 'blur(0px)' };
  const stagger = (n) => (reduced ? 0 : n);
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
      gsap.fromTo(words(1), HIDDEN, { ...SHOWN, duration: reduced ? 0.6 : 1.1, ease: 'power2.out', stagger: stagger(0.06), delay: 0.35 });
    }, 450);
  };
  // If the story can't play (frames fail, or nothing arrives in 10s), drop to the still version:
  // the painting with the first line, then the stacked logo. Never a list of raw text.
  let failed = false;
  const fallBack = () => {
    if (failed) return;
    failed = true;
    mm?.revert(); // unpins the hero and undoes the scroll timeline
    gsap.killTweensOf([ring, ...words(1)]);
    gsap.set($$('.beat, .beat .w'), { clearProps: 'all' });
    document.documentElement.classList.remove('motion');
    document.documentElement.classList.add('hero-failed');
    nav.classList.remove('is-hidden');
    ScrollTrigger.refresh();
    scroller.resize();
  };

  let haveFirst = false;
  const stage = createStage(
    $('.hero__canvas'),
    (f, first) => {
      if (first) haveFirst = true;
      const shown = Math.min(1, f / 0.3);
      if (!lifted) gsap.to(ring, { strokeDashoffset: 1 - shown, duration: 0.5, ease: 'power1.out', overwrite: true });
      // Lift once the battlefield is in and enough of the opening has arrived (never sooner than 0.9s).
      if (haveFirst && shown >= 1) setTimeout(lift, Math.max(0, 900 - (performance.now() - shownAt)));
    },
    fallBack,
  );
  setTimeout(() => haveFirst && lift(), 4000); // slow connections: show the battlefield anyway
  setTimeout(() => !haveFirst && fallBack(), 10000); // the opening frame never arrived
  // QA: ?herofail shows what a failed frame load looks like on any build.
  if (new URLSearchParams(location.search).has('herofail')) setTimeout(fallBack, 600);
  if (import.meta.env.DEV) window.__hero = stage;

  // Scroll cue fades after the first move; the trail line tracks progress through the hero.
  const cue = $('.hero__cue');
  const trail = $('.hero__trail span');

  // Skip: jump straight past the hero to the first section, with the hero settled on its last
  // frame (no fast-forward through the story), and move focus there.
  const skip = $('[data-skip]');
  skip.addEventListener('click', () => {
    const intro = $('#main');
    scroller.to(intro.getBoundingClientRect().top + window.scrollY - navH());
    ScrollTrigger.update();
    ScrollTrigger.getById('hero')?.getTween()?.progress(1);
    const h = $('h1, h2', intro);
    h.setAttribute('tabindex', '-1');
    h.focus({ preventScroll: true });
  });

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
        scrub: reduced ? true : CHOREO.scrub,
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
          skip.classList.toggle('is-gone', state.p > 95);
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
      tl.set(el, SHOWN, b[n].in);
      tl.fromTo(ws, HIDDEN, { ...SHOWN, duration: fade, stagger: stagger((fade * 0.5) / ws.length) }, b[n].in);
      tl.to(el, { ...HIDDEN, duration: fade }, b[n].out);
    }
    gsap.set(['[data-beat="2"]', '[data-beat="3"]'], { autoAlpha: 0 });
  });

  // Nav: on at load; fades out as the reader scrolls down into the hero, back on scroll-up and for
  // good once the hero ends. Keyboard focus always brings it back.
  let lastY = 0;
  scroller.on((y) => {
    const pin = ScrollTrigger.getById('hero');
    const inHero = pin && y > 24 && y < pin.end - 1;
    if (!inHero || y < lastY - 2) nav.classList.remove('is-hidden');
    else if (y > lastY + 2) nav.classList.add('is-hidden');
    lastY = y;
  });
  nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));

  // This module loads after the page's first layout pass, so measure again now that the pin exists
  // (it moves every section below it).
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
  scroller.resize();
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
