// Client-work carousel (Home), modelled on the Bang Bang Barbershop reviews carousel: the active
// card sits centred, its neighbours dimmed and slightly smaller, and the row's edges fade out. Moves
// only when asked: buttons, dots, swipe, arrow keys, or a click on a side card. No autoplay.

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// Sample testimonial text for layout checks. DEV ONLY: never in the production build, always
// labelled. TODO(client): real quotes with name, business, town and permission.
const DRAFT = 'Sample quote for layout only. A real client testimonial goes here once one is supplied.';

export function initCarousel(root, { reduceMotion }) {
  const track = $('[data-track]', root);
  const slides = $$('.slide', track);
  const dots = $('[data-dots]', root);
  let index = 0;

  if (import.meta.env.DEV) {
    slides.forEach((s) => {
      const q = document.createElement('blockquote');
      q.className = 'slide__draft';
      q.innerHTML = `<span class="slide__draft-label">Draft placeholder</span><p>${DRAFT}</p>`;
      $('figcaption', s).append(q);
    });
  }

  const dotBtns = slides.map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'carousel__dot';
    b.setAttribute('aria-label', `Show project ${i + 1} of ${slides.length}`);
    b.addEventListener('click', () => go(i));
    dots.append(b);
    return b;
  });

  // A copy of the last slide before the first and of the first after the last, so the active card
  // always has a neighbour on both sides and wrapping keeps moving forward. Copies are decorative.
  const n = slides.length;
  const clone = (s, logical) => {
    const c = s.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    c.inert = true;
    c.removeAttribute('aria-roledescription');
    c.removeAttribute('aria-label');
    c.dataset.logical = logical;
    c.addEventListener('click', () => go(logical === 0 ? index + 1 : index - 1));
    return c;
  };
  if (n > 1) {
    track.prepend(clone(slides[n - 1], n - 1));
    track.append(clone(slides[0], 0));
  }
  const items = $$('.slide', track); // physical order: [last copy], s0 … s(n-1), [first copy]
  const offset = n > 1 ? 1 : 0;
  let phys = index + offset;

  function place(animate = true) {
    track.classList.toggle('is-snapping', !animate);
    const view = root.querySelector('.carousel__view').clientWidth;
    const slideW = items[0].getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const x = view / 2 - (phys * (slideW + gap) + slideW / 2);
    track.style.transform = `translate3d(${x}px, 0, 0)`;
    items.forEach((s, i) => s.classList.toggle('is-active', i === phys));
    slides.forEach((s, i) => s.setAttribute('aria-current', String(i === index)));
    dotBtns.forEach((b, i) => b.setAttribute('aria-current', String(i === index)));
    if (!animate) {
      void track.offsetWidth; // apply the jump before transitions come back
      track.classList.remove('is-snapping');
    }
  }
  const layout = () => place(false);

  let snapTimer;
  function go(i) {
    clearTimeout(snapTimer);
    // Past either end: slide onto the copy, then jump to the real slide without animation.
    const target = i + offset;
    index = (i + n) % n;
    phys = n > 1 ? Math.max(0, Math.min(n + 1, target)) : index;
    place(!reduceMotion);
    if (phys !== index + offset) {
      snapTimer = setTimeout(() => {
        phys = index + offset;
        place(false);
      }, reduceMotion ? 0 : 920);
    }
  }

  $('[data-prev]', root).addEventListener('click', () => go(index - 1));
  $('[data-next]', root).addEventListener('click', () => go(index + 1));
  slides.forEach((s, i) => s.addEventListener('click', () => i !== index && go(i)));
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') (e.preventDefault(), go(index - 1));
    if (e.key === 'ArrowRight') (e.preventDefault(), go(index + 1));
  });

  // Swipe (touch or pen): a clear horizontal drag of 40px or more.
  let startX = null;
  let startY = 0;
  root.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    startX = e.clientX;
    startY = e.clientY;
  });
  root.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - startY)) go(index + (dx < 0 ? 1 : -1));
    startX = null;
  });

  if (reduceMotion) root.classList.add('is-instant');
  new ResizeObserver(layout).observe(root);
  layout();
}
