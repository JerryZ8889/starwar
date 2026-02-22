// ════════════════════════════════════════════════════
//  SoundManager.ts — Web Audio API 程序合成音效
//  所有音效均通过振荡器/噪声动态生成，无需音频文件
//  导出单例 `sound` 供全项目直接 import 使用
// ════════════════════════════════════════════════════

class SoundManager {
  private ctx:    AudioContext | null = null
  private master: GainNode    | null = null

  // BGM
  private bgmInterval = 0
  private bgmDrones:  OscillatorNode[] = []
  private bgmNoteIdx = 0

  // ── AudioContext 懒初始化（需用户交互后才能创建）──
  private getCtx(): AudioContext | null {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext
          ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (!AC) return null
        this.ctx   = new AC()
        this.master = this.ctx.createGain()
        this.master.gain.value = 0.65
        this.master.connect(this.ctx.destination)
      } catch { return null }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {})
    return this.ctx
  }

  private dst(): AudioNode | null {
    return this.master
  }

  // ── UI：按钮点击（亮短音）──────────────────────────
  playClick() {
    const ctx = this.getCtx(); if (!ctx || !this.dst()) return
    const t    = ctx.currentTime
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1100, t)
    osc.frequency.exponentialRampToValueAtTime(550, t + 0.10)
    gain.gain.setValueAtTime(0.30, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
    osc.connect(gain); gain.connect(this.dst()!)
    osc.start(t); osc.stop(t + 0.13)
  }

  // ── UI：战机卡片选中（柔和向上音）─────────────────
  playSelect() {
    const ctx = this.getCtx(); if (!ctx || !this.dst()) return
    const t    = ctx.currentTime
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(700, t)
    osc.frequency.exponentialRampToValueAtTime(1100, t + 0.12)
    gain.gain.setValueAtTime(0.18, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
    osc.connect(gain); gain.connect(this.dst()!)
    osc.start(t); osc.stop(t + 0.20)
  }

  // ── 战斗：玩家发射子弹（快速激光）─────────────────
  playShoot() {
    const ctx = this.getCtx(); if (!ctx || !this.dst()) return
    const t    = ctx.currentTime
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(880, t)
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.07)
    gain.gain.setValueAtTime(0.10, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
    osc.connect(gain); gain.connect(this.dst()!)
    osc.start(t); osc.stop(t + 0.09)
  }

  // ── 战斗：击中敌机（噪声爆裂）─────────────────────
  playHitEnemy() {
    const ctx = this.getCtx(); if (!ctx || !this.dst()) return
    const t      = ctx.currentTime
    const len    = Math.floor(ctx.sampleRate * 0.07)
    const buf    = ctx.createBuffer(1, len, ctx.sampleRate)
    const data   = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)

    const src    = ctx.createBufferSource()
    src.buffer   = buf
    const filt   = ctx.createBiquadFilter()
    filt.type    = 'bandpass'
    filt.frequency.value = 1800
    filt.Q.value = 1.2
    const gain   = ctx.createGain()
    gain.gain.setValueAtTime(0.28, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
    src.connect(filt); filt.connect(gain); gain.connect(this.dst()!)
    src.start(t)
  }

  // ── 战斗：道具拾取（升阶钟声）─────────────────────
  playPowerUp() {
    const ctx = this.getCtx(); if (!ctx || !this.dst()) return
    const freqs = [523, 784, 1047, 1568]
    freqs.forEach((f, i) => {
      const t    = ctx.currentTime + i * 0.075
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type   = 'triangle'
      osc.frequency.value = f
      gain.gain.setValueAtTime(0.20, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
      osc.connect(gain); gain.connect(this.dst()!)
      osc.start(t); osc.stop(t + 0.24)
    })
  }

  // ── 战斗：玩家受伤（沉重低鸣）─────────────────────
  playPlayerHit() {
    const ctx = this.getCtx(); if (!ctx || !this.dst()) return
    const t    = ctx.currentTime
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type   = 'sine'
    osc.frequency.setValueAtTime(140, t)
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.40)
    gain.gain.setValueAtTime(0.50, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45)
    osc.connect(gain); gain.connect(this.dst()!)
    osc.start(t); osc.stop(t + 0.46)
  }

  // ── 战斗：游戏结束（下行琶音）─────────────────────
  playGameOver() {
    const ctx = this.getCtx(); if (!ctx || !this.dst()) return
    const notes = [880, 698, 523, 330]
    notes.forEach((f, i) => {
      const t    = ctx.currentTime + i * 0.22
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type   = 'sine'
      osc.frequency.value = f
      gain.gain.setValueAtTime(0.38, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45)
      osc.connect(gain); gain.connect(this.dst()!)
      osc.start(t); osc.stop(t + 0.47)
    })
  }

  // ════════════════════════════════════════════════
  //  BGM：梦幻循环旋律（战斗背景音乐）
  // ════════════════════════════════════════════════

  playBgm() {
    if (this.bgmInterval) return   // 已在播放
    const ctx = this.getCtx(); if (!ctx || !this.dst()) return

    // 低沉底鼓氛围（持续 drone）
    const droneFreqs = [55, 110]
    for (const f of droneFreqs) {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type   = 'sine'
      osc.frequency.value = f
      gain.gain.value = 0.035
      osc.connect(gain); gain.connect(this.dst()!)
      osc.start()
      this.bgmDrones.push(osc)
    }

    // 旋律序列（C 大调五声音阶 + 变化）
    const melody = [
      523, 659, 784, 1047, 784, 659,
      523, 392, 523, 622, 784, 1047,
      988, 784, 622, 523,
    ]
    const noteMs = 280   // ms / 音符

    const tick = () => {
      const actCtx = this.getCtx(); if (!actCtx || !this.dst()) return
      const now  = actCtx.currentTime
      const freq = melody[this.bgmNoteIdx % melody.length]
      this.bgmNoteIdx++

      const osc  = actCtx.createOscillator()
      const gain = actCtx.createGain()
      osc.type   = 'triangle'
      osc.frequency.value = freq

      const dur = (noteMs / 1000) * 0.88
      gain.gain.setValueAtTime(0.0,   now)
      gain.gain.linearRampToValueAtTime(0.055, now + 0.02)
      gain.gain.setValueAtTime(0.055, now + dur * 0.75)
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur)

      osc.connect(gain); gain.connect(this.dst()!)
      osc.start(now); osc.stop(now + dur + 0.02)
    }

    this.bgmNoteIdx = 0
    tick()
    this.bgmInterval = window.setInterval(tick, noteMs)
  }

  stopBgm() {
    if (this.bgmInterval) { clearInterval(this.bgmInterval); this.bgmInterval = 0 }
    for (const osc of this.bgmDrones) { try { osc.stop() } catch {} }
    this.bgmDrones = []
    this.bgmNoteIdx = 0
  }
}

// 单例导出，全项目共享同一个 AudioContext
export const sound = new SoundManager()
