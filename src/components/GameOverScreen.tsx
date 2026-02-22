// ════════════════════════════════════════════════════
//  GameOverScreen.tsx — 游戏结算界面
//  "Great Job, Sophia!" + 分数 + 成就 + 按钮
// ════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import type { FC } from 'react'
import type { Achievement, GameStats } from '../types'
import { sound } from '../game/SoundManager'

interface GameOverScreenProps {
  stats:          GameStats
  highScore:      number
  isNewHighScore: boolean
  achievements:   Achievement[]   // 本局新解锁的成就
  onPlayAgain:    () => void
  onMenu:         () => void
}

// ── 主组件 ────────────────────────────────────────────
const GameOverScreen: FC<GameOverScreenProps> = ({
  stats, highScore, isNewHighScore, achievements, onPlayAgain, onMenu,
}) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto"
      style={{
        background:     'rgba(13, 6, 32, 0.80)',
        backdropFilter: 'blur(8px)',
        opacity:        visible ? 1 : 0,
        transition:     'opacity 0.35s ease',
      }}
    >
      {/* 彩虹粒子背景 */}
      <ConfettiLayer />

      {/* ── 主卡片 ─────────────────────────────────── */}
      <div
        className="glass-card mx-5 px-5 py-6 flex flex-col items-center gap-4 w-full max-w-xs relative z-10"
        style={{
          transform:  visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.94)',
          transition: 'transform 0.45s cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        {/* 标题 */}
        <div className="text-center leading-tight">
          <div
            className="font-bold"
            style={{
              fontSize:   24,
              color:      '#ffb7d5',
              textShadow: '0 0 20px #ffb7d5, 0 0 40px #fb7185',
            }}
          >
            Great Job, Sophia!
          </div>
          <div style={{ fontSize: 20, marginTop: 2 }}>✨🌟✨</div>
        </div>

        {/* 分数 */}
        <div className="text-center">
          <div
            className="text-xs font-semibold opacity-60 tracking-widest mb-1"
            style={{ color: '#c4b5fd' }}
          >
            FINAL SCORE
          </div>
          <div
            className="font-bold"
            style={{ fontSize: 40, color: '#fde68a', textShadow: '0 0 16px #fde68a' }}
          >
            {stats.score.toLocaleString()}
          </div>

          {isNewHighScore ? (
            <div
              className="text-rainbow font-bold mt-1 animate-pulse"
              style={{ fontSize: 13 }}
            >
              ★ NEW HIGH SCORE! ★
            </div>
          ) : highScore > 0 && (
            <div className="text-xs mt-0.5 opacity-50" style={{ color: '#fef9e7' }}>
              Best: {highScore.toLocaleString()}
            </div>
          )}
        </div>

        {/* 统计徽章 */}
        <div className="flex gap-2.5">
          <StatBadge icon="💥" value={stats.kills}    label="Kills" />
          <StatBadge icon="🌊" value={stats.wave}     label="Wave"  />
          <StatBadge icon="⚡" value={stats.maxCombo} label="Combo" />
        </div>

        {/* 本局解锁成就 */}
        {achievements.length > 0 && (
          <div className="w-full">
            <div
              className="text-center text-xs font-semibold mb-2 opacity-70 tracking-widest"
              style={{ color: '#c4b5fd' }}
            >
              ✨ UNLOCKED
            </div>
            <div className="flex flex-col gap-1.5">
              {achievements.map(a => (
                <div
                  key={a.id}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-2xl"
                  style={{ background: 'rgba(196,181,253,0.10)', border: '1px solid rgba(196,181,253,0.20)' }}
                >
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{a.icon}</span>
                  <div>
                    <div className="font-semibold text-xs" style={{ color: '#c4b5fd' }}>{a.name}</div>
                    <div className="text-xs opacity-55" style={{ color: '#fef9e7' }}>{a.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3 w-full mt-1">
          <button className="flex-1 btn-dream py-2.5 text-sm" onClick={() => { sound.playClick(); onPlayAgain() }}>
            Play Again
          </button>
          <button className="flex-1 btn-outline py-2.5 text-sm" onClick={() => { sound.playClick(); onMenu() }}>
            Menu
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 统计小徽章 ────────────────────────────────────────
function StatBadge({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div
      className="flex flex-col items-center px-3 py-2 rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', minWidth: 60 }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div className="font-bold text-sm" style={{ color: '#fef9e7' }}>{value}</div>
      <div className="text-xs opacity-50" style={{ color: '#fef9e7' }}>{label}</div>
    </div>
  )
}

// ── CSS 彩虹粒子 ──────────────────────────────────────
const CONFETTI_COLORS = ['#fb7185', '#fbbf24', '#a7f3d0', '#60a5fa', '#c4b5fd', '#f9a8d4']

function ConfettiLayer() {
  const pieces = Array.from({ length: 20 }, (_, i) => ({
    id:    i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left:  `${4 + (i * 13) % 92}%`,
    size:  6 + (i % 4) * 2,
    delay: `${(i * 0.15) % 1.8}s`,
    dur:   `${2.2 + (i % 5) * 0.35}s`,
    shape: i % 3 === 0 ? '50%' : '2px',
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position:     'absolute',
            left:         p.left,
            top:          '-14px',
            width:        p.size,
            height:       p.size,
            borderRadius: p.shape,
            background:   p.color,
            boxShadow:    `0 0 6px ${p.color}`,
            animation:    `confettiFall ${p.dur} ${p.delay} ease-in infinite`,
          }}
        />
      ))}
    </div>
  )
}

export default GameOverScreen
