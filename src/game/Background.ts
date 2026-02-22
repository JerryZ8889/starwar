// ════════════════════════════════════════════════════
//  Background.ts — 动态星空 + 极光动画
//  纯 Canvas API，无 React 依赖
// ════════════════════════════════════════════════════

import { C } from '../constants/colors'
import { BACKGROUND, DESIGN_WIDTH, DESIGN_HEIGHT } from '../constants/config'

interface Star {
  x: number
  y: number
  radius: number
  baseAlpha: number
  twinkleSpeed: number
  twinkleOffset: number
  color: string
  vy: number          // 向下漂移速度（视差）
  layer: 1 | 2 | 3
}

interface AuroraBand {
  yCenter: number     // 光带中心 Y（设计坐标）
  color: string       // rgba 颜色字符串
  wavelength: number  // 正弦波波长（水平）
  speed: number       // 动画速度
  amplitude: number   // 振幅
  thickness: number   // 光带粗细
  phaseOffset: number // 初始相位偏移
}

export class Background {
  // 预渲染的静态星云（避免每帧重建径向渐变）
  private readonly nebulaCache: HTMLCanvasElement
  private readonly stars: Star[] = []
  private readonly auroraBands: AuroraBand[] = []
  private time = 0
  private readonly w: number
  private readonly h: number

  constructor(w = DESIGN_WIDTH, h = DESIGN_HEIGHT) {
    this.w = w
    this.h = h

    // ── 预渲染静态星云 ──────────────────────────────
    this.nebulaCache = document.createElement('canvas')
    this.nebulaCache.width = w
    this.nebulaCache.height = h
    const nc = this.nebulaCache.getContext('2d')!
    this.renderNebulaToCache(nc)

    this.initStars()
    this.initAuroraBands()
  }

  // ── 私有初始化 ────────────────────────────────────

  private renderNebulaToCache(ctx: CanvasRenderingContext2D) {
    // 深空底色
    ctx.fillStyle = C.nebulaDeep
    ctx.fillRect(0, 0, this.w, this.h)

    // 多个径向渐变星云团（只算一次）
    const blobs = [
      { cx: 0.12, cy: 0.08, r: 220, color: 'rgba(61,26,122,0.65)' },
      { cx: 0.88, cy: 0.22, r: 195, color: 'rgba(45,27,105,0.55)' },
      { cx: 0.30, cy: 0.48, r: 240, color: 'rgba(30,10,74,0.72)' },
      { cx: 0.72, cy: 0.70, r: 175, color: 'rgba(61,26,122,0.48)' },
      { cx: 0.08, cy: 0.87, r: 155, color: 'rgba(50,20,100,0.58)' },
      { cx: 0.58, cy: 0.93, r: 140, color: 'rgba(40,15,90,0.45)' },
      { cx: 0.50, cy: 0.30, r: 160, color: 'rgba(80,20,140,0.30)' },
    ]
    for (const b of blobs) {
      const grd = ctx.createRadialGradient(
        b.cx * this.w, b.cy * this.h, 0,
        b.cx * this.w, b.cy * this.h, b.r,
      )
      grd.addColorStop(0, b.color)
      grd.addColorStop(1, 'transparent')
      ctx.fillStyle = grd
      ctx.fillRect(0, 0, this.w, this.h)
    }
  }

  private initStars() {
    const colors = [
      C.starWhite, C.starWhite, C.starWhite, // 白色占多数
      C.starPink, C.starBlue, C.starGold,
    ]
    for (let i = 0; i < BACKGROUND.STAR_COUNT; i++) {
      const layer = ((i % 3) + 1) as 1 | 2 | 3
      this.stars.push({
        x:            Math.random() * this.w,
        y:            Math.random() * this.h,
        radius:       layer === 1 ? 0.25 + Math.random() * 0.65
                    : layer === 2 ? 0.55 + Math.random() * 0.95
                    :               0.85 + Math.random() * 1.35,
        baseAlpha:    layer === 1 ? 0.20 + Math.random() * 0.30
                    : layer === 2 ? 0.40 + Math.random() * 0.30
                    :               0.60 + Math.random() * 0.35,
        twinkleSpeed: 0.35 + Math.random() * 2.2,
        twinkleOffset:Math.random() * Math.PI * 2,
        color:        colors[Math.floor(Math.random() * colors.length)],
        vy:           layer * 5 + Math.random() * 6,  // 近层滚动更快
        layer,
      })
    }
  }

  private initAuroraBands() {
    // 4 条光带，各自频率/位置不同，营造层次感
    const defs = [
      { cy: 0.16, wi: 300, sp: 0.18, am: 28, th: 44, ph: 0            },
      { cy: 0.35, wi: 240, sp: 0.13, am: 22, th: 34, ph: Math.PI / 3  },
      { cy: 0.57, wi: 330, sp: 0.16, am: 34, th: 28, ph: Math.PI * 0.75 },
      { cy: 0.76, wi: 200, sp: 0.24, am: 20, th: 22, ph: Math.PI * 1.4  },
    ]
    defs.forEach((d, i) => {
      this.auroraBands.push({
        yCenter:     d.cy * this.h,
        color:       C.aurora[i],
        wavelength:  d.wi,
        speed:       d.sp,
        amplitude:   d.am,
        thickness:   d.th,
        phaseOffset: d.ph,
      })
    })
  }

  // ── 公开方法 ──────────────────────────────────────

  /** 每帧更新（推进时间、移动星星） */
  update(dt: number) {
    this.time += dt
    for (const star of this.stars) {
      star.y += star.vy * dt
      if (star.y > this.h + 2) {
        star.y = -2
        star.x = Math.random() * this.w
      }
    }
  }

  /** 绘制全部背景（调用前 ctx 已施加 dpr×scale 变换） */
  draw(ctx: CanvasRenderingContext2D) {
    // 1. 复合静态星云（drawImage 极快）
    ctx.drawImage(this.nebulaCache, 0, 0)
    // 2. 动态极光
    this.drawAurora(ctx)
    // 3. 闪烁星星
    this.drawStars(ctx)
  }

  // ── 私有绘制 ──────────────────────────────────────

  private drawAurora(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    for (const band of this.auroraBands) {
      // 构建正弦路径（双频叠加，更自然）
      ctx.beginPath()
      for (let x = 0; x <= this.w; x += 5) {
        const y = band.yCenter
          + band.amplitude       * Math.sin(x / band.wavelength + this.time * band.speed + band.phaseOffset)
          + band.amplitude * 0.3 * Math.sin(x / (band.wavelength * 0.55) + this.time * band.speed * 1.8 + band.phaseOffset + 1.2)
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }

      ctx.strokeStyle = band.color

      // 三层描边 → 模拟发光效果（避免 shadowBlur 性能开销）
      // 层1: 宽而淡的光晕底
      ctx.lineWidth   = band.thickness * 1.8
      ctx.globalAlpha = 0.08
      ctx.stroke()
      // 层2: 主光带
      ctx.lineWidth   = band.thickness * 0.70
      ctx.globalAlpha = 0.26
      ctx.stroke()
      // 层3: 亮芯
      ctx.lineWidth   = band.thickness * 0.22
      ctx.globalAlpha = 0.48
      ctx.stroke()
    }

    ctx.globalAlpha = 1
    ctx.restore()
  }

  private drawStars(ctx: CanvasRenderingContext2D) {
    for (const star of this.stars) {
      const t     = this.time * star.twinkleSpeed + star.twinkleOffset
      const alpha = Math.min(star.baseAlpha + (1 - star.baseAlpha) * 0.45 * (1 + Math.sin(t)), 1)

      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle   = star.color

      // 近层亮星加十字闪光
      if (star.layer === 3 && alpha > 0.82) {
        this.drawCrossSparkle(ctx, star.x, star.y, star.radius, star.color, alpha)
      }

      ctx.beginPath()
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  /** 十字形闪光（亮星专属）*/
  private drawCrossSparkle(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    r: number, color: string, alpha: number,
  ) {
    const len = r * 5 * alpha
    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth   = r * 0.5
    ctx.globalAlpha = alpha * 0.55

    // 横
    ctx.beginPath()
    ctx.moveTo(x - len, y)
    ctx.lineTo(x + len, y)
    ctx.stroke()
    // 竖
    ctx.beginPath()
    ctx.moveTo(x, y - len)
    ctx.lineTo(x, y + len)
    ctx.stroke()

    ctx.restore()
  }
}
