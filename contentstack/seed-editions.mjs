import {readFile, access} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.join(root, '..', 'your-existing-app')
const seeds = await Promise.all(['back-to-school-no-1.json', 'autumn-is-here-no-2.json'].map(async (filename) =>
  JSON.parse(await readFile(path.join(appRoot, 'content', filename), 'utf8')),
))

async function loadEnvFile() {
  try {
    const text = await readFile(path.join(appRoot, '.env.local'), 'utf8')
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
    }
  } catch {}
}
await loadEnvFile()

const apiKey = process.env.CONTENTSTACK_API_KEY
const token = process.env.CONTENTSTACK_MANAGEMENT_TOKEN
if (!apiKey || !token) {
  console.error('Set CONTENTSTACK_API_KEY and CONTENTSTACK_MANAGEMENT_TOKEN in your-existing-app/.env.local before importing.')
  process.exit(1)
}

const host = (process.env.CONTENTSTACK_CMA_HOST || 'api.contentstack.io').replace(/^https?:\/\//, '').replace(/\/$/, '')
const locale = process.env.CONTENTSTACK_LOCALE || 'fr-fr'
const environment = process.env.CONTENTSTACK_ENVIRONMENT || 'production'
const base = `https://${host}/v3`

async function request(endpoint, options = {}) {
  const headers = new Headers(options.headers || {})
  headers.set('api_key', apiKey)
  headers.set('authorization', token)
  if (options.body && !(options.body instanceof FormData)) headers.set('content-type', 'application/json')
  const response = await fetch(`${base}${endpoint}`, {...options, headers})
  const text = await response.text()
  let data
  try { data = text ? JSON.parse(text) : {} } catch { data = {message: text} }
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${endpoint} failed (${response.status}): ${JSON.stringify(data).slice(0, 500)}`)
  return data
}

async function findEntry(type, slug) {
  const query = encodeURIComponent(JSON.stringify({slug}))
  const result = await request(`/content_types/${type}/entries?query=${query}&locale=${locale}&limit=1`)
  return result.entries?.[0]
}

async function upsertEntry(type, fields) {
  const existing = await findEntry(type, fields.slug)
  if (existing?.uid) {
    const result = await request(`/content_types/${type}/entries/${existing.uid}?locale=${locale}`, {method: 'PUT', body: JSON.stringify({entry: fields})})
    return result.entry || {...fields, uid: existing.uid}
  }
  const result = await request(`/content_types/${type}/entries?locale=${locale}`, {method: 'POST', body: JSON.stringify({entry: fields})})
  if (!result.entry?.uid) throw new Error(`Contentstack did not return a UID for ${type}:${fields.slug}`)
  return result.entry
}

async function uploadAsset(filename, title, description) {
  const existing = await request(`/assets?query=${encodeURIComponent(JSON.stringify({filename}))}&limit=100`)
  const match = existing.assets?.find((asset) => asset.filename === filename)
  if (match?.uid) return match
  const filePath = path.join(root, 'seeds/assets', filename)
  await access(filePath)
  const bytes = await readFile(filePath)
  const form = new FormData()
  form.append('asset[upload]', new Blob([bytes]), filename)
  form.append('asset[title]', title)
  form.append('asset[description]', description)
  const result = await request('/assets', {method: 'POST', body: form})
  if (!result.asset?.uid) throw new Error(`Contentstack did not return an asset UID for ${filename}`)
  return result.asset
}

async function publish(type, uid) {
  await request(`/content_types/${type}/entries/${uid}/publish?locale=${locale}`, {
    method: 'POST', body: JSON.stringify({entry: {environments: [environment], locales: [locale]}}),
  })
}

const categoryDescriptions = {
  'about-parismus': 'The people, projects, and everyday life of our association.',
  'hidden-spots': 'Little-known places to pause, wander, and return to.',
  'book-of-the-month': 'Stories and recommendations from our reading table.',
  'song-of-the-month': 'Music and artists travelling with our contributors.',
  'student-voices': 'Interviews and experiences from our student community.',
  'culture-without-borders': 'Traditions, perspectives, and discoveries across cultures.',
  'life-in-paris': 'Neighbourhoods, cafés, and the details of student life.',
  'parismus-events': 'Stories from gatherings and events hosted by Parismus.',
}
const categories = [
  ['about-parismus', 'About Parismus'], ['hidden-spots', 'Hidden Spots'], ['book-of-the-month', 'Book of the Month'],
  ['song-of-the-month', 'Song of the Month'], ['student-voices', 'Student Voices'], ['culture-without-borders', 'Culture Without Borders'],
  ['life-in-paris', 'Life in Paris'], ['parismus-events', 'Parismus Events'],
]
const categoryRefs = new Map()
for (const [slug, title] of categories) {
  const entry = await upsertEntry('category', {title, slug, description: categoryDescriptions[slug]})
  categoryRefs.set(slug, {_content_type_uid: 'category', uid: entry.uid})
  await publish('category', entry.uid)
}

const authorNames = [...new Set(seeds.flatMap((seed) => seed.articles.map((article) => article.author)))]
const authorRefs = new Map()
for (const name of authorNames) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const entry = await upsertEntry('author', {name, slug})
  authorRefs.set(name, {_content_type_uid: 'author', uid: entry.uid})
  await publish('author', entry.uid)
}

const assetNames = new Set(seeds.flatMap((seed) => [
  path.basename(seed.edition.coverImage),
  ...seed.articles.map((article) => article.image ? path.basename(article.image) : null).filter(Boolean),
]))
const assets = new Map()
for (const filename of assetNames) {
  const title = filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
  assets.set(filename, await uploadAsset(filename, title, title))
}

const articlesBySlug = new Map()
for (const seed of seeds) for (const article of seed.articles) {
  const fields = {
    title: article.title,
    slug: article.slug,
    subtitle: article.subtitle,
    category: categoryRefs.get(article.categorySlug),
    author: authorRefs.get(article.author),
    ...(article.image ? {cover_image: {uid: assets.get(path.basename(article.image)).uid}} : {}),
    rich_text_content: article.richTextContent,
    publication_date: article.publicationDate,
    featured: article.featured,
    reading_time: Number.parseInt(article.readingTime, 10),
    excerpt: article.excerpt,
  }
  articlesBySlug.set(article.slug, {entry: await upsertEntry('article', fields), article, seed})
}

const editionsToPublish = []
for (const seed of seeds) {
  const articleRefs = new Map(seed.edition.storySlugs.map((slug) => [slug, {_content_type_uid: 'article', uid: articlesBySlug.get(slug)?.entry.uid}]))
  const coverAsset = assets.get(path.basename(seed.edition.coverImage))
  const editionFields = {
    title: seed.edition.title,
    slug: seed.edition.slug,
    edition_number: seed.edition.editionNumber,
    month: seed.edition.month,
    year: seed.edition.year,
    publication_date: seed.edition.publicationDate,
    cover_image: {uid: coverAsset.uid},
    subtitle: seed.edition.subtitle,
    introduction: seed.edition.introduction,
    stories: seed.edition.storySlugs.map((slug) => articleRefs.get(slug)),
    featured_story: articleRefs.get(seed.edition.featuredStorySlug),
    theme_accent: seed.edition.themeAccent,
    status: 'draft',
  }
  const editionEntry = await upsertEntry('edition', editionFields)
  editionsToPublish.push({seed, editionEntry, editionFields})
}

for (const {seed, editionEntry, editionFields} of editionsToPublish) {
  for (const slug of seed.edition.storySlugs) {
    const {entry: articleEntry, article} = articlesBySlug.get(slug)
  const fields = {
    title: article.title,
    slug: article.slug,
    subtitle: article.subtitle,
    category: categoryRefs.get(article.categorySlug),
    author: authorRefs.get(article.author),
    ...(article.image ? {cover_image: {uid: assets.get(path.basename(article.image)).uid}} : {}),
    rich_text_content: article.richTextContent,
    publication_date: article.publicationDate,
    edition: {_content_type_uid: 'edition', uid: editionEntry.uid},
    featured: article.featured,
    reading_time: Number.parseInt(article.readingTime, 10),
    excerpt: article.excerpt,
  }
  const updated = await request(`/content_types/article/entries/${articleEntry.uid}?locale=${locale}`, {method: 'PUT', body: JSON.stringify({entry: fields})})
  await publish('article', updated.entry?.uid || articleEntry.uid)
  }
  const publishableEdition = await request(`/content_types/edition/entries/${editionEntry.uid}?locale=${locale}`, {
    method: 'PUT', body: JSON.stringify({entry: {...editionFields, status: 'published'}}),
  })
  await publish('edition', publishableEdition.entry?.uid || editionEntry.uid)
  console.log(`Imported ${seed.edition.title} (No. ${seed.edition.editionNumber}) with ${seed.articles.length} articles into ${environment}/${locale}.`)
}
