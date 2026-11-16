import {notFound} from 'next/navigation'
import {getPublishedArticleCategories, getPublishedArticles} from '@/lib/contentstack'
import StoryCard from '@/components/StoryCard'

export const revalidate = 60

export async function generateStaticParams() {
  return (await getPublishedArticleCategories()).map((category) => ({slug: category.slug}))
}

export default async function CategoryPage({params}:{params:Promise<{slug:string}>}) {
  const {slug} = await params
  const [categories, stories] = await Promise.all([getPublishedArticleCategories(), getPublishedArticles()])
  const category = categories.find((item) => item.slug === slug)
  if (!category) notFound()
  const items = stories.filter((story) => story.categorySlug === slug)
  return <div className="listing-page"><div className="page-intro"><span className="eyebrow">Le journal · Rubrique</span><h1>{category.name}</h1><p>{category.description}</p></div>{items.length ? <div className="listing-grid">{items.map((story) => <StoryCard key={story.uid} story={story}/>)}</div> : <div className="empty-state"><span className="eyebrow">Bientôt dans le journal</span><h2>Cette rubrique attend sa première histoire.</h2><p>Les nouvelles contributions apparaîtront ici.</p></div>}</div>
}
