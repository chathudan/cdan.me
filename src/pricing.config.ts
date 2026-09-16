/**
 * Package and rate data, shared by /pricing/ (the cards) and /contact/
 * (the "what do you need" dropdown). Edit prices here — nowhere else.
 *
 * All amounts are Australian dollars, excluding GST. Every package is a RANGE:
 * `priceMin` is the honest starting point for a straightforward build and what
 * the card leads with; `priceMax` is the ceiling for the full scope. Quoting a
 * range keeps the entry price attractive without capping the upside on bigger
 * jobs — and the hours on each card are what tie a quote to a point in it.
 */

export interface Package {
  id: string;
  name: string;
  /** Starting price — the number the card leads with. */
  priceMin: number;
  /** Ceiling for the full scope. Omit only for a genuinely fixed price. */
  priceMax?: number;
  unit?: string;
  timeline: string;
  /** Hours the range covers, low end to high. Past the top, the hourly rate applies. */
  effort: string;
  tagline: string;
  includes: string[];
}

/** Fixed-scope builds. Ordered cheapest first — the grid reads as a ladder. */
export const packages: Package[] = [
  {
    id: 'starter-site',
    name: 'Starter site',
    priceMin: 550,
    priceMax: 1200,
    timeline: 'Two to four days',
    effort: '4–8 hours',
    tagline: 'One page, off a clean template, live this week. The cheapest way to exist online properly.',
    includes: [
      'Single page built on a proven template',
      'Your copy and images, tidied up by me',
      'Mobile-first, fast, accessible',
      'Contact form wired to your inbox',
      'Domain, HTTPS and hosting set up',
    ],
  },
  {
    id: 'business-website',
    name: 'Business website',
    priceMin: 1900,
    priceMax: 7500,
    timeline: 'One to three weeks',
    effort: '12–47 hours',
    tagline: 'The site most small businesses actually need, and no more.',
    includes: [
      'Up to six pages',
      'Blog or news section you can update yourself',
      'Contact form, analytics, SEO basics',
      'Domain, HTTPS and hosting set up',
      'Two rounds of revisions',
      'Thirty days of post-launch fixes included',
    ],
  },
  {
    id: 'web-app',
    name: 'Web app',
    priceMin: 9000,
    priceMax: 30000,
    timeline: 'Six to twelve weeks',
    effort: '56–190 hours',
    tagline: 'A real application — accounts, data, an admin view that works.',
    includes: [
      'Login and user accounts',
      'Database design and the screens on top of it',
      'Admin area for you to run the thing',
      'API for anything that needs to talk to it',
      'Deployed with CI/CD, monitoring and backups',
    ],
  },
  {
    id: 'mobile-app',
    name: 'Mobile app',
    priceMin: 12000,
    priceMax: 35000,
    timeline: 'Eight to fourteen weeks',
    effort: '75–219 hours',
    tagline: 'iOS and Android from one codebase, submitted to both stores.',
    includes: [
      'Cross-platform build (.NET MAUI or similar)',
      'Backend and API if you need one',
      'Store listings, signing and submission handled',
      'Crash reporting and analytics',
      'One post-approval fix round',
    ],
  },
];

/** Ongoing / infrastructure work. Sold alongside a build or on its own. */
export const opsPackages: Package[] = [
  {
    id: 'devops-setup',
    name: 'Ship & host it',
    priceMin: 1200,
    priceMax: 4500,
    timeline: 'Two to five days',
    effort: '8–28 hours',
    tagline: 'For a codebase that works but has no safe way to reach users.',
    includes: [
      'CI/CD pipeline — push to deploy',
      'Server, domain, HTTPS and certificates',
      'Automated backups you can actually restore',
      'Uptime and error monitoring with alerts',
      'A written runbook so you are not locked to me',
    ],
  },
  {
    id: 'care-plan',
    name: 'Care plan',
    priceMin: 79,
    priceMax: 600,
    unit: '/month',
    timeline: 'Rolling, cancel anytime',
    effort: '30 min – 4 hours a month',
    tagline: 'I keep it patched, backed up and online so you can forget it.',
    includes: [
      'Security patches and dependency updates',
      'Backup checks and uptime monitoring',
      'Certificate and domain renewals',
      'A small monthly allowance for tweaks',
      'Priority when something breaks',
    ],
  },
];

/** Hourly ladder for work that does not fit a package. Mirrors the service page. */
export const rates = [
  { label: 'Ad hoc', price: 'A$160/hr', note: 'No commitment, no minimum beyond the first hour.' },
  { label: '10 hours', price: 'A$1,500', note: 'A$150/hr — a decent backlog clear-out.' },
  { label: '25 hours', price: 'A$3,500', note: 'A$140/hr — a feature, a migration, or a month of upkeep.' },
  { label: '50 hours', price: 'A$6,500', note: 'A$130/hr — best rate; a part-time engineer on call.' },
];

export const allPackages = [...packages, ...opsPackages];
