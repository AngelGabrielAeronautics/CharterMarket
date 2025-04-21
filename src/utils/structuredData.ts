export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Charter Aviation',
    url: 'https://charter.angelgabriel.co.za',
    logo: 'https://charter.angelgabriel.co.za/logo.png',
    sameAs: [
      'https://twitter.com/charteraviation',
      'https://facebook.com/charteraviation',
      'https://linkedin.com/company/charteraviation',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+27-XXX-XXX-XXXX',
      contactType: 'customer service',
      availableLanguage: ['English'],
    },
  };
}

export function generateServiceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Private Jet Charter',
    provider: {
      '@type': 'Organization',
      name: 'Charter Aviation',
    },
    description: 'Luxury private jet charter services for business and leisure travel.',
    areaServed: {
      '@type': 'Country',
      name: 'South Africa',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Charter Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Private Jet Charter',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Aircraft Management',
          },
        },
      ],
    },
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://charter.angelgabriel.co.za${item.url}`,
    })),
  };
} 