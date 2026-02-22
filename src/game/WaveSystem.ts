// ════════════════════════════════════════════════════
//  WaveSystem.ts — 波次 / 难度 / 敌机生成调度
// ════════════════════════════════════════════════════

import { WAVE, ENEMY_CONFIGS } from '../constants/config'
import type { EnemyType } from '../types'

export class WaveSystem {
  private wave       = 1
  private elapsed    = 0   // 总运行秒数
  private spawnTimer = 0   // 距下次生成的计时器

  // ── 每帧调用，返回本帧需要生成的敌机类型（null=不生成）
  update(dt: number): EnemyType | null {
    this.elapsed    += dt
    this.spawnTimer += dt

    // 波次推进（每 WAVE.DURATION 秒一波）
    const newWave = Math.floor(this.elapsed / WAVE.DURATION) + 1
    if (newWave > this.wave) this.wave = newWave

    // 当前波次生成间隔（随波次加快，但有下限）
    const interval = Math.max(
      WAVE.MIN_SPAWN_RATE,
      WAVE.BASE_SPAWN_RATE - (this.wave - 1) * WAVE.SPAWN_RATE_DECAY,
    )

    if (this.spawnTimer >= interval) {
      this.spawnTimer -= interval   // 减去间隔，保留余量（更均匀）
      return this.selectType()
    }

    return null
  }

  getWave()      { return this.wave }
  getElapsed()   { return this.elapsed }

  /** 敌机基础速度倍率（随波次增加）*/
  getSpeedMult() {
    return 1 + (this.wave - 1) * WAVE.SPEED_BONUS
  }

  // ── 加权随机选择敌机类型 ────────────────────────
  private selectType(): EnemyType {
    // 重型(1) wave≥2 出现，精英(4) wave≥3 出现
    const w1 = this.wave >= 2 ? ENEMY_CONFIGS[1].spawnWeight : 0
    const w2 = ENEMY_CONFIGS[2].spawnWeight
    const w3 = ENEMY_CONFIGS[3].spawnWeight
    const w4 = this.wave >= 3 ? ENEMY_CONFIGS[4].spawnWeight : 0

    const total = w1 + w2 + w3 + w4
    let r = Math.random() * total

    if ((r -= w1) <= 0) return 1
    if ((r -= w2) <= 0) return 2
    if ((r -= w3) <= 0) return 3
    return 4
  }
}
