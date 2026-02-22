// ════════════════════════════════════════════════════
//  SOPHIA'S STARWAR — 全局类型定义
// ════════════════════════════════════════════════════

// ─── 界面状态 ─────────────────────────────────────
export type GameScreen =
  | 'loading'   // 图片预加载
  | 'start'     // 标题界面
  | 'select'    // 战机选择
  | 'playing'   // 游戏中
  | 'paused'    // 暂停
  | 'gameover'  // 游戏结束

// ─── 战机配置（4 架可选）──────────────────────────
export interface ShipConfig {
  id: 1 | 2 | 3 | 4
  name: string           // 银翼天使 / 火焰骑士 / 暗影使者 / 星际猎手
  imageSrc: string       // public/ships/player-X.png
  trailColor: string     // Canvas 粒子尾迹颜色
  bulletColor: string    // 子弹颜色
  description: string    // 简短描述（展示在选机界面）
  rotateInGame: boolean  // true = 图片原始朝下，需旋转 180° 才能机头朝上
}

// ─── 玩家状态 ────────────────────────────────────
export interface PlayerState {
  x: number              // 中心 X（设计坐标）
  y: number              // 中心 Y（设计坐标）
  width: number
  height: number
  lives: number          // 剩余爱心数（初始 3）
  invincible: boolean    // 被击中后的无敌帧
  invincibleTimer: number// 无敌剩余秒数
  shield: boolean        // 彩虹护盾是否激活
  shieldHits: number     // 护盾剩余可抵挡次数（最多 3）
  shieldTimer: number    // 护盾持续时间倒计时
  powerUp: 'normal' | 'triple' // 当前子弹模式
  powerUpTimer: number   // 道具剩余时间（秒）
  ship: ShipConfig
}

// ─── 敌机类型 ────────────────────────────────────
export type EnemyType = 1 | 2 | 3 | 4
// 1 = 重型轰炸机（图5）  2 = 快速侦察机（图6）
// 3 = 标准战机（图7）    4 = 精英护卫舰（图8，会反击）

export interface EnemyConfig {
  type: EnemyType
  hp: number
  speed: number          // 基础下落速度（设计单位/秒）
  score: number          // 击败得分
  radius: number         // 碰撞圆半径
  canShoot: boolean      // 是否会反击
  shootInterval: number  // 反击间隔（秒），canShoot=false 时为 0
  spawnWeight: number    // 相对出现权重
}

export interface Enemy {
  id: string
  type: EnemyType
  x: number
  y: number
  vx: number             // 横向速度（正弦漂移用）
  vy: number             // 纵向速度
  hp: number
  maxHp: number
  radius: number
  canShoot: boolean
  shootTimer: number     // 距离下次射击的计时器
  shootInterval: number
  active: boolean
  sineOffset: number     // 正弦漂移相位偏移
  sineAmplitude: number  // 正弦漂移振幅
}

// ─── 子弹 ────────────────────────────────────────
export type BulletShape = 'star' | 'heart' | 'circle'

export interface Bullet {
  id: string
  active: boolean
  x: number
  y: number
  vx: number
  vy: number
  shape: BulletShape
  color: string
  size: number
  isPlayer: boolean
}

// ─── 粒子（对象池复用）────────────────────────────
export type ParticleType = 'confetti' | 'sparkle' | 'trail' | 'shimmer' | 'heart'

export interface Particle {
  active: boolean
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  decay: number          // 每秒减少的 alpha 量
  color: string
  rotation: number
  rotationSpeed: number
  type: ParticleType
  life: number           // 已存活秒数
  maxLife: number        // 最大生命秒数
  gravity: number        // 重力加速度（confetti 下落用）
  scaleX: number         // 水平缩放（confetti 翻转用）
}

// ─── 道具 ────────────────────────────────────────
export type PowerUpType = 'triple' | 'shield'

export interface PowerUpItem {
  id: string
  active: boolean
  x: number
  y: number
  vy: number
  type: PowerUpType
  rotation: number       // 旋转角度（rad），用于旋转动画
  size: number
}

// ─── 浮动得分文字 ─────────────────────────────────
export interface FloatingText {
  id: string
  active: boolean
  x: number
  y: number
  vy: number             // 向上漂移速度
  text: string
  color: string
  alpha: number
  size: number
  life: number
  maxLife: number
}

// ─── 成就 ─────────────────────────────────────────
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
}

// ─── 游戏统计（成就判断依据）─────────────────────
export interface GameStats {
  score: number
  kills: number
  powerUpsCollected: number
  shieldBlockCount: number
  maxCombo: number
  wave: number
  survivalTime: number   // 秒
}

// ─── React 可读的游戏快照（通过 hook 传递）──────
export interface GameStateSnapshot {
  screen: GameScreen
  score: number
  highScore: number
  lives: number
  wave: number
  combo: number
  comboMultiplier: number
  selectedShipId: number
  achievements: Achievement[]
  stats: GameStats
}

// ─── Canvas 尺寸信息 ──────────────────────────────
export interface CanvasDimensions {
  designWidth: number    // 内部逻辑宽度（390）
  designHeight: number   // 内部逻辑高度（844）
  scale: number          // CSS 缩放比例
  dpr: number            // devicePixelRatio
  cssWidth: number       // canvas CSS 宽度
  cssHeight: number      // canvas CSS 高度
}

// ─── GameEngine 对外回调 ───────────────────────────
export interface GameEngineCallbacks {
  onStateChange: (snapshot: Partial<GameStateSnapshot>) => void
  onScreenChange: (screen: GameScreen) => void
}

// ─── 触控/鼠标输入状态（设计坐标系）──────────────
export interface PointerState {
  active: boolean
  x: number   // 设计坐标 0–390
  y: number   // 设计坐标 0–844
}

// ─── 游戏引擎接口（GameCanvas ↔ GameEngine 桥接）─
export interface IGameEngine {
  update(dt: number): void
  draw(ctx: CanvasRenderingContext2D): void
  setPointer(state: PointerState): void
}
