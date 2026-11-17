import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const studioRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
async function loadEnv(file) {
  try {
    const contents = await readFile(file, 'utf8')
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
    }
  } catch {}
}

await loadEnv(path.join(studioRoot, '.env'))
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'g57lcjmj'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const apiVersion = process.env.SANITY_API_VERSION || '2026-11-16'
const token = process.env.SANITY_API_TOKEN
if (!token) throw new Error('Add SANITY_API_TOKEN to studio-journalmus/.env to seed the About page.')

async function query(queryText) {
  const url = new URL(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`)
  url.searchParams.set('query', queryText)
  const response = await fetch(url, {headers: {authorization: `Bearer ${token}`}})
  const payload = await response.json()
  if (!response.ok) throw new Error(`Sanity query failed (${response.status}): ${JSON.stringify(payload).slice(0, 300)}`)
  return payload.result
}

async function mutate(mutations) {
  const response = await fetch(`https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}`, {
    method: 'POST',
    headers: {authorization: `Bearer ${token}`, 'content-type': 'application/json'},
    body: JSON.stringify({mutations}),
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(`Sanity mutation failed (${response.status}): ${JSON.stringify(payload).slice(0, 300)}`)
}

const existing = await query('*[_id == "aboutPage"][0]{_id}')
if (existing) {
  await mutate([{patch: {id: 'aboutPage', setIfMissing: {
    fontStyle: 'bodoniModa',
    heroTextAlignment: 'left',
    missionTextAlignment: 'left',
    teamTextAlignment: 'left',
    categoriesTextAlignment: 'left',
  }}}])
  console.log('The About page already exists; leaving its content unchanged.')
  process.exit(0)
}

function textBlocks(paragraphs) {
  return paragraphs.map((text, index) => ({
    _type: 'block',
    _key: `paragraph-${index + 1}`,
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: `text-${index + 1}`, text, marks: []}],
  }))
}

await mutate([{create: {
  _id: 'aboutPage',
  _type: 'aboutPage',
  heroEyebrow: 'À propos · Un journal étudiant',
  heroTitle: 'Des histoires qui',
  heroTitleEmphasis: 'nous rapprochent.',
  heroDescription: 'Parismus Journal est un espace éditorial étudiant pour les histoires, les gens et les cultures qui font Paris.',
  heroCaption: 'Un journal fait de rencontres',
  missionEyebrow: 'Notre intention',
  missionTitle: 'Regarder la ville ensemble.',
  missionBody: textBlocks([
    'Nous racontons les lieux qui nous accueillent, les livres qui restent en tête, les musiques qui accompagnent le retour et les expériences qui changent notre regard.',
    'Le journal prolonge l’esprit de Parismus : un point de rencontre pour des étudiants de parcours et de cultures différents. Il s’écrit au fil des contributions, avec curiosité et attention.',
  ]),
  teamEyebrow: 'Une rédaction ouverte',
  teamTitle: 'Il y a une place pour votre regard.',
  teamBody: textBlocks(['Écriture, images et idées de sujets : le journal prend forme avec ses contributeurs. Proposez une histoire ou découvrez les rubriques.']),
  callToActionLabel: 'Proposer une contribution',
  callToActionUrl: 'mailto:bonjour@parismus.fr',
  categoriesEyebrow: 'Les rubriques du journal',
  categoriesTitle: 'Huit façons de raconter.',
  fontStyle: 'bodoniModa',
  heroTextAlignment: 'left',
  missionTextAlignment: 'left',
  teamTextAlignment: 'left',
  categoriesTextAlignment: 'left',
}}])
console.log(`Created the About page singleton in ${projectId}/${dataset}. Upload photos for the image fields in Studio.`)
