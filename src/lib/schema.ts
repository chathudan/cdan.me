import { site } from '../site.config';
import type { Package } from '../pricing.config';

export const PERSON_ID = `${site.url}/#person`;
export const WEBSITE_ID = `${site.url}/#website`;
export const BUSINESS_ID = `${site.url}/#business`;

const addressNode = {
  '@type': 'PostalAddress',
  addressLocality: site.location.city,
  addressRegion: site.location.region,
  addressCountry: site.location.country,
};

const areaServed = [
  { '@type': 'Country', name: 'Australia' },
  { '@type': 'Place', name: 'Worldwide (remote)' },
];

const socials = [site.social.github, site.social.linkedin, site.social.twitter];

export function personSchema() {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: site.author,
    url: site.url,
    email: site.email,
    jobTitle: site.jobTitle,
    sameAs: socials,
    knowsAbout: site.knowsAbout,
    address: addressNode,
    image: `${site.url}/og.png`,
  };
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: site.url,
    name: site.name,
    description: site.description,
    inLanguage: 'en-AU',
    publisher: { '@id': PERSON_ID },
  };
}

export function businessSchema() {
  return {
    '@type': 'ProfessionalService',
    '@id': BUSINESS_ID,
    name: 'Chathura — Software Engineering & Consulting',
    url: site.url,
    description: site.description,
    founder: { '@id': PERSON_ID },
    employee: { '@id': PERSON_ID },
    areaServed,
    priceRange: 'A$$',
    email: site.email,
    address: addressNode,
    sameAs: socials,
    image: `${site.url}/og.png`,
  };
}

export function serviceSchema({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    '@type': 'Service',
    serviceType: name,
    name,
    provider: { '@id': BUSINESS_ID },
    url,
    description,
    areaServed,
  };
}

export function blogPostingSchema({
  title,
  description,
  url,
  date,
  updated,
  image,
  tags,
}: {
  title: string;
  description: string;
  url: string;
  date: Date;
  updated?: Date;
  image?: string;
  tags?: string[];
}) {
  return {
    '@type': 'BlogPosting',
    headline: title,
    description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: date.toISOString(),
    dateModified: (updated ?? date).toISOString(),
    author: { '@id': PERSON_ID },
    publisher: { '@id': PERSON_ID },
    image: new URL(image ?? '/og.png', site.url).href,
    keywords: (tags ?? []).join(', '),
    inLanguage: 'en-AU',
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function offerFor(pkg: Package) {
  const priceSpecification = {
    '@type': 'PriceSpecification',
    priceCurrency: 'AUD',
    valueAddedTaxIncluded: false,
    ...(pkg.priceMax
      ? { minPrice: pkg.priceMin, maxPrice: pkg.priceMax }
      : { price: pkg.priceMin }),
  };

  return {
    '@type': 'Offer',
    name: pkg.name,
    description: pkg.tagline,
    ...(pkg.priceMax ? {} : { price: pkg.priceMin }),
    priceCurrency: 'AUD',
    url: `${site.url}/contact/?package=${pkg.id}`,
    itemOffered: { '@type': 'Service', name: pkg.name },
    priceSpecification,
  };
}

export function offerCatalogSchema(packages: Package[], opsPackages: Package[]) {
  return {
    '@type': 'OfferCatalog',
    '@id': `${site.url}/pricing/#catalog`,
    name: 'Packages & pricing',
    provider: { '@id': BUSINESS_ID },
    itemListElement: [...packages, ...opsPackages].map(offerFor),
  };
}
