/** Canvas 程序生成贴图：酒店主题房苏绣展陈 */

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function shade(hex: string, amt: number) {
  const n = hex.replace('#', '')
  const num = parseInt(n, 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amt))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt))
  const b = Math.min(255, Math.max(0, (num & 0xff) + amt))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

/** 浅色橡木地板 */
export function woodFloorTexture() {
  const c = makeCanvas(512, 512)
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, 512)
  g.addColorStop(0, '#c4a574')
  g.addColorStop(1, '#a8885a')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 512, 512)
  for (let y = 0; y < 512; y += 36) {
    ctx.fillStyle = 'rgba(80,40,10,0.08)'
    ctx.fillRect(0, y, 512, 1.5)
    for (let x = 0; x < 512; x += 160) {
      const offset = (y / 36) % 2 === 0 ? 0 : 80
      ctx.strokeStyle = 'rgba(70,35,10,0.12)'
      ctx.strokeRect(x + offset, y, 158, 34)
    }
  }
  return c.toDataURL('image/png')
}

/** 酒店墙纸：米白暗纹 */
export function wallTexture() {
  const c = makeCanvas(512, 512)
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#f4efe6'
  ctx.fillRect(0, 0, 512, 512)
  ctx.strokeStyle = 'rgba(180,150,110,0.10)'
  ctx.lineWidth = 1.5
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      const x = 26 + i * 52
      const y = 26 + j * 52
      ctx.beginPath()
      ctx.arc(x, y, 7, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(x, y, 14, 5, Math.PI / 4, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  return c.toDataURL('image/png')
}

/** 木饰面墙裙 */
export function wainscotTexture() {
  const c = makeCanvas(512, 256)
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#e8dcc8'
  ctx.fillRect(0, 0, 512, 256)
  for (let x = 0; x < 512; x += 128) {
    ctx.strokeStyle = 'rgba(120,90,50,0.25)'
    ctx.lineWidth = 3
    ctx.strokeRect(x + 8, 16, 112, 224)
    ctx.strokeRect(x + 20, 32, 88, 192)
  }
  ctx.fillStyle = 'rgba(120,90,50,0.35)'
  ctx.fillRect(0, 0, 512, 8)
  ctx.fillRect(0, 248, 512, 8)
  return c.toDataURL('image/png')
}

/**
 * 主画：花下双猫（苏绣经典题材）
 * 对应传统双面绣/花鸟猫戏题材，课程作业示意用
 */
export function embroideryCatsTexture() {
  const c = makeCanvas(640, 800)
  const ctx = c.getContext('2d')!

  // 绢底
  const bg = ctx.createLinearGradient(0, 0, 640, 800)
  bg.addColorStop(0, '#faf6ee')
  bg.addColorStop(1, '#efe4d2')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 640, 800)

  // 淡远山
  ctx.fillStyle = 'rgba(140,160,150,0.12)'
  ctx.beginPath()
  ctx.moveTo(0, 520)
  ctx.quadraticCurveTo(160, 430, 320, 500)
  ctx.quadraticCurveTo(480, 420, 640, 490)
  ctx.lineTo(640, 800)
  ctx.lineTo(0, 800)
  ctx.fill()

  // 石
  ctx.fillStyle = '#9a958c'
  ctx.beginPath()
  ctx.ellipse(480, 620, 90, 55, -0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#7f7a72'
  ctx.beginPath()
  ctx.ellipse(520, 600, 50, 35, 0.3, 0, Math.PI * 2)
  ctx.fill()

  // 主枝
  ctx.strokeStyle = '#5a4030'
  ctx.lineWidth = 10
  ctx.beginPath()
  ctx.moveTo(40, 760)
  ctx.bezierCurveTo(120, 600, 180, 480, 260, 300)
  ctx.stroke()
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(200, 420)
  ctx.quadraticCurveTo(320, 360, 420, 280)
  ctx.stroke()

  // 牡丹花
  const drawPeony = (cx: number, cy: number, s: number) => {
    const colors = ['#c23b4e', '#d4566a', '#e07a8c', '#b83248']
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      ctx.fillStyle = colors[i % colors.length]
      ctx.beginPath()
      ctx.ellipse(cx + Math.cos(a) * 18 * s, cy + Math.sin(a) * 14 * s, 22 * s, 14 * s, a, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#f0d060'
    ctx.beginPath()
    ctx.arc(cx, cy, 10 * s, 0, Math.PI * 2)
    ctx.fill()
  }
  drawPeony(260, 270, 1.35)
  drawPeony(400, 220, 1.0)
  drawPeony(330, 340, 0.85)

  // 叶
  ctx.fillStyle = '#3f7a52'
  for (const [x, y, r] of [
    [220, 360, -0.5],
    [300, 300, 0.4],
    [360, 380, -0.15],
    [430, 250, 0.6],
    [180, 480, -0.3],
  ] as Array<[number, number, number]>) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(r)
    ctx.beginPath()
    ctx.ellipse(0, 0, 30, 11, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // 猫一（白猫卧石）
  const drawCat = (
    x: number,
    y: number,
    body: string,
    stripe: string,
    scale: number,
    flip = false,
  ) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(flip ? -scale : scale, scale)
    // 身
    ctx.fillStyle = body
    ctx.beginPath()
    ctx.ellipse(0, 20, 52, 34, 0, 0, Math.PI * 2)
    ctx.fill()
    // 头
    ctx.beginPath()
    ctx.arc(48, 0, 28, 0, Math.PI * 2)
    ctx.fill()
    // 耳
    ctx.beginPath()
    ctx.moveTo(32, -18)
    ctx.lineTo(40, -42)
    ctx.lineTo(52, -20)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(56, -20)
    ctx.lineTo(68, -42)
    ctx.lineTo(76, -16)
    ctx.fill()
    // 条纹
    ctx.fillStyle = stripe
    ctx.beginPath()
    ctx.ellipse(-10, 18, 16, 8, 0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(18, 28, 12, 6, -0.3, 0, Math.PI * 2)
    ctx.fill()
    // 脸
    ctx.fillStyle = '#f7e7d4'
    ctx.beginPath()
    ctx.ellipse(52, 6, 14, 12, 0, 0, Math.PI * 2)
    ctx.fill()
    // 眼
    ctx.fillStyle = '#2a2a2a'
    ctx.beginPath()
    ctx.ellipse(44, -2, 3.5, 5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(60, -2, 3.5, 5, 0, 0, Math.PI * 2)
    ctx.fill()
    // 鼻嘴
    ctx.fillStyle = '#d4788a'
    ctx.beginPath()
    ctx.arc(52, 6, 3, 0, Math.PI * 2)
    ctx.fill()
    // 尾
    ctx.strokeStyle = body
    ctx.lineWidth = 10
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(-40, 25)
    ctx.quadraticCurveTo(-70, 0, -55, -35)
    ctx.stroke()
    ctx.restore()
  }

  drawCat(210, 560, '#f2ebe3', '#d9cfc4', 1.15, false)
  drawCat(400, 575, '#e0a35c', '#b87a3a', 0.95, true)

  // 丝理高光
  ctx.globalAlpha = 0.15
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  for (let i = 0; i < 20; i++) {
    ctx.beginPath()
    ctx.moveTo(30 + i * 30, 80)
    ctx.lineTo(50 + i * 28, 760)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  // 内框
  ctx.strokeStyle = 'rgba(100,70,40,0.18)'
  ctx.lineWidth = 20
  ctx.strokeRect(16, 16, 608, 768)
  return c.toDataURL('image/png')
}

/** 副画：金鱼戏莲（苏绣常见题材） */
export function embroideryGoldfishTexture() {
  const c = makeCanvas(512, 640)
  const ctx = c.getContext('2d')!
  const bg = ctx.createLinearGradient(0, 0, 0, 640)
  bg.addColorStop(0, '#eef5f0')
  bg.addColorStop(1, '#dce8e2')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 512, 640)

  // 水纹
  ctx.strokeStyle = 'rgba(90,140,150,0.2)'
  for (let i = 0; i < 10; i++) {
    ctx.beginPath()
    ctx.moveTo(20, 80 + i * 50)
    ctx.quadraticCurveTo(150, 60 + i * 50, 280, 85 + i * 50)
    ctx.quadraticCurveTo(400, 110 + i * 50, 500, 75 + i * 50)
    ctx.stroke()
  }

  // 荷叶
  ctx.fillStyle = '#3d7a55'
  for (const [x, y, r] of [
    [120, 200, 48],
    [300, 160, 36],
    [380, 300, 42],
  ] as Array<[number, number, number]>) {
    ctx.beginPath()
    ctx.ellipse(x, y, r, r * 0.7, 0.2, 0, Math.PI * 2)
    ctx.fill()
  }

  // 荷花
  ctx.fillStyle = '#e8a0b0'
  for (let i = 0; i < 6; i++) {
    const a = -0.4 + i * 0.25
    ctx.beginPath()
    ctx.ellipse(250 + Math.cos(a) * 16, 250 + Math.sin(a) * 10, 16, 10, a, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = '#f0d060'
  ctx.beginPath()
  ctx.arc(250, 248, 8, 0, Math.PI * 2)
  ctx.fill()

  // 金鱼
  const drawFish = (x: number, y: number, s: number, color: string) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.ellipse(0, 0, 36, 22, 0, 0, Math.PI * 2)
    ctx.fill()
    // 尾
    ctx.beginPath()
    ctx.moveTo(-30, 0)
    ctx.quadraticCurveTo(-70, -30, -60, 0)
    ctx.quadraticCurveTo(-70, 30, -30, 0)
    ctx.fill()
    // 眼
    ctx.fillStyle = '#1a1a1a'
    ctx.beginPath()
    ctx.arc(18, -4, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  drawFish(160, 400, 1.15, '#e85a2a')
  drawFish(320, 480, 0.9, '#d43a2a')
  drawFish(240, 540, 0.75, '#f07830')

  ctx.strokeStyle = 'rgba(90,60,30,0.15)'
  ctx.lineWidth = 16
  ctx.strokeRect(12, 12, 488, 616)
  return c.toDataURL('image/png')
}

/** 丝线色谱展板 */
export function silkThreadsTexture() {
  const c = makeCanvas(512, 280)
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#f7f1e6'
  ctx.fillRect(0, 0, 512, 280)
  ctx.strokeStyle = '#8b5a2b'
  ctx.lineWidth = 10
  ctx.strokeRect(10, 10, 492, 260)
  const colors = ['#9b2c2c', '#c45c2a', '#d4a017', '#2f6f5e', '#3d5a80', '#6b4c9a', '#c4788a', '#5c4030']
  colors.forEach((color, i) => {
    const x = 28 + i * 58
    const grad = ctx.createLinearGradient(x, 70, x + 40, 220)
    grad.addColorStop(0, color)
    grad.addColorStop(1, shade(color, -20))
    ctx.fillStyle = grad
    roundRect(ctx, x, 70, 40, 150, 6)
    ctx.fill()
  })
  ctx.fillStyle = '#3d2b1f'
  ctx.font = '600 22px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('苏绣丝线 · 劈丝色谱', 256, 48)
  return c.toDataURL('image/png')
}

/** 说明牌 */
export function plaqueTexture() {
  const c = makeCanvas(640, 280)
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#f8f3ea'
  ctx.fillRect(0, 0, 640, 280)
  ctx.strokeStyle = '#b08968'
  ctx.lineWidth = 8
  ctx.strokeRect(18, 18, 604, 244)
  ctx.strokeStyle = 'rgba(176,137,104,0.35)'
  ctx.lineWidth = 2
  ctx.strokeRect(30, 30, 580, 220)
  ctx.fillStyle = '#2b1d12'
  ctx.font = '600 44px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('苏绣非遗主题角', 320, 110)
  ctx.font = '24px sans-serif'
  ctx.fillStyle = '#6b5340'
  ctx.fillText('花下双猫 · 金鱼戏莲 · 劈丝八法', 320, 165)
  ctx.fillText('酒店客房文化体验展陈', 320, 210)
  return c.toDataURL('image/png')
}

/** 地毯纹样 */
export function rugTexture() {
  const c = makeCanvas(512, 512)
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#8b4a4a'
  ctx.beginPath()
  ctx.arc(256, 256, 250, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#c9a06a'
  ctx.lineWidth = 10
  ctx.beginPath()
  ctx.arc(256, 256, 210, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(255,230,180,0.35)'
  ctx.lineWidth = 4
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(256 + Math.cos(a) * 80, 256 + Math.sin(a) * 80)
    ctx.lineTo(256 + Math.cos(a) * 190, 256 + Math.sin(a) * 190)
    ctx.stroke()
  }
  return c.toDataURL('image/png')
}
