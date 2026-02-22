// ════════════════════════════════════════════════════
//  drawHelpers.ts — Canvas 绘制工具函数
//  所有几何图形（星形、心形）和特效（光晕、战机）
//  均在此集中定义，供 GameEngine 和粒子系统使用
// ════════════════════════════════════════════════════

// ── 五角星（子弹 / 粒子）────────────────────────────
/**
 * 在当前路径上构建星形（不自动填充，需调用方 fill/stroke）
 * @param points  角数，默认 5
 * @param rotation 旋转角度（rad），默认指向正上方
 */
export function pathStar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  outerR: number, innerR: number,
  points = 5,
  rotation = -Math.PI / 2,
) {
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI / points) * i + rotation
    const r     = i % 2 === 0 ? outerR : innerR
    const px    = x + r * Math.cos(angle)
    const py    = y + r * Math.sin(angle)
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
  }
  ctx.closePath()
}

/** 直接填充一个星形（含颜色设置）*/
export function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  outerR: number, innerR: number,
  color: string,
  alpha = 1,
  rotation = -Math.PI / 2,
) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle   = color
  ctx.shadowBlur  = outerR * 2
  ctx.shadowColor = color
  pathStar(ctx, x, y, outerR, innerR, 5, rotation)
  ctx.fill()
  ctx.restore()
}

// ── 心形（三向爱心子弹）──────────────────────────────
/**
 * 在当前路径上构建心形（中心在 x,y，尖端朝下）
 * size 控制整体大小
 */
export function pathHeart(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  size: number,
) {
  const s = size * 0.5
  ctx.beginPath()
  // 从底部尖端开始
  ctx.moveTo(x, y + s * 1.4)
  // 右侧弧
  ctx.bezierCurveTo(
    x + s * 2,  y + s * 0.6,
    x + s * 2,  y - s * 0.8,
    x,          y - s * 0.3,
  )
  // 左侧弧
  ctx.bezierCurveTo(
    x - s * 2,  y - s * 0.8,
    x - s * 2,  y + s * 0.6,
    x,          y + s * 1.4,
  )
  ctx.closePath()
}

/** 直接填充一个心形 */
export function drawHeart(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  size: number,
  color: string,
  alpha = 1,
) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle   = color
  ctx.shadowBlur  = size * 2.5
  ctx.shadowColor = color
  pathHeart(ctx, x, y, size)
  ctx.fill()
  ctx.restore()
}

// ── 径向光晕 ─────────────────────────────────────────
/**
 * 在 (x, y) 处绘制一个径向渐变光晕
 * @param color  hex / rgba 颜色字符串
 * @param alpha  整体透明度
 */
export function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  radius: number,
  color: string,
  alpha = 0.5,
) {
  if (alpha <= 0 || radius <= 0) return
  ctx.save()
  ctx.globalAlpha = alpha
  const grd = ctx.createRadialGradient(x, y, 0, x, y, radius)
  grd.addColorStop(0,   color)
  grd.addColorStop(1,   'transparent')
  ctx.fillStyle = grd
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// ── 战机图片绘制 ────────────────────────────────────
/**
 * 以 (x, y) 为中心绘制战机图片
 * @param rotate180 true = 旋转 180°（图片原始朝向朝下时，用于翻转到朝上/朝下）
 */
export function drawShipImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number,
  w: number, h: number,
  alpha = 1,
  rotate180 = false,
) {
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x, y)
  if (rotate180) ctx.rotate(Math.PI)
  ctx.drawImage(img, -w / 2, -h / 2, w, h)
  ctx.restore()
}

// ── 浮动得分文字 ─────────────────────────────────────
export function drawFloatingText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  color: string,
  alpha: number,
  fontSize = 18,
) {
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha  = alpha
  ctx.fillStyle    = color
  ctx.font         = `bold ${fontSize}px Quicksand, sans-serif`
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowBlur   = 8
  ctx.shadowColor  = color
  ctx.fillText(text, x, y)
  ctx.restore()
}
