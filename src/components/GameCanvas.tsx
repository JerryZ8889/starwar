// ════════════════════════════════════════════════════
//  GameCanvas.tsx — 双层 Canvas 容器
//  负责：响应式缩放 / 动画主循环 / 触控输入捕获
//  游戏引擎（Step 4）通过 engineRef 注入此组件
// ════════════════════════════════════════════════════

import { useRef, useEffect, useCallback } from 'react'
import { Background } from '../game/Background'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../constants/config'
import type { PointerState, IGameEngine } from '../types'

// ── Props ─────────────────────────────────────────────
interface GameCanvasProps {
  /** Step 4 注入游戏引擎实例 */
  engineRef?: React.MutableRefObject<IGameEngine | null>
  /** Canvas 就绪时的回调（GameEngine 初始化用） */
  onCanvasReady?: (dims: { w: number; h: number; scale: number; dpr: number }) => void
}

// ══════════════════════════════════════════════════════
export default function GameCanvas({ engineRef, onCanvasReady }: GameCanvasProps) {
  const bgCanvasRef   = useRef<HTMLCanvasElement>(null)
  const gameCanvasRef = useRef<HTMLCanvasElement>(null)
  const bgRef         = useRef<Background | null>(null)
  const rafRef        = useRef<number>(0)
  const lastTimeRef   = useRef<number>(0)
  const scaleRef      = useRef<number>(1)
  const dprRef        = useRef<number>(1)

  // 触控状态（设计坐标），默认在屏幕中央偏下
  const ptrRef = useRef<PointerState>({
    active: false,
    x: DESIGN_WIDTH  / 2,
    y: DESIGN_HEIGHT * 0.80,
  })

  // ── Canvas 尺寸配置 ────────────────────────────────
  const setupCanvases = useCallback(() => {
    const dpr   = window.devicePixelRatio || 1
    const scale = Math.min(
      window.innerWidth  / DESIGN_WIDTH,
      window.innerHeight / DESIGN_HEIGHT,
    )
    dprRef.current   = dpr
    scaleRef.current = scale

    const cssW = Math.round(DESIGN_WIDTH  * scale)
    const cssH = Math.round(DESIGN_HEIGHT * scale)
    const pixW = Math.round(cssW * dpr)
    const pixH = Math.round(cssH * dpr)

    for (const ref of [bgCanvasRef, gameCanvasRef]) {
      const canvas = ref.current
      if (!canvas) continue
      canvas.width        = pixW
      canvas.height       = pixH
      canvas.style.width  = `${cssW}px`
      canvas.style.height = `${cssH}px`

      const ctx = canvas.getContext('2d')
      if (ctx) {
        // 重置矩阵后施加 DPR × CSS缩放
        // 之后所有绘制调用都使用设计坐标（0–390, 0–844）
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.scale(dpr * scale, dpr * scale)
      }
    }

    onCanvasReady?.({ w: DESIGN_WIDTH, h: DESIGN_HEIGHT, scale, dpr })
  }, [onCanvasReady])

  // ── 屏幕坐标 → 设计坐标转换 ───────────────────────
  const toDesign = useCallback((clientX: number, clientY: number) => {
    const canvas = gameCanvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(DESIGN_WIDTH,  (clientX - rect.left) / scaleRef.current)),
      y: Math.max(0, Math.min(DESIGN_HEIGHT, (clientY - rect.top)  / scaleRef.current)),
    }
  }, [])

  // ── 输入事件（原生监听，避免 React 合成事件延迟）──
  useEffect(() => {
    const canvas = gameCanvasRef.current
    if (!canvas) return

    // Touch
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      const t = e.touches[0]
      ptrRef.current = { active: true, ...toDesign(t.clientX, t.clientY) }
      engineRef?.current?.setPointer(ptrRef.current)
    }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const t = e.touches[0]
      ptrRef.current = { active: true, ...toDesign(t.clientX, t.clientY) }
      engineRef?.current?.setPointer(ptrRef.current)
    }
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      ptrRef.current = { ...ptrRef.current, active: false }
      engineRef?.current?.setPointer(ptrRef.current)
    }

    // Mouse（桌面调试）
    const onMouseDown = (e: MouseEvent) => {
      ptrRef.current = { active: true, ...toDesign(e.clientX, e.clientY) }
      engineRef?.current?.setPointer(ptrRef.current)
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!ptrRef.current.active) return
      ptrRef.current = { active: true, ...toDesign(e.clientX, e.clientY) }
      engineRef?.current?.setPointer(ptrRef.current)
    }
    const onMouseUp = () => {
      ptrRef.current = { ...ptrRef.current, active: false }
      engineRef?.current?.setPointer(ptrRef.current)
    }

    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false })
    canvas.addEventListener('touchend',   onTouchEnd,   { passive: false })
    canvas.addEventListener('mousedown',  onMouseDown)
    window.addEventListener('mousemove',  onMouseMove)
    window.addEventListener('mouseup',    onMouseUp)

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove',  onTouchMove)
      canvas.removeEventListener('touchend',   onTouchEnd)
      canvas.removeEventListener('mousedown',  onMouseDown)
      window.removeEventListener('mousemove',  onMouseMove)
      window.removeEventListener('mouseup',    onMouseUp)
    }
  }, [toDesign, engineRef])

  // ── 主动画循环 ────────────────────────────────────
  useEffect(() => {
    setupCanvases()

    const bgCtx   = bgCanvasRef.current?.getContext('2d')
    const gameCtx = gameCanvasRef.current?.getContext('2d')
    if (!bgCtx || !gameCtx) return

    // 初始化背景
    bgRef.current = new Background(DESIGN_WIDTH, DESIGN_HEIGHT)

    let bgFrame = 0
    let running = true

    const loop = (ts: number) => {
      if (!running) return

      // 限制 dt 上限（避免切换标签后大跳帧）
      const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.05)
      lastTimeRef.current = ts
      bgFrame++

      // ── 背景层：每 2 帧更新一次（~30fps）────────────
      if (bgFrame % 2 === 0) {
        bgRef.current?.update(dt * 2)
        bgRef.current?.draw(bgCtx)
      }

      // ── 游戏层：每帧更新 ──────────────────────────
      gameCtx.clearRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT)

      if (engineRef?.current) {
        // Step 4 注入引擎后走这里
        engineRef.current.update(dt)
        engineRef.current.draw(gameCtx)
      } else {
        // Step 2 调试：显示指针位置
        drawPointerDebug(gameCtx, ptrRef.current)
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    lastTimeRef.current = performance.now()
    rafRef.current = requestAnimationFrame(loop)

    // 窗口缩放：重新计算尺寸
    const onResize = () => {
      setupCanvases()
      // 背景已缓存，无需重建；但 ctx 变换已被 setupCanvases 重置
    }

    // 标签切换：暂停/恢复循环
    const onVisibility = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(rafRef.current)
      } else {
        running = true
        lastTimeRef.current = performance.now()
        rafRef.current = requestAnimationFrame(loop)
      }
    }

    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      running = false
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [setupCanvases, engineRef])

  // ── 渲染 ──────────────────────────────────────────
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-nebula-deep">
      {/* 层1：背景（星云/极光/星星）*/}
      <canvas
        ref={bgCanvasRef}
        className="absolute"
        aria-hidden="true"
      />
      {/* 层2：游戏实体 + 接收所有输入事件 */}
      <canvas
        ref={gameCanvasRef}
        className="absolute"
        style={{ touchAction: 'none', cursor: 'none' }}
      />
    </div>
  )
}

// ── Step 2 调试绘制（Step 4 移除）────────────────────
function drawPointerDebug(ctx: CanvasRenderingContext2D, ptr: PointerState) {
  if (!ptr.active) return
  ctx.save()
  ctx.fillStyle   = 'rgba(255,183,213,0.5)'
  ctx.shadowBlur  = 24
  ctx.shadowColor = '#ffb7d5'
  ctx.beginPath()
  ctx.arc(ptr.x, ptr.y, 14, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
