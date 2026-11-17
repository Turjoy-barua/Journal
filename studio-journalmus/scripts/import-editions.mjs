import {createReadStream} from 'node:fs'
import {access, readFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {randomUUID} from 'node:crypto'

const studioRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const projectRoot = path.resolve(studioRoot, '..')
const appRoot = path.join(projectRoot, 'your-existing-app')
const seedFiles = ['back-to-school-no-1.json', 'autumn-is-here-no-2.json']

async function loadEnvFile(file) {
  try {
    const contents = await readFile(file, 'utf8')
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
    }
  } catch {}
}

await loadEnvFile(path.join(studioRoot, '.env'))
await loadEnvFile(path.join(appRoot, '.env.local'))

const token = process.env.SANITY_API_TOKEN
if (!token) {
  console.error('Add SANITY_API_TOKEN to studio-journalmus/.env or your-existing-app/.env.local, then run npm run import:editions again.')
  process.exit(1)
}

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'g57lcjmj'
const dataset = process.env.SANITY_STUDIO_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const seeds = await Promise.all(seedFiles.map(async (filename) => JSON.parse(await readFile(path.join(appRoot, 'content', filename), 'utf8'))))
const assetRoot = path.join(appRoot, 'public', 'editions')

async function sanityQuery(query, params = {}) {
  const url = new URL(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`)
  url.searchParams.set('query', query)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(`$${key}`, JSON.stringify(value))
  const response = await fetch(url, {headers: {authorization: `Bearer ${token}`}})
  const payload = await response.json()
  if (!response.ok) throw new Error(`Sanity query failed (${response.status}): ${JSON.stringify(payload).slice(0, 400)}`)
  return payload.result
}

async function sanityMutation(mutations) {
  const response = await fetch(`https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}?returnDocuments=true`, {
    method: 'POST',
    headers: {authorization: `Bearer ${token}`, 'content-type': 'application/json'},
    body: JSON.stringify({mutations}),
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(`Sanity mutation failed (${response.status}): ${JSON.stringify(payload).slice(0, 400)}`)
  return payload
}

async function findDocument(type, slug) {
  return sanityQuery('*[_type == $type && slug.current == $slug][0]{_id}', {type, slug})
}

async function upsertDocument(type, slug, fields) {
  const existing = await findDocument(type, slug)
  if (existing?._id) {
    await sanityMutation([{patch: {id: existing._id, set: fields}}])
    return existing._id
  }
  const result = await sanityMutation([{create: {_type: type, ...fields}}])
  const id = result.results?.[0]?.id || result.results?.[0]?.documentId
  if (!id) throw new Error(`Sanity did not return a document ID for ${type}:${slug}`)
  return id
}

async function uploadImage(filename, title, description) {
  const existing = await sanityQuery('*[_type == "sanity.imageAsset" && originalFilename == $filename][0]{_id}', {filename})
  if (existing?._id) return existing._id
  const file = path.join(assetRoot, filename)
  await access(file)
  const content = await readFile(file)
  const uploadUrl = new URL(`https://${projectId}.api.sanity.io/v${apiVersion}/assets/images/${dataset}`)
  uploadUrl.searchParams.set('filename', filename)
  uploadUrl.searchParams.set('title', title)
  uploadUrl.searchParams.set('description', description)
  const response = await fetch(uploadUrl, {method: 'POST', headers: {authorization: `Bearer ${token}`, 'content-type': 'image/png'}, body: content})
  const payload = await response.json()
  const id = payload.document?._id || payload._id
  if (!response.ok || !id) throw new Error(`Sanity image upload failed for ${filename}: ${JSON.stringify(payload).slice(0, 400)}`)
  return id
}

function portableText(value) {
  const blocks = value?.children || []
  return blocks.map((block, index) => ({
    _type: 'block',
    _key: randomUUID(),
    style: block.type === 'blockquote' ? 'blockquote' : 'normal',
    markDefs: [],
    children: (block.children || []).map((child, childIndex) => ({
      _type: 'span',
      _key: randomUUID(),
      text: child.text || '',
      marks: child.italic ? ['em'] : child.bold ? ['strong'] : [],
    })),
  }))
}

const categoryInfo = [
  ['about-parismus', 'About Parismus', 'The people, projects, and everyday life of our association.'],
  ['hidden-spots', 'Hidden Spots', 'Little-known places to pause, wander, and return to.'],
  ['book-of-the-month', 'Book of the Month', 'Stories and recommendations from our reading table.'],
  ['song-of-the-month', 'Song of the Month', 'Music and artists travelling with our contributors.'],
  ['student-voices', 'Student Voices', 'Interviews and experiences from our student community.'],
  ['culture-without-borders', 'Culture Without Borders', 'Traditions, perspectives, and discoveries across cultures.'],
  ['life-in-paris', 'Life in Paris', 'Neighbourhoods, cafés, and the details of student life.'],
  ['parismus-events', 'Parismus Events', 'Stories from gatherings and events hosted by Parismus.'],
]
const categoryRefs = new Map()
for (const [slug, title, description] of categoryInfo) {
  const id = await upsertDocument('category', slug, {title, slug: {_type: 'slug', current: slug}, description})
  categoryRefs.set(slug, {_type: 'reference', _ref: id})
}

const authorNames = [...new Set(seeds.flatMap((seed) => seed.articles.map((article) => article.author)))]
const authorRefs = new Map()
for (const name of authorNames) {
  const slug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const id = await upsertDocument('author', slug, {name, slug: {_type: 'slug', current: slug}})
  authorRefs.set(name, {_type: 'reference', _ref: id})
}

const filenames = new Set(seeds.flatMap((seed) => [
  path.basename(seed.edition.coverImage),
  ...seed.articles.map((article) => article.image ? path.basename(article.image) : null).filter(Boolean),
]))
const assetRefs = new Map()
for (const filename of filenames) {
  const title = filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
  assetRefs.set(filename, {_type: 'reference', _ref: await uploadImage(filename, title, title)})
}

const articleRefs = new Map()
const articleDocuments = new Map()
for (const seed of seeds) for (const article of seed.articles) {
  const imageName = article.image ? path.basename(article.image) : undefined
  const fields = {
    title: article.title,
    slug: {_type: 'slug', current: article.slug},
    subtitle: article.subtitle,
    excerpt: article.excerpt,
    category: categoryRefs.get(article.categorySlug),
    author: authorRefs.get(article.author),
    ...(imageName ? {coverImage: {_type: 'image', asset: assetRefs.get(imageName), alt: article.imageAlt}} : {}),
    body: portableText(article.richTextContent),
    publishedAt: `${article.publicationDate}T12:00:00.000Z`,
    featured: article.featured,
    readingTime: Number.parseInt(article.readingTime, 10),
  }
  const id = await upsertDocument('article', article.slug, fields)
  articleRefs.set(article.slug, {_type: 'reference', _ref: id})
  articleDocuments.set(article.slug, {id, article})
}

const editionIds = new Map()
for (const seed of seeds) {
  const imageName = path.basename(seed.edition.coverImage)
  const fields = {
    title: seed.edition.title,
    slug: {_type: 'slug', current: seed.edition.slug},
    editionNumber: seed.edition.editionNumber,
    month: seed.edition.month,
    year: seed.edition.year,
    publicationDate: `${seed.edition.publicationDate}T12:00:00.000Z`,
    coverImage: {_type: 'image', asset: assetRefs.get(imageName), alt: seed.edition.coverAlt},
    subtitle: seed.edition.subtitle,
    introduction: portableText(seed.edition.introduction),
    stories: seed.edition.storySlugs.map((slug) => articleRefs.get(slug)),
    featuredStory: articleRefs.get(seed.edition.featuredStorySlug),
    themeAccent: seed.edition.themeAccent,
    status: 'published',
  }
  editionIds.set(seed.edition.slug, await upsertDocument('edition', seed.edition.slug, fields))
}

for (const seed of seeds) {
  const editionRef = {_type: 'reference', _ref: editionIds.get(seed.edition.slug)}
  for (const slug of seed.edition.storySlugs) {
    const {id} = articleDocuments.get(slug)
    await sanityMutation([{patch: {id, set: {edition: editionRef}}}])
  }
}

console.log(`Imported ${seeds.map(({edition}) => `No. ${edition.editionNumber} ${edition.title}`).join(' and ')} into ${projectId}/${dataset}.`)
