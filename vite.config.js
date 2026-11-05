import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// The four pages. Each is a real HTML file, so every route loads directly and works without JS.
const PAGES = {
  home: { file: 'index.html', path: '/' },
  about: { file: 'about/index.html', path: '/about' },
  portfolio: { file: 'portfolio/index.html', path: '/portfolio' },
  contact: { file: 'contact/index.html', path: '/contact' },
};

// Shared nav and footer: `<!-- @nav -->` / `<!-- @footer -->` in a page are replaced with the
// partials from src/partials, and the current page's tab gets aria-current="page".
function partials() {
  const read = (name) => readFileSync(resolve(__dirname, 'src/partials', `${name}.html`), 'utf8');
  const pageOf = (file) => {
    const rel = file.replace(/\\/g, '/').replace(/^.*?\/(?=(?:about|portfolio|contact)\/index\.html$|index\.html$)/, '');
    return Object.entries(PAGES).find(([, p]) => p.file === rel)?.[1].path;
  };
  return {
    name: 'mm-partials',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const current = pageOf(ctx.filename) || '/';
        const mark = (s) =>
          s.replace(/<a ([^>]*?)href="([^"]+)"([^>]*)data-tab/g, (m, a, href, b) =>
            `<a ${a}href="${href}"${b}${href === current ? 'aria-current="page"' : ''}`,
          );
        return html.replace('<!-- @nav -->', mark(read('nav'))).replace('<!-- @footer -->', mark(read('footer')));
      },
    },
  };
}

export default defineConfig({
  plugins: [partials()],
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        Object.entries(PAGES)
          .map(([name, p]) => [name, resolve(__dirname, p.file)])
          .filter(([, f]) => {
            try {
              readFileSync(f);
              return true;
            } catch {
              return false; // pages not written yet
            }
          }),
      ),
    },
  },
});
