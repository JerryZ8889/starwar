// ════════════════════════════════════════════════════
//  App.tsx — 根组件 / 屏幕路由
//  GameCanvas 始终渲染（背景动画），
//  React 界面叠加在精确匹配 canvas 的容器上
// ════════════════════════════════════════════════════

import { useState, useRef, useCallback, useEffect } from 'react'
import type { GameScreen, IGameEngine, GameStateSnapshot, Achievement, GameStats } from './types'
import type { ImageMap } from './game/ImageLoader'
import GameCanvas        from './components/GameCanvas'
import LoadingScreen     from './components/LoadingScreen'
import StartScreen       from './components/StartScreen'
import ShipSelectScreen  from './components/ShipSelectScreen'
import HUD               from './components/HUD'
import GameOverScreen    from './components/GameOverScreen'
import { GameEngine }    from './game/GameEngine'
import { sound }         from './game/SoundManager'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from './constants/config'

// ── Canvas 尺寸 hook ───────────────────────────────
function useCanvasBounds() {
  const calc = useCallback(() => {
    const scale = Math.min(
      window.innerWidth  / DESIGN_WIDTH,
      window.innerHeight / DESIGN_HEIGHT,
    )
    return {
      w: Math.round(DESIGN_WIDTH  * scale),
      h: Math.round(DESIGN_HEIGHT * scale),
    }
  }, [])

  const [bounds, setBounds] = useState(calc)

  useEffect(() => {
    const onResize = () => setBounds(calc())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [calc])

  return bounds
}

// ── 游戏结算结果 ────────────────────────────────────
interface GameResult {
  stats:          GameStats
  achievements:   Achievement[]
  isNewHighScore: boolean
}

// ── HUD 状态（帧级更新来自引擎 onState 回调）─────────
interface HudState {
  score:           number
  lives:           number
  wave:            number
  combo:           number
  comboMultiplier: number
}

const DEFAULT_HUD: HudState = { score: 0, lives: 3, wave: 1, combo: 0, comboMultiplier: 1 }

// ══════════════════════════════════════════════════════
export default function App() {
  const [screen,          setScreen]          = useState<GameScreen>('loading')
  const [selectedShipId,  setSelectedShipId]  = useState<number>(1)
  const [highScore,       setHighScore]        = useState(
    () => parseInt(localStorage.getItem('sophia_highscore') ?? '0', 10),
  )
  const [images,  setImages]     = useState<ImageMap>(new Map())
  const [hudState, setHudState]  = useState<HudState>(DEFAULT_HUD)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)

  const engineRef        = useRef<IGameEngine | null>(null)
  const prevHighScoreRef = useRef(highScore)   // 开局时的最高分快照（用于判断是否打破纪录）
  const bounds           = useCanvasBounds()

  // ── 引擎 onState 回调（每帧可能调用，需稳定引用）──
  const handleState = useCallback((patch: Partial<GameStateSnapshot>) => {
    // 批量更新 HUD 状态
    const hudFields = ['score', 'lives', 'wave', 'combo', 'comboMultiplier'] as const
    const hasHud = hudFields.some(f => patch[f] !== undefined)
    if (hasHud) {
      setHudState(prev => ({
        score:           patch.score           ?? prev.score,
        lives:           patch.lives           ?? prev.lives,
        wave:            patch.wave            ?? prev.wave,
        combo:           patch.combo           ?? prev.combo,
        comboMultiplier: patch.comboMultiplier ?? prev.comboMultiplier,
      }))
    }

    // 游戏结束
    if (patch.screen === 'gameover' && patch.stats) {
      const finalScore = patch.stats.score
      const isNew      = finalScore > prevHighScoreRef.current
      if (isNew) {
        setHighScore(finalScore)
        prevHighScoreRef.current = finalScore
      }
      setGameResult({
        stats:          patch.stats,
        achievements:   patch.achievements ?? [],
        isNewHighScore: isNew,
      })
      setScreen('gameover')
    }
  }, [])   // 空依赖：setX 是稳定引用，prevHighScoreRef 是 ref

  // ── LoadingScreen 完成 ─────────────────────────────
  const handleLoadComplete = useCallback((loaded: ImageMap) => {
    setImages(loaded)
    setScreen('start')
  }, [])

  // ── 战机确认，启动引擎 ─────────────────────────────
  const handleLaunch = useCallback(() => {
    prevHighScoreRef.current = parseInt(localStorage.getItem('sophia_highscore') ?? '0', 10)
    setHudState(DEFAULT_HUD)
    engineRef.current = new GameEngine(images, selectedShipId, handleState)
    sound.playBgm()
    setScreen('playing')
  }, [images, selectedShipId, handleState])

  // ── 退出 / 销毁引擎 ───────────────────────────────
  const handleQuit = useCallback((dest: GameScreen) => {
    sound.stopBgm()
    engineRef.current = null
    setScreen(dest)
  }, [])

  // ── 游戏结束后重新来一局 ──────────────────────────
  const handlePlayAgain = useCallback(() => {
    engineRef.current = null
    setGameResult(null)
    setScreen('select')
  }, [])

  const handleMenu = useCallback(() => {
    engineRef.current = null
    setGameResult(null)
    setScreen('start')
  }, [])

  return (
    <div className="relative w-full h-full overflow-hidden bg-nebula-deep">

      {/* ── Canvas 层（始终渲染，提供动态背景）──── */}
      <GameCanvas engineRef={engineRef} />

      {/* ── React 叠加层（与 canvas 等大、居中）── */}
      <div
        className="absolute overflow-hidden pointer-events-none"
        style={{
          width:     bounds.w,
          height:    bounds.h,
          left:      '50%',
          top:       '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Loading */}
        {screen === 'loading' && (
          <LoadingScreen onComplete={handleLoadComplete} />
        )}

        {/* 标题界面 */}
        {screen === 'start' && (
          <StartScreen
            highScore={highScore}
            onStart={() => setScreen('select')}
          />
        )}

        {/* 战机选择 */}
        {screen === 'select' && (
          <ShipSelectScreen
            selectedId={selectedShipId}
            onSelect={setSelectedShipId}
            onConfirm={handleLaunch}
            onBack={() => setScreen('start')}
          />
        )}

        {/* 游戏进行中：HUD */}
        {screen === 'playing' && (
          <HUD
            score={hudState.score}
            lives={hudState.lives}
            wave={hudState.wave}
            combo={hudState.combo}
            comboMultiplier={hudState.comboMultiplier}
            onQuit={() => handleQuit('select')}
          />
        )}

        {/* 游戏结算 */}
        {screen === 'gameover' && gameResult && (
          <GameOverScreen
            stats={gameResult.stats}
            highScore={highScore}
            isNewHighScore={gameResult.isNewHighScore}
            achievements={gameResult.achievements}
            onPlayAgain={handlePlayAgain}
            onMenu={handleMenu}
          />
        )}
      </div>
    </div>
  )
}
