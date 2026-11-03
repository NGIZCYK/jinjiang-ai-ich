export function isStayQuestion(question:string){
 return /订房|订.{0,4}(?:客房|套房|房间)|房型|房价|套房|住宿套餐|住宿订单|客房预订|酒店预订|取消住宿|入住日期|离店日期|退房时间|book(?:ing)?\s+(?:a\s+)?room|room\s*(?:type|rate|price|booking)|suite|accommodation|check[ -]?(?:in|out)\s*time/i.test(question)
}
export function stayGuideText(language:'zh'|'en'){
 return language==='zh'
  ?'课程住宿预订原型提供江南雅居大床房、苏绣主题大床房和苏绣主题套房，每单一间、1—2人，可选纯住宿或苏绣体验套餐。\n\n请到“客房与套餐”选择入住和离店日期，查看逐晚费用及房量。提交后须由运营确认，无需实际付款；我不能替你锁房或确认订单。\n\n含工坊的套餐在住宿确认时保障一个入住期间的具体场次，之后从“我的行程 → 住宿订单”兑换，也可改选有余位的场次。须在保留场次开始前兑换，逾期失效。已确认住宿可在入住时间前取消，并同步释放关联体验。\n\n房型、价格、房量均为课程演示资料，当前报价及可订情况以查询页为准。'
  :'The course booking prototype offers Jiangnan King, Embroidery King and Embroidery Suite rooms: one room for 1–2 guests, with a room-only or embroidery package option.\n\nOpen Rooms & Packages, choose arrival and departure, and review nightly rates and availability. Operations must confirm the request. No actual payment is taken, and I cannot hold or confirm a room for you.\n\nA workshop package holds places in a specific session during your stay when accommodation is confirmed. Redeem it from My Journey → Accommodation, or choose another available session. Redeem before the held session begins; unused benefits then expire. Confirmed accommodation can be cancelled before check-in, releasing associated experiences.\n\nRooms, rates and inventory are course demonstration data. The search page provides the current quote and availability.'
}
