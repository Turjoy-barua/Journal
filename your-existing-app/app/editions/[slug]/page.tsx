import Image from 'next/image'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import type {CSSProperties} from 'react'
import {ArrowLeft, ArrowRight, ArrowUpRight} from 'lucide-react'
import ContentstackRichText from '@/components/ContentstackRichText'
import StoryCard from '@/components/StoryCard'
import {getPublishedEditionBySlug, formatEditionDate} from '@/lib/contentstack'

export const revalidate = 60

export async function generateMetadata({params}:{params:Promise<{slug:string}>}) {
  const {slug} = await params
  const edition = await getPublishedEditionBySlug(slug)
  return edition ? {title: edition.title, description: edition.subtitle || `Édition ${formatEditionDate(edition)} de Parismus Journal.`, openGraph: {images: edition.coverImage ? [edition.coverImage] : []}} : {}
}

export default async function EditionPage({params}:{params:Promise<{slug:string}>}) {
  const {slug} = await params
  const edition = await getPublishedEditionBySlug(slug)
  if (!edition) notFound()

  const featured = edition.featuredStory || edition.stories[0] || null
  const stories = [...edition.stories]
  if (featured && !stories.some((story) => story.uid === featured.uid)) stories.unshift(featured)
  const remaining = stories.filter((story) => story.uid !== featured?.uid)
  const style = {'--edition-accent': edition.themeAccent || '#20205b'} as CSSProperties

  return <article className="edition-page" style={style}>
    <div className="article-top"><Link href="/editions" className="back-link"><ArrowLeft size={15}/> Toutes les éditions</Link><span className="eyebrow">Nº {String(edition.editionNumber).padStart(2, '0')} · {formatEditionDate(edition)}</span></div>
    <header className="edition-page-header">
      <span className="eyebrow">Journalmus · {formatEditionDate(edition)}</span>
      <h1>{edition.title}</h1>
      {edition.subtitle && <p className="article-subtitle">{edition.subtitle}</p>}
    </header>
    <figure className="edition-page-cover">
      {edition.coverImage ? <Image src={edition.coverImage} alt={edition.coverAlt} fill priority sizes="(max-width:700px) 100vw, 90vw"/> : <div className="edition-cover-placeholder"/>}
      <figcaption>Nº {String(edition.editionNumber).padStart(2, '0')} <span>—</span> {formatEditionDate(edition)}</figcaption>
    </figure>
    {edition.introduction && <section className="edition-page-intro"><span className="eyebrow">Le mot de l’équipe</span><ContentstackRichText value={edition.introduction}/></section>}
    {stories.length > 0 && <section className="edition-toc" aria-labelledby="edition-toc-title">
      <div className="section-heading"><div><span className="eyebrow">Sommaire · {stories.length} histoires</span><h2 id="edition-toc-title">Dans <i>ce numéro.</i></h2></div></div>
      <ol>{stories.map((story, index) => <li key={story.uid}>
        <span className="edition-toc-number">{String(index + 1).padStart(2, '0')}</span>
        <Link href={`/articles/${story.slug}`}><span>{story.category}</span><strong>{story.title}</strong></Link>
        {story.uid === featured?.uid && <span className="edition-toc-featured">À la une</span>}
      </li>)}</ol>
    </section>}
    {featured && <section className="section edition-featured-section"><div className="section-heading"><div><span className="eyebrow">À la une · {featured.category}</span><h2>Notre histoire <i>en couverture.</i></h2></div></div><StoryCard story={featured} large/></section>}
    {remaining.length > 0 && <section className="section edition-stories-section"><div className="section-heading"><div><span className="eyebrow">{stories.length} histoires · {formatEditionDate(edition)}</span><h2>Dans cette <i>édition.</i></h2></div></div><div className="edition-story-grid">{remaining.map((story) => <StoryCard story={story} key={story.uid}/>)}</div></section>}
    {!stories.length && <div className="empty-state"><h2>Les histoires arrivent bientôt.</h2><p>Cette édition est publiée. Son équipe prépare encore les articles.</p></div>}
    <nav className="edition-page-bottom"><Link className="text-link" href="/editions"><ArrowLeft size={15}/> Parcourir toutes les éditions</Link><Link className="text-link" href="/articles">Toutes les histoires <ArrowUpRight size={15}/></Link></nav>
  </article>
}
