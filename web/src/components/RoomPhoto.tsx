import { useEffect, useState } from 'react'
import type { RoomImage } from '../data/roomPresentation'
import { useLanguage } from '../lib/i18n'
export function RoomPhoto({image,priority=false,sizes='(min-width: 1024px) 55vw, 100vw'}:{image:RoomImage;priority?:boolean;sizes?:string}){
 const {language}=useLanguage();const [failed,setFailed]=useState(false)
 useEffect(()=>setFailed(false),[image.src])
 return <div className="room-photo">{failed?<div className="room-photo-fallback" role="img" aria-label={image.alt[language]}><span aria-hidden="true">绢</span><p>{language==='zh'?'空间概念图暂不可用':'Concept image unavailable'}</p></div>:<img src={image.src} srcSet={image.srcSet} sizes={sizes} width={image.width} height={image.height} alt={image.alt[language]} loading={priority?'eager':'lazy'} decoding="async" {...(priority?{fetchpriority:'high'}:{})} onError={()=>setFailed(true)}/>}</div>
}
