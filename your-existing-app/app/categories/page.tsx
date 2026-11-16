import Link from 'next/link'
import {getPublishedArticleCategories} from '@/lib/contentstack'

export const revalidate = 60
export const metadata = {title: 'Rubriques', description: 'Explorez les rubriques de Parismus Journal.'}

export default async function Categories() {
  const categories = await getPublishedArticleCategories()
  return <div className="listing-page"><div className="page-intro"><span className="eyebrow">L’index du journal</span><h1>Nos <i>rubriques.</i></h1><p>Autant de façons de se raconter, de découvrir et de se retrouver.</p></div>{categories.length ? <div className="category-grid">{categories.map((category, index) => <Link href={`/categories/${category.slug}`} className="category-block" key={category.slug}><span className="eyebrow">Rubrique · {String(index + 1).padStart(2, '0')}</span><h2>{category.name}</h2><p>{category.description}</p><span className="round-arrow">↗</span></Link>)}</div> : <div className="empty-state"><h2>Les rubriques se dessineront avec les premières histoires.</h2><p>Publiez des articles dans une édition pour faire apparaître leurs rubriques.</p></div>}</div>
}
