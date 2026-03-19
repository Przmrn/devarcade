import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ThemeProvider } from './utils/ThemeContext.jsx'
import Hub from './games/hub/Hub.jsx'
import PathQuest from './games/pathquest/PathQuest.jsx'
import FreightCommander from './games/freight/FreightCommander.jsx'
import HashBreaker from './games/hashbreaker/HashBreaker.jsx'
import Codebreaker from './games/codebreaker/Codebreaker.jsx'

// Placeholder for games not built yet
function ComingSoon({ name }) {
  return (
    <div className="flex items-center justify-center h-full"
      style={{ fontFamily: 'var(--font)' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--accent)', fontSize: 13, letterSpacing: '0.2em' }}>
          {name.toUpperCase()}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 8, letterSpacing: '0.15em' }}>
          COMING SOON
        </p>
      </div>
    </div>
  )
}

const GAMES = {
  pathquest:   { title: 'PATHQUEST',         component: PathQuest },
  freight:     { title: 'FREIGHT CMD',       component: FreightCommander },
  vision:      { title: 'VISION HUNT',       component: () => <ComingSoon name="Vision Hunt" /> },
  hashbreaker: { title: 'HASH BREAKER',      component: HashBreaker },
  codebreaker: { title: 'CODEBREAKER',       component: Codebreaker },
}

const slide = {
  initial:  { opacity: 0, y: 16 },
  animate:  { opacity: 1, y: 0,  transition: { duration: 0.3, ease: 'easeOut' } },
  exit:     { opacity: 0, y: -16, transition: { duration: 0.18 } },
}

export default function App() {
  const [current, setCurrent] = useState(null)
  const game = current ? GAMES[current] : null
  const GameComponent = game?.component

  return (
    // ThemeProvider wraps everything — theme is available to all children
    <ThemeProvider>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <AnimatePresence mode="wait">

          {/* Hub */}
          {!current && (
            <motion.div key="hub" {...slide}>
              <Hub onPlay={(id) => setCurrent(id)} />
            </motion.div>
          )}

          {/* Game shell */}
          {current && (
            <motion.div key={current} {...slide}
              style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

              {/* Top bar */}
              <header style={{
                flexShrink:   0,
                display:      'flex',
                alignItems:   'center',
                gap:          12,
                padding:      '8px 16px',
                borderBottom: '1px solid var(--border)',
                background:   'var(--bg)',
                fontFamily:   'var(--font)',
              }}>
                <button
                  onClick={() => setCurrent(null)}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          6,
                    padding:      '5px 12px',
                    border:       '1px solid var(--border)',
                    background:   'transparent',
                    color:        'var(--text-dim)',
                    fontSize:     11,
                    fontFamily:   'var(--font)',
                    letterSpacing:'0.12em',
                    cursor:       'pointer',
                  }}
                >
                  ← BACK
                </button>
                <span style={{
                  fontSize:     12,
                  color:        'var(--accent)',
                  letterSpacing:'0.18em',
                }}>
                  {game.title}
                </span>
              </header>

              {/* Game content */}
              <main style={{ flex: 1, overflow: 'hidden' }}>
                <GameComponent />
              </main>

            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </ThemeProvider>
  )
}