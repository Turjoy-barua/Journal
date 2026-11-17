import type {Story} from './content'
import firstEditionSeed from '../content/back-to-school-no-1.json'
import secondEditionSeed from '../content/autumn-is-here-no-2.json'

type SanityArticleDocument = Record<string, any> & {_id?: string; _type?: string}
type SanityEditionDocument = Record<string, any> & {_id?: string; _type?: string}

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

export type AboutPageContent = {
  heroEyebrow?: string
  heroTitle?: string
  heroTitleEmphasis?: string
  heroDescription?: string
  heroImage?: {url?: string; alt?: string}
  heroCaption?: string
  missionEyebrow?: string
  missionTitle?: string
  missionBody?: unknown
  teamEyebrow?: string
  teamTitle?: string
  teamBody?: unknown
  teamImage?: {url?: string; alt?: string}
  callToActionLabel?: string
  callToActionUrl?: string
  categoriesEyebrow?: string
  categoriesTitle?: string
  fontStyle?: 'bodoniModa' | 'editorialSerif' | 'sansSerif'
  heroTextAlignment?: 'left' | 'center' | 'right' | 'justify'
  missionTextAlignment?: 'left' | 'center' | 'right' | 'justify'
  teamTextAlignment?: 'left' | 'center' | 'right' | 'justify'
  categoriesTextAlignment?: 'left' | 'center' | 'right' | 'justify'
}

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'g57lcjmj'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = '2025-02-19'
const locale = process.env.NEXT_PUBLIC_JOURNAL_LOCALE || 'fr-FR'
const readToken = process.env.SANITY_API_READ_TOKEN
const seeds = [firstEditionSeed, secondEditionSeed]

function dateLabel(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale, {dateStyle: 'long'}).format(date)
}

async function sanityQuery<T>(query: string, params: Record<string, string | number> = {}): Promise<T | null> {
  const url = new URL(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`)
  url.searchParams.set('query', query)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(`$${key}`, JSON.stringify(value))
  const headers: Record<string, string> = {}
  if (readToken) headers.authorization = `Bearer ${readToken}`

  try {
    const response = await fetch(url, {headers, next: {revalidate: 60}})
    if (!response.ok) throw new Error(`Sanity query failed (${response.status})`)
    const payload = await response.json() as {result?: T}
    return payload.result ?? null
  } catch (error) {
    console.error('[Sanity delivery]', error instanceof Error ? error.message : error)
    return null
  }
}

export async function getAboutPage(): Promise<AboutPageContent | null> {
  return sanityQuery<AboutPageContent>(`*[_id == "aboutPage" && _type == "aboutPage"][0]{
    heroEyebrow, heroTitle, heroTitleEmphasis, heroDescription,
    "heroImage": heroImage{alt, "url": asset->url}, heroCaption,
    missionEyebrow, missionTitle, "missionBody": missionBody[]{..., "asset": asset->{url}},
    teamEyebrow, teamTitle, "teamBody": teamBody[]{..., "asset": asset->{url}},
    "teamImage": teamImage{alt, "url": asset->url}, callToActionLabel, callToActionUrl,
    categoriesEyebrow, categoriesTitle, fontStyle,
    heroTextAlignment, missionTextAlignment, teamTextAlignment, categoriesTextAlignment
  }`)
}

function normalizeArticle(entry: SanityArticleDocument, editionUid?: string): JournalArticle {
  const title = String(entry.title || 'Untitled story')
  const category = String(entry.category?.title || entry.category || 'Journal')
  const publishedAt = String(entry.publicationDate || entry.publishedAt || '')
  const image = entry.coverImage?.url || entry.coverImage?.asset?.url || entry.image || ''
  const richTextContent = entry.body || entry.richTextContent || null

  return {
    uid: String(entry._id || entry.uid || entry.slug || title),
    slug: String(entry.slug?.current || entry.slug || ''),
    title,
    subtitle: String(entry.subtitle || ''),
    category,
    categorySlug: String(entry.category?.slug || entry.categorySlug || ''),
    author: String(entry.author?.name || entry.author || 'Parismus Journal'),
    date: dateLabel(publishedAt),
    publicationDate: publishedAt,
    readingTime: `${Number(entry.readingTime) || Number.parseInt(entry.readingTime, 10) || 5} min`,
    excerpt: String(entry.excerpt || entry.subtitle || ''),
    image,
    imageAlt: String(entry.coverImage?.alt || entry.imageAlt || title),
    body: [],
    featured: Boolean(entry.featured),
    editionUid,
    richTextContent,
  }
}

function normalizeEdition(entry: SanityEditionDocument): JournalEdition {
  const stories = (entry.stories || []).filter(Boolean).map((article: SanityArticleDocument) => normalizeArticle(article, String(entry._id || '')))
  const featured = entry.featuredStory ? normalizeArticle(entry.featuredStory, String(entry._id || '')) : null
  const coverImage = entry.coverImage?.url || entry.coverImage?.asset?.url || ''
  return {
    uid: String(entry._id || entry.uid || entry.slug?.current || ''),
    title: String(entry.title || 'Journalmus'),
    slug: String(entry.slug?.current || entry.slug || ''),
    editionNumber: Number(entry.editionNumber) || 0,
    month: String(entry.month || ''),
    year: Number(entry.year) || 0,
    publicationDate: String(entry.publicationDate || ''),
    coverImage,
    coverAlt: String(entry.coverImage?.alt || entry.title || 'Journalmus edition cover'),
    subtitle: String(entry.subtitle || ''),
    introduction: entry.introduction || null,
    stories,
    featuredStory: featured,
    themeAccent: typeof entry.themeAccent === 'string' ? entry.themeAccent : undefined,
  }
}

function seedArticles(): JournalArticle[] {
  return seeds.flatMap((seed) => seed.articles.map((article) => ({
    ...article,
    date: dateLabel(article.publicationDate),
    body: [],
    richTextContent: article.richTextContent,
  })))
}

function seedEditions(): JournalEdition[] {
  const articles = seedArticles()
  return seeds.map(({edition}) => {
    const stories = edition.storySlugs.map((slug) => articles.find((article) => article.slug === slug)).filter((article): article is JournalArticle => Boolean(article))
    return {...edition, introduction: edition.introduction, stories, featuredStory: stories.find((story) => story.slug === edition.featuredStorySlug) || null}
  }).sort((a, b) => (Date.parse(b.publicationDate) || 0) - (Date.parse(a.publicationDate) || 0))
}

const ARTICLE_FIELDS = `
  _id, title, "slug": slug.current, subtitle, excerpt, "publishedAt": publishedAt,
  "readingTime": readingTime, featured,
  "category": category->{title, "slug": slug.current},
  "author": author->{name},
  "coverImage": coverImage{alt, "url": asset->url},
  "body": body[]{..., "asset": asset->{url}}
`

const EDITIONS_QUERY = `*[_type == "edition" && defined(slug.current)] | order(publicationDate desc) {
  _id, title, "slug": slug.current, editionNumber, month, year, publicationDate, subtitle, themeAccent, status,
  "coverImage": coverImage{alt, "url": asset->url}, introduction,
  "stories": stories[]->{${ARTICLE_FIELDS}},
  "featuredStory": featuredStory->{${ARTICLE_FIELDS}}
}`

export async function getPublishedEditions(): Promise<JournalEdition[]> {
  const documents = await sanityQuery<SanityEditionDocument[]>(EDITIONS_QUERY)
  if (!documents?.length) return seedEditions()
  const editions = documents.filter((entry) => entry.status === 'published').map(normalizeEdition).filter((edition) => {
    const count = new Set([...edition.stories, ...(edition.featuredStory ? [edition.featuredStory] : [])].map((story) => story.uid)).size
    return count >= 5 && count <= 10
  })
  return editions
}

export async function getLatestPublishedEdition(): Promise<JournalEdition | null> {
  return (await getPublishedEditions())[0] || null
}

export async function getPublishedEditionBySlug(slug: string): Promise<JournalEdition | null> {
  return (await getPublishedEditions()).find((edition) => edition.slug === slug) || null
}

export async function getPublishedArticles(): Promise<JournalArticle[]> {
  const editions = await getPublishedEditions()
  return editions.flatMap((edition) => edition.stories).filter((article, index, all) => all.findIndex((item) => item.uid === article.uid) === index)
    .sort((a, b) => (Date.parse(b.publicationDate) || 0) - (Date.parse(a.publicationDate) || 0))
}

export async function getPublishedArticleBySlug(slug: string): Promise<JournalArticle | null> {
  return (await getPublishedArticles()).find((article) => article.slug === slug) || null
}

const fallbackCategories = [
  ['about-parismus', 'About Parismus', 'The people, projects, and everyday life of our association.'],
  ['hidden-spots', 'Hidden Spots', 'Little-known places to pause, wander, and return to.'],
  ['book-of-the-month', 'Book of the Month', 'Stories and recommendations from our reading table.'],
  ['song-of-the-month', 'Song of the Month', 'Music and artists travelling with our contributors.'],
  ['student-voices', 'Student Voices', 'Interviews and experiences from our student community.'],
  ['culture-without-borders', 'Culture Without Borders', 'Traditions, perspectives, and discoveries across cultures.'],
  ['life-in-paris', 'Life in Paris', 'Neighbourhoods, cafés, and the details of student life.'],
  ['parismus-events', 'Parismus Events', 'Stories from gatherings and events hosted by Parismus.'],
].map(([slug, name, description]) => ({slug, name, description}))

export async function getPublishedArticleCategories() {
  const categories = await sanityQuery<{slug: string; title: string; description?: string}[]>(
    `*[_type == "category" && defined(slug.current)] | order(title asc){"slug":slug.current,title,description}`,
  )
  return categories?.length ? categories.map(({slug, title, description}) => ({slug, name: title, description: description || ''})) : fallbackCategories
}

export function formatEditionDate(edition: Pick<JournalEdition, 'month' | 'year' | 'publicationDate'>) {
  const source = edition.publicationDate ? new Date(edition.publicationDate) : null
  if (source && !Number.isNaN(source.getTime())) return new Intl.DateTimeFormat(locale, {month: 'long', year: 'numeric'}).format(source)
  return [edition.month, edition.year].filter(Boolean).join(' ')
}

export function getSanityStatus() {
  return Boolean(projectId && dataset)
}
