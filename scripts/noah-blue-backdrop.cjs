// Noah on a soft blue studio backdrop: lit centre falling off to the corners (like a painted studio
// paper), fine grain against banding; the cutout's alpha softened by half a pixel so edges sit in.
const sharp = require('sharp'); const [cut, outDir, prev] = process.argv.slice(2);
(async () => { const N = 800;
  const bg = Buffer.alloc(N * N * 3); const c0 = [150, 170, 192], c1 = [96, 116, 140];
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const dx = (x - N * 0.5) / N, dy = (y - N * 0.4) / N; const t = Math.min(1, Math.sqrt(dx * dx * 1.1 + dy * dy) / 0.72); const e = t * t * (3 - 2 * t); const n = rnd() * 3;
    for (let k = 0; k < 3; k++) bg[(y * N + x) * 3 + k] = Math.max(0, Math.min(255, Math.round(c0[k] + (c1[k] - c0[k]) * e + n))); }
  const { data: a, info } = await sharp(cut).toColourspace('srgb').ensureAlpha().raw({ depth: 'uchar' }).toBuffer({ resolveWithObject: true }); if (info.channels !== 4 || info.width !== N) throw new Error('unexpected ' + JSON.stringify(info));
  // soften alpha edge a touch
  const alpha = Buffer.alloc(N * N); for (let i = 0; i < N * N; i++) alpha[i] = a[i * 4 + 3];
  // The cutout drops the last rows at the frame's bottom edge: carry the subject down from row N-16.
  for (let y = N - 16; y < N; y++) for (let x = 0; x < N; x++) alpha[y * N + x] = Math.max(alpha[y * N + x], alpha[(N - 17) * N + x]);
  // Colours from the original crop (the cutout's RGB is unreliable where its alpha was 0).
  const src = await sharp(cut.replace('noah-cut.png', 'noah-800.png')).removeAlpha().raw({ depth: 'uchar' }).toBuffer();
  const sb = await sharp(alpha, { raw: { width: N, height: N, channels: 1 } }).blur(0.6).raw().toBuffer({ resolveWithObject: true }); const ch = sb.info.channels; const soft = Buffer.alloc(N * N); for (let i = 0; i < N * N; i++) soft[i] = sb.data[i * ch]; console.log('alpha blur channels', ch);
  const out = Buffer.alloc(N * N * 3);
  for (let i = 0; i < N * N; i++) { const al = soft[i] / 255; for (let k = 0; k < 3; k++) out[i * 3 + k] = Math.round(src[i * 3 + k] * al + bg[i * 3 + k] * (1 - al)); }
  const img = sharp(out, { raw: { width: N, height: N, channels: 3 } });
  const buf = await img.png().toBuffer();
  for (const w of [400, 240]) { const b = sharp(buf).resize(w, w, { kernel: 'lanczos3' });
    await b.clone().webp({ quality: 82 }).toFile(`${outDir}/noah-${w}.webp`); await b.clone().avif({ quality: 55 }).toFile(`${outDir}/noah-${w}.avif`); }
  const eth = await sharp('C:/Claude Code/minute-men-marketing/public/founders/ethan-400.webp').toBuffer();
  await sharp({ create: { width: 820, height: 400, channels: 3, background: '#f7f4ec' } }).composite([{ input: await sharp(buf).resize(400).toBuffer(), left: 0, top: 0 }, { input: eth, left: 420, top: 0 }]).jpeg({ quality: 88 }).toFile(prev);
})();
