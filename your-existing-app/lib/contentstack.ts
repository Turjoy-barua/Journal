import type {Story} from './content'
import firstEditionSeed from '../content/back-to-school-no-1.json'
import secondEditionSeed from '../content/autumn-is-here-no-2.json'

type ContentstackAsset = {
  url?: string
  title?: string
  description?: string
  filename?: string
}

type Entry = Record<string, any> & {uid?: string; _content_type_uid?: string}
type DeliveryResponse = {entries?: Entry[]; includes?: {entry?: Entry[]}}

export type JournalArticle = Story & {
  uid: string
  publicationDate: string
  featured: boolean
  editionUid?: string
  richTextContent: unknown
}

export type JournalEdition = {
  uid: string
  title: string
  slug: string
  editionNumber: number
  month: string
  year: number
  publicationDate: string
  coverImage: string
  coverAlt: string
  subtitle: string
  introduction: unknown
  stories: JournalArticle[]
  featuredStory: JournalArticle | null
  themeAccent?: string
}

const apiKey = process.env.CONTENTSTACK_API_KEY
const deliveryToken = process.env.CONTENTSTACK_DELIVERY_TOKEN
const environment = process.env.CONTENTSTACK_ENVIRONMENT || 'production'
const locale = process.env.CONTENTSTACK_LOCALE || 'fr-fr'
const apiHost = (process.env.CONTENTSTACK_API_HOST || 'cdn.contentstack.io').replace(/^https?:\/\//, '')
const configured = Boolean(apiKey && deliveryToken)

function localSeedEnabled() {
  return process.env.NODE_ENV !== 'production' && process.env.JOURNAL_USE_LOCAL_SEED !== 'false'
}

const localEditionSeeds = [firstEditionSeed, secondEditionSeed]

function localSeedArticles(): JournalArticle[] {
  return localEditionSeeds.flatMap((seed) => seed.articles.map((article) => ({
      ...article,
      date: dateLabel(article.publicationDate),
      body: [],
      richTextContent: article.richTextContent,
    })))
}

function localSeedEditions(): JournalEdition[] {
  const articles = localSeedArticles()
  return localEditionSeeds.map(({edition}) => {
    const stories = edition.storySlugs.map((slug) => articles.find((article) => article.slug === slug)).filter((article): article is JournalArticle => Boolean(article))
    return {...edition, introduction: edition.introduction, stories, featuredStory: stories.find((story) => story.slug === edition.featuredStorySlug) || null}
  }).sort((a, b) => (Date.parse(b.publicationDate) || 0) - (Date.parse(a.publicationDate) || 0))
}

function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function assetUrl(asset: ContentstackAsset | ContentstackAsset[] | string | undefined) {
  if (typeof asset === 'string') return asset
  const first = Array.isArray(asset) ? asset[0] : asset
  return first?.url || ''
}

function assetAlt(asset: ContentstackAsset | ContentstackAsset[] | undefined, fallback: string) {
  const first = Array.isArray(asset) ? asset[0] : asset
  return first?.description || first?.title || first?.filename || fallback
}

function dateLabel(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale, {dateStyle: 'long'}).format(date)
}

async function fetchEntries(contentType: string, include: string[] = []): Promise<DeliveryResponse> {
  if (!configured) return {entries: []}

  const entries: Entry[] = []
  const includedEntries = new Map<string, Entry>()
  const limit = 100
  let skip = 0

  while (true) {
    const params = new URLSearchParams({environment, locale, limit: String(limit), skip: String(skip)})
    for (const field of include) params.append('include[]', field)
    const response = await fetch(`https://${apiHost}/v3/content_types/${contentType}/entries?${params}`, {
      headers: {api_key: apiKey!, access_token: deliveryToken!},
      next: {revalidate: 60},
    })

    if (!response.ok) {
      const detail = await response.text()
      throw new Error(`Contentstack ${contentType} request failed (${response.status}): ${detail.slice(0, 240)}`)
    }

    const page = (await response.json()) as DeliveryResponse
    const current = page.entries || []
    entries.push(...current)
    for (const included of page.includes?.entry || []) {
      if (included.uid) includedEntries.set(included.uid, included)
    }
    if (current.length < limit) break
    skip += current.length
  }

  return {entries, includes: {entry: [...includedEntries.values()]}}
}

function entryMap(response: DeliveryResponse) {
  return new Map([...(response.includes?.entry || []), ...(response.entries || [])].filter((entry) => entry.uid).map((entry) => [entry.uid!, entry]))
}

function resolveReference(value: unknown, entries: Map<string, Entry>): Entry | undefined {
  const reference = Array.isArray(value) ? value[0] : value
  if (!reference || typeof reference !== 'object') return undefined
  const entry = reference as Entry
  if (entry.title && entry.slug) return entry
  return entry.uid ? entries.get(entry.uid) : undefined
}

function resolveReferences(value: unknown, entries: Map<string, Entry>): Entry[] {
  const list = Array.isArray(value) ? value : value ? [value] : []
  return list.map((item) => resolveReference(item, entries)).filter((entry): entry is Entry => Boolean(entry))
}

function isPublishedEdition(entry?: Entry) {
  return Boolean(entry && String(entry.status || '').toLowerCase() === 'published')
}

function normalizeArticle(entry: Entry, edition?: Entry, references = new Map<string, Entry>()): JournalArticle {
  const title = String(entry.title || 'Untitled story')
  const categoryEntry = resolveReference(entry.category, references)
  const authorEntry = resolveReference(entry.author, references)
  const category = String(categoryEntry?.title || entry.category || 'Journal')
  const cover = entry.cover_image as ContentstackAsset | ContentstackAsset[] | undefined
  const publicationDate = String(entry.publication_date || '')
  const readingMinutes = Number(entry.reading_time) || 5
  const richTextContent = entry.rich_text_content || null
  const plainText = (entry.excerpt || entry.subtitle || '').toString()

  return {
    uid: String(entry.uid || entry.slug || slugify(title)),
    slug: String(entry.slug || ''),
    title,
    subtitle: String(entry.subtitle || ''),
    category,
    categorySlug: String(categoryEntry?.slug || slugify(category)),
    author: String(authorEntry?.name || entry.author?.name || entry.author || 'Parismus Journal'),
    date: dateLabel(publicationDate),
    publicationDate,
    readingTime: `${readingMinutes} min`,
    excerpt: plainText,
    image: assetUrl(cover),
    imageAlt: assetAlt(cover, title),
    body: [],
    richBody: undefined,
    featured: Boolean(entry.featured),
    editionUid: edition?.uid,
    richTextContent,
  }
}

function normalizeEdition(entry: Entry, references: Map<string, Entry>): JournalEdition {
  const articles = resolveReferences(entry.stories, references)
  const featured = resolveReference(entry.featured_story, references)
  const featuredArticle = featured ? normalizeArticle(featured, entry, references) : null
  const stories = articles
    .map((article) => normalizeArticle(article, entry, references))
  const cover = entry.cover_image as ContentstackAsset | ContentstackAsset[] | undefined

  return {
    uid: String(entry.uid || ''),
    title: String(entry.title || 'Journalmus'),
    slug: String(entry.slug || ''),
    editionNumber: Number(entry.edition_number) || 0,
    month: String(entry.month || ''),
    year: Number(entry.year) || 0,
    publicationDate: String(entry.publication_date || ''),
    coverImage: assetUrl(cover),
    coverAlt: assetAlt(cover, String(entry.title || 'Journalmus edition cover')),
    subtitle: String(entry.subtitle || ''),
    introduction: entry.introduction || null,
    stories,
    featuredStory: featuredArticle,
    themeAccent: typeof entry.theme_accent === 'string' ? entry.theme_accent : undefined,
  }
}

function logDeliveryError(error: unknown) {
  console.error('[Contentstack delivery]', error instanceof Error ? error.message : error)
}

export async function getPublishedEditions(): Promise<JournalEdition[]> {
  if (!configured) return localSeedEnabled() ? localSeedEditions() : []
  try {
    const [response, articleResponse] = await Promise.all([
      fetchEntries('edition', ['stories', 'featured_story']),
      fetchEntries('article', ['category', 'author']),
    ])
    const references = new Map([...entryMap(response), ...entryMap(articleResponse)])
    return (response.entries || [])
      .filter(isPublishedEdition)
      .map((entry) => normalizeEdition(entry, references))
      .filter((edition) => {
        const count = new Set([...edition.stories, ...(edition.featuredStory ? [edition.featuredStory] : [])].map((story) => story.uid)).size
        return count >= 5 && count <= 10
      })
      .sort((a, b) => (Date.parse(b.publicationDate) || 0) - (Date.parse(a.publicationDate) || 0))
  } catch (error) {
    logDeliveryError(error)
    return []
  }
}

export async function getLatestPublishedEdition(): Promise<JournalEdition | null> {
  return (await getPublishedEditions())[0] || null
}

export async function getPublishedEditionBySlug(slug: string): Promise<JournalEdition | null> {
  return (await getPublishedEditions()).find((edition) => edition.slug === slug) || null
}

export async function getPublishedArticles(): Promise<JournalArticle[]> {
  if (!configured) return localSeedEnabled() ? localSeedArticles() : []
  try {
    const [response, editions] = await Promise.all([
      fetchEntries('article', ['edition', 'category', 'author']),
      getPublishedEditions(),
    ])
    const references = entryMap(response)
    const publicEditionArticles = new Set(editions.flatMap((edition) => [
      ...edition.stories.map((story) => story.uid),
      ...(edition.featuredStory ? [edition.featuredStory.uid] : []),
    ]))
    return (response.entries || []).flatMap((entry) => {
      const edition = resolveReference(entry.edition, references)
      if (!isPublishedEdition(edition) || entry.status && String(entry.status).toLowerCase() !== 'published') return []
      if (!publicEditionArticles.has(String(entry.uid || ''))) return []
      return [normalizeArticle(entry, edition, references)]
    }).sort((a, b) => (Date.parse(b.publicationDate) || 0) - (Date.parse(a.publicationDate) || 0))
  } catch (error) {
    logDeliveryError(error)
    return []
  }
}

export async function getPublishedArticleBySlug(slug: string): Promise<JournalArticle | null> {
  return (await getPublishedArticles()).find((article) => article.slug === slug) || null
}

export async function getPublishedArticleCategories() {
  const fallback = [
    ['about-parismus', 'About Parismus', 'The people, projects, and everyday life of our association.'],
    ['hidden-spots', 'Hidden Spots', 'Little-known places to pause, wander, and return to.'],
    ['book-of-the-month', 'Book of the Month', 'Stories and recommendations from our reading table.'],
    ['song-of-the-month', 'Song of the Month', 'Music and artists travelling with our contributors.'],
    ['student-voices', 'Student Voices', 'Interviews and experiences from our student community.'],
    ['culture-without-borders', 'Culture Without Borders', 'Traditions, perspectives, and discoveries across cultures.'],
    ['life-in-paris', 'Life in Paris', 'Neighbourhoods, cafés, and the details of student life.'],
    ['parismus-events', 'Parismus Events', 'Stories from gatherings and events hosted by Parismus.'],
  ].map(([slug, name, description]) => ({slug, name, description}))
  if (!configured) return fallback
  try {
    const response = await fetchEntries('category')
    const categories = (response.entries || []).map((entry) => ({slug: String(entry.slug || ''), name: String(entry.title || ''), description: String(entry.description || '')})).filter((category) => category.slug && category.name)
    return categories.length ? categories.sort((a, b) => a.name.localeCompare(b.name, locale)) : fallback
  } catch {
    return fallback
  }
}

export function formatEditionDate(edition: Pick<JournalEdition, 'month' | 'year' | 'publicationDate'>) {
  const source = edition.publicationDate ? new Date(edition.publicationDate) : null
  if (source && !Number.isNaN(source.getTime())) return new Intl.DateTimeFormat(locale, {month: 'long', year: 'numeric'}).format(source)
  return [edition.month, edition.year].filter(Boolean).join(' ')
}

export function getContentstackStatus() {
  return configured
}
