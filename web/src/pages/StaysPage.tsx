import { Link } from 'react-router-dom'
import { useCopy,Notice } from '../components/JourneyCommon'
import { StayDemoNotice,StayRules } from '../components/StayCommon'
import { RoomPhoto } from '../components/RoomPhoto'
import { RoomRate } from '../components/RoomRate'
import { RoomSearchForm } from '../components/RoomSearchForm'
import { ROOMS } from '../data/roomPresentation'
import { money } from '../lib/stays'
import { useRoomHeaderOffset,useRoomSearch,type RoomCategory } from '../hooks/useRoomSearch'

export function StaysPage(){
 const {language,t}=useCopy();const state=useRoomSearch();const ref=useRoomHeaderOffset();const featured=ROOMS[1]
 const plan=state.plan;const rooms=ROOMS.filter(room=>state.category==='all'||room.category===state.category)
 const planQuotes=state.quotes.filter(q=>q.plan_id===plan);const roomCount=new Set(planQuotes.map(q=>q.room_id)).size
 const from=planQuotes.reduce<number|null>((min,q)=>q.total===null?min:min===null?q.total:Math.min(min,q.total),null)
 const summary=state.queried&&roomCount>0?(from!==null?t(`${roomCount} 个房型 · ${money(from)} 起`,`${roomCount} ${roomCount===1?'room':'rooms'} · from ${money(from)}`):t(`${roomCount} 个房型`,`${roomCount} rooms`)):''
 return <div ref={ref} className="stays-page room-editorial">
  <header className="room-overview-intro"><p className="eyebrow">ROOMS & CULTURAL STAYS</p><h1>{t('在苏州，留一晚给手艺。','A stay woven with discovery.')}</h1><p>{t('从窗边的一张椅子，到床头的一面绣意，找到与你的停留相宜的空间。','From a reading chair by the window to silk above the bed, find a space for your own rhythm.')}</p><a className="room-text-link" href="#room-availability">{t('查询房价与日期','Check dates & rates')} <span aria-hidden="true">↗</span></a></header>
  <figure className="room-overview-cover"><RoomPhoto image={featured.images[0]} priority sizes="(min-width: 1440px) 1376px, 100vw"/><figcaption>{t('AI空间概念图 · 苏绣主题大床房','AI interior concept · Embroidery King')}</figcaption></figure>
  <section className="room-availability" id="room-availability" tabIndex={-1} aria-labelledby="room-search-title"><div className="room-section-heading"><p className="eyebrow">MAKE TIME FOR A STAY</p><h2 id="room-search-title">{t('安排你的停留','Make time for your stay')}</h2><p>{t('先选择日期与人数，再核对每一晚的费用。','Choose your dates and guests, then review each night’s rate.')}</p></div><RoomSearchForm value={state.search} busy={state.busy} plan={plan} session={state.session} summary={summary} revision={state.revision} onChange={state.change} onPlan={state.setPlan} onSession={state.setSession} onSubmit={()=>void state.run()}/><StayDemoNotice/>
   {state.error&&<Notice error>{state.error} <button className="room-text-link" onClick={()=>void state.run()}>{t('重试','Retry')}</button></Notice>}
   {!state.busy&&!state.error&&!state.queried&&<p className="stay-caption">{t('日期已更改，请重新查询价格与房量。房型介绍仍可继续浏览。','Dates changed. Search again for rates and availability; room descriptions remain available.')}</p>}
  </section>
  <section className="room-collection" aria-labelledby="room-collection-title"><div className="room-collection-head"><div><p className="eyebrow">THREE WAYS TO SETTLE IN</p><h2 id="room-collection-title">{t('三种空间，各有停留的理由。','Three rooms. Your own way to stay.')}</h2></div><div className="room-category" role="group" aria-label={t('房型类别','Room category')}>{[['all','全部客房','All rooms'],['classic','普通客房','Classic'],['theme','苏绣主题','Embroidery']].map(([id,zh,en])=><button key={id} aria-pressed={state.category===id} onClick={()=>state.selectCategory(id as RoomCategory)}>{language==='zh'?zh:en}</button>)}</div></div>
   <div className="room-editorial-list">{rooms.map(room=>{const options=state.quotes.filter(q=>q.room_id===room.id);const quote=options.find(q=>q.plan_id===plan);const detail=`/stays/${room.id}?${state.link(room.id)}`
    return <article className="room-editorial-card" key={room.id} aria-labelledby={`room-${room.id}-title`}><figure><Link to={detail} aria-label={t(`了解${room.title.zh}`,`Discover ${room.title.en}`)}><RoomPhoto image={room.images[0]}/></Link><figcaption>{t('AI空间概念图','AI interior concept')}</figcaption></figure><div className="room-editorial-copy"><p className="eyebrow">{room.eyebrow}</p><h3 id={`room-${room.id}-title`}><Link to={detail}>{room.title[language]}</Link></h3><p className="room-card-lead">{room.lead[language]}</p><p className="room-card-summary">{room.summary[language]}</p><ul className="room-card-features">{room.features.map(f=><li key={f.title.en}>{f.title[language]}</li>)}</ul><p className="room-facts">{t('大床 · 最多2人 · 每单一间','King bed · Up to 2 guests · One room per order')}</p><Link className="room-text-link" to={detail}>{t('了解这间客房','Discover this room')} <span aria-hidden="true">↗</span></Link>
    <RoomRate quote={quote} busy={state.busy} queried={state.queried} context={state.link(room.id)}/></div></article>
   })}</div>
  </section>
  <section className="room-package-story" aria-labelledby="room-package-title"><p className="eyebrow">FROM A ROOM TO A CRAFT</p><h2 id="room-package-title">{t('让住宿，多一段亲手体验。','Make room for a hands-on experience.')}</h2><p>{t('纯住宿让行程自由安排；苏绣体验套餐增加入住人数的一次90分钟入门工坊。住宿确认时保障一个具体场次，之后从“我的行程”选择或改约。','Room only leaves your plans open. The embroidery package adds one 90-minute introductory workshop for the booked guests. A session is held when accommodation is confirmed; choose or change it later in My Journey.')}</p><p className="stay-caption">{t('数字文化导览向访客开放；工坊权益按每次入住提供，不按晚重复赠送。','Digital cultural guidance is open to visitors. Workshop benefits apply once per stay, not once per night.')}</p><Link className="room-text-link" to="/guide">{t('有问题，问婉娘','Ask Wanniang')} →</Link></section>
  <StayRules/>
 </div>
}
