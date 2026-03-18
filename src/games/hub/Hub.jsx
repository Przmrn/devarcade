// Hub.jsx
// The main arcade menu. Renders the Three.js background behind
// a grid of game cards. Each card calls onPlay(gameId) when clicked.

import { useEffect, useRef } from 'react'
import { motion, useSpring } from 'framer-motion'
import { Map, Truck, Eye, Hash, Terminal, ArrowRight } from 'lucide-react'
import ThreeBackground from '../../components/ThreeBackground.jsx'
import { sounds } from '../../utils/useSound.js'

// ── Game definitions ───────────────────────────────────────────
const GAMES = [
    {
        id: 'pathquest',
        title: 'PathQuest',
        category: 'Algorithm',
        desc: 'Visualize Dijkstra\'s shortest-path algorithm on a live grid — or on real city streets via OpenStreetMap.',
        icon: Map,
        accent: '#5eead4',
        glow: 'rgba(20,184,166,0.18)',
    },
    {
        id: 'freight',
        title: 'Freight Commander',
        category: 'Strategy',
        desc: 'Dispatch trucks across a generated city. Manage cargo, fuel, and delivery timers before your reputation collapses.',
        icon: Truck,
        accent: '#fbbf24',
        glow: 'rgba(251,191,36,0.15)',
    },
    {
        id: 'vision',
        title: 'Vision Hunt',
        category: 'AI / CV',
        desc: 'Real-time scavenger hunt powered by TensorFlow.js. Find physical objects before the countdown hits zero.',
        icon: Eye,
        accent: '#34d399',
        glow: 'rgba(52,211,153,0.15)',
    },
    {
        id: 'hashbreaker',
        title: 'Hash Breaker',
        category: 'Cryptography',
        desc: 'Mine a blockchain block by finding the right nonce. Watch real SHA-256 hashes mutate as proof-of-work unfolds.',
        icon: Hash,
        accent: '#a3e635',
        glow: 'rgba(163,230,53,0.12)',
    },
    {
        id: 'codebreaker',
        title: 'Codebreaker',
        category: 'Logic',
        desc: 'Crack the hidden 4-colour sequence in ten attempts. Mastermind-style with mathematically precise feedback.',
        icon: Terminal,
        accent: '#c084fc',
        glow: 'rgba(192,132,252,0.15)',
    },
]

// ── Framer Motion variants ─────────────────────────────────────
const containerVariants = {
    hidden: {},
    show: {
        transition: { staggerChildren: 0.09, delayChildren: 0.45 }
    },
}
const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.97 },
    show: {
        opacity: 1, y: 0, scale: 1,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    },
}

// ── Single game card ───────────────────────────────────────────
function GameCard({ game, onPlay }) {
    const Icon = game.icon
    const cardRef = useRef(null)

    // Spring-based 3D tilt on mouse movement
    const rotX = useSpring(0, { stiffness: 220, damping: 22 })
    const rotY = useSpring(0, { stiffness: 220, damping: 22 })

    const onMouseMove = (e) => {
        const r = cardRef.current?.getBoundingClientRect()
        if (!r) return
        rotY.set(((e.clientX - r.left - r.width / 2) / r.width) * 10)
        rotX.set(((e.clientY - r.top - r.height / 2) / r.height) * -10)
    }
    const onMouseLeave = () => { rotX.set(0); rotY.set(0) }

    return (
        <motion.div
            ref={cardRef}
            variants={cardVariants}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            onMouseEnter={() => sounds.hover()}
            onClick={() => { sounds.launch(); onPlay(game.id) }}
            style={{
                rotateX: rotX,
                rotateY: rotY,
                transformStyle: 'preserve-3d',
                transformPerspective: 900,
            }}
            className="group relative flex flex-col rounded-2xl cursor-pointer select-none"
        >
            {/* Glow halo that appears on hover */}
            <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: `radial-gradient(ellipse at 50% 0%, ${game.glow} 0%, transparent 72%)`
                }}
            />

            {/* Glass card surface */}
            <div
                className="relative flex flex-col flex-1 p-6 rounded-2xl border transition-all duration-300 group-hover:border-white/[0.13]"
                style={{
                    background: 'rgba(255,255,255,0.034)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderColor: 'rgba(255,255,255,0.07)',
                    boxShadow: '0 2px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.055)',
                }}
            >
                {/* Icon + category badge */}
                <div className="flex items-start justify-between mb-5">
                    <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{
                            background: `${game.accent}15`,
                            border: `1px solid ${game.accent}28`,
                        }}
                    >
                        <Icon size={20} style={{ color: game.accent }} />
                    </div>
                    <span
                        className="text-[10px] font-bold tracking-[0.16em] px-2.5 py-1 rounded-full uppercase"
                        style={{
                            color: game.accent,
                            background: `${game.accent}12`,
                            border: `1px solid ${game.accent}22`,
                        }}
                    >
                        {game.category}
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-[16px] font-bold text-white mb-2 leading-snug tracking-tight">
                    {game.title}
                </h3>

                {/* Description */}
                <p className="text-[13px] text-slate-400 leading-relaxed flex-1">
                    {game.desc}
                </p>

                {/* Play now CTA */}
                <div
                    className="mt-5 flex items-center gap-2 text-[13px] font-semibold transition-all duration-200 group-hover:gap-3"
                    style={{ color: game.accent }}
                >
                    Play now
                    <ArrowRight
                        size={13}
                        className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                </div>

                {/* Shimmer line at bottom on hover */}
                <div
                    className="absolute bottom-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${game.accent}55, transparent)`
                    }}
                />
            </div>
        </motion.div>
    )
}

// ── Hub page ───────────────────────────────────────────────────
export default function Hub({ onPlay }) {
    // Play ambient sound when hub loads
    useEffect(() => {
        const t = setTimeout(() => sounds.ambient(), 400)
        return () => clearTimeout(t)
    }, [])

    return (
        <div className="relative min-h-screen overflow-auto">

            {/* Three.js particle network — lives in its own layer */}
            <ThreeBackground />

            {/* Vignette — darkens the edges so cards are readable */}
            <div
                className="fixed inset-0 pointer-events-none z-[1]"
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.6) 100%)'
                }}
            />

            {/* All UI sits above the background */}
            <div className="relative z-10 max-w-5xl mx-auto px-6 py-20">

                {/* ── Hero text ── */}
                <motion.div
                    initial={{ opacity: 0, y: -14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-20"
                >
                    {/* Eyebrow line */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="flex items-center gap-3 mb-7"
                    >
                        <div className="h-px w-8 bg-teal-400/40" />
                        <span className="text-[11px] font-semibold tracking-[0.22em] uppercase text-teal-400/70">
                            DevArcade · v1.0
                        </span>
                    </motion.div>

                    {/* Main title */}
                    <h1
                        className="font-black leading-[1.03] tracking-[-0.03em] text-white mb-6"
                        style={{
                            fontFamily: 'monospace',
                            fontSize: 'clamp(2.2rem, 5.5vw, 4.2rem)',
                        }}
                    >
                        Algorithm &<br />
                        <span
                            style={{
                                backgroundImage: 'linear-gradient(130deg, #5eead4 0%, #818cf8 55%, #c084fc 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            Logic Arcade
                        </span>
                    </h1>

                    <p className="text-[15px] text-slate-400 max-w-md leading-relaxed">
                        Five interactive minigames that make computer science tangible —
                        algorithms, AI, cryptography, and logic.
                    </p>
                </motion.div>

                {/* ── Game cards grid ── */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    style={{ perspective: '1200px' }}
                >
                    {GAMES.map(game => (
                        <GameCard key={game.id} game={game} onPlay={onPlay} />
                    ))}
                </motion.div>

                {/* ── Footer ── */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4, duration: 0.8 }}
                    className="mt-20 text-center text-[11px] text-slate-700"
                >
                    React · Three.js · TensorFlow.js · Framer Motion
                </motion.p>

            </div>
        </div>
    )
}