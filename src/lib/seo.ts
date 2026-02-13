import type { ConversionPair } from '@/types/conversion';
import { SITE_URL, categoryLabels } from './constants';

export function conversionMetaTitle(conversion: ConversionPair): string {
  return conversion.title;
}

export function conversionMetaDescription(conversion: ConversionPair): string {
  return conversion.description;
}

export function conversionStructuredData(conversion: ConversionPair) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: conversion.title,
    description: conversion.description,
    url: `${SITE_URL}/convert/${conversion.id}`,
    applicationCategory: 'BrowserApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: conversion.features.join(', '),
  };
}

export function faqStructuredData(faq: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function howToStructuredData(name: string, steps: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    step: steps.map((text, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text,
    })),
  };
}

export function collectionStructuredData(title: string, description: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: `${SITE_URL}${url}`,
  };
}

export function breadcrumbStructuredData(
  items: { name: string; url: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}
