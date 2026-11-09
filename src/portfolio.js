// Portfolio browser windows: each live site loads into an interactive, scrollable iframe once its
// window nears the viewport. The screenshot underneath stays visible until the site has loaded, and
// stays as the fallback when the site may not be framed here (data-frame-hosts lists the only hosts
// that site allows to frame it).

const FRAME_TIMEOUT = 15000;
// Each site renders at a standard laptop viewport and is scaled to fit its window, so the layout is
// exactly what a desktop visitor sees (Noah, 2026-11-08), on every screen size.
const DESKTOP = { w: 1440, h: 900 };
const MIN_NATIVE = 1024;

export function initFrames(windows) {
  if (!windows.length) return;
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
    const native = W >= MIN_NATIVE;
    frame.width = native ? W : DESKTOP.w;
    frame.height = native ? view.clientHeight : DESKTOP.h;
    view.classList.toggle('is-native', native);
    view.style.setProperty('--frame-scale', native ? '1' : String(W / DESKTOP.w));
  };
  new ResizeObserver(fit).observe(view);
  fit();
  view.append(frame);
}
