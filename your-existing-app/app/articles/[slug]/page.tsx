import {notFound} from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {ArrowLeft, ArrowUpRight} from 'lucide-react'
import type {CSSProperties} from 'react'
import StoryCard from '@/components/StoryCard'
import PortableTextContent from '@/components/PortableTextContent'
import ShareButton from '@/components/ShareButton'
import {getPublishedArticleBySlug, getPublishedArticles} from '@/lib/sanity'

export const revalidate = 60

export async function generateMetadata({params}:{params:Promise<{slug:string}>}) {
  const {slug} = await params
  const story = await getPublishedArticleBySlug(slug)
  return story ? {title: story.title, description: story.excerpt || story.subtitle, openGraph: {images: story.image ? [story.image] : [], type: 'article'}} : {}
}

export default async function Article({params}:{params:Promise<{slug:string}>}) {
  const {slug} = await params
  const [story, allStories] = await Promise.all([getPublishedArticleBySlug(slug), getPublishedArticles()])
  if (!story) notFound()
  const related = allStories.filter((item) => item.slug !== story.slug && item.categorySlug === story.categorySlug).slice(0, 2)
  const fonts = {bodoniModa: '"Bodoni Moda", Didot, "Bodoni 72", serif', editorialSerif: 'var(--serif)', sansSerif: 'var(--sans)'}
  const style = {
    '--editorial-font-family': fonts[story.fontStyle || 'editorialSerif'],
    '--editorial-title-alignment': story.titleAlignment || 'center',
    '--editorial-body-alignment': story.bodyAlignment || 'left',
  } as CSSProperties

  return <article className="article-page" style={style}>
    <div className="article-top"><Link href={`/categories/${story.categorySlug}`} className="back-link"><ArrowLeft size={15}/> {story.category}</Link><span className="eyebrow">{story.readingTime} de lecture</span></div>
    <header className="article-header"><span className="eyebrow">{story.category} · {story.date}</span><h1>{story.title}</h1>{story.subtitle && <p className="article-subtitle">{story.subtitle}</p>}<div className="byline">Par {story.author}<span>·</span>{story.date}</div></header>
    {story.image && <figure className="article-cover"><Image src={story.image} alt={story.imageAlt} fill priority sizes="100vw"/><figcaption>{story.imageAlt}</figcaption></figure>}
    {story.richTextContent ? <><PortableTextContent value={story.richTextContent}/><div className="article-body article-body-footer"><div className="article-endnote">Une histoire du <Link href="/">Parismus Journal</Link>.</div><div className="article-share"><span className="eyebrow">À partager</span><ShareButton/></div></div></> : <div className="article-body"><div className="empty-state"><p>Le texte de cet article est en préparation.</p></div></div>}
    {related.length > 0 && <section className="related-section"><div className="section-heading"><div><span className="eyebrow">Pour continuer</span><h2>À lire <i>aussi.</i></h2></div><Link className="text-link" href="/articles">Toutes les histoires <ArrowUpRight size={15}/></Link></div><div className="listing-grid">{related.map((item) => <StoryCard key={item.uid} story={item}/>)}</div></section>}
  </article>
}
