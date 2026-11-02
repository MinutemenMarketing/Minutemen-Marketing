// Extract hero frames from an approved final with ffmpeg and write the manifest the scrubber reads.
// Usage: npm run frames -- assets/finals/hero.mp4 v1 [width=1920] [fps=24]
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [input, version, width = '1920', fps = '24'] = process.argv.slice(2);
if (!input || !version) {
  console.error('Usage: npm run frames -- <video> <version> [width] [fps]');
  process.exit(1);
}

const out = join('public', 'frames', version);
mkdirSync(out, { recursive: true });

execFileSync(
  'ffmpeg',
  ['-y', '-i', input, '-vf', `fps=${fps},scale=${width}:-2`, '-c:v', 'libwebp', '-quality', '78', join(out, 'f_%04d.webp')],
  { stdio: 'inherit' },
);

const count = readdirSync(out).filter((f) => f.endsWith('.webp')).length;
writeFileSync(join(out, 'manifest.json'), JSON.stringify({ count, pattern: 'f_%04d.webp' }, null, 2) + '\n');
console.log(`${count} frames → ${out}`);
