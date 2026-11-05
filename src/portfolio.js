// Portfolio browser windows: each live site loads into an interactive, scrollable iframe once its
// window nears the viewport. The screenshot underneath stays visible until the site has loaded, and
// stays as the fallback when the site may not be framed here (data-frame-hosts lists the only hosts
// that site allows to frame it).

const FRAME_TIMEOUT = 15000;

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
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
  const timer = setTimeout(() => win.classList.add('is-shot'), FRAME_TIMEOUT);
  frame.addEventListener('load', () => {
    clearTimeout(timer);
    win.classList.remove('is-shot');
    win.classList.add('is-live');
  });
  view.setAttribute('data-lenis-prevent', ''); // wheel and touch scroll the site, not the page
  view.append(frame);
}
