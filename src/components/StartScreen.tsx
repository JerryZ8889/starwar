// ════════════════════════════════════════════════════
//  StartScreen.tsx — 游戏标题界面
//  Canvas 极光背景可见，React 叠加浮动标题与按钮
// ════════════════════════════════════════════════════

import { sound } from '../game/SoundManager'

interface Props {
  highScore: number
  onStart: () => void
}

export default function StartScreen({ highScore, onStart }: Props) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center select-none">

      {/* ── 浮动云朵装饰（模糊色块）────────────────── */}
      <Cloud cls="top-[12%] -left-[8%] w-56 h-20"  color="#ffb7d5" delay="0s"   />
      <Cloud cls="top-[22%] -right-[10%] w-48 h-16" color="#c4b5fd" delay="0.8s" />
      <Cloud cls="top-[58%] -left-[12%] w-52 h-18"  color="#bae6fd" delay="1.5s" />
      <Cloud cls="top-[70%] -right-[8%] w-44 h-14"  color="#a7f3d0" delay="2.2s" />
      <Cloud cls="top-[40%] left-[30%]  w-36 h-12"  color="#fed7aa" delay="1.1s" />

      {/* ── 角落装饰星星 ──────────────────────────── */}
      <Deco cls="top-[16%] left-[8%]"  char="✦" color="text-dream-gold"     size="text-3xl" delay="0.3s" />
      <Deco cls="top-[20%] right-[10%]" char="★" color="text-dream-pink"    size="text-2xl" delay="1.0s" />
      <Deco cls="top-[74%] left-[6%]"  char="✦" color="text-dream-lavender" size="text-xl"  delay="0.7s" />
      <Deco cls="top-[68%] right-[8%]" char="★" color="text-dream-mint"    size="text-2xl" delay="1.8s" />
      <Deco cls="top-[8%]  left-[42%]" char="✧" color="text-dream-sky"     size="text-sm"  delay="0s"   anim="animate-twinkle" />
      <Deco cls="top-[82%] left-[48%]" char="✧" color="text-dream-gold"    size="text-sm"  delay="0.6s" anim="animate-twinkle" />
      <Deco cls="top-[50%] right-[4%]" char="✦" color="text-dream-peach"   size="text-xs"  delay="1.3s" anim="animate-twinkle" />

      {/* ── 副标题 ────────────────────────────────── */}
      <p className="font-game text-dream-mint/70 text-xs tracking-[0.28em] uppercase mb-4 whitespace-nowrap">
        ~ A Magical Space Adventure ~
      </p>

      {/* ── 主标题（浮动）────────────────────────── */}
      <div className="text-center animate-float mb-14" style={{ animationDuration: '3.5s' }}>
        <h1
          className="font-game font-bold leading-[1.05] text-rainbow drop-shadow-2xl"
          style={{ fontSize: 'clamp(2.8rem, 12vw, 3.5rem)' }}
        >
          SOPHIA'S
        </h1>
        <h1
          className="font-game font-bold leading-[1.05] text-rainbow drop-shadow-2xl"
          style={{ fontSize: 'clamp(2.8rem, 12vw, 3.5rem)' }}
        >
          STARWAR
        </h1>
        <p className="font-game text-dream-gold/80 text-sm mt-3 tracking-wider">
          ✨ Protect the galaxy with magic! ✨
        </p>
      </div>

      {/* ── 开始按钮 ──────────────────────────────── */}
      <button
        className="btn-dream text-lg px-14 py-4 pointer-events-auto animate-pulse-glow"
        onClick={() => { sound.playClick(); onStart() }}
      >
        ✨ START GAME
      </button>

      {/* ── 最高分 ────────────────────────────────── */}
      {highScore > 0 && (
        <p className="mt-6 font-game text-dream-cream/40 text-xs">
          ★ Best Score: {highScore.toLocaleString()}
        </p>
      )}

      {/* ── 操作提示 ──────────────────────────────── */}
      <p className="mt-4 font-game text-white/25 text-xs animate-pulse">
        拖动画面控制飞机 · 自动射击
      </p>

      {/* ── 版权角标 ──────────────────────────────── */}
      <p className="absolute bottom-5 font-game text-white/15 text-xs">
        Made with ✨ for Sophia
      </p>
    </div>
  )
}

// ── 辅助组件 ──────────────────────────────────────

function Cloud({
  cls, color, delay,
}: { cls: string; color: string; delay: string }) {
  return (
    <div
      className={`absolute ${cls} rounded-full blur-2xl animate-float opacity-100`}
      style={{
        backgroundColor: color,
        opacity:          0.08,
        animationDelay:   delay,
        animationDuration:'4s',
      }}
    />
  )
}

function Deco({
  cls, char, color, size, delay,
  anim = 'animate-float',
}: {
  cls: string; char: string; color: string
  size: string; delay: string; anim?: string
}) {
  return (
    <span
      className={`absolute ${cls} ${color} ${size} ${anim} select-none`}
      style={{ animationDelay: delay }}
    >
      {char}
    </span>
  )
}
