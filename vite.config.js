import { existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { SITE } from './src/site-config.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ORIGIN = 'https://minutemenmarketing.com';

// The four pages. Each is a real HTML file, so every route loads directly and works without JS.
const PAGES = {
  home: { file: 'index.html', path: '/' },
  about: { file: 'about/index.html', path: '/about' },
  portfolio: { file: 'portfolio/index.html', path: '/portfolio' },
  contact: { file: 'contact/index.html', path: '/contact' },
  terms: { file: 'terms/index.html', path: '/terms' },
  notFound: { file: '404.html', path: '/404' }, // Vercel serves it for unknown addresses
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// tel: link with the country code (10-digit US numbers get +1), so phones dial it on tap.
const telHref = (p) => {
  const d = p.replace(/[^\d+]/g, '');
  return `tel:${d.startsWith('+') ? d : d.length === 10 ? `+1${d}` : d}`;
};

// Footer contact lines: email and phone, once supplied.
function footerContactHtml() {
  const out = [];
  if (SITE.workEmail) out.push(`<a href="mailto:${esc(SITE.workEmail)}">${esc(SITE.workEmail)}</a>`);
  if (SITE.phone) out.push(`<a href="${telHref(SITE.phone)}">${esc(SITE.phone)}</a>`);
  if (SITE.instagram) out.push(`<a href="${esc(SITE.instagram)}" target="_blank" rel="noopener">Instagram</a>`);
  if (SITE.linkedin) out.push(`<a href="${esc(SITE.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>`);
  return out.join('\n      ');
}

// Hero lines: wrap each word in <span class="w"> at build time (keeping <em> and other inline tags),
// so the staggered reveal animates the same elements the browser painted first. Splitting at runtime
// created new elements, and the browser then counted the reveal (seconds later) as the page's
// largest paint.
function splitWordsHtml(html) {
  return html.replace(/(<(\w+)([^>]*)\sdata-words>)([\s\S]*?)(<\/\2>)/g, (m, open, tag, attrs, inner, close) => {
    const body = inner
      .split(/(<[^>]+>)/)
      .map((part) => (part.startsWith('<') ? part : part.replace(/\S+/g, '<span class="w">$&</span>')))
      .join('');
    return `<${tag}${attrs} data-words="split">${body}${close}`;
  });
}

// Founder portraits (matched set in public/founders/, 240 and 400 px, AVIF + WebP).
const FOUNDER_ALT = {
  noah: 'Noah Medina, co-founder of Minutemen Marketing',
  ethan: 'Ethan Eghbali, co-founder of Minutemen Marketing',
};
function founderPhotoHtml(name, sizes) {
  const set = (ext) => `/founders/${name}-240.${ext} 240w, /founders/${name}-400.${ext} 400w`;
  return `<picture class="portrait">
                <source type="image/avif" srcset="${set('avif')}" sizes="${sizes}" />
                <source type="image/webp" srcset="${set('webp')}" sizes="${sizes}" />
                <img src="/founders/${name}-400.webp" width="400" height="400" alt="${FOUNDER_ALT[name]}" loading="lazy" decoding="async" />
              </picture>`;
}
// Small LinkedIn icon link for a founder card (only when the URL is set in site-config).
const LINKEDIN_ICON =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"/></svg>';
function founderLinkHtml(name, label) {
  const url = SITE.founders?.[name]?.linkedin;
  return url
    ? `<a class="founder-link" href="${esc(url)}" target="_blank" rel="noopener">${LINKEDIN_ICON}<span class="visually-hidden">${esc(label)} on LinkedIn (opens in a new tab)</span></a>`
    : '';
}

// Closing bands: a direct line to email and phone under the consultation button.
function directHtml() {
  const links = [];
  if (SITE.workEmail) links.push(`<a href="mailto:${esc(SITE.workEmail)}">${esc(SITE.workEmail)}</a>`);
  if (SITE.phone) links.push(`<a href="${telHref(SITE.phone)}">${esc(SITE.phone)}</a>`);
  return links.length ? `<p class="closing__direct">${links.join(' ')}</p>` : '';
}

// Contact details from src/site-config.js. Empty values are TODO(client) and are not rendered.
function detailsHtml() {
  const rows = [];
  const add = (label, text, href, ext) =>
    rows.push(
      `<div><dt>${label}</dt><dd><a href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${esc(text)}</a></dd></div>`,
    );
  if (SITE.workEmail) add('Email', SITE.workEmail, `mailto:${SITE.workEmail}`);
  if (SITE.otherEmail) add('Also', SITE.otherEmail, `mailto:${SITE.otherEmail}`);
  if (SITE.phone) add('Phone', SITE.phone, telHref(SITE.phone));
  if (SITE.instagram) add('Instagram', '@' + SITE.instagram.replace(/\/$/, '').split('/').pop(), SITE.instagram, true);
  if (SITE.linkedin) add('LinkedIn', 'LinkedIn', SITE.linkedin, true);
  for (const o of SITE.other || []) if (o?.url) add(o.label || 'Link', o.label || o.url, o.url, true);
  return rows.join('');
}

// Build-time page assembly:
// - `<!-- @nav -->` / `<!-- @footer -->` → partials from src/partials, current tab aria-current="page"
// - `<!-- @head -->` → icon + Open Graph / Twitter tags from the page's own title, description, canonical
// - contact details and the contact form's on/off state from src/site-config.js
function pages() {
  const read = (name) => readFileSync(resolve(__dirname, 'src/partials', `${name}.html`), 'utf8');
  const pathOf = (file) => {
    const rel = relative(__dirname, file).replace(/\\/g, '/');
    return Object.values(PAGES).find((p) => p.file === rel)?.path || '/';
  };
  return {
    name: 'mm-pages',
    // Dev server: serve /about, /portfolio, /contact like Vercel's cleanUrls does in production.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const [path, query = ''] = req.url.split('?');
        const page = Object.values(PAGES).find((p) => p.path !== '/' && (path === p.path || path === `${p.path}/`));
        if (page) req.url = `/${page.file}${query ? `?${query}` : ''}`;
        next();
      });
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const current = pathOf(ctx.filename);
        const mark = (s) =>
          s.replace(/<a ([^>]*?)href="([^"]+)"([^>]*)data-tab/g, (m, a, href, b) =>
            `<a ${a}href="${href}"${b}${href === current ? 'aria-current="page"' : ''}`,
          );
        const title = html.match(/<title>([^<]*)<\/title>/)?.[1] || 'Minutemen Marketing';
        const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] || '';
        const url = `${ORIGIN}${current === '/' ? '/' : current}`;
        const head = [
          // Icons: .ico for old browsers and crawlers, SVG for modern tabs, PNG for iOS/Android.
          '<link rel="icon" href="/favicon.ico" sizes="32x32 48x48" />',
          '<link rel="icon" href="/favicon.svg" type="image/svg+xml" />',
          '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
          '<link rel="manifest" href="/site.webmanifest" />',
          // Share cards (iMessage, Instagram/Facebook, LinkedIn read og:*; X reads twitter:*).
          '<meta property="og:type" content="website" />',
          '<meta property="og:site_name" content="Minutemen Marketing" />',
          '<meta property="og:locale" content="en_US" />',
          `<meta property="og:title" content="${title}" />`,
          `<meta property="og:description" content="${desc}" />`,
          `<meta property="og:url" content="${url}" />`,
          `<meta property="og:image" content="${ORIGIN}/og-v3.jpg" />`,
          `<meta property="og:image:secure_url" content="${ORIGIN}/og-v3.jpg" />`,
          '<meta property="og:image:type" content="image/jpeg" />',
          '<meta property="og:image:width" content="1200" />',
          '<meta property="og:image:height" content="630" />',
          '<meta property="og:image:alt" content="The Minutemen Marketing logo over a painting of minutemen firing in a line on a misty autumn field" />',
          '<meta name="twitter:card" content="summary_large_image" />',
          `<meta name="twitter:title" content="${title}" />`,
          `<meta name="twitter:description" content="${desc}" />`,
          `<meta name="twitter:image" content="${ORIGIN}/og-v3.jpg" />`,
        ].join('\n    ');
        let out = html
          .replace('<!-- @head -->', head)
          .replace('<!-- @nav -->', mark(read('nav')))
          .replace('<!-- @footer -->', mark(read('footer')).replace('<!-- @footer-contact -->', footerContactHtml()).replace('<!-- @terms -->', SITE.terms ? ' · <a href="/terms">Terms of Service</a>' : ''))
          .replace('<dl class="details" data-details-list></dl>', `<dl class="details" data-details-list>${detailsHtml()}</dl>`);
        out = out.replace(/<!-- @direct -->/g, directHtml());
        out = splitWordsHtml(out)
          .replace(/<!-- @photo:(\w+):([^>]*?) -->/g, (m, name, sizes) => founderPhotoHtml(name, sizes))
          .replace(/<!-- @founder-link:(\w+):([^>]*?) -->/g, (m, name, label) => founderLinkHtml(name, label));
        return out;
      },
    },
  };
}

// Production only: inline the stylesheet (about 9KB compressed) so the first paint doesn't wait for a
// separate request, and preload the Outfit file the hero headline uses (latin, variable).
function criticalPath() {
  return {
    name: 'mm-critical-path',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const bundle = ctx.bundle || {};
        let out = html.replace(/<link rel="stylesheet"[^>]*href="\/(assets\/[^"]+\.css)"[^>]*>/g, (m, file) => {
          const asset = bundle[file];
          return asset && asset.type === 'asset' ? `<style>${asset.source}</style>` : m;
        });
        const fonts = Object.keys(bundle).filter((f) => /outfit-latin-wght-normal-.*.woff2$/.test(f));
        const preload = fonts.map((f) => `<link rel="preload" as="font" type="font/woff2" href="/${f}" crossorigin />`).join('\n    ');
        // Home: fetch the hero module alongside the main script instead of after it runs.
        const hero = Object.keys(bundle).find((f) => /^assets\/home-hero-.*\.js$/.test(f));
        const heroPreload = hero && html.includes('class="hero"') ? `\n    <link rel="modulepreload" href="/${hero}" crossorigin />` : '';
        out = out.replace('</title>', `</title>\n    ${preload}${heroPreload}`);
        return out;
      },
    },
  };
}

export default defineConfig(() => ({
  plugins: [pages(), criticalPath()],
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        Object.entries(PAGES)
          .map(([name, p]) => [name, resolve(__dirname, p.file)])
          .filter(([, f]) => existsSync(f)),
      ),
    },
  },
}));
