import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Hub from './games/hub/Hub.jsx'
import PathQuest from './games/pathquest/PathQuest.jsx'
import FreightCommander from './games/freight/FreightCommander.jsx'

// Placeholder — we'll replace these one by one as we build each game
function ComingSoon({ name }) {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-slate-400 text-lg">{name} — coming soon</p>
    </div>
  )
}

const GAMES = {
  pathquest: { title: 'PathQuest', component: PathQuest },
  freight: { title: 'Freight Commander', component: FreightCommander },
  vision: { title: 'Vision Hunt', component: () => <ComingSoon name="Vision Hunt" /> },
  hashbreaker: { title: 'Hash Breaker', component: () => <ComingSoon name="Hash Breaker" /> },
  codebreaker: { title: 'Codebreaker', component: () => <ComingSoon name="Codebreaker" /> },
}

const slide = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
}

export default function App() {
  const [current, setCurrent] = useState(null)

  const game = current ? GAMES[current] : null
  const GameComponent = game?.component

  return (
    <div className="min-h-screen bg-[#080c14]">
      <AnimatePresence mode="wait">

        {/* No game selected → show hub */}
        {!current && (
          <motion.div key="hub" {...slide}>
            <Hub onPlay={(id) => setCurrent(id)} />
          </motion.div>
        )}

        {/* Game selected → show game + back button */}
        {current && (
          <motion.div key={current} {...slide} className="flex flex-col h-screen">

            {/* Top bar with back button */}
            <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#080c14]/90 backdrop-blur">
              <button
                onClick={() => setCurrent(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 transition-all"
              >
                ← Back to Hub
              </button>
              <span className="text-sm font-bold text-violet-400">{game.title}</span>
            </header>

            {/* Game fills the rest of the screen */}
            <main className="flex-1 overflow-hidden">
              <GameComponent />
            </main>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}