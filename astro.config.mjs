import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://cdanme.com',
  build: {
    format: 'directory',
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
    },
  },
});
