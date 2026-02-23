// ════════════════════════════════════════════════════
//  GameEngine.ts — 游戏主引擎（Step 4.2 完整版）
//  包含：玩家 / 子弹 / 敌机 / 碰撞 / 计分 / 道具
//  Step 4.3 将扩展：全屏烟花粒子 / 护盾特效 / 音效 / HUD
// ════════════════════════════════════════════════════

import type { IGameEngine, PointerState, GameStateSnapshot, ShipConfig, EnemyType, Achievement, GameStats } from '../types'
import type { ImageMap } from './ImageLoader'
import { SHIPS, PLAYER, POWERUP, COMBO, ENEMY_CONFIGS, ENEMY_IMAGE_SRCS,
         DESIGN_WIDTH, DESIGN_HEIGHT, getComboTier, ACHIEVEMENT_DEFS } from '../constants/config'
import { C } from '../constants/colors'
import { drawGlow, drawShipImage, drawStar, drawHeart, drawFloatingText } from './drawHelpers'
import { WaveSystem } from './WaveSystem'
import { sound } from './SoundManager'

// ══════════════════════════════════════════════════════
//  内部实体类型
// ══════════════════════════════════════════════════════

interface EnemyEntity {
  id: number
  type:       EnemyType
  x: number;  y: number
  spawnX:     number          // 正弦漂移的水平基准
  vy:         number          // 向下速度
  hp: number; maxHp: number
  radius:     number
  canShoot:   boolean
  shootTimer: number
  shootInterval: number
  sineFreq:   number          // 正弦频率（rad/s）
  sineAmp:    number          // 正弦振幅（设计单位）
  sinePhase:  number          // 初始相位
  displayW:   number
  displayH:   number
  // Type 4 俯冲
  diveTimer:  number          // 距下次俯冲的倒计时（秒）
  isDiving:   boolean         // 当前是否在俯冲
  diveDX:     number          // 俯冲方向 X（已归一化）
  diveDY:     number          // 俯冲方向 Y（已归一化）
  diveSpeed:  number          // 俯冲速度
}

interface BulletEntity {
  id: number
  active:   boolean
  x: number; y: number
  vx: number; vy: number
  shape:    'star' | 'heart' | 'circle'
  color:    string
  size:     number
  isPlayer: boolean
  rotation: number
}

interface BurstParticle {
  x: number; y: number
  vx: number; vy: number
  color:   string
  size:    number
  alpha:   number
  life:    number
  maxLife: number
  gravity: number
}

interface PowerUpEntity {
  id: number
  active:   boolean
  x: number; y: number
  vy:       number
  type:     'triple' | 'shield'
  rotation: number
}

interface FloatText {
  x: number; y: number
  vy:      number
  text:    string
  color:   string
  alpha:   number
  life:    number
  maxLife: number
  size:    number
}

interface TrailParticle {
  x: number; y: number
  vx: number; vy: number
  size:    number
  alpha:   number
  color:   string
  life:    number
  maxLife: number
}

// 敌机显示尺寸（设计单位）
const ENEMY_DISPLAY: Record<number, { w: number; h: number }> = {
  1: { w: 88, h: 72 },
  2: { w: 62, h: 68 },
  3: { w: 74, h: 74 },
  4: { w: 90, h: 82 },
}

type StateCallback = (patch: Partial<GameStateSnapshot>) => void

// ══════════════════════════════════════════════════════
export class GameEngine implements IGameEngine {

  // ── 资源 ─────────────────────────────────────────
  protected readonly images:  ImageMap
  protected readonly ship:    ShipConfig
  protected readonly onState: StateCallback

  // ── 玩家 ─────────────────────────────────────────
  protected px = DESIGN_WIDTH  / 2
  protected py = DESIGN_HEIGHT * PLAYER.START_Y_RATIO
  protected lives: number = PLAYER.LIVES
  protected invTimer    = 0
  protected shieldOn    = false
  protected shieldHits  = 0
  protected shieldTimer = 0
  protected powerUp: 'normal' | 'triple' = 'normal'
  protected powerUpTimer = 0

  // ── 输入 ─────────────────────────────────────────
  protected ptr: PointerState = {
    active: false,
    x: DESIGN_WIDTH / 2,
    y: DESIGN_HEIGHT * 0.80,
  }

  // ── 尾迹粒子 ─────────────────────────────────────
  private trails: TrailParticle[] = []

  // ── 子弹 ─────────────────────────────────────────
  private playerBullets: BulletEntity[] = []
  private enemyBullets:  BulletEntity[] = []
  private fireTimer = 0

  // ── 敌机 ─────────────────────────────────────────
  private enemies: EnemyEntity[] = []

  // ── 爆炸粒子（简版，4.3 升级为完整烟花）─────────
  private bursts: BurstParticle[] = []

  // ── 道具 ─────────────────────────────────────────
  private powerUps: PowerUpEntity[] = []

  // ── 浮动分数文字 ─────────────────────────────────
  private floatTexts: FloatText[] = []

  // ── 波次系统 ─────────────────────────────────────
  private waveSystem = new WaveSystem()

  // ── 计分 ─────────────────────────────────────────
  protected score          = 0
  protected wave           = 1
  protected combo          = 0
  protected comboTimer     = 0
  protected totalKills     = 0
  protected powerUpCount   = 0
  protected maxCombo       = 0
  protected shieldBlockCount = 0

  // ── 状态 ─────────────────────────────────────────
  protected elapsed  = 0
  protected gameOver = false
  private   idSeq    = 0

  private getId() { return ++this.idSeq }

  // ═══════════════════════════════════════════════
  constructor(images: ImageMap, shipId: number, onState: StateCallback) {
    this.images  = images
    this.ship    = SHIPS.find(s => s.id === shipId) ?? SHIPS[0]
    this.onState = onState

    onState({
      score: 0, lives: PLAYER.LIVES,
      wave: 1,  combo: 0, comboMultiplier: 1,
    })
  }

  // ═══════════════════════════════════════════════
  //  IGameEngine 接口
  // ═══════════════════════════════════════════════

  setPointer(state: PointerState) { this.ptr = state }

  update(dt: number) {
    if (this.gameOver) return
    this.elapsed += dt

    // 玩家
    this.updatePlayer(dt)
    this.updateTrails(dt)

    // 子弹
    this.fireAutomatic(dt)
    this.updateBullets(dt)

    // 敌机
    const spawnType = this.waveSystem.update(dt)
    if (spawnType !== null) this.spawnEnemy(spawnType)
    this.updateEnemies(dt)

    // 道具
    this.updatePowerUps(dt)

    // 碰撞检测
    this.checkPlayerBulletsVsEnemies()
    this.checkEnemyBulletsVsPlayer()
    this.checkEnemiesVsPlayer()
    this.checkPowerUpsVsPlayer()

    // 浮动文字 / 粒子
    this.updateBursts(dt)
    this.updateFloatTexts(dt)
    this.updateCombo(dt)

    // 同步波次
    const w = this.waveSystem.getWave()
    if (w !== this.wave) {
      this.wave = w
      this.onState({ wave: w })
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.drawBursts(ctx)
    this.drawPowerUps(ctx)
    this.drawEnemies(ctx)
    this.drawPlayerBullets(ctx)
    this.drawEnemyBullets(ctx)
    this.drawTrails(ctx)
    this.drawPlayer(ctx)
    this.drawFloatTexts(ctx)
    this.drawTempHUD(ctx)       // 临时画布 HUD（Step 4.3 替换为 React 组件）
  }

  // ═══════════════════════════════════════════════
  //  玩家移动
  // ═══════════════════════════════════════════════

  private updatePlayer(dt: number) {
    if (this.ptr.active) {
      const k = 1 - Math.exp(-10 * dt)
      this.px += (this.ptr.x - this.px) * k
      this.py += (this.ptr.y - this.py) * k
    }
    const hw = PLAYER.WIDTH  / 2
    const hh = PLAYER.HEIGHT / 2
    this.px = Math.max(hw + 4,               Math.min(DESIGN_WIDTH  - hw - 4,  this.px))
    this.py = Math.max(DESIGN_HEIGHT * 0.22, Math.min(DESIGN_HEIGHT - hh - 12, this.py))

    if (this.invTimer > 0) this.invTimer = Math.max(0, this.invTimer - dt)
    // 护盾无时间限制，仅在 shieldHits 耗尽时消失（见 onPlayerHit）
    if (this.powerUpTimer > 0) {
      this.powerUpTimer = Math.max(0, this.powerUpTimer - dt)
      if (this.powerUpTimer <= 0) this.powerUp = 'normal'
    }

    this.spawnTrail()
  }

  // ═══════════════════════════════════════════════
  //  尾迹粒子
  // ═══════════════════════════════════════════════

  private spawnTrail() {
    const ex = this.px
    const ey = this.py + PLAYER.TRAIL_OFFSET
    for (let i = 0; i < PLAYER.TRAIL_RATE; i++) {
      if (this.trails.length >= 200) break
      this.trails.push({
        x: ex + (Math.random() - 0.5) * 12,
        y: ey + Math.random() * 6,
        vx: (Math.random() - 0.5) * 20,
        vy: 38 + Math.random() * 48,
        size: 2.2 + Math.random() * 2.8,
        alpha: 0.70 + Math.random() * 0.30,
        color: this.ship.trailColor,
        life: 0, maxLife: 0.25 + Math.random() * 0.22,
      })
    }
  }

  private updateTrails(dt: number) {
    let i = this.trails.length
    while (i--) {
      const t = this.trails[i]
      t.x += t.vx * dt; t.y += t.vy * dt; t.life += dt
      t.alpha = Math.max(0, (1 - t.life / t.maxLife) * 0.88)
      if (t.life >= t.maxLife) this.trails.splice(i, 1)
    }
  }

  private drawTrails(ctx: CanvasRenderingContext2D) {
    for (const t of this.trails) {
      if (t.alpha < 0.02) continue
      const r = t.size * (1 - t.life / t.maxLife)
      if (r < 0.1) continue
      ctx.save()
      ctx.globalAlpha = t.alpha
      ctx.fillStyle   = t.color
      ctx.shadowBlur  = r * 5
      ctx.shadowColor = t.color
      ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
    }
  }

  // ═══════════════════════════════════════════════
  //  自动射击
  // ═══════════════════════════════════════════════

  private fireAutomatic(dt: number) {
    this.fireTimer -= dt
    if (this.fireTimer > 0) return
    this.fireTimer = PLAYER.AUTO_FIRE_RATE
    sound.playShoot()

    if (this.powerUp === 'triple') {
      this.spawnBullet(this.px,      this.py - 30, 0,    -PLAYER.BULLET_SPEED, 'heart',  C.heartBullet, PLAYER.BULLET_SIZE * 0.9)
      this.spawnBullet(this.px - 16, this.py - 20, -80,  -PLAYER.BULLET_SPEED * 0.9, 'heart', C.heartBullet, PLAYER.BULLET_SIZE * 0.8)
      this.spawnBullet(this.px + 16, this.py - 20, 80,   -PLAYER.BULLET_SPEED * 0.9, 'heart', C.heartBullet, PLAYER.BULLET_SIZE * 0.8)
    } else {
      this.spawnBullet(this.px, this.py - 30, 0, -PLAYER.BULLET_SPEED, 'star', this.ship.bulletColor, PLAYER.BULLET_SIZE)
    }
  }

  private spawnBullet(x: number, y: number, vx: number, vy: number,
    shape: BulletEntity['shape'], color: string, size: number) {
    this.playerBullets.push({
      id: this.getId(), active: true,
      x, y, vx, vy, shape, color, size, isPlayer: true,
      rotation: Math.random() * Math.PI * 2,
    })
  }

  private spawnEnemyBullet(x: number, y: number) {
    this.enemyBullets.push({
      id: this.getId(), active: true,
      x, y, vx: 0, vy: PLAYER.BULLET_SPEED * 0.5, shape: 'circle',
      color: C.enemyBullet, size: 7, isPlayer: false, rotation: 0,
    })
  }

  private updateBullets(dt: number) {
    const rotSpeed = 4   // 子弹旋转速度

    // 玩家子弹
    let i = this.playerBullets.length
    while (i--) {
      const b = this.playerBullets[i]
      b.x += b.vx * dt; b.y += b.vy * dt
      b.rotation += rotSpeed * dt
      if (b.y < -20 || b.x < -20 || b.x > DESIGN_WIDTH + 20)
        this.playerBullets.splice(i, 1)
    }

    // 敌机子弹
    i = this.enemyBullets.length
    while (i--) {
      const b = this.enemyBullets[i]
      b.x += b.vx * dt; b.y += b.vy * dt
      if (b.y > DESIGN_HEIGHT + 20)
        this.enemyBullets.splice(i, 1)
    }
  }

  // ═══════════════════════════════════════════════
  //  敌机生成 / 移动
  // ═══════════════════════════════════════════════

  private spawnEnemy(type: EnemyType) {
    const cfg     = ENEMY_CONFIGS[type]
    const display = ENEMY_DISPLAY[type]
    const margin  = display.w / 2 + 10
    const spawnX  = margin + Math.random() * (DESIGN_WIDTH - margin * 2)
    const speedMult = this.waveSystem.getSpeedMult()

    this.enemies.push({
      id: this.getId(), type,
      x: spawnX, y: -display.h / 2 - 10, spawnX,
      vy: cfg.speed * speedMult,
      hp: cfg.hp, maxHp: cfg.hp,
      radius: cfg.radius,
      canShoot: cfg.canShoot,
      shootTimer: cfg.shootInterval * 0.5,  // 第一次射击略有延迟
      shootInterval: cfg.shootInterval,
      sineFreq:  0.5 + Math.random() * 0.8,
      sineAmp:   type === 1 ? 15 : type === 4 ? 35 : 22 + Math.random() * 20,
      sinePhase: Math.random() * Math.PI * 2,
      displayW: display.w,
      displayH: display.h,
      // Type 4 俯冲初始化
      diveTimer:  type === 4 ? 3.5 + Math.random() * 2 : 999,
      isDiving:   false,
      diveDX:     0,
      diveDY:     1,
      diveSpeed:  0,
    })
  }

  private updateEnemies(dt: number) {
    let i = this.enemies.length
    while (i--) {
      const e = this.enemies[i]

      if (e.type === 4) {
        // ── 精英护卫舰：俯冲逻辑 ──────────────────
        e.diveTimer -= dt

        if (e.isDiving) {
          // 俯冲中：沿固定方向高速移动
          e.x += e.diveDX * e.diveSpeed * dt
          e.y += e.diveDY * e.diveSpeed * dt

          // 俯冲结束：冲过玩家或飞出屏幕边缘
          const pastPlayer  = e.y > this.py + 80
          const offScreen   = e.y > DESIGN_HEIGHT + e.displayH ||
                              e.x < -e.displayW || e.x > DESIGN_WIDTH + e.displayW
          if (pastPlayer || offScreen) {
            e.isDiving  = false
            e.diveTimer = 4.0 + Math.random() * 2   // 下次俯冲冷却
            // 以当前 X 为新漂移基准，避免瞬移
            e.spawnX = Math.max(
              e.displayW / 2 + 10,
              Math.min(DESIGN_WIDTH - e.displayW / 2 - 10, e.x),
            )
          }
        } else {
          // 正常下落 + 正弦漂移
          e.y += e.vy * dt
          e.x  = e.spawnX + Math.sin(this.elapsed * e.sineFreq + e.sinePhase) * e.sineAmp

          // 触发俯冲：计时结束且已进入屏幕上半区
          if (e.diveTimer <= 0 && e.y > 0 && e.y < DESIGN_HEIGHT * 0.55) {
            const dx   = this.px - e.x
            const dy   = this.py - e.y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1
            e.isDiving  = true
            e.diveDX    = dx / dist
            e.diveDY    = dy / dist
            e.diveSpeed = 290
          }
        }
      } else {
        // ── 普通敌机：纵向下落 + 正弦漂移 ─────────
        e.y += e.vy * dt
        e.x  = e.spawnX + Math.sin(this.elapsed * e.sineFreq + e.sinePhase) * e.sineAmp
      }

      // 所有敌机：反击射击
      if (e.canShoot) {
        e.shootTimer -= dt
        if (e.shootTimer <= 0) {
          e.shootTimer = e.shootInterval
          this.spawnEnemyBullet(e.x, e.y + e.displayH / 2)
        }
      }

      // 飞出屏幕底部：移除（不扣血）
      if (e.y > DESIGN_HEIGHT + e.displayH / 2 + 20)
        this.enemies.splice(i, 1)
    }
  }

  // ═══════════════════════════════════════════════
  //  道具
  // ═══════════════════════════════════════════════

  private tryDropPowerUp(x: number, y: number, type: EnemyType) {
    const isElite = type === 1 || type === 4
    if (!isElite && Math.random() > POWERUP.DROP_CHANCE_NORMAL) return

    const pType = Math.random() < 0.55 ? 'triple' : 'shield'
    this.powerUps.push({
      id: this.getId(), active: true,
      x, y, vy: POWERUP.FALL_SPEED,
      type: pType, rotation: 0,
    })
  }

  private updatePowerUps(dt: number) {
    let i = this.powerUps.length
    while (i--) {
      const p = this.powerUps[i]
      p.y        += p.vy * dt
      p.rotation += POWERUP.ROTATION_SPEED * dt
      if (!p.active || p.y > DESIGN_HEIGHT + 40)
        this.powerUps.splice(i, 1)
    }
  }

  // ═══════════════════════════════════════════════
  //  碰撞检测（圆形）
  // ═══════════════════════════════════════════════

  private overlap(ax: number, ay: number, ar: number,
                  bx: number, by: number, br: number) {
    const dx = ax - bx, dy = ay - by
    return dx * dx + dy * dy < (ar + br) * (ar + br)
  }

  private checkPlayerBulletsVsEnemies() {
    for (let bi = this.playerBullets.length - 1; bi >= 0; bi--) {
      const b = this.playerBullets[bi]
      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const e = this.enemies[ei]
        if (!this.overlap(b.x, b.y, b.size, e.x, e.y, e.radius)) continue

        // 命中
        this.playerBullets.splice(bi, 1)
        e.hp--
        if (e.hp <= 0) {
          this.onEnemyKilled(e)
          this.enemies.splice(ei, 1)
        } else {
          // 受伤闪白
          this.spawnBurst(e.x, e.y, 6, '#ffffff')
          sound.playHitEnemy()
        }
        break
      }
    }
  }

  private checkEnemyBulletsVsPlayer() {
    if (this.invTimer > 0) return
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i]
      if (!this.overlap(b.x, b.y, b.size, this.px, this.py, PLAYER.COLLISION_RADIUS)) continue
      this.enemyBullets.splice(i, 1)
      this.onPlayerHit()
      break
    }
  }

  private checkEnemiesVsPlayer() {
    if (this.invTimer > 0) return
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]
      if (!this.overlap(e.x, e.y, e.radius * 0.7, this.px, this.py, PLAYER.COLLISION_RADIUS)) continue
      this.enemies.splice(i, 1)
      this.onPlayerHit()
      break
    }
  }

  private checkPowerUpsVsPlayer() {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i]
      if (!p.active) continue
      if (!this.overlap(p.x, p.y, POWERUP.SIZE, this.px, this.py, PLAYER.COLLISION_RADIUS + 10)) continue

      // 收集道具
      p.active = false
      this.powerUpCount++

      sound.playPowerUp()
      if (p.type === 'triple') {
        this.powerUp      = 'triple'
        this.powerUpTimer = POWERUP.TRIPLE_DURATION
        this.addFloatText(p.x, p.y, '💕 Triple!', C.heartBullet)
      } else {
        this.shieldOn   = true
        this.shieldHits = POWERUP.SHIELD_HITS
        this.addFloatText(p.x, p.y, '🛡 Shield!', '#60a5fa')
      }

      this.onState({ lives: this.lives })
    }
  }

  // ═══════════════════════════════════════════════
  //  事件处理
  // ═══════════════════════════════════════════════

  private onEnemyKilled(e: EnemyEntity) {
    this.combo++
    this.comboTimer = COMBO.WINDOW
    this.totalKills++
    if (this.combo > this.maxCombo) this.maxCombo = this.combo

    const tier   = getComboTier(this.combo)
    const points = Math.round(ENEMY_CONFIGS[e.type].score * tier.multiplier)
    this.score  += points

    // 爆炸粒子 + 音效
    sound.playHitEnemy()
    this.spawnBurst(e.x, e.y, 20, C.confetti[Math.floor(Math.random() * C.confetti.length)])

    // 浮动得分
    const label = tier.multiplier > 1
      ? `+${points}  ${tier.label}`
      : `+${points}`
    this.addFloatText(e.x, e.y, label,
      tier.multiplier >= 2 ? C.hudCombo : C.hudScore)

    this.tryDropPowerUp(e.x, e.y, e.type)

    this.onState({
      score: this.score,
      combo: this.combo,
      comboMultiplier: tier.multiplier,
    })
  }

  private onPlayerHit() {
    if (this.shieldOn && this.shieldHits > 0) {
      // 护盾吸收
      this.shieldHits--
      this.shieldBlockCount++
      this.spawnBurst(this.px, this.py, 10, '#60a5fa')
      this.addFloatText(this.px, this.py - 40, 'Shield!', '#60a5fa')
      if (this.shieldHits <= 0) {
        this.shieldOn = false
        this.onState({ lives: this.lives })
      }
      return
    }

    this.lives = Math.max(0, this.lives - 1)
    this.triggerInvincible()
    this.spawnBurst(this.px, this.py, 12, C.sakura)
    sound.playPlayerHit()
    this.onState({ lives: this.lives })

    if (this.lives <= 0) {
      this.gameOver = true
      sound.stopBgm()
      sound.playGameOver()

      // 保存最高分
      const prev = parseInt(localStorage.getItem('sophia_highscore') ?? '0', 10)
      if (this.score > prev) {
        localStorage.setItem('sophia_highscore', String(this.score))
      }

      // 构建本局统计
      const stats: GameStats = {
        score:             this.score,
        kills:             this.totalKills,
        powerUpsCollected: this.powerUpCount,
        shieldBlockCount:  this.shieldBlockCount,
        maxCombo:          this.maxCombo,
        wave:              this.wave,
        survivalTime:      this.elapsed,
      }

      // 成就判断 & 通知 React
      const achievements = this.evaluateAchievements()
      this.onState({ screen: 'gameover', stats, achievements })
    }
  }

  private updateCombo(dt: number) {
    if (this.combo > 0) {
      this.comboTimer -= dt
      if (this.comboTimer <= 0) {
        this.combo = 0
        this.onState({ combo: 0, comboMultiplier: 1 })
      }
    }
  }

  // ═══════════════════════════════════════════════
  //  爆炸粒子（简版）
  // ═══════════════════════════════════════════════

  private spawnBurst(x: number, y: number, count: number, baseColor: string) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
      const speed = 55 + Math.random() * 130
      const colors = C.confetti
      this.bursts.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: i % 3 === 0 ? baseColor : colors[Math.floor(Math.random() * colors.length)],
        size:    3 + Math.random() * 4,
        alpha:   1,
        life:    0, maxLife: 0.45 + Math.random() * 0.45,
        gravity: 90,
      })
    }
  }

  private updateBursts(dt: number) {
    let i = this.bursts.length
    while (i--) {
      const p = this.bursts[i]
      p.x    += p.vx * dt
      p.y    += p.vy * dt
      p.vy   += p.gravity * dt
      p.life += dt
      p.alpha = Math.max(0, 1 - p.life / p.maxLife)
      if (p.life >= p.maxLife) this.bursts.splice(i, 1)
    }
  }

  private drawBursts(ctx: CanvasRenderingContext2D) {
    for (const p of this.bursts) {
      if (p.alpha < 0.02) continue
      const r = p.size * (1 - p.life / p.maxLife * 0.5)
      ctx.save()
      ctx.globalAlpha = p.alpha
      ctx.fillStyle   = p.color
      ctx.shadowBlur  = r * 3
      ctx.shadowColor = p.color
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
    }
  }

  // ═══════════════════════════════════════════════
  //  浮动得分文字
  // ═══════════════════════════════════════════════

  private addFloatText(x: number, y: number, text: string, color: string) {
    this.floatTexts.push({
      x, y, vy: -70, text, color,
      alpha: 1, life: 0, maxLife: 1.1, size: 16,
    })
  }

  private updateFloatTexts(dt: number) {
    let i = this.floatTexts.length
    while (i--) {
      const f = this.floatTexts[i]
      f.y    += f.vy * dt
      f.life += dt
      f.alpha = Math.max(0, 1 - f.life / f.maxLife)
      if (f.life >= f.maxLife) this.floatTexts.splice(i, 1)
    }
  }

  private drawFloatTexts(ctx: CanvasRenderingContext2D) {
    for (const f of this.floatTexts) {
      drawFloatingText(ctx, f.text, f.x, f.y, f.color, f.alpha, f.size)
    }
  }

  // ═══════════════════════════════════════════════
  //  绘制：敌机
  // ═══════════════════════════════════════════════

  private drawEnemies(ctx: CanvasRenderingContext2D) {
    for (const e of this.enemies) {
      const src = ENEMY_IMAGE_SRCS[e.type]
      const img = this.images.get(src)
      if (img?.complete && img.naturalHeight > 0) {
        drawShipImage(ctx, img, e.x, e.y, e.displayW, e.displayH, 1, false)
      } else {
        // 图片未加载：画一个占位圆
        ctx.save()
        ctx.fillStyle = '#60a5fa'
        ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
      }

      // 血量条（hp 不满时显示）
      if (e.hp < e.maxHp) {
        const bw = 44, bh = 4
        const bx = e.x - bw / 2
        const by = e.y - e.displayH / 2 - 10
        ctx.save()
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 2); ctx.fill()
        const ratio = e.hp / e.maxHp
        ctx.fillStyle = ratio > 0.5 ? '#a7f3d0' : '#fb7185'
        ctx.beginPath(); ctx.roundRect(bx, by, bw * ratio, bh, 2); ctx.fill()
        ctx.restore()
      }
    }
  }

  // ═══════════════════════════════════════════════
  //  绘制：子弹
  // ═══════════════════════════════════════════════

  private drawPlayerBullets(ctx: CanvasRenderingContext2D) {
    for (const b of this.playerBullets) {
      if (b.shape === 'star') {
        drawStar(ctx, b.x, b.y, b.size, b.size * 0.4, b.color, 1, b.rotation)
      } else {
        drawHeart(ctx, b.x, b.y, b.size, b.color, 1)
      }
    }
  }

  private drawEnemyBullets(ctx: CanvasRenderingContext2D) {
    for (const b of this.enemyBullets) {
      ctx.save()
      ctx.fillStyle   = b.color
      ctx.shadowBlur  = b.size * 2
      ctx.shadowColor = b.color
      ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
    }
  }

  // ═══════════════════════════════════════════════
  //  绘制：道具
  // ═══════════════════════════════════════════════

  private drawPowerUps(ctx: CanvasRenderingContext2D) {
    for (const p of this.powerUps) {
      if (!p.active) continue
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)

      if (p.type === 'triple') {
        // 粉色爱心道具
        drawGlow(ctx, 0, 0, POWERUP.SIZE * 1.4, C.heartBullet, 0.3)
        drawHeart(ctx, 0, 0, POWERUP.SIZE * 0.65, C.heartBullet, 1)
      } else {
        // 蓝色护盾道具（六角星）
        drawGlow(ctx, 0, 0, POWERUP.SIZE * 1.4, '#60a5fa', 0.3)
        drawStar(ctx, 0, 0, POWERUP.SIZE * 0.75, POWERUP.SIZE * 0.35, '#60a5fa', 1, 0)
      }

      ctx.restore()
    }
  }

  // ═══════════════════════════════════════════════
  //  绘制：玩家
  // ═══════════════════════════════════════════════

  private drawPlayer(ctx: CanvasRenderingContext2D) {
    const img = this.images.get(this.ship.imageSrc)
    if (!img?.complete || img.naturalHeight === 0) return

    this.drawEngineGlow(ctx)

    const isInv = this.invTimer > 0
    const alpha = isInv ? (Math.sin(this.elapsed * 16) > 0 ? 0.95 : 0.22) : 1

    drawShipImage(ctx, img, this.px, this.py, PLAYER.WIDTH, PLAYER.HEIGHT, alpha, this.ship.rotateInGame)

    if (!isInv) {
      drawGlow(ctx, this.px, this.py, PLAYER.WIDTH * 0.6, this.ship.trailColor, 0.07)
    }

    // 护盾光圈
    if (this.shieldOn) {
      const pulse = 0.8 + 0.2 * Math.sin(this.elapsed * 6)
      drawGlow(ctx, this.px, this.py, PLAYER.WIDTH * pulse, '#60a5fa', 0.28 * pulse)
      // 彩虹描边
      const colors = C.shieldRainbow
      const r      = PLAYER.WIDTH * 0.72
      const rot    = this.elapsed * 1.5
      ctx.save()
      colors.forEach((col, ci) => {
        const arc = (Math.PI * 2) / colors.length
        ctx.beginPath()
        ctx.arc(this.px, this.py, r, rot + arc * ci, rot + arc * (ci + 1))
        ctx.strokeStyle = col; ctx.lineWidth = 4
        ctx.shadowBlur = 10; ctx.shadowColor = col
        ctx.stroke()
      })
      ctx.restore()
    }
  }

  private drawEngineGlow(ctx: CanvasRenderingContext2D) {
    const ex    = this.px
    const ey    = this.py + PLAYER.TRAIL_OFFSET
    const pulse = 0.70 + 0.30 * Math.sin(this.elapsed * 8.5)
    drawGlow(ctx, ex, ey, 26 * pulse, this.ship.trailColor, 0.30 * pulse)
    drawGlow(ctx, ex, ey,  9 * pulse, '#ffffff',             0.50 * pulse)
  }

  // ═══════════════════════════════════════════════
  //  成就判断（本局新解锁项）
  // ═══════════════════════════════════════════════

  private evaluateAchievements(): Achievement[] {
    const stored: string[] = JSON.parse(
      localStorage.getItem('sophia_achievements') ?? '[]',
    )
    const newlyUnlocked: Achievement[] = []

    for (const def of ACHIEVEMENT_DEFS) {
      if (stored.includes(def.id)) continue   // 已解锁，跳过

      let earned = false
      if (def.id === 'first_game')   earned = true
      if (def.id === 'shield_block') earned = this.shieldBlockCount >= 1
      if (def.id === 'candy_queen')  earned = this.powerUpCount >= 5
      if (def.id === 'combo_star')   earned = this.maxCombo >= 5
      if (def.id === 'high_score')   earned = this.score > 1000
      if (def.id === 'wave_5')       earned = this.wave >= 5

      if (earned) {
        newlyUnlocked.push({
          id: def.id, name: def.name,
          description: def.description, icon: def.icon,
          unlocked: true,
        })
      }
    }

    if (newlyUnlocked.length > 0) {
      const all = [...new Set([...stored, ...newlyUnlocked.map(a => a.id)])]
      localStorage.setItem('sophia_achievements', JSON.stringify(all))
    }

    return newlyUnlocked
  }

  // ═══════════════════════════════════════════════
  //  Canvas HUD（仅显示道具倒计时，分数等由 React 接管）
  // ═══════════════════════════════════════════════

  private drawTempHUD(ctx: CanvasRenderingContext2D) {
    if (this.gameOver) return   // React GameOverScreen 负责显示

    const showTriple = this.powerUp === 'triple'
    const showShield = this.shieldOn
    if (!showTriple && !showShield) return

    ctx.save()
    ctx.font         = '13px Quicksand, sans-serif'
    ctx.textBaseline = 'top'
    ctx.shadowBlur   = 6

    if (showTriple) {
      ctx.textAlign   = 'left'
      ctx.fillStyle   = C.heartBullet
      ctx.shadowColor = C.heartBullet
      ctx.fillText(`💕 ${this.powerUpTimer.toFixed(1)}s`, 14, 40)
    }
    if (showShield) {
      ctx.textAlign   = 'right'
      ctx.fillStyle   = '#60a5fa'
      ctx.shadowColor = '#60a5fa'
      ctx.fillText(`🛡 ×${this.shieldHits}`, DESIGN_WIDTH - 14, 40)
    }

    ctx.restore()
  }

  // ═══════════════════════════════════════════════
  //  对外辅助
  // ═══════════════════════════════════════════════

  getPlayerPos()   { return { x: this.px, y: this.py } }
  getShip()        { return this.ship }
  isInvincible()   { return this.invTimer > 0 }
  triggerInvincible() { this.invTimer = PLAYER.INVINCIBLE_TIME }
  getLives()       { return this.lives }
  getScore()       { return this.score }
  isGameOver()     { return this.gameOver }
}
