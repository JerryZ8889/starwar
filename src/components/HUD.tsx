// ════════════════════════════════════════════════════
//  HUD.tsx — 游戏进行中 React 叠加层
//  显示：分数 / 波次 / 生命值 / 连击倍率
//  pointer-events-none（退出按钮除外）
// ════════════════════════════════════════════════════

import type { FC } from 'react'
import { sound } from '../game/SoundManager'

interface HUDProps {
  score:           number
  lives:           number   // 0–3
  wave:            number
  combo:           number
  comboMultiplier: number
  onQuit:          () => void
}

const MAX_LIVES = 3

const HUD: FC<HUDProps> = ({ score, lives, wave, combo, comboMultiplier, onQuit }) => {
  return (
    <div className="absolute inset-0 pointer-events-none">

      {/* ── 顶部状态栏 ──────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 flex items-start justify-between px-3.5 pt-3">

        {/* 分数（左）*/}
        <div
          className="font-bold"
          style={{ fontSize: 15, color: '#fde68a', textShadow: '0 0 10px #fde68a' }}
        >
          ★ {score.toLocaleString()}
        </div>

        {/* 波次（中）*/}
        <div
          className="font-bold"
          style={{ fontSize: 13, paddingTop: 1, color: '#c4b5fd', textShadow: '0 0 8px #c4b5fd' }}
        >
          WAVE {wave}
        </div>

        {/* 生命值（右）— 空心 ♡ / 实心 ♥ */}
        <div className="flex gap-px">
          {Array.from({ length: MAX_LIVES }, (_, i) => (
            <span
              key={i}
              className="transition-all duration-300"
              style={{
                fontSize:        20,
                color:           i < lives ? '#fb7185' : 'transparent',
                textShadow:      i < lives ? '0 0 8px #fb7185' : 'none',
                WebkitTextStroke: i < lives ? '0' : '1.2px rgba(251,113,133,0.30)',
              }}
            >
              ♥
            </span>
          ))}
        </div>
      </div>

      {/* ── 连击标语（combo ≥ 3 时显示）────────────── */}
      {combo >= 3 && (
        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-baseline gap-1"
          style={{ top: 36 }}
        >
          <span
            className="font-bold"
            style={{
              fontSize:   Math.min(14 + combo, 22),
              color:      '#fde68a',
              textShadow: '0 0 12px #fbbf24',
            }}
          >
            {combo} COMBO!
          </span>
          {comboMultiplier > 1 && (
            <span
              className="font-bold"
              style={{ fontSize: 12, color: '#ffb7d5', textShadow: '0 0 8px #fb7185' }}
            >
              ×{comboMultiplier}
            </span>
          )}
        </div>
      )}

      {/* ── 退出按钮（右下）──────────────────────────── */}
      <button
        className="pointer-events-auto absolute bottom-5 right-4 btn-outline opacity-60 hover:opacity-90 transition-opacity"
        style={{ fontSize: 11, padding: '4px 10px' }}
        onClick={() => { sound.playClick(); onQuit() }}
      >
        ✕ Quit
      </button>

    </div>
  )
}

export default HUD
