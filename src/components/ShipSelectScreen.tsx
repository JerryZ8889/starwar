// ════════════════════════════════════════════════════
//  ShipSelectScreen.tsx — 战机选择界面
//  2×2 网格展示 4 架战机，支持触控/点击选择
// ════════════════════════════════════════════════════

import type { ShipConfig } from '../types'
import { SHIPS } from '../constants/config'
import { sound } from '../game/SoundManager'

interface Props {
  selectedId: number
  onSelect:   (id: number) => void
  onConfirm:  () => void
  onBack:     () => void
}

export default function ShipSelectScreen({ selectedId, onSelect, onConfirm, onBack }: Props) {
  const selected = SHIPS.find(s => s.id === selectedId) ?? SHIPS[0]

  return (
    <div className="absolute inset-0 flex flex-col select-none">

      {/* ── 顶部栏 ──────────────────────────────── */}
      <div className="flex items-center px-5 pt-12 pb-3 gap-5">
        <button
          className="pointer-events-auto btn-outline text-sm px-4 py-2 flex-shrink-0"
          onClick={() => { sound.playClick(); onBack() }}
        >
          ← 返回
        </button>

        <div>
          <h2 className="font-game font-bold text-dream-pink text-lg leading-none">
            选择你的战机
          </h2>
          <p className="font-game text-dream-mint/50 text-xs mt-0.5 tracking-wider">
            SELECT YOUR SHIP
          </p>
        </div>
      </div>

      {/* ── 2×2 战机卡片网格 ─────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-5">
        <div className="grid grid-cols-2 gap-3 w-full">
          {SHIPS.map(ship => (
            <ShipCard
              key={ship.id}
              ship={ship}
              selected={selectedId === ship.id}
              onSelect={() => onSelect(ship.id)}
            />
          ))}
        </div>
      </div>

      {/* ── 底部：选中信息面板 + 确认按钮 ─────────── */}
      <div className="px-5 pb-8 space-y-3">

        {/* 已选战机信息 */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-4">
            {/* 小图预览 */}
            <div
              className="relative w-16 h-16 flex-shrink-0 rounded-xl flex items-center justify-center"
              style={{
                background: `radial-gradient(circle, ${selected.trailColor}25, transparent 80%)`,
              }}
            >
              <img
                src={selected.imageSrc}
                alt={selected.name}
                className="w-full h-full object-contain"
                style={{
                  filter:    `drop-shadow(0 0 8px ${selected.trailColor})`,
                  transform: selected.rotateInGame ? 'rotate(180deg)' : 'none',
                }}
                draggable={false}
              />
            </div>

            {/* 文字信息 */}
            <div className="flex-1 min-w-0">
              <p className="font-game font-bold text-dream-gold text-base leading-none">
                {selected.name}
              </p>
              <p className="font-game text-dream-mint/70 text-xs mt-1">
                {selected.description}
              </p>
              {/* 颜色指示 */}
              <div className="flex gap-3 mt-2">
                <ColorDot color={selected.trailColor} label="尾迹" />
                <ColorDot color={selected.bulletColor} label="子弹" />
              </div>
            </div>
          </div>
        </div>

        {/* 出发按钮 */}
        <button
          className="pointer-events-auto btn-dream w-full text-base py-4"
          onClick={() => { sound.playClick(); onConfirm() }}
        >
          🚀 出发！LAUNCH!
        </button>
      </div>
    </div>
  )
}

// ── 战机卡片 ──────────────────────────────────────

interface ShipCardProps {
  ship:     ShipConfig
  selected: boolean
  onSelect: () => void
}

function ShipCard({ ship, selected, onSelect }: ShipCardProps) {
  return (
    <button
      className={[
        'pointer-events-auto relative p-3 rounded-2xl border-2 transition-all duration-200 text-center w-full',
        selected
          ? 'scale-[1.04]'
          : 'border-white/15 bg-white/5 active:scale-95',
      ].join(' ')}
      style={
        selected
          ? {
              borderColor: ship.trailColor,
              background:  `linear-gradient(135deg, ${ship.trailColor}18, ${ship.bulletColor}12)`,
              boxShadow:   `0 0 24px 4px ${ship.trailColor}40, inset 0 0 16px ${ship.trailColor}10`,
            }
          : {}
      }
      onClick={() => { sound.playSelect(); onSelect() }}
    >
      {/* 尾迹色点（右上角）*/}
      <div
        className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full border border-white/30"
        style={{ backgroundColor: ship.trailColor }}
      />

      {/* 选中标记（左上角）*/}
      {selected && (
        <div
          className="absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
          style={{ backgroundColor: ship.trailColor }}
        >
          ✓
        </div>
      )}

      {/* 战机图片 */}
      <div
        className="relative h-28 flex items-center justify-center mb-2 rounded-xl overflow-hidden"
      >
        {/* 背景光晕 */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            background: `radial-gradient(ellipse at center, ${ship.trailColor}${selected ? '30' : '18'}, transparent 70%)`,
            transition: 'background 0.2s',
          }}
        />
        <img
          src={ship.imageSrc}
          alt={ship.name}
          className="relative h-[88%] object-contain transition-all duration-200"
          style={{
            filter: selected
              ? `drop-shadow(0 0 14px ${ship.trailColor}) brightness(1.08)`
              : `drop-shadow(0 2px 6px rgba(0,0,0,0.6))`,
            transform: ship.rotateInGame ? 'rotate(180deg)' : 'none',
          }}
          draggable={false}
        />
      </div>

      {/* 战机名称 */}
      <p
        className="font-game font-bold text-sm leading-none"
        style={{ color: selected ? ship.trailColor : 'rgba(255,255,255,0.9)' }}
      >
        {ship.name}
      </p>
      <p className="font-game text-white/45 text-xs mt-1 leading-none">
        {ship.description}
      </p>
    </button>
  )
}

// ── 颜色指示点 ────────────────────────────────────

function ColorDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div
        className="w-2.5 h-2.5 rounded-full border border-white/20 flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="font-game text-white/35 text-[10px]">{label}</span>
    </div>
  )
}
