// Noah's portrait at 800px with exactly the crop and tone the site uses (founders.cjs), for cutout.
const sharp = require('sharp'); const SRC = 'C:/Claude Code/minute-men-marketing/assets/founders/'; const OUT = process.argv[2];
(async () => {
  const S = 1100, left = Math.round(648.5 - 0.4975 * 1100), top = Math.round(447 - 0.35 * 1100);
  const ethan = await sharp(SRC + 'ethan.jpg').extract({ left: Math.round(199 - 0.4975 * 400), top: Math.round(140 - 0.35 * 400), width: 400, height: 400 }).toBuffer();
  const noah400 = await sharp(SRC + 'noah.jpg').extract({ left, top, width: S, height: S }).resize(400, 400, { kernel: 'lanczos3' }).toBuffer();
  const bg = async (buf) => { const w = 400, s = Math.round(w * 0.07); const st = []; for (const l of [0, w - s]) { const r = await sharp(buf).extract({ left: l, top: Math.round(w * 0.18), width: s, height: Math.round(w * 0.3) }).toBuffer(); st.push((await sharp(r).stats()).channels.slice(0, 3).map((c) => c.mean)); } return [0, 1, 2].map((k) => (st[0][k] + st[1][k]) / 2); };
  const e = await bg(ethan), n = await bg(noah400); const gain = e.map((v, k) => v / n[k]); console.log('gain', gain.map((g) => g.toFixed(3)), 'ethan bg', e.map(Math.round));
  await sharp(SRC + 'noah.jpg').extract({ left, top, width: S, height: S }).resize(800, 800, { kernel: 'lanczos3' }).linear(gain, [0, 0, 0]).png().toFile(OUT);
  console.log('crop', { left, top, S });
})();
