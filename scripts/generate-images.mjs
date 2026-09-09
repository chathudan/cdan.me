#!/usr/bin/env node
// Rasterize social-share SVGs to PNGs so LinkedIn / Twitter / iMessage link
// previews render them reliably. Uses sharp (native, fast).
//
//   npm run og           # regenerate both PNGs from the SVG sources

import sharp from 'sharp';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const jobs = [
  {
    name: 'og image (social share preview)',
    input: 'src/assets/og-image.svg',
    output: 'public/og.png',
    width: 1200,
    height: 630,
  },
  {
    name: 'linkedin banner',
    input: 'src/assets/linkedin-banner.svg',
    output: 'public/linkedin-banner.png',
    width: 1584,
    height: 396,
  },
];

let failed = 0;

for (const job of jobs) {
  const src = path.join(root, job.input);
  const dst = path.join(root, job.output);

  if (!existsSync(src)) {
    console.error(`✗ ${job.name}: source not found at ${job.input}`);
    failed++;
    continue;
  }

  try {
    const svg = await readFile(src);
    await sharp(svg, { density: 300 })
      .resize(job.width, job.height, { fit: 'contain', background: '#0e0e10' })
      .png({ quality: 95, compressionLevel: 9 })
      .toFile(dst);
    const { size } = await stat(dst);
    console.log(`✓ ${job.name}: ${job.output} (${job.width}×${job.height}, ${(size / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error(`✗ ${job.name}: ${err.message}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n${failed} of ${jobs.length} jobs failed.`);
  process.exit(1);
}

console.log('\nDone. Commit public/og.png + public/linkedin-banner.png so the deployed site serves them.');
