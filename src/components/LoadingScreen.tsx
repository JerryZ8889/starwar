// ════════════════════════════════════════════════════
//  LoadingScreen.tsx — 图片预加载界面
//  首屏展示，加载 8 张战机 PNG
// ════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from 'react'
import { loadImages, type ImageMap } from '../game/ImageLoader'

interface Props {
  onComplete: (images: ImageMap) => void
}

export default function LoadingScreen({ onComplete }: Props) {
  const [loaded, setLoaded]   = useState(0)
  const [total,  setTotal]    = useState(8)
  const [done,   setDone]     = useState(false)

  const progress = total > 0 ? Math.round((loaded / total) * 100) : 0

  // 进度回调需要稳定引用
  const handleProgress = useCallback((l: number, t: number) => {
    setLoaded(l)
    setTotal(t)
  }, [])

  useEffect(() => {
    loadImages(handleProgress).then(images => {
      setDone(true)
      // 短暂停留让用户看到 100%，再切屏
      setTimeout(() => onComplete(images), 500)
    })
  }, [handleProgress, onComplete])

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-nebula-deep/92 backdrop-blur-sm">

      {/* 旋转星星 Logo */}
      <div
        className="text-7xl mb-8 animate-float select-none"
        style={{ filter: 'drop-shadow(0 0 24px #ffb7d5)' }}
      >
        ✨
      </div>

      {/* 标题 */}
      <h1 className="font-game font-bold text-2xl text-rainbow mb-1 tracking-wide">
        SOPHIA'S STARWAR
      </h1>
      <p className="font-game text-dream-lavender/60 text-xs tracking-widest uppercase mb-10">
        ✦ A Magical Space Adventure ✦
      </p>

      {/* 进度卡片 */}
      <div className="glass-card px-10 py-7 w-64 text-center">
        <p className="font-game text-dream-mint text-sm mb-5 transition-all duration-300">
          {done ? '准备就绪 ✨' : '正在准备出发...'}
        </p>

        {/* 进度条 */}
        <div className="relative h-2.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #ffb7d5, #c4b5fd, #bae6fd)',
            }}
          />
          {/* 光泽扫光 */}
          <div
            className="absolute inset-y-0 w-8 bg-white/30 blur-sm"
            style={{
              left: `calc(${progress}% - 16px)`,
              transition: 'left 0.5s ease-out',
            }}
          />
        </div>

        {/* 星星进度指示 */}
        <div className="flex justify-between mt-3 px-1">
          {[25, 50, 75, 100].map(threshold => (
            <span
              key={threshold}
              className="text-sm transition-all duration-300"
              style={{
                color:   progress >= threshold ? '#fde68a' : 'rgba(255,255,255,0.2)',
                filter:  progress >= threshold ? 'drop-shadow(0 0 6px #fde68a)' : 'none',
                transform: progress >= threshold ? 'scale(1.2)' : 'scale(1)',
              }}
            >
              ★
            </span>
          ))}
        </div>

        <p className="font-game text-white/30 text-xs mt-3">
          {loaded} / {total}
        </p>
      </div>

      {/* 底部提示 */}
      <p className="absolute bottom-8 font-game text-white/20 text-xs animate-pulse">
        Loading ship assets...
      </p>
    </div>
  )
}
