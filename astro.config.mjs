import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/** Paths that get a bump above the default 0.5 priority, checked longest-prefix-first. */
function priorityFor(pathname) {
  if (pathname === '/') return 1.0;
  if (pathname === '/services/' || pathname === '/pricing/') return 0.9;
  if (pathname === '/about/' || pathname === '/contact/') return 0.8;
  if (pathname === '/blog/') return 0.7;
  if (/^\/services\/[^/]+\/$/.test(pathname)) return 0.8;
  if (/^\/blog\/[^/]+\/$/.test(pathname)) return 0.6;
  return 0.5;
}

function changefreqFor(pathname) {
  if (/^\/blog\/[^/]+\/$/.test(pathname) || /^\/services\/[^/]+\/$/.test(pathname)) {
    return 'monthly';
  }
  return 'weekly';
}

export default defineConfig({
  site: 'https://cdan.me',
  build: {
    format: 'directory',
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
    },
  },
  integrations: [
    sitemap({
      changefreq: 'weekly',
      serialize(item) {
        const pathname = new URL(item.url).pathname;
        return {
          ...item,
          changefreq: changefreqFor(pathname),
          priority: priorityFor(pathname),
        };
      },
    }),
  ],
});
