import {getPublishedArticles} from '@/lib/sanity'
import StoryCard from '@/components/StoryCard'
import {Search} from 'lucide-react'

export const revalidate = 60
export const metadata = {title: 'Les histoires', description: 'Articles publiés par Parismus Journal.'}

export default async function Articles({searchParams}:{searchParams:Promise<{q?:string}>}) {
  const {q = ''} = await searchParams
  const stories = await getPublishedArticles()
  const filtered = stories.filter((story) => (story.title + ' ' + story.excerpt + ' ' + story.category).toLowerCase().includes(q.toLowerCase()))
  return <div className="listing-page"><div className="page-intro"><span className="eyebrow">Le journal · Histoires et rencontres</span><h1>Nos <i>histoires.</i></h1><p>Des voix, des idées et des morceaux de ville à découvrir à votre rythme.</p><form className="listing-search"><Search size={18}/><input name="q" defaultValue={q} placeholder="Un thème, un lieu, un titre…"/><button>Rechercher</button></form>{q && <p className="result-count">{filtered.length} résultat{filtered.length === 1 ? '' : 's'} pour « {q} »</p>}</div><div className="listing-grid">{filtered.map((story) => <StoryCard key={story.uid} story={story}/>)}</div>{!filtered.length && <div className="empty-state"><h2>{q ? 'Pas d’histoire trouvée.' : 'Les prochaines histoires se préparent.'}</h2><p>{q ? 'Essayez un autre mot ou explorez les éditions.' : 'Les articles publiés dans les éditions de Parismus apparaîtront ici.'}</p></div>}</div>
}
