// FreightCommander.jsx
// Top-down logistics game. Click a truck, click a destination.
// Trucks move along the grid, deliver cargo, earn revenue.

import { useState, useEffect, useRef } from 'react'
import { Fuel, DollarSign, Star, AlertTriangle } from 'lucide-react'
import { sounds } from '../../utils/useSound.js'

const GRID       = 10
const CELL       = 54
const SVG_SIZE   = GRID * CELL
const TRUCK_COLORS = ['#3b82f6', '#f59e0b', '#10b981']
const CARGO_TYPES  = ['📦 Boxes', '🧊 Frozen', '⚗️ Chemical', '🔩 Parts']

// ── Pure helpers ───────────────────────────────────────────────

function randomDropoffs() {
  const used = new Set(['5,5'])
  const result = []
  while (result.length < 4) {
    const row = Math.floor(Math.random() * GRID)
    const col = Math.floor(Math.random() * GRID)
    const key = `${row},${col}`
    if (!used.has(key)) {
      used.add(key)
      result.push({ id: result.length, row, col })
    }
  }
  return result
}

function makeTruck(id) {
  return {
    id,
    row: 5, col: 5,
    path: [], pathIdx: 0,
    cargo: null,
    fuel: 100,
    status: 'idle',      // 'idle' | 'moving'
    destination: null,
  }
}

// Walk from (fromRow,fromCol) to (toRow,toCol) — horizontal first
function buildPath(from, to) {
  const path = []
  let { row, col } = from
  while (col !== to.col) { col += col < to.col ? 1 : -1; path.push({ row, col }) }
  while (row !== to.row) { row += row < to.row ? 1 : -1; path.push({ row, col }) }
  return path
}

let orderIdSeq = 0
function makeOrder(dropoffs) {
  return {
    id:       ++orderIdSeq,
    dropoffId: dropoffs[Math.floor(Math.random() * dropoffs.length)].id,
    cargo:    CARGO_TYPES[Math.floor(Math.random() * CARGO_TYPES.length)],
    timeLeft: 30 + Math.floor(Math.random() * 20),
    reward:   200 + Math.floor(Math.random() * 300),
  }
}

// SVG centre of a grid cell
function centre(row, col) {
  return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 }
}

// ── Component ──────────────────────────────────────────────────

export default function FreightCommander() {
  const [dropoffs]              = useState(randomDropoffs)
  const [trucks,   setTrucks]   = useState([0, 1, 2].map(makeTruck))
  const [orders,   setOrders]   = useState([])
  const [selected, setSelected] = useState(null)
  const [revenue,  setRevenue]  = useState(0)
  const [rep,      setRep]      = useState(100)
  const [log,      setLog]      = useState([])
  const [tick,     setTick]     = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [showHow,  setShowHow]  = useState(false)

  const addLog = (msg) => setLog(l => [msg, ...l.slice(0, 7)])

  // Game tick every 650ms
  useEffect(() => {
    if (gameOver) return
    const id = setInterval(() => setTick(t => t + 1), 650)
    return () => clearInterval(id)
  }, [gameOver])

  useEffect(() => {
    if (tick === 0) return

    // 1. Move trucks one step along their path
    setTrucks(prev => prev.map(t => {
      if (t.status !== 'moving' || t.path.length === 0) return t
      const next = t.path[t.pathIdx]
      if (!next) {
        // Arrived at destination
        return { ...t, status: 'idle', path: [], pathIdx: 0 }
      }
      return {
        ...t,
        row:     next.row,
        col:     next.col,
        pathIdx: t.pathIdx + 1,
        fuel:    Math.max(0, t.fuel - 2),
      }
    }))

    // 2. Check deliveries — truck idle at a dropoff with matching cargo
    setTrucks(prev => {
      const updated = [...prev]
      updated.forEach((t, i) => {
        if (t.status !== 'idle' || !t.cargo) return
        const drop = dropoffs.find(d => d.row === t.row && d.col === t.col)
        if (!drop) return
        setOrders(prev => {
          const order = prev.find(o => o.dropoffId === drop.id && o.cargo === t.cargo)
          if (!order) return prev
          setRevenue(r => r + order.reward)
          addLog(`✓ Truck ${t.id + 1} delivered ${t.cargo} +$${order.reward}`)
          sounds.success()
          updated[i] = { ...t, cargo: null, destination: null }
          return prev.filter(o => o.id !== order.id)
        })
      })
      return updated
    })

    // 3. Tick order timers — remove expired ones, hit reputation
    setOrders(prev => {
      const ticked  = prev.map(o => ({ ...o, timeLeft: o.timeLeft - 1 }))
      const expired = ticked.filter(o => o.timeLeft <= 0)
      if (expired.length > 0) {
        setRep(r => {
          const next = Math.max(0, r - expired.length * 10)
          if (next <= 0) setGameOver(true)
          return next
        })
        sounds.error()
        addLog(`⚠ ${expired.length} order(s) expired! Rep -${expired.length * 10}`)
      }
      return ticked.filter(o => o.timeLeft > 0)
    })

    // 4. Refuel trucks parked at warehouse
    setTrucks(prev => prev.map(t =>
      (t.row === 5 && t.col === 5 && t.status === 'idle')
        ? { ...t, fuel: Math.min(100, t.fuel + 15) }
        : t
    ))

    // 5. Spawn new orders occasionally
    if (tick % 5 === 0 && orders.length < 5) {
      setOrders(o => [...o, makeOrder(dropoffs)])
    }

  }, [tick])

  function handleTruckClick(id) {
    if (gameOver) return
    sounds.click()
    setSelected(s => s === id ? null : id)
  }

  function handleDropoffClick(dropoff) {
    if (selected === null || gameOver) return
    const truck = trucks.find(t => t.id === selected)
    if (!truck || truck.status === 'moving') return

    // Load matching cargo for this dropoff, or first available
    const order   = orders.find(o => o.dropoffId === dropoff.id)
    const cargo   = order?.cargo ?? CARGO_TYPES[0]
    const path    = buildPath({ row: truck.row, col: truck.col }, dropoff)

    setTrucks(prev => prev.map(t =>
      t.id === selected
        ? { ...t, status: 'moving', path, pathIdx: 0, cargo, destination: dropoff }
        : t
    ))
    addLog(`Truck ${selected + 1} → Drop #${dropoff.id + 1}`)
    sounds.launch()
    setSelected(null)
  }

  function handleWarehouseClick() {
    if (selected === null || gameOver) return
    const truck = trucks.find(t => t.id === selected)
    if (!truck || truck.status === 'moving') return
    const path = buildPath({ row: truck.row, col: truck.col }, { row: 5, col: 5 })
    setTrucks(prev => prev.map(t =>
      t.id === selected ? { ...t, status: 'moving', path, pathIdx: 0 } : t
    ))
    sounds.click()
    setSelected(null)
  }

  function reset() {
    orderIdSeq = 0
    setTrucks([0, 1, 2].map(makeTruck))
    setOrders([])
    setRevenue(0)
    setRep(100)
    setSelected(null)
    setLog([])
    setGameOver(false)
    setTick(0)
  }

  return (
    <div className="flex h-full bg-gray-950 overflow-hidden">

      {/* ── Map canvas ── */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative">
          <svg
            width={SVG_SIZE}
            height={SVG_SIZE}
            className="rounded-xl border border-white/10 bg-gray-900"
          >
            {/* Grid lines */}
            {Array.from({ length: GRID + 1 }, (_, i) => (
              <g key={i}>
                <line x1={i * CELL} y1={0}        x2={i * CELL}    y2={SVG_SIZE} stroke="#1e293b" strokeWidth="0.5" />
                <line x1={0}        y1={i * CELL}  x2={SVG_SIZE}    y2={i * CELL} stroke="#1e293b" strokeWidth="0.5" />
              </g>
            ))}

            {/* Road highlights — cross through warehouse */}
            <rect x={5 * CELL} y={0}        width={CELL} height={SVG_SIZE} fill="#0f172a" opacity={0.7} />
            <rect x={0}        y={5 * CELL} width={SVG_SIZE} height={CELL} fill="#0f172a" opacity={0.7} />

            {/* Warehouse */}
            <g onClick={handleWarehouseClick} className="cursor-pointer">
              <rect
                x={5 * CELL + 3} y={5 * CELL + 3}
                width={CELL - 6} height={CELL - 6} rx={6}
                fill={selected !== null ? '#92400e' : '#1c1917'}
                stroke="#f59e0b" strokeWidth="1.5"
              />
              <text
                x={5 * CELL + CELL / 2} y={5 * CELL + CELL / 2}
                textAnchor="middle" dominantBaseline="central"
                fontSize={20}
              >🏭</text>
            </g>

            {/* Dropoff nodes */}
            {dropoffs.map(d => {
              const { x, y } = centre(d.row, d.col)
              const order    = orders.find(o => o.dropoffId === d.id)
              return (
                <g key={d.id} onClick={() => handleDropoffClick(d)} className="cursor-pointer">
                  <rect
                    x={d.col * CELL + 3} y={d.row * CELL + 3}
                    width={CELL - 6} height={CELL - 6} rx={6}
                    fill={order ? '#14532d' : '#0f172a'}
                    stroke={order ? '#4ade80' : '#334155'}
                    strokeWidth="1.5"
                  />
                  <text x={x} y={y - 5} textAnchor="middle" dominantBaseline="central" fontSize={16}>📍</text>
                  {order && (
                    <text x={x} y={y + 12} textAnchor="middle" fontSize={9} fill="#4ade80">
                      {order.timeLeft}s
                    </text>
                  )}
                </g>
              )
            })}

            {/* Trucks */}
            {trucks.map(t => {
              const { x, y } = centre(t.row, t.col)
              const color     = TRUCK_COLORS[t.id]
              const isSel     = selected === t.id
              return (
                <g
                  key={t.id}
                  onClick={() => handleTruckClick(t.id)}
                  className="cursor-pointer"
                  transform={`translate(${x},${y})`}
                >
                  <circle r={15} fill={color} opacity={isSel ? 0.25 : 0.12} />
                  <circle
                    r={11} fill={color} opacity={0.9}
                    stroke={isSel ? 'white' : color}
                    strokeWidth={isSel ? 2.5 : 1}
                  />
                  <text textAnchor="middle" dominantBaseline="central" fontSize={12}>🚛</text>
                  {t.cargo && (
                    <text x={0} y={18} textAnchor="middle" fontSize={8} fill="white" opacity={0.8}>📦</text>
                  )}
                  <text x={0} y={-18} textAnchor="middle" fontSize={8} fill={color}>{t.id + 1}</text>
                </g>
              )
            })}
          </svg>

          {/* Game over overlay */}
          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl">
              <p className="text-4xl font-black text-rose-400 mb-2">GAME OVER</p>
              <p className="text-slate-400 mb-4">Reputation hit zero</p>
              <p className="text-2xl font-bold text-amber-400 mb-6">Final: ${revenue}</p>
              <button
                onClick={reset}
                className="px-6 py-2.5 rounded-lg bg-amber-500 text-black font-bold hover:bg-amber-400 transition-colors"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Sidebar ── */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-3 p-4 bg-gray-900/60 border-l border-white/5 overflow-y-auto">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-amber-950/40 border border-amber-800/30 rounded-lg p-3">
            <p className="text-[10px] text-amber-600 mb-1">REVENUE</p>
            <p className="text-lg font-bold text-amber-400">${revenue}</p>
          </div>
          <div className="bg-rose-950/40 border border-rose-800/30 rounded-lg p-3">
            <p className="text-[10px] text-rose-600 mb-1">REPUTATION</p>
            <p className="text-lg font-bold text-rose-400">{rep}%</p>
          </div>
        </div>

        {/* Reputation bar */}
        <div className="w-full bg-slate-800 rounded-full h-1.5">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${rep}%`,
              background: rep > 60 ? '#4ade80' : rep > 30 ? '#fbbf24' : '#f43f5e',
            }}
          />
        </div>

        <div className="h-px bg-white/5" />

        {/* Fleet */}
        <p className="text-[10px] text-slate-500 font-semibold tracking-wider">FLEET</p>
        {trucks.map(t => (
          <div
            key={t.id}
            onClick={() => handleTruckClick(t.id)}
            className={`rounded-lg p-3 cursor-pointer border transition-all ${
              selected === t.id
                ? 'border-white/30 bg-white/10'
                : 'border-white/5 bg-white/3 hover:border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold" style={{ color: TRUCK_COLORS[t.id] }}>
                Truck {t.id + 1}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                t.status === 'moving'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {t.status}
              </span>
            </div>

            {/* Fuel bar */}
            <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1">
              <Fuel size={10} />
              <div className="flex-1 bg-slate-800 rounded-full h-1.5">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width:      `${t.fuel}%`,
                    background: t.fuel > 50 ? '#4ade80' : t.fuel > 20 ? '#fbbf24' : '#f43f5e',
                  }}
                />
              </div>
              <span>{t.fuel}%</span>
            </div>

            {t.cargo && (
              <p className="text-[10px] text-slate-400">{t.cargo}</p>
            )}
          </div>
        ))}

        <div className="h-px bg-white/5" />

        {/* Active orders */}
        <p className="text-[10px] text-slate-500 font-semibold tracking-wider">
          ORDERS ({orders.length})
        </p>
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto min-h-0">
          {orders.length === 0 && (
            <p className="text-xs text-slate-600 italic">Waiting for orders…</p>
          )}
          {orders.map(o => {
            const drop = dropoffs.find(d => d.id === o.dropoffId)
            return (
              <div
                key={o.id}
                className={`rounded-lg p-2.5 border text-xs ${
                  o.timeLeft < 10
                    ? 'border-rose-800/50 bg-rose-950/30'
                    : 'border-white/5 bg-white/3'
                }`}
              >
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-white">Drop #{o.dropoffId + 1}</span>
                  <span className={`font-mono font-bold ${o.timeLeft < 10 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {o.timeLeft}s
                  </span>
                </div>
                <p className="text-slate-400">{o.cargo}</p>
                <p className="text-amber-400 font-semibold">${o.reward}</p>
              </div>
            )
          })}
        </div>

        <div className="h-px bg-white/5" />

        {/* Log */}
        <p className="text-[10px] text-slate-500 font-semibold tracking-wider">LOG</p>
        <div className="space-y-1">
          {log.map((l, i) => (
            <p key={i} className="text-[10px] text-slate-500 font-mono">{l}</p>
          ))}
        </div>

        {/* How to play toggle */}
        <button
          onClick={() => setShowHow(h => !h)}
          className="mt-2 text-[10px] text-violet-400 hover:text-violet-300 transition-colors text-left"
        >
          {showHow ? '▲ Hide guide' : '▼ How to play'}
        </button>

        {showHow && (
          <div className="bg-slate-900 rounded-lg p-3 text-[10px] text-slate-400 leading-relaxed space-y-1.5 border border-white/5">
            <p><span className="text-white font-semibold">1.</span> Click a truck to select it</p>
            <p><span className="text-white font-semibold">2.</span> Click a 📍 dropoff to dispatch it with matching cargo</p>
            <p><span className="text-white font-semibold">3.</span> Deliver before the timer hits zero or reputation drops</p>
            <p><span className="text-white font-semibold">4.</span> Return trucks to 🏭 to refuel</p>
            <p><span className="text-white font-semibold">5.</span> Reputation hits 0 → game over</p>
          </div>
        )}

      </div>
    </div>
  )
}