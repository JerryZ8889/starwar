// ════════════════════════════════════════════════════
//  SOPHIA'S STARWAR — 游戏参数配置
//  修改这里即可调整难度、速度、分数等所有数值
// ════════════════════════════════════════════════════

import type { ShipConfig, EnemyConfig } from '../types'

// ─── 设计画布尺寸（内部逻辑单位）────────────────
export const DESIGN_WIDTH  = 390
export const DESIGN_HEIGHT = 844

// ─── 玩家 ────────────────────────────────────────
export const PLAYER = {
  WIDTH:            80,      // 渲染宽度
  HEIGHT:           80,      // 渲染高度
  COLLISION_RADIUS: 22,      // 碰撞圆半径（比图片小，更宽容）
  START_Y_RATIO:    0.80,    // 初始纵向位置（占高度比例）
  LIVES:            3,
  INVINCIBLE_TIME:  2.0,     // 被击中后无敌秒数
  TRAIL_RATE:       3,       // 每帧生成的尾迹粒子数
  TRAIL_OFFSET:     30,      // 尾迹生成点距中心的纵向偏移（向下）
  AUTO_FIRE_RATE:   0.16,    // 自动射击间隔（秒）
  BULLET_SPEED:     520,     // 子弹速度（设计单位/秒）
  BULLET_SIZE:      11,      // 子弹渲染尺寸
} as const

// ─── 四架战机配置 ─────────────────────────────────
export const SHIPS: ShipConfig[] = [
  {
    id:           1,
    name:         '银翼天使',
    imageSrc:     '/ships/player-1.png',
    trailColor:   '#f9a8d4',
    bulletColor:  '#fb7185',
    description:  '均衡·优雅',
    rotateInGame: true,   // 原图机头朝下，旋转 180° 才朝上
  },
  {
    id:           2,
    name:         '火焰骑士',
    imageSrc:     '/ships/player-2.png',
    trailColor:   '#fde68a',
    bulletColor:  '#fbbf24',
    description:  '攻击·热烈',
    rotateInGame: false,  // 原图机头朝上，无需旋转
  },
  {
    id:           3,
    name:         '暗影使者',
    imageSrc:     '/ships/player-3.png',
    trailColor:   '#a5f3fc',
    bulletColor:  '#22d3ee',
    description:  '速度·神秘',
    rotateInGame: true,
  },
  {
    id:           4,
    name:         '星际猎手',
    imageSrc:     '/ships/player-4.png',
    trailColor:   '#c4b5fd',
    bulletColor:  '#a78bfa',
    description:  '全能·璀璨',
    rotateInGame: true,
  },
]

// ─── 敌机配置（type 对应图片 5–8）────────────────
export const ENEMY_CONFIGS: Record<number, EnemyConfig> = {
  // 重型轰炸机：血厚移速慢，射速低
  1: { type: 1, hp: 4, speed: 90,  score: 50, radius: 42,
       canShoot: true, shootInterval: 0.88, spawnWeight: 1 },
  // 快速侦察机：一击即溃，在屏幕时间短，偶尔射击
  2: { type: 2, hp: 1, speed: 200, score: 20, radius: 28,
       canShoot: true, shootInterval: 0.75, spawnWeight: 4 },
  // 标准战机：均衡射速
  3: { type: 3, hp: 2, speed: 130, score: 10, radius: 34,
       canShoot: true, shootInterval: 0.63, spawnWeight: 5 },
  // 精英护卫舰：最强，射速最快
  4: { type: 4, hp: 6, speed: 70,  score: 80, radius: 46,
       canShoot: true, shootInterval: 0.5,  spawnWeight: 1 },
}

// 敌机图片路径（type → src）
export const ENEMY_IMAGE_SRCS: Record<number, string> = {
  1: '/ships/enemy-1.png',
  2: '/ships/enemy-2.png',
  3: '/ships/enemy-3.png',
  4: '/ships/enemy-4.png',
}

// ─── 道具 ────────────────────────────────────────
export const POWERUP = {
  DROP_CHANCE_ELITE:  1.00,  // type 1 & 4 必定掉落
  DROP_CHANCE_NORMAL: 0.12,  // type 2 & 3 有 12% 概率
  FALL_SPEED:         85,    // 下落速度（设计单位/秒）
  SIZE:               30,    // 渲染尺寸
  ROTATION_SPEED:     1.8,   // 旋转速度（rad/s）
  TRIPLE_DURATION:    10.0,  // 三向爱心持续秒数
  SHIELD_HITS:        3,     // 护盾最多抵挡次数
  SHIELD_DURATION:    12.0,  // 护盾持续秒数（兜底）
} as const

// ─── 波次系统 ─────────────────────────────────────
export const WAVE = {
  DURATION:         30,      // 每波持续秒数
  BASE_SPAWN_RATE:  2.2,     // 初始生成间隔（秒）
  SPAWN_RATE_DECAY: 0.12,    // 每波减少的生成间隔
  MIN_SPAWN_RATE:   0.45,    // 最快生成间隔（下限）
  SPEED_BONUS:      0.08,    // 每波敌机速度倍增（× 波次）
} as const

// ─── 连击系统 ─────────────────────────────────────
interface ComboTier {
  minKills: number
  multiplier: number
  label: string
}

export const COMBO = {
  WINDOW: 2.5,               // 连击保持窗口（秒）
  TIERS: [
    { minKills: 0,  multiplier: 1.0, label: '' },
    { minKills: 3,  multiplier: 1.5, label: 'COMBO ×1.5!' },
    { minKills: 6,  multiplier: 2.0, label: 'COMBO ×2!!' },
    { minKills: 10, multiplier: 2.5, label: 'COMBO ×2.5!!!' },
    { minKills: 15, multiplier: 3.0, label: 'MAX COMBO ×3 ✨' },
  ] as ComboTier[],
}

// 根据连击数返回当前 tier
export function getComboTier(kills: number): ComboTier {
  const tiers = COMBO.TIERS
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (kills >= tiers[i].minKills) return tiers[i]
  }
  return tiers[0]
}

// ─── 粒子系统 ─────────────────────────────────────
export const PARTICLES = {
  POOL_SIZE:          300,   // 对象池预分配粒子数
  EXPLOSION_COUNT:    55,    // 每次爆炸的粒子数
  TRAIL_COUNT:        3,     // 每帧尾迹粒子数
  GRAVITY:            160,   // confetti 重力（设计单位/秒²）
  SPARKLE_RADIUS:     60,    // sparkle 粒子扩散半径
} as const

// ─── 背景星场 ─────────────────────────────────────
export const BACKGROUND = {
  STAR_COUNT:         120,   // 星星数量
  AURORA_BANDS:       4,     // 极光光带数量
  AURORA_SPEED:       0.15,  // 极光动画速度
  PARALLAX_LAYERS:    3,     // 视差层数
} as const

// ─── 成就定义 ─────────────────────────────────────
export const ACHIEVEMENT_DEFS = [
  {
    id:          'first_game',
    name:        '星际小公主',
    description: '完成第一场战役',
    icon:        '👑',
  },
  {
    id:          'shield_block',
    name:        '魔法守护者',
    description: '用护盾成功抵挡 1 次攻击',
    icon:        '🛡️',
  },
  {
    id:          'candy_queen',
    name:        '糖果收藏家',
    description: '单局收集 5 个道具',
    icon:        '🍬',
  },
  {
    id:          'combo_star',
    name:        '彩虹战士',
    description: '达到 5 连击',
    icon:        '🌈',
  },
  {
    id:          'high_score',
    name:        '宇宙女王',
    description: '得分超过 1000',
    icon:        '⭐',
  },
  {
    id:          'wave_5',
    name:        '深空探索者',
    description: '存活至第 5 波',
    icon:        '🚀',
  },
] as const
