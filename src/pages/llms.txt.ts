import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../site.config';
import { packages, opsPackages, rates } from '../pricing.config';

export const GET: APIRoute = async () => {
  const services = (await getCollection('services')).sort((a, b) => a.data.order - b.data.order);
  const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  const serviceLines = services
    .map((s) => `- [${s.data.title}](${site.url}/services/${s.slug}/): ${s.data.summary}`)
    .join('\n');

  const packageNames = [...packages, ...opsPackages]
    .map((p) => `${p.name} (${p.priceMax ? 'from ' : ''}A$${p.priceMin.toLocaleString('en-AU')}${p.unit ?? ''}${p.priceMax ? ` to A$${p.priceMax.toLocaleString('en-AU')}${p.unit ?? ''}` : ''})`)
    .join(', ');
  const hourlyRate = rates[0]?.price ?? '';

  const postLines = posts
    .map((p) => `- [${p.data.title}](${site.url}/blog/${p.slug}/): ${p.data.description}`)
    .join('\n');

  const body = `# ${site.name} — ${site.tagline}

> ${site.description}

Melbourne-based senior software engineer with fifteen years across backend, mobile,
and cloud engineering, available for select engagements with clients in Australia and
remotely. Core stack: C#/.NET Core, Azure, .NET MAUI, Linux server administration, and
PostgreSQL/MS SQL Server.

## Services
${serviceLines}

## Pricing
- [Packages & pricing](${site.url}/pricing/): ${packageNames}, plus an hourly rate starting at ${hourlyRate}.

## Blog
${postLines || '(no posts yet)'}

## Pages
- [About](${site.url}/about/): Background, career history, and how I work.
- [Contact](${site.url}/contact/): Email and enquiry form.

## Contact
- Email: ${site.email}
- GitHub: ${site.social.github}
- LinkedIn: ${site.social.linkedin}
- X: ${site.social.twitter}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
