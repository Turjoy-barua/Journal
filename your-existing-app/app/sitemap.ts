import type {MetadataRoute} from 'next'
import {getPublishedArticles, getPublishedArticleCategories, getPublishedEditions} from '@/lib/contentstack'

export default async function sitemap():Promise<MetadataRoute.Sitemap> {
  const [articles, categories, editions] = await Promise.all([getPublishedArticles(), getPublishedArticleCategories(), getPublishedEditions()])
  const base = 'https://journal.parismus.fr'
  return [
    {url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1},
    ...['articles', 'editions', 'about', 'categories'].map((path) => ({url: `${base}/${path}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: .7})),
    ...articles.map((article) => ({url: `${base}/articles/${article.slug}`, lastModified: article.publicationDate ? new Date(article.publicationDate) : new Date(), changeFrequency: 'monthly' as const, priority: .7})),
    ...editions.map((edition) => ({url: `${base}/editions/${edition.slug}`, lastModified: edition.publicationDate ? new Date(edition.publicationDate) : new Date(), changeFrequency: 'monthly' as const, priority: .8})),
    ...categories.map((category) => ({url: `${base}/categories/${category.slug}`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: .5})),
  ]
}
