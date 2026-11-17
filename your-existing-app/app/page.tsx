import Image from 'next/image'
import Link from 'next/link'
import type {CSSProperties} from 'react'
import {ArrowRight, ArrowUpRight} from 'lucide-react'
import PortableTextContent from '@/components/PortableTextContent'
import StoryCard from '@/components/StoryCard'
import {getPublishedEditions, formatEditionDate} from '@/lib/sanity'

export const revalidate = 60

export default async function Home() {
  const editions = await getPublishedEditions()
  const edition = editions[0]
  const previousEditions = editions.slice(1, 4)
  const accentStyle = {'--edition-accent': edition?.themeAccent || '#20205b'} as CSSProperties

  if (!edition) {
    return <>
      <section className="edition-empty-home">
        <span className="eyebrow">Le journal étudiant de Parismus · Paris</span>
        <h1>La prochaine édition <i>se prépare.</i></h1>
        <p>Les histoires du journal paraîtront ici dès que la prochaine édition sera publiée.</p>
        <Link className="button button-dark" href="/editions">Explorer les éditions <ArrowUpRight size={16}/></Link>
      </section>
    </>
  }

  const featured = edition.featuredStory || edition.stories[0] || null
  const stories = [...edition.stories]
  if (featured && !stories.some((story) => story.uid === featured.uid)) stories.unshift(featured)
  const remaining = stories.filter((story) => story.uid !== featured?.uid)

  return <div className="edition-home" style={accentStyle}>
    <section className="edition-home-hero">
      <div className="edition-home-copy">
        <div className="issue-rule"><span>Nº {String(edition.editionNumber).padStart(2, '0')}</span><i/><span>{formatEditionDate(edition)}</span></div>
        <span className="eyebrow">Le journal des histoires vivantes · Paris</span>
        <h1>{edition.title}</h1>
        {edition.subtitle && <p className="edition-subtitle">{edition.subtitle}</p>}
        <Link className="button button-dark" href={`/editions/${edition.slug}`}>Ouvrir cette édition <ArrowUpRight size={16}/></Link>
      </div>
      <Link className="edition-cover-link" href={`/editions/${edition.slug}`} aria-label={`Ouvrir ${edition.title}`}>
        {edition.coverImage ? <Image src={edition.coverImage} alt={edition.coverAlt} fill priority sizes="(max-width: 700px) 92vw, 52vw"/> : <div className="edition-cover-placeholder"/>}
        <span className="edition-cover-label">Journalmus · {String(edition.editionNumber).padStart(2, '0')}</span>
      </Link>
    </section>

    {Boolean(edition.introduction) && <section className="edition-introduction">
      <span className="eyebrow">Le mot de l’équipe · {formatEditionDate(edition)}</span>
      <h2>Bienvenue <i>dans cette édition.</i></h2>
      <PortableTextContent value={edition.introduction}/>
    </section>}

    {featured && <section className="section edition-featured-section">
      <div className="section-heading"><div><span className="eyebrow">À la une · {edition.title}</span><h2>L’histoire <i>du mois.</i></h2></div></div>
      <StoryCard story={featured} large/>
    </section>}

    {remaining.length > 0 && <section className="section edition-stories-section">
      <div className="section-heading"><div><span className="eyebrow">Dans cette édition · {stories.length} histoires</span><h2>À lire <i>en ce moment.</i></h2></div><Link className="text-link" href={`/editions/${edition.slug}`}>Toute l’édition <ArrowRight size={16}/></Link></div>
      <div className="edition-story-grid">{remaining.map((story) => <StoryCard key={story.uid} story={story}/>)}</div>
    </section>}

    {previousEditions.length > 0 && <section className="previous-editions-section">
      <div className="section-heading"><div><span className="eyebrow">À feuilleter à nouveau</span><h2>Les éditions <i>précédentes.</i></h2></div><Link className="text-link" href="/editions">Toutes les éditions <ArrowRight size={16}/></Link></div>
      <div className="previous-editions-grid">{previousEditions.map((item) => <Link className="previous-edition-card" href={`/editions/${item.slug}`} key={item.uid}>
        {item.coverImage ? <Image src={item.coverImage} alt={item.coverAlt} fill sizes="(max-width: 700px) 84vw, 25vw"/> : <div className="edition-cover-placeholder"/>}
        <span className="eyebrow">Nº {String(item.editionNumber).padStart(2, '0')} · {formatEditionDate(item)}</span>
        <h3>{item.title}</h3>
      </Link>)}</div>
    </section>}

  </div>
}
