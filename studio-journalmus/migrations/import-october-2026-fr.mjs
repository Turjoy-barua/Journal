import {createClient} from '@sanity/client'
import {readFile} from 'node:fs/promises'

const projectId = process.env.SANITY_PROJECT_ID || 'g57lcjmj'
const dataset = process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN

if (!token) throw new Error('Set SANITY_WRITE_TOKEN in the environment.')

const client = createClient({projectId, dataset, apiVersion: '2026-11-16', token, useCdn: false})
const source = JSON.parse(await readFile(new URL('./journalmus-october-2026-fr.json', import.meta.url), 'utf8'))
const prefix = 'journalmus-oct-2026-fr'
const categoryId = (key) => `${prefix}-category-${key}`
const authorId = (key) => `${prefix}-author-${key}`
const articleId = (key) => `${prefix}-article-${key}`
const slug = (value) => ({_type: 'slug', current: value})

const documents = [
  ...source.categories.map((category) => ({
    _id: categoryId(category.key),
    _type: 'category',
    title: category.title,
    slug: slug(category.slug),
  })),
  ...source.authors.map((author) => ({
    _id: authorId(author.key),
    _type: 'author',
    name: author.name,
    slug: slug(author.key),
    role: 'Contributeur·rice — Journalmus N02, octobre 2026',
  })),
  ...source.articles.map((article) => ({
    _id: `drafts.${articleId(article.key)}`,
    _type: 'article',
    title: article.title,
    slug: slug(article.slug),
    category: {_type: 'reference', _ref: categoryId(article.category)},
    author: {_type: 'reference', _ref: authorId(article.author)},
    publishedAt: source.source.publishedAt,
    readingTime: Math.max(1, Math.ceil(article.paragraphs.join(' ').split(/\s+/).length / 220)),
    demoContent: false,
    body: article.paragraphs.map((text, index) => ({
      _type: 'block',
      _key: `p${index + 1}`,
      style: 'normal',
      markDefs: [],
      children: [{_type: 'span', _key: `t${index + 1}`, text, marks: []}],
    })),
    seoTitle: article.title,
    seoDescription: `${article.category} · ${article.author} · Journalmus N02, October 2026. Source: ${source.source.url}`,
  })),
]

const transaction = client.transaction()
for (const document of documents) transaction.createIfNotExists(document)
await transaction.commit()
console.log(`Created ${source.categories.length} categories and ${source.authors.length} authors; imported ${source.articles.length} article drafts.`)
console.log(`Source: ${source.source.url}`)
