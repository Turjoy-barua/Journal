'use client'

import {useState} from 'react'
import {Check, Share2} from 'lucide-react'

export default function ShareButton() {
  const [copied, setCopied] = useState(false)

  async function share() {
    if (navigator.share) {
      await navigator.share({title: document.title, url: location.href})
      return
    }
    await navigator.clipboard.writeText(location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return <button onClick={share} className="text-link">{copied ? <Check size={15}/> : <Share2 size={15}/>} {copied ? 'Lien copié' : 'Partager'}</button>
}
