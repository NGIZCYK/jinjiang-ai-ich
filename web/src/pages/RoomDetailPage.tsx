import { useState } from 'react'
import { Link,useParams } from 'react-router-dom'
import { useCopy,Notice } from '../components/JourneyCommon'
import { StayDemoNotice,StayRules } from '../components/StayCommon'
import { RoomPhoto } from '../components/RoomPhoto'
import { RoomGallery } from '../components/RoomGallery'
import { RoomRate } from '../components/RoomRate'
import { RoomSearchForm } from '../components/RoomSearchForm'
import { ROOMS,roomPresentation,type RoomPresentation } from '../data/roomPresentation'
import { money } from '../lib/stays'
import { useRoomHeaderOffset,useRoomSearch } from '../hooks/useRoomSearch'

export function RoomDetailPage(){
 const {roomId}=useParams();const room=roomPresentation(roomId);const {t}=useCopy()
 if(!room)return <div className="stays-page room-not-found"><h1>{t('未找到这间客房','Room not found')}</h1><p>{t('请返回总览，查看现有客房与套餐。','Return to the overview to explore our rooms and packages.')}</p><Link className="btn-primary" to="/stays">{t('返回客房总览','Back to rooms')}</Link></div>
 return <RoomDetail key={room.id} room={room}/>
}
function RoomDetail({room}:{room:RoomPresentation}){
 const {language,t}=useCopy();const state=useRoomSearch();const ref=useRoomHeaderOffset();const [gallery,setGallery]=useState<number|null>(null)
 const options=state.quotes.filter(q=>q.room_id===room.id);const quote=options.find(q=>q.plan_id===state.plan)
 return <div ref={ref} className="stays-page room-editorial room-detail">
  <Link className="room-text-link room-back" to={`/stays?${state.link(room.id)}`}>← {t('返回客房总览','Back to rooms')}</Link>
  <header className="room-detail-intro"><p className="eyebrow">{room.eyebrow}</p><h1>{room.title[language]}</h1><p>{room.lead[language]}</p><a className="room-text-link" href="#room-booking">{t('查看预订方案','Explore stay options')} ↗</a></header>
  <figure className="room-detail-hero"><button className="room-gallery-trigger" onClick={()=>setGallery(0)} aria-label={t('查看客房图集，共2张','View room gallery, 2 images')}><RoomPhoto image={room.images[0]} priority sizes="(min-width: 1440px) 1376px, 100vw"/><span>{t('查看图集','View gallery')} <span aria-hidden="true">↗</span> · 2</span></button><figcaption>{t('AI空间概念图 · 非酒店实景','AI interior concept · Not hotel photography')}</figcaption></figure>
  <div className="room-detail-facts"><span>{t('大床','King bed')}</span><span>{t('最多2人','Up to 2 guests')}</span><span>{room.category==='classic'?t('江南雅居','Classic Jiangnan'):t('苏绣主题','Embroidery-inspired')}</span></div>
  <section className="room-detail-story"><div><p className="eyebrow">A SENSE OF PLACE</p><h2>{room.storyTitle[language]}</h2><p>{room.story[language]}</p></div><figure><button className="room-gallery-trigger" onClick={()=>setGallery(1)} aria-label={t('放大查看客房细节','Enlarge room detail')}><RoomPhoto image={room.images[1]} sizes="(min-width: 1024px) 45vw, 100vw"/></button><figcaption>{room.images[1].caption[language]} · {t('AI概念图','AI concept')}</figcaption></figure></section>
  <section className="room-feature-grid" aria-label={t('客房设计特色','Room design features')}>{room.features.map((feature,index)=><article key={feature.title.en}><span aria-hidden="true">0{index+1}</span><h2>{feature.title[language]}</h2><p>{feature.body[language]}</p></article>)}</section>
  <section className="room-detail-reservation" id="room-booking" tabIndex={-1} aria-labelledby="room-booking-title"><div className="room-detail-information"><p className="eyebrow">CONSIDERED DETAILS</p><h2>{t('空间配置与住宿方案','Design details & stay options')}</h2><ul className="room-configurations">{room.configurations.map(item=><li key={item.en}>{item[language]}</li>)}</ul><p className="stay-caption">{t('空间与陈设为概念设计，不代表已运营酒店的设施承诺。','Interiors and furnishings are design concepts, not confirmed facilities at an operating hotel.')}</p><div className="room-package-note"><h3>{t('住宿之外，继续认识苏绣。','Continue your discovery of embroidery.')}</h3><p>{t('纯住宿与体验套餐共享所选房型。体验套餐额外包含入住人数的一次90分钟工坊，住宿确认时保障名额，之后再选择或改约场次。','Both options use the selected room. The package adds one 90-minute workshop for the booked guests. Places are held at accommodation confirmation; select or change the session afterwards.')}</p><p>{t('数字导览向访客开放，不属于套餐专享权益。','Digital guidance is open to visitors and is not an exclusive package benefit.')}</p><Link className="room-text-link" to="/guide">{t('咨询婉娘','Ask Wanniang')} →</Link></div><StayRules/></div>
   <aside className="room-booking-panel"><p className="eyebrow">YOUR STAY</p><h2 id="room-booking-title">{t('为这间客房，选一段停留。','Choose your dates for this room.')}</h2><RoomSearchForm value={state.search} busy={state.busy} plan={state.plan} session={state.session} room={room.id} compact summary={state.queried&&quote?`${quote.nights.length} ${t('晚','nights')} · ${money(quote.total)}`:''} revision={state.revision} onChange={state.change} onPlan={state.setPlan} onSession={state.setSession} onSubmit={()=>void state.run()}/>{state.error&&<Notice error>{state.error} <button className="room-text-link" onClick={()=>void state.run()}>{t('重试','Retry')}</button></Notice>}<RoomRate quote={quote} busy={state.busy} queried={state.queried} context={state.link(room.id)}/><StayDemoNotice/></aside>
  </section>
  <section className="room-related" aria-labelledby="room-related-title"><p className="eyebrow">ANOTHER WAY TO STAY</p><h2 id="room-related-title">{t('也看看，另外两种停留。','Discover another way to stay.')}</h2><div>{ROOMS.filter(item=>item.id!==room.id).map(item=><article key={item.id}><Link to={`/stays/${item.id}?${state.link(item.id)}`}><RoomPhoto image={item.images[0]} sizes="(min-width: 768px) 45vw, 100vw"/><h3>{item.title[language]} <span aria-hidden="true">↗</span></h3></Link><p>{item.summary[language]}</p></article>)}</div></section>
  <a className="room-mobile-booking" href="#room-booking">{quote?t('查看预订方案','View stay options'):t('查询房价','Check rates')} <span aria-hidden="true">↗</span></a>
  {gallery!==null&&<RoomGallery room={room} start={gallery} onClose={()=>setGallery(null)}/>}
 </div>
}
