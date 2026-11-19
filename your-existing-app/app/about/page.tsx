import Link from 'next/link'
import Image from 'next/image'
import {ArrowUpRight} from 'lucide-react'
import {photos} from '@/lib/content'
import PortableTextContent from '@/components/PortableTextContent'
import {getAboutPage, getPublishedArticleCategories} from '@/lib/sanity'
import type {CSSProperties} from 'react'

export const metadata = {title: 'À propos', description: 'Découvrez Parismus Journal, le journal étudiant de Parismus.'}

function fallbackText(paragraphs: string[]) {
  return {
    type: 'doc',
    children: paragraphs.map((text) => ({type: 'p', children: [{text}]})),
  }
}

export default async function About() {
  const [page, categories] = await Promise.all([getAboutPage(), getPublishedArticleCategories()])
  const defaultCategoryOrder = [
    'about-parismus', 'hidden-spots', 'book-of-the-month', 'song-of-the-month',
    'student-voices', 'culture-without-borders', 'life-in-paris', 'parismus-events',
  ]
  const categoryOrder = new Map(defaultCategoryOrder.map((slug, index) => [slug, index]))
  const defaultCategories = categories
    .filter((category) => categoryOrder.has(category.slug))
    .sort((a, b) => (categoryOrder.get(a.slug) ?? 99) - (categoryOrder.get(b.slug) ?? 99))
  // Sanity returns an empty array when no references have been selected yet.
  // Use the editorial defaults in that case instead of showing every legacy category.
  const aboutCategories = page?.displayCategories?.length ? page.displayCategories : defaultCategories
  const heroTitle = page?.heroTitle || 'Des histoires qui'
  const heroTitleEmphasis = page?.heroTitleEmphasis || 'nous rapprochent.'
  const missionBody = page?.missionBody || fallbackText([
    'Nous racontons les lieux qui nous accueillent, les livres qui restent en tête, les musiques qui accompagnent le retour et les expériences qui changent notre regard.',
    'Le journal prolonge l’esprit de Parismus : un point de rencontre pour des étudiants de parcours et de cultures différents. Il s’écrit au fil des contributions, avec curiosité et attention.',
  ])
  const teamBody = page?.teamBody || fallbackText([
    'Écriture, images et idées de sujets : le journal prend forme avec ses contributeurs. Proposez une histoire ou découvrez les rubriques.',
  ])
  const fonts = {
    bodoniModa: '"Bodoni Moda", Didot, "Bodoni 72", serif',
    editorialSerif: '"Cormorant Garamond", Baskerville, Georgia, serif',
    sansSerif: '"DM Sans", Arial, sans-serif',
  } as const
  const pageStyle = {'--about-font-family': fonts[page?.fontStyle || 'bodoniModa']} as CSSProperties

  return <div className="about-page" style={pageStyle}>
    <div className="page-intro" style={{textAlign: page?.heroTextAlignment || 'left'}}>
      <span className="eyebrow">{page?.heroEyebrow || 'À propos · Un journal étudiant'}</span>
      <h1>{heroTitle} <i>{heroTitleEmphasis}</i></h1>
      <p>{page?.heroDescription || 'Parismus Journal est un espace éditorial étudiant pour les histoires, les gens et les cultures qui font Paris.'}</p>
    </div>

    <div className="about-hero">
      <Image src={page?.heroImage?.url || photos.cafe} alt={page?.heroImage?.alt || 'Un espace accueillant pour se retrouver'} fill sizes="(max-width: 700px) 92vw, 80vw"/>
      <span>{page?.heroCaption || 'Un journal fait de rencontres'}</span>
    </div>

    <section className="about-columns" style={{textAlign: page?.missionTextAlignment || 'left'}}>
      <div>
        <span className="eyebrow">{page?.missionEyebrow || 'Notre intention'}</span>
        <h2>{page?.missionTitle || 'Regarder la ville ensemble.'}</h2>
      </div>
      <div className="about-rich-body"><PortableTextContent value={missionBody}/></div>
    </section>

    <section className="about-team">
      <div className="about-team-copy" style={{textAlign: page?.teamTextAlignment || 'left'}}>
        <span className="eyebrow">{page?.teamEyebrow || 'Une rédaction ouverte'}</span>
        <h2>{page?.teamTitle || 'Il y a une place pour votre regard.'}</h2>
        <div className="about-rich-body"><PortableTextContent value={teamBody}/></div>
        <Link className="button button-dark" href={page?.callToActionUrl || 'mailto:bonjour@parismus.fr'}>{page?.callToActionLabel || 'Proposer une contribution'} <ArrowUpRight size={16}/></Link>
      </div>
      <Image src={page?.teamImage?.url || photos.portrait} alt={page?.teamImage?.alt || "Portrait d'une étudiante"} width={500} height={650}/>
    </section>

    <div className="departments" style={{textAlign: page?.categoriesTextAlignment || 'left'}}>
      <span className="eyebrow">{page?.categoriesEyebrow || 'Les rubriques du journal'}</span>
      <h2>{page?.categoriesTitle || 'Huit façons de raconter.'}</h2>
      <div>{aboutCategories.map((category, index) => <Link href={`/categories/${category.slug}`} key={category.slug}>
        <span>{String(index + 1).padStart(2, '0')}</span>{category.name}<ArrowUpRight size={16}/>
      </Link>)}</div>
    </div>
  </div>
}
