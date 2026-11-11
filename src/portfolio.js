// Portfolio browser windows: each live site loads into an interactive, scrollable iframe once its
// window nears the viewport. The screenshot underneath stays visible until the site has loaded, and
// stays as the fallback when the site may not be framed here (data-frame-hosts lists the only hosts
// that site allows to frame it).

const FRAME_TIMEOUT = 15000;
// Each site renders at a standard laptop viewport and is scaled to fit its window, so the layout is
// exactly what a desktop visitor sees (Noah, 2026-11-08), on every screen size.
const DESKTOP = { w: 1440, h: 900 };
const MIN_NATIVE = 1024;
// Phone windows render the site at the window's own width (its real mobile layout), but never
// narrower than the narrowest real phone: below 320px the client sites' text runs off the side.
const MIN_PHONE = 320;

export function initFrames(windows) {
  if (!windows.length) return;
  // Phones: the window is sized (in CSS) so the client name, the window and "Open Live Website" fit
  // on one screen; this measures the name block and the button of each project for that sum.
  const chrome = () => {
    for (const w of windows) {
      const li = w.closest('.project');
      const head = li?.querySelector('.project__head');
      const btn = li?.querySelector(':scope > .link-out');
      if (head && btn) li.style.setProperty('--chrome-h', Math.ceil(head.offsetHeight + btn.offsetHeight) + 'px');
    }
  };
  chrome();
  window.addEventListener('resize', chrome);
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        io.unobserve(en.target);
        mount(en.target);
      }
    },
    { rootMargin: '600px 0px' },
  );
  for (const w of windows) {
    const hosts = w.dataset.frameHosts?.split(/\s+/).filter(Boolean);
    if (hosts && !hosts.includes(location.hostname)) {
      w.classList.add('is-shot'); // framing blocked on this host: the screenshot is the window
      continue;
    }
    io.observe(w);
  }
}

function mount(win) {
  const view = win.querySelector('.browser__view');
  const frame = document.createElement('iframe');
  frame.className = 'browser__frame';
  frame.src = win.dataset.src;
  frame.title = win.dataset.title;
  frame.loading = 'lazy';
  // Out of the tab order: keyboard users take "Open Live Website" beside the window instead of
  // tabbing through someone else's whole site. Mouse, trackpad and touch still use the embed.
  frame.tabIndex = -1;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
  const timer = setTimeout(() => win.classList.add('is-shot'), FRAME_TIMEOUT);
  frame.addEventListener('load', () => {
    clearTimeout(timer);
    win.classList.remove('is-shot');
    win.classList.add('is-live');
  });
  view.setAttribute('data-lenis-prevent', ''); // wheel and touch scroll the site, not the page
  // Crisp windows (2026-11-08): a window 1024px or wider shows the site at its own width, unscaled,
  // exactly as if opened directly (still the site's desktop layout). A fractional CSS scale on the
  // 1440px page was resampled after drawing and looked frosted on 1x screens. Narrower windows (phones,
  // high-density screens) keep the 1440px desktop view scaled to fit.
  const fit = () => {
    const W = view.clientWidth;
    // Phones show a phone-shaped window (taller than wide): the site renders there unscaled at the
    // window's own size, which is its real mobile layout at full crispness (2026-11-10).
    const H = view.clientHeight;
    const phone = H > W;
    if (phone && W < MIN_PHONE) {
      // A window narrower than a phone: the 320px phone layout, scaled down to fit.
      frame.width = MIN_PHONE;
      frame.height = Math.round((H * MIN_PHONE) / W);
      view.classList.remove('is-native');
      view.style.setProperty('--frame-w', MIN_PHONE + 'px');
      view.style.setProperty('--frame-h', frame.height + 'px');
      view.style.setProperty('--frame-scale', String(W / MIN_PHONE));
      return;
    }
    const native = W >= MIN_NATIVE || phone;
    frame.width = native ? W : DESKTOP.w;
    frame.height = native ? H : DESKTOP.h;
    view.classList.toggle('is-native', native);
    view.style.removeProperty('--frame-w');
    view.style.removeProperty('--frame-h');
    view.style.setProperty('--frame-scale', native ? '1' : String(W / DESKTOP.w));
  };
  new ResizeObserver(fit).observe(view);
  fit();
  view.append(frame);
}
