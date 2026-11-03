import { useEffect, useRef, useState } from 'react'
import type { RoomPresentation } from '../data/roomPresentation'
import { useCopy } from './JourneyCommon'
import { RoomPhoto } from './RoomPhoto'
export function RoomGallery({room,start=0,onClose}:{room:RoomPresentation;start?:number;onClose:()=>void}){
 const {language,t}=useCopy();const [index,setIndex]=useState(start===1?1:0);const dialog=useRef<HTMLDialogElement>(null);const close=useRef(onClose);close.current=onClose
 useEffect(()=>{const element=dialog.current;if(!element)return;const previous=document.activeElement;const overflow=document.body.style.overflow;document.body.style.overflow='hidden'
  if(typeof element.showModal==='function')element.showModal();else element.setAttribute('open','')
  element.querySelector<HTMLButtonElement>('button')?.focus()
  return()=>{if(typeof element.close==='function')element.close();document.body.style.overflow=overflow;if(previous instanceof HTMLElement&&previous.isConnected)previous.focus()}
 },[])
 const image=room.images[index]
 return <dialog ref={dialog} className="room-gallery" aria-modal="true" aria-labelledby="room-gallery-title" onCancel={event=>{event.preventDefault();close.current()}} onClick={event=>{if(event.target===event.currentTarget)close.current()}} onKeyDown={event=>{
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close.current()}
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();setIndex(i=>(i+1)%2)}
  if(event.key==='Tab'){const controls=[...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];const first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}
 }}>
  <div className="room-gallery-top"><h2 id="room-gallery-title">{room.title[language]}</h2><button className="room-gallery-close" onClick={()=>close.current()} aria-label={t('关闭客房图集','Close room gallery')}>×</button></div>
  <figure><RoomPhoto key={image.id} image={image} priority sizes="(min-width: 1440px) 1320px, 95vw"/><figcaption aria-live="polite"><span>{image.caption[language]}</span><span>{index+1} / 2 · {t('AI空间概念图','AI interior concept')}</span></figcaption></figure>
  <div className="room-gallery-controls"><button onClick={()=>setIndex(i=>(i+1)%2)} aria-label={t('上一张客房图片','Previous room image')}>←</button><span>{t('空间与细节','Space & detail')}</span><button onClick={()=>setIndex(i=>(i+1)%2)} aria-label={t('下一张客房图片','Next room image')}>→</button></div>
 </dialog>
}
