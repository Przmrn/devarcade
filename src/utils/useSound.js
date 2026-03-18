// useSound.js
// Generates UI sounds using Web Audio API.
// Zero audio files — everything is math.

let ctx = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function play({ type = 'sine', freq = 440, freq2 = null, gain = 0.15, duration = 0.12, attack = 0.005, decay = 0.08 }) {
  try {
    const c   = getCtx()
    const osc = c.createOscillator()
    const env = c.createGain()
    const now = c.currentTime

    osc.type = type
    osc.frequency.setValueAtTime(freq, now)
    if (freq2) osc.frequency.linearRampToValueAtTime(freq2, now + duration)

    env.gain.setValueAtTime(0, now)
    env.gain.linearRampToValueAtTime(gain, now + attack)
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration + decay)

    osc.connect(env)
    env.connect(c.destination)
    osc.start(now)
    osc.stop(now + duration + decay + 0.05)
  } catch (_) {}
}

export const sounds = {
  // Soft blip when hovering a card
  hover: () => play({
    type: 'sine', freq: 880, freq2: 1040,
    gain: 0.05, duration: 0.05, decay: 0.05
  }),

  // Two-tone pop when clicking
  click: () => {
    play({ type: 'sine', freq: 520, freq2: 780, gain: 0.12, duration: 0.08, decay: 0.10 })
    setTimeout(() => play({ type: 'sine', freq: 980, gain: 0.08, duration: 0.06, decay: 0.08 }), 70)
  },

  // Descending tone when going back
  back: () => play({
    type: 'sine', freq: 660, freq2: 440,
    gain: 0.10, duration: 0.14, decay: 0.15
  }),

  // Rising sweep when launching a game
  launch: () => {
    play({ type: 'sine', freq: 220, freq2: 880, gain: 0.14, duration: 0.25, decay: 0.18 })
    setTimeout(() => play({ type: 'sine', freq: 1100, gain: 0.08, duration: 0.08, decay: 0.16 }), 230)
  },

  // Three ascending notes — win/success
  success: () => {
    [0, 100, 200].forEach((t, i) => {
      setTimeout(() => play({
        type: 'sine', freq: [523, 659, 784][i],
        gain: 0.10, duration: 0.10, decay: 0.14
      }), t)
    })
  },

  // Low sawtooth buzz — error/blocked
  error: () => play({
    type: 'sawtooth', freq: 180, freq2: 120,
    gain: 0.08, duration: 0.18, decay: 0.20
  }),

  // Gentle three-note chord on page load
  ambient: () => {
    [0, 150, 350].forEach((t, i) => {
      setTimeout(() => play({
        type: 'sine', freq: [220, 330, 440][i],
        gain: 0.05, duration: 0.30, decay: 0.50
      }), t)
    })
  },
}