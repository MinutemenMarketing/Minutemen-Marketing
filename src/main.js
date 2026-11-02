import '@fontsource/libre-caslon-text/latin-400.css';
import '@fontsource/libre-caslon-text/latin-700.css';
import '@fontsource-variable/hanken-grotesk';
import './styles/main.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { createSequence } from './hero/sequence.js';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (!reduceMotion.matches) {
  document.documentElement.classList.add('motion');

  const lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  const sequence = createSequence(document.querySelector('.hero__canvas'), '/frames/v1');
  const beats = gsap.utils.toArray('.beat');

  // One timeline for the whole hero: frame index and copy beats share the same scroll progress,
  // so scrolling up plays everything backward for free.
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
    },
  });

  tl.to(sequence.state, { progress: 1, ease: 'none', duration: 1, onUpdate: sequence.render }, 0);
  beats.forEach((beat, i) => {
    const at = i / beats.length;
    tl.fromTo(beat, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.06 }, at + (i ? 0.02 : 0));
    tl.to(beat, { autoAlpha: 0, y: -24, duration: 0.06 }, at + 1 / beats.length - 0.08);
  });
}
