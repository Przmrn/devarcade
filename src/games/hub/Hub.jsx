// Hub.jsx — CRT Terminal aesthetic with theme selector
// Uses CSS variables exclusively — no hardcoded colors

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../utils/ThemeContext.jsx'
import { THEMES } from '../../utils/themes.js'
import { sounds } from '../../utils/useSound.js'

// ── Game roster ────────────────────────────────────────────────
const GAMES = [
  {
    id:     'pathquest',
    num:    '01',
    title:  'PATHQUEST',
    sub:    'DIJKSTRA VISUALIZER',
    desc:   'Shortest-path algorithm on a live grid. Place walls and weights, watch the search expand node by node.',
    status: 'ONLINE',
  },
  {
    id:     'freight',
    num:    '02',
    title:  'FREIGHT CMD',
    sub:    'LOGISTICS & ROUTING',
    desc:   'Dispatch trucks across a generated city. Manage cargo, fuel, and delivery timers or lose reputation.',
    status: 'ONLINE',
  },
  {
    id:     'vision',
    num:    '03',
    title:  'VISION HUNT',
    sub:    'AI OBJECT DETECTION',
    desc:   'Real-time webcam scavenger hunt. TensorFlow.js detects real-world objects before the countdown expires.',
    status: 'ONLINE',
  },
  {
    id:     'hashbreaker',
    num:    '04',
    title:  'HASH BREAKER',
    sub:    'BLOCKCHAIN MINING',
    desc:   'Find the nonce that satisfies proof-of-work. Real SHA-256 hashes mutate live as you mine.',
    status: 'ONLINE',
  },
  {
    id:     'codebreaker',
    num:    '05',
    title:  'CODEBREAKER',
    sub:    'LOGIC PUZZLE',
    desc:   'Crack the hidden 4-colour sequence in 10 attempts. Mastermind with mathematically precise peg feedback.',
    status: 'ONLINE',
  },
  {
    id:     null,
    num:    '06',
    title:  'CLASSIFIED',
    sub:    'ACCESS DENIED',
    desc:   '████████ ██████ ████ ███████ ██ ████████████ ████ ███',
    status: 'LOCKED',
  },
]

// ── Typewriter hook ────────────────────────────────────────────
function useTypewriter(text, speed = 52) {
  const [out, setOut] = useState('')
  useEffect(() => {
    setOut('')
    let i = 0
    const id = setInterval(() => {
      i++
      setOut(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text])
  return out
}

// ── Theme selector ─────────────────────────────────────────────
function ThemeSelector() {
  const { themeId, setThemeId, themes } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      {/* Current theme button */}
      <button
        onClick={() => { setOpen(o => !o); sounds.click() }}
        style={{
          display:       'flex',
          alignItems:    'center',
          gap:           8,
          padding:       '4px 12px',
          border:        '1px solid var(--border)',
          background:    'transparent',
          color:         'var(--accent)',
          fontFamily:    'var(--font)',
          fontSize:      10,
          letterSpacing: '0.15em',
          cursor:        'pointer',
        }}
      >
        <span style={{ color: 'var(--text-muted)' }}>THEME:</span>
        {themes[themeId]?.label}
        <span style={{ color: 'var(--text-muted)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            style={{
              position:   'absolute',
              top:        '100%',
              right:      0,
              marginTop:  4,
              border:     '1px solid var(--border)',
              background: 'var(--bg2)',
              zIndex:     100,
              minWidth:   200,
            }}
          >
            {Object.values(themes).map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setThemeId(t.id)
                  sounds.click()
                  setOpen(false)
                }}
                style={{
                  display:       'block',
                  width:         '100%',
                  padding:       '9px 14px',
                  border:        'none',
                  borderBottom:  '1px solid var(--border-dim)',
                  background:    t.id === themeId ? 'var(--accent-bg)' : 'transparent',
                  color:         t.id === themeId ? 'var(--accent)' : 'var(--text-dim)',
                  fontFamily:    'var(--font)',
                  fontSize:      10,
                  letterSpacing: '0.15em',
                  textAlign:     'left',
                  cursor:        'pointer',
                }}
                onMouseEnter={e => {
                  if (t.id !== themeId) e.target.style.color = 'var(--text)'
                  sounds.hover()
                }}
                onMouseLeave={e => {
                  if (t.id !== themeId) e.target.style.color = 'var(--text-dim)'
                }}
              >
                {t.id === themeId ? '▶ ' : '  '}{t.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Game card ──────────────────────────────────────────────────
function GameCard({ game, onPlay, index }) {
  const isLocked = game.status === 'LOCKED'
  const [hovered, setHovered] = useState(false)

  function handleClick() {
    if (isLocked || !game.id) return
    sounds.click()
    onPlay(game.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.14, delay: index * 0.055 }}
      onMouseEnter={() => { setHovered(true);  sounds.hover() }}
      onMouseLeave={() => { setHovered(false) }}
      onClick={handleClick}
      style={{
        padding:    20,
        cursor:     isLocked ? 'not-allowed' : 'pointer',
        opacity:    isLocked ? 0.35 : 1,
        background: hovered && !isLocked ? 'var(--accent)' : 'transparent',
        // No transition — instant snap, Nothing OS / CRT feel
        transition: 'none',
        fontFamily: 'var(--font)',
      }}
    >
      {/* Header row */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        marginBottom:   12,
      }}>
        <span style={{
          fontSize:      10,
          letterSpacing: '0.18em',
          color: hovered && !isLocked ? 'rgba(0,0,0,0.55)' : 'var(--text-muted)',
        }}>
          [{game.num}] {game.sub}
        </span>
        <span style={{
          fontSize:      9,
          letterSpacing: '0.14em',
          padding:       '3px 8px',
          border:        `1px solid ${hovered && !isLocked ? 'rgba(0,0,0,0.25)' : 'var(--border)'}`,
          color: hovered && !isLocked ? 'rgba(0,0,0,0.6)' : 'var(--accent)',
        }}>
          {game.status}
        </span>
      </div>

      {/* Title */}
      <h3 style={{
        fontSize:      22,
        fontWeight:    700,
        letterSpacing: '0.04em',
        marginBottom:  8,
        color: hovered && !isLocked ? '#000' : 'var(--text)',
        textShadow: hovered ? 'none' : `0 0 12px var(--glow)`,
      }}>
        {game.title}
      </h3>

      {/* Desc */}
      <p style={{
        fontSize:   11,
        lineHeight: 1.65,
        color: hovered && !isLocked ? 'rgba(0,0,0,0.6)' : 'var(--text-dim)',
      }}>
        {game.desc}
      </p>

      {/* Execute prompt — shows on hover */}
      {hovered && !isLocked && (
        <div style={{
          marginTop:     12,
          fontSize:      11,
          letterSpacing: '0.14em',
          color:         'rgba(0,0,0,0.7)',
        }}>
          {'>'} EXECUTE PROGRAM_
        </div>
      )}
    </motion.div>
  )
}

// ── Hub ────────────────────────────────────────────────────────
export default function Hub({ onPlay }) {
  const headerText = useTypewriter('SYS.REQ: DEV_ARCADE // ONLINE', 52)
  const [time, setTime] = useState('')

  // Live clock
  useEffect(() => {
    const update = () => {
      const n = new Date()
      setTime(
        n.toTimeString().slice(0, 8) + ':' +
        String(n.getMilliseconds()).padStart(3, '0')
      )
    }
    update()
    const id = setInterval(update, 100)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => sounds.ambient(), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="crt-flicker"
      style={{
        minHeight:  '100vh',
        background: 'var(--bg)',
        fontFamily: 'var(--font)',
        overflowY:  'auto',
      }}
    >
      {/* CRT overlays */}
      <div className="crt-scanlines" style={{
        position:       'fixed', inset: 0, zIndex: 50,
        pointerEvents:  'none', opacity: 0.35,
      }} />
      <div className="crt-vignette" style={{
        position:      'fixed', inset: 0, zIndex: 50,
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 10, maxWidth: 900, margin: '0 auto', padding: '36px 32px' }}>

        {/* ── Top bar ── */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          paddingBottom:  12,
          borderBottom:   '1px solid var(--border-dim)',
          marginBottom:   6,
        }}>
          {/* Typewriter */}
          <span style={{
            fontSize:      12,
            letterSpacing: '0.15em',
            color:         'var(--accent)',
            borderRight:   '2px solid var(--accent)',
            paddingRight:  3,
            animation:     'caret-blink 0.7s step-end infinite',
          }}>
            {headerText}
          </span>

          {/* Clock */}
          <span style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--text-muted)' }}>
            {time}
          </span>
        </div>

        {/* ── System info row ── */}
        <div style={{
          display:       'flex',
          gap:           28,
          paddingBottom: 28,
          borderBottom:  '1px solid var(--border-dim)',
          marginBottom:  32,
          flexWrap:      'wrap',
          alignItems:    'center',
        }}>
          {[['KERNEL','v1.0.0'],['MODULES','5 LOADED'],['MEM','OK'],['STATUS','NOMINAL']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--text-muted)' }}>{k}:</span>
              <span style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--accent-dim)' }}>{v}</span>
            </div>
          ))}

          {/* Theme selector pushed to the right */}
          <div style={{ marginLeft: 'auto' }}>
            <ThemeSelector />
          </div>
        </div>

        {/* ── Hero ── */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            style={{
              fontFamily:    'var(--font-display)',
              fontSize:      'clamp(3.5rem, 12vw, 8rem)',
              fontWeight:    700,
              letterSpacing: '0.06em',
              lineHeight:    1,
              color:         'var(--accent)',
              textShadow:    '0 0 30px var(--glow), 0 0 60px var(--glow)',
              marginBottom:  12,
            }}
          >
            ARCADE.EXE
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.3 }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}
          >
            <div style={{ flex: 1, height: 1, background: 'var(--border-dim)' }} />
            <span style={{ fontSize: 10, letterSpacing: '0.28em', color: 'var(--text-muted)' }}>
              ALGORITHM & LOGIC PLATFORM // SELECT PROGRAM
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-dim)' }} />
          </motion.div>
        </div>

        {/* ── Game grid ── */}
        <div style={{
          display:       'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          border:        '1px solid var(--border)',
          marginBottom:  32,
        }}>
          {GAMES.map((game, i) => {
            const cols   = window.innerWidth >= 780 ? 3 : window.innerWidth >= 520 ? 2 : 1
            const isLast = i >= GAMES.length - cols
            const isRight = (i + 1) % cols === 0

            return (
              <div
                key={game.id ?? game.num}
                style={{
                  borderRight:  isRight ? 'none' : '1px solid var(--border)',
                  borderBottom: isLast  ? 'none' : '1px solid var(--border)',
                }}
              >
                <GameCard game={game} onPlay={onPlay} index={i} />
              </div>
            )
          })}
        </div>

        {/* ── How to use ── */}
        <div style={{
          padding:      20,
          border:       '1px solid var(--border-dim)',
          marginBottom: 28,
        }}>
          <p style={{
            fontSize:      10,
            letterSpacing: '0.2em',
            color:         'var(--text-muted)',
            marginBottom:  14,
          }}>
            // SYSTEM MANUAL
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {[
              { cmd: 'HOVER',      desc: 'Preview program' },
              { cmd: 'CLICK',      desc: 'Execute program' },
              { cmd: 'THEME ▼',    desc: 'Change color theme' },
              { cmd: '← BACK',     desc: 'Return to terminal' },
            ].map(({ cmd, desc }) => (
              <div key={cmd} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--accent)', fontSize: 14, lineHeight: 1, flexShrink: 0 }}>{'>'}</span>
                <div>
                  <p style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--text)', marginBottom: 2 }}>{cmd}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        8,
          paddingTop: 16,
          borderTop:  '1px solid var(--border-dim)',
        }}>
          <span style={{ fontSize: 12, letterSpacing: '0.12em', color: 'var(--text-muted)' }}>
            root@devarcade:~$
          </span>
          <span
            className="cursor-blink"
            style={{ fontSize: 20, lineHeight: 1, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
          >
            █
          </span>
        </div>

      </div>
    </div>
  )
}