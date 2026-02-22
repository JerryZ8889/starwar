// ════════════════════════════════════════════════════
//  SOPHIA'S STARWAR — Canvas 绘图颜色常量
//  所有 Canvas drawX() 调用统一从这里取色
//  UI 颜色在 tailwind.config.js 中定义
// ════════════════════════════════════════════════════

export const C = {

  // ─── 背景星云 ──────────────────────────────────
  nebulaDeep:   '#0d0620',
  nebulaMid:    '#1e0a4a',
  nebulaAccent: '#3d1a7a',
  nebulaDark:   '#0a0318',

  // ─── 极光动画（4条光带，带透明度）──────────────
  aurora: [
    'rgba(255, 110, 180, 0.35)',   // 樱花粉
    'rgba(192, 132, 252, 0.35)',   // 薰衣草紫
    'rgba(96,  165, 250, 0.30)',   // 天空蓝
    'rgba(52,  211, 153, 0.25)',   // 薄荷绿
  ] as readonly string[],

  // ─── 马卡龙调色板（UI & 粒子通用）──────────────
  sakura:   '#ffb7d5',
  lavender: '#c4b5fd',
  mint:     '#a7f3d0',
  cream:    '#fef9e7',
  peach:    '#fed7aa',
  sky:      '#bae6fd',
  gold:     '#fde68a',
  rose:     '#fb7185',

  // ─── 磨砂玻璃（Canvas 绘制 UI 时用）────────────
  glass:        'rgba(255, 255, 255, 0.10)',
  glassMd:      'rgba(255, 255, 255, 0.18)',
  glassBdr:     'rgba(255, 255, 255, 0.28)',
  glassBdrHi:   'rgba(255, 255, 255, 0.55)',

  // ─── 星场 ──────────────────────────────────────
  starWhite: 'rgba(255, 255, 255, 0.90)',
  starPink:  'rgba(255, 183, 213, 0.70)',
  starBlue:  'rgba(165, 243, 252, 0.70)',
  starGold:  'rgba(253, 230, 138, 0.60)',

  // ─── 战机尾迹颜色（index 0–3 对应战机 1–4）─────
  trails: [
    '#f9a8d4',  // 银翼天使：樱花粉
    '#fde68a',  // 火焰骑士：金黄
    '#a5f3fc',  // 暗影使者：冰蓝
    '#c4b5fd',  // 星际猎手：薰衣草
  ] as readonly string[],

  // ─── 子弹颜色（对应战机）────────────────────────
  bullets: [
    '#fb7185',  // 银翼天使：玫瑰红星星
    '#fbbf24',  // 火焰骑士：琥珀金星星
    '#22d3ee',  // 暗影使者：青色星星
    '#a78bfa',  // 星际猎手：紫色星星
  ] as readonly string[],

  // ─── 三向爱心子弹 ───────────────────────────────
  heartBullet: '#fb7185',

  // ─── 敌机子弹（精英护卫舰反击）─────────────────
  enemyBullet: '#60a5fa',

  // ─── 烟花爆炸粒子调色板 ────────────────────────
  confetti: [
    '#fb7185',  // 玫瑰
    '#fbbf24',  // 琥珀
    '#a7f3d0',  // 薄荷
    '#c4b5fd',  // 薰衣草
    '#67e8f9',  // 青
    '#f9a8d4',  // 粉
    '#6ee7b7',  // 绿
    '#fde68a',  // 金
  ] as readonly string[],

  // ─── 护盾光圈（彩虹渐变，7色）──────────────────
  shieldRainbow: [
    '#fb7185',
    '#fbbf24',
    '#a7f3d0',
    '#60a5fa',
    '#c4b5fd',
    '#f9a8d4',
    '#fb7185',  // 首尾相同，闭合渐变
  ] as readonly string[],

  // ─── HUD 颜色 ──────────────────────────────────
  hudScore:  '#fde68a',  // 星星图标 & 分数文字
  hudHeart:  '#fb7185',  // 生命爱心
  hudShield: '#60a5fa',  // 护盾指示
  hudCombo:  '#c4b5fd',  // 连击文字

  // ─── 浮动得分文字 ───────────────────────────────
  floatText: {
    normal:   '#fde68a',
    combo:    '#c4b5fd',
    powerup:  '#a7f3d0',
    miss:     '#fb7185',
  },

} as const

// ─── 便捷函数：带透明度的颜色 ─────────────────────
export function alpha(hexColor: string, a: number): string {
  // 将 #rrggbb 转为 rgba(r,g,b,a)
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}
