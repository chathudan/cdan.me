export const site = {
  name: 'Chathura',
  tagline: 'Web & mobile apps, consulting, and workflow automation.',
  description:
    'Personal site of Chathura — I build web and mobile apps, offer consulting, and design workflow automations that free teams from busywork.',
  url: 'https://cdan.me',
  author: 'Chathura',
  email: 'cdanasiri@gmail.com',
  locale: 'en_AU',
  twitterHandle: '@chathuradw',
  location: { city: 'Melbourne', region: 'VIC', country: 'AU' },
  jobTitle: 'Senior Software Engineer',
  knowsAbout: [
    '.NET',
    'C#',
    'ASP.NET Core',
    'Azure',
    '.NET MAUI',
    'Xamarin',
    'Microservices',
    'REST API design',
    'Mobile app development',
    'Workflow automation',
    'DevOps',
    'Linux server administration',
    'PostgreSQL',
    'MS SQL Server',
    'Software architecture',
  ],
  social: {
    github: 'https://github.com/chathudan',
    linkedin: 'https://www.linkedin.com/in/chathurawijesinghe/',
    twitter: 'https://x.com/chathuradw',
  },
  nav: [
    { label: 'About', href: '/about/' },
    { label: 'Services', href: '/services/' },
    { label: 'Pricing', href: '/pricing/' },
    { label: 'Blog', href: '/blog/' },
    { label: 'Contact', href: '/contact/' },
  ],

  // Contact form posts to Web3Forms, which relays submissions to `email`.
  // The key below is a PUBLIC identifier: it only permits posting to this
  // one form, it is visible in the page source by design, and it is not a
  // credential. Grab a free one at https://web3forms.com — they email you a
  // key, no account required. Until it is replaced the form renders in a
  // disabled state with a mailto fallback, so the page is never broken.
  form: {
    endpoint: 'https://api.web3forms.com/submit',
    publicKey: '643eddb0-7880-48f5-a232-3d3a79c40cf4',
  },
};
