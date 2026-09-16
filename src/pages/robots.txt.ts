import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL('/sitemap-index.xml', site).href;

  const body = `# ${site}
User-agent: *
Allow: /

Sitemap: ${sitemapUrl}

# Structured summary for LLM agents: /llms.txt
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
