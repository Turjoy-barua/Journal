import type {Metadata} from 'next';import Header from '@/components/Header';import Footer from '@/components/Footer';import './globals.css';import './mobile.css';

export const metadata:Metadata={metadataBase:new URL('https://journal.parismus.fr'),title:{default:'Parismus Journal — Stories, People & Culture',template:'%s — Parismus Journal'},description:'Des histoires, des rencontres et des cultures. Le journal étudiant de Parismus à Paris.',openGraph:{siteName:'Parismus Journal',locale:'fr_FR',type:'website'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr"><body ><Header/><main>{children}</main><Footer/></body></html>}
