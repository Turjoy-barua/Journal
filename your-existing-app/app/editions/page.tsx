import Image from 'next/image'
import Link from 'next/link'
import type {CSSProperties} from 'react'
import {ArrowRight} from 'lucide-react'
import {getPublishedEditions, formatEditionDate} from '@/lib/sanity'

export const revalidate = 60
export const metadata = {title: 'Les éditions', description: 'Parcourez les éditions de Parismus Journal.'}

export default async function EditionsArchive() {
  const editions = await getPublishedEditions()
  return <div className="listing-page editions-archive">
    <header className="page-intro"><span className="eyebrow">Journalmus · Archive</span><h1>Les <i>éditions.</i></h1><p>Chaque numéro a sa saison, ses histoires et sa manière de regarder Paris.</p></header>
    {editions.length ? <div className="editions-archive-grid">{editions.map((edition) => {
      const storyCount = new Set([...edition.stories, ...(edition.featuredStory ? [edition.featuredStory] : [])].map((story) => story.uid)).size
      return <Link className="edition-archive-card" href={`/editions/${edition.slug}`} key={edition.uid} style={{'--edition-accent': edition.themeAccent || '#20205b'} as CSSProperties}>
        <div className="edition-archive-cover">{edition.coverImage ? <Image src={edition.coverImage} alt={edition.coverAlt} fill sizes="(max-width:700px) 90vw, 45vw"/> : <div className="edition-cover-placeholder"/>}<span className="edition-number">Nº {String(edition.editionNumber).padStart(2, '0')}</span></div>
        <div className="edition-archive-meta"><span className="eyebrow">{formatEditionDate(edition)}</span><span className="eyebrow">{storyCount} {storyCount === 1 ? 'histoire' : 'histoires'}</span></div>
        <h2>{edition.title}</h2>
        {edition.subtitle && <p>{edition.subtitle}</p>}
        <span className="text-link">Feuilleter l’édition <ArrowRight size={15}/></span>
      </Link>
      })}</div> : <div className="empty-state"><span className="eyebrow">Archive bientôt ouverte</span><h2>Aucune édition publiée pour le moment.</h2><p>Les éditions apparaîtront ici après leur publication dans Sanity.</p></div>}
  </div>
}
