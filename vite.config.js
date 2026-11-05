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
  return out.join('\n      ');
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
  if (SITE.instagram) add('Instagram', SITE.instagram.replace(/^https?:\/\/(www\.)?/, ''), SITE.instagram, true);
  if (SITE.linkedin) add('LinkedIn', 'LinkedIn', SITE.linkedin, true);
  for (const o of SITE.other || []) if (o?.url) add(o.label || 'Link', o.label || o.url, o.url, true);
  return rows.join('');
}

// Build-time page assembly:
// - `<!-- @nav -->` / `<!-- @footer -->` → partials from src/partials, current tab aria-current="page"
// - `<!-- @head -->` → icon + Open Graph / Twitter tags from the page's own title, description, canonical
// - contact details and the contact form's on/off state from src/site-config.js
function pages({ dev }) {
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
          '<link rel="icon" href="/brand/logo-mark.svg" type="image/svg+xml" />',
          '<meta property="og:type" content="website" />',
          '<meta property="og:site_name" content="Minutemen Marketing" />',
          `<meta property="og:title" content="${title}" />`,
          `<meta property="og:description" content="${desc}" />`,
          `<meta property="og:url" content="${url}" />`,
          `<meta property="og:image" content="${ORIGIN}/og.jpg" />`,
          '<meta property="og:image:width" content="1200" />',
          '<meta property="og:image:height" content="630" />',
          '<meta name="twitter:card" content="summary_large_image" />',
        ].join('\n    ');
        let out = html
          .replace('<!-- @head -->', head)
          .replace('<!-- @nav -->', mark(read('nav')))
          .replace('<!-- @footer -->', mark(read('footer')).replace('<!-- @footer-contact -->', footerContactHtml()))
          .replace('<dl class="details" data-details-list></dl>', `<dl class="details" data-details-list>${detailsHtml()}</dl>`);
        // The form shows only with a Web3Forms key (always in dev, so it can be tested).
        if (SITE.web3formsKey || dev) {
          out = out.replace('<form class="form" data-form novalidate hidden>', '<form class="form" data-form novalidate>');
          out = out.replace(/<p class="form-off" data-form-off>[\s\S]*?<\/p>/, '');
        }
        return out;
      },
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [pages({ dev: command === 'serve' })],
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
