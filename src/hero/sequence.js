// Canvas image-sequence scrubber. Frames live in `${base}/manifest.json` + numbered images.
// Until frames exist the canvas simply stays on the navy ground.

export function createSequence(canvas, base) {
  const ctx = canvas.getContext('2d');
  const state = { progress: 0 };
  let frames = [];
  let current = -1;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    current = -1;
    render();
  }

  // Nearest already-loaded frame, so fast scrolling never shows a blank canvas.
  function nearestLoaded(index) {
    for (let d = 0; d < frames.length; d++) {
      if (frames[index - d]?.complete) return frames[index - d];
      if (frames[index + d]?.complete) return frames[index + d];
    }
    return null;
  }

  function render() {
    if (!frames.length) return;
    const index = Math.round(state.progress * (frames.length - 1));
    if (index === current) return;
    const img = nearestLoaded(index);
    if (!img?.naturalWidth) return;
    current = img === frames[index] ? index : -1;

    const { width: cw, height: ch } = canvas;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  async function load() {
    let manifest;
    try {
      const res = await fetch(`${base}/manifest.json`);
      if (!res.ok) return;
      manifest = await res.json();
    } catch {
      return;
    }
    const name = (i) => manifest.pattern.replace('%04d', String(i + 1).padStart(4, '0'));
    frames = Array.from({ length: manifest.count }, () => new Image());

    // Coarse pass first (every 8th frame) so the whole scrub is usable early, then fill in.
    const order = new Set();
    for (let step = 8; step >= 1; step /= 2) {
      for (let i = 0; i < manifest.count; i += step) order.add(i);
    }
    order.forEach((i) => {
      frames[i].decoding = 'async';
      frames[i].onload = () => i === Math.round(state.progress * (frames.length - 1)) && render();
      frames[i].src = `${base}/${name(i)}`;
    });
  }

  window.addEventListener('resize', resize);
  resize();
  load();

  return { state, render };
}
