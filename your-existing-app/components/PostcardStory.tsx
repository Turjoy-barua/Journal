'use client';
import {useState} from 'react';import {Volume2,VolumeX,Share2,Check} from 'lucide-react';
export function ShareButton(){const [copied,setCopied]=useState(false);async function share(){if(navigator.share){await navigator.share({title:document.title,url:location.href})}else{await navigator.clipboard.writeText(location.href);setCopied(true);setTimeout(()=>setCopied(false),2000)}}return <button onClick={share} className="text-link">{copied?<Check size={15}/>:<Share2 size={15}/>} {copied?'Lien copié':'Partager'}</button>}
export function AudioToggle(){const [on,setOn]=useState(false);return <button onClick={()=>setOn(!on)} className="audio-toggle">{on?<Volume2/>:<VolumeX/>} {on?'Ambiance activée':'Écouter l’ambiance'}</button>}
