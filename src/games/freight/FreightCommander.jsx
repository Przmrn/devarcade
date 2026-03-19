// FreightCommander.jsx
// All UI chrome uses CSS variables.
// Game uses SVG canvas for the city grid.

import { useState, useEffect, useRef } from 'react'
import { sounds } from '../../utils/useSound.js'

const GRID         = 10
const CELL         = 52
const SVG_SIZE     = GRID * CELL
const TRUCK_COLORS = ['#3b82f6', '#f59e0b', '#10b981']
const CARGO_TYPES  = ['BOXES', 'FROZEN', 'CHEMICAL', 'PARTS']
const CARGO_ICONS  = { BOXES: '📦', FROZEN: '🧊', CHEMICAL: '⚗️', PARTS: '🔩' }

function randomDropoffs() {
  const used = new Set(['5,5'])
  const result = []
  while (result.length < 4) {
    const row = Math.floor(Math.random() * GRID)
    const col = Math.floor(Math.random() * GRID)
    const key = `${row},${col}`
    if (!used.has(key)) { used.add(key); result.push({ id: result.length, row, col }) }
  }
  return result
}

function makeTruck(id) {
  return { id, row: 5, col: 5, path: [], pathIdx: 0, cargo: null, fuel: 100, status: 'idle', destination: null }
}

function buildPath(from, to) {
  const path = []
  let { row, col } = from
  while (col !== to.col) { col += col < to.col ? 1 : -1; path.push({ row, col }) }
  while (row !== to.row) { row += row < to.row ? 1 : -1; path.push({ row, col }) }
  return path
}

let orderSeq = 0
function makeOrder(dropoffs) {
  return {
    id:        ++orderSeq,
    dropoffId: dropoffs[Math.floor(Math.random() * dropoffs.length)].id,
    cargo:     CARGO_TYPES[Math.floor(Math.random() * CARGO_TYPES.length)],
    timeLeft:  30 + Math.floor(Math.random() * 20),
    reward:    200 + Math.floor(Math.random() * 300),
  }
}

function centre(row, col) {
  return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 }
}

// Themed stat box
function StatBox({ label, value, color }) {
  return (
    <div style={{
      flex:       1,
      padding:    '8px 10px',
      border:     '1px solid var(--border)',
      background: 'var(--bg2)',
    }}>
      <p style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--text-muted)', marginBottom: 3 }}>
        {label}
      </p>
      <p style={{ fontSize: 16, fontWeight: 700, color: color || 'var(--accent)', letterSpacing: '0.06em' }}>
        {value}
      </p>
    </div>
  )
}

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

  const addLog = msg => setLog(l => [`> ${msg}`, ...l.slice(0, 9)])

  useEffect(() => {
    if (gameOver) return
    const id = setInterval(() => setTick(t => t + 1), 650)
    return () => clearInterval(id)
  }, [gameOver])

  useEffect(() => {
    if (tick === 0) return

    // Move trucks
    setTrucks(prev => prev.map(t => {
      if (t.status !== 'moving' || t.path.length === 0) return t
      const next = t.path[t.pathIdx]
      if (!next) return { ...t, status: 'idle', path: [], pathIdx: 0 }
      return { ...t, row: next.row, col: next.col, pathIdx: t.pathIdx + 1, fuel: Math.max(0, t.fuel - 2) }
    }))

    // Check deliveries
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
          addLog(`T${t.id + 1} DELIVERED ${t.cargo} +$${order.reward}`)
          sounds.success()
          updated[i] = { ...t, cargo: null, destination: null }
          return prev.filter(o => o.id !== order.id)
        })
      })
      return updated
    })

    // Tick order timers
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
        addLog(`${expired.length} ORDER(S) EXPIRED`)
      }
      return ticked.filter(o => o.timeLeft > 0)
    })

    // Refuel at warehouse
    setTrucks(prev => prev.map(t =>
      (t.row === 5 && t.col === 5 && t.status === 'idle')
        ? { ...t, fuel: Math.min(100, t.fuel + 15) }
        : t
    ))

    // Spawn orders
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
    const order = orders.find(o => o.dropoffId === dropoff.id)
    const cargo = order?.cargo ?? CARGO_TYPES[0]
    const path  = buildPath({ row: truck.row, col: truck.col }, dropoff)
    setTrucks(prev => prev.map(t =>
      t.id === selected ? { ...t, status: 'moving', path, pathIdx: 0, cargo, destination: dropoff } : t
    ))
    addLog(`T${selected + 1} DISPATCHED → DROP #${dropoff.id + 1}`)
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
    addLog(`T${selected + 1} RETURNING TO BASE`)
    sounds.click()
    setSelected(null)
  }

  function reset() {
    orderSeq = 0
    setTrucks([0, 1, 2].map(makeTruck))
    setOrders([]); setRevenue(0); setRep(100)
    setSelected(null); setLog([]); setGameOver(false); setTick(0)
  }

  const repColor = rep > 60 ? '#34d399' : rep > 30 ? '#f59e0b' : '#f43f5e'

  return (
    <div style={{
      display:    'flex',
      height:     '100%',
      overflow:   'hidden',
      background: 'var(--bg)',
      fontFamily: 'var(--font)',
    }}>

      {/* ── Left sidebar ───────────────────────────────────────── */}
      <div style={{
        width:        200,
        flexShrink:   0,
        display:      'flex',
        flexDirection:'column',
        background:   'var(--bg2)',
        borderRight:  '1px solid var(--border)',
        overflowY:    'auto',
      }}>

        {/* Stats */}
        <div style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-dim)' }}>
          <p style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: 8 }}>
            // STATUS
          </p>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            <StatBox label="REVENUE" value={`$${revenue}`} />
            <StatBox label="REP"     value={`${rep}%`} color={repColor} />
          </div>

          {/* Rep bar */}
          <div style={{ height: 2, background: 'var(--border)', position: 'relative' }}>
            <div style={{
              position:   'absolute',
              left:       0,
              width:      `${rep}%`,
              height:     '100%',
              background: repColor,
              transition: 'width 0.3s',
            }} />
          </div>
        </div>

        {/* Fleet */}
        <div style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-dim)' }}>
          <p style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: 8 }}>
            // FLEET
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {trucks.map(t => {
              const color   = TRUCK_COLORS[t.id]
              const isSel   = selected === t.id
              return (
                <div
                  key={t.id}
                  onClick={() => handleTruckClick(t.id)}
                  style={{
                    padding:    '8px 10px',
                    border:     `1px solid ${isSel ? color : 'var(--border)'}`,
                    background: isSel ? `${color}12` : 'transparent',
                    cursor:     'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: '0.12em' }}>
                      TRUCK {t.id + 1}
                    </span>
                    <span style={{
                      fontSize:   9,
                      letterSpacing: '0.1em',
                      color: t.status === 'moving' ? '#60a5fa' : 'var(--text-muted)',
                    }}>
                      {t.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Fuel bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>FUEL</span>
                    <div style={{ flex: 1, height: 2, background: 'var(--border)' }}>
                      <div style={{
                        height:     '100%',
                        width:      `${t.fuel}%`,
                        background: t.fuel > 50 ? '#34d399' : t.fuel > 20 ? '#f59e0b' : '#f43f5e',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>{t.fuel}%</span>
                  </div>

                  {t.cargo && (
                    <p style={{ fontSize: 8, color: 'var(--accent-dim)', marginTop: 4, letterSpacing: '0.1em' }}>
                      {CARGO_ICONS[t.cargo]} {t.cargo}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Orders */}
        <div style={{ padding: '14px 12px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: 8, flexShrink: 0 }}>
            // ORDERS ({orders.length})
          </p>
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {orders.length === 0 && (
              <p style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', fontStyle: 'italic' }}>
                AWAITING ORDERS...
              </p>
            )}
            {orders.map(o => (
              <div key={o.id} style={{
                padding:    '7px 9px',
                border:     `1px solid ${o.timeLeft < 10 ? 'rgba(244,63,94,0.4)' : 'var(--border)'}`,
                background: o.timeLeft < 10 ? 'rgba(244,63,94,0.05)' : 'var(--bg)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.1em' }}>
                    DROP #{o.dropoffId + 1}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                    color: o.timeLeft < 10 ? '#f43f5e' : 'var(--text-muted)',
                  }}>
                    {o.timeLeft}s
                  </span>
                </div>
                <p style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                  {CARGO_ICONS[o.cargo]} {o.cargo}
                </p>
                <p style={{ fontSize: 9, color: 'var(--accent)', letterSpacing: '0.1em', marginTop: 2 }}>
                  ${o.reward}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Map ────────────────────────────────────────────────── */}
      <div style={{
        flex:           1,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        background:     'var(--bg)',
        padding:        16,
        position:       'relative',
      }}>
        <svg
          width={SVG_SIZE} height={SVG_SIZE}
          style={{ border: '1px solid var(--border)', background: 'var(--bg2)' }}
        >
          {/* Grid lines */}
          {Array.from({ length: GRID + 1 }, (_, i) => (
            <g key={i}>
              <line x1={i * CELL} y1={0}       x2={i * CELL}  y2={SVG_SIZE} stroke="var(--border-dim)" strokeWidth="0.5" />
              <line x1={0}        y1={i * CELL} x2={SVG_SIZE}  y2={i * CELL} stroke="var(--border-dim)" strokeWidth="0.5" />
            </g>
          ))}

          {/* Road cross */}
          <rect x={5 * CELL} y={0}        width={CELL} height={SVG_SIZE} fill="var(--bg3)" opacity={0.7} />
          <rect x={0}        y={5 * CELL} width={SVG_SIZE} height={CELL} fill="var(--bg3)" opacity={0.7} />

          {/* Warehouse */}
          <g onClick={handleWarehouseClick} style={{ cursor: 'pointer' }}>
            <rect
              x={5 * CELL + 3} y={5 * CELL + 3}
              width={CELL - 6} height={CELL - 6}
              fill={selected !== null ? 'var(--accent-bg)' : 'var(--bg3)'}
              stroke="var(--accent)" strokeWidth="1"
            />
            <text
              x={5 * CELL + CELL / 2} y={5 * CELL + CELL / 2}
              textAnchor="middle" dominantBaseline="central" fontSize={18}
            >🏭</text>
          </g>

          {/* Dropoffs */}
          {dropoffs.map(d => {
            const { x, y } = centre(d.row, d.col)
            const order    = orders.find(o => o.dropoffId === d.id)
            return (
              <g key={d.id} onClick={() => handleDropoffClick(d)} style={{ cursor: 'pointer' }}>
                <rect
                  x={d.col * CELL + 3} y={d.row * CELL + 3}
                  width={CELL - 6} height={CELL - 6}
                  fill={order ? 'rgba(52,211,153,0.08)' : 'var(--bg3)'}
                  stroke={order ? '#34d399' : 'var(--border)'}
                  strokeWidth="1"
                />
                <text x={x} y={y - 5} textAnchor="middle" dominantBaseline="central" fontSize={14}>📍</text>
                {order && (
                  <text x={x} y={y + 12} textAnchor="middle" fontSize={8}
                    fill="#34d399" fontFamily="var(--font)">{order.timeLeft}s</text>
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
              <g key={t.id} onClick={() => handleTruckClick(t.id)}
                style={{ cursor: 'pointer' }}
                transform={`translate(${x},${y})`}>
                {isSel && <circle r={18} fill={color} opacity={0.12} />}
                <rect x={-11} y={-11} width={22} height={22}
                  fill={color} opacity={0.9}
                  stroke={isSel ? 'white' : color} strokeWidth={isSel ? 2 : 0.5}
                />
                <text textAnchor="middle" dominantBaseline="central" fontSize={11}>🚛</text>
                <text x={0} y={-17} textAnchor="middle" fontSize={7}
                  fill={color} fontFamily="var(--font)" fontWeight="700">
                  T{t.id + 1}
                </text>
                {t.cargo && (
                  <text x={14} y={-14} textAnchor="middle" fontSize={9}>
                    {CARGO_ICONS[t.cargo]}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {/* Game Over overlay */}
        {gameOver && (
          <div style={{
            position:       'absolute', inset: 0,
            display:        'flex', flexDirection: 'column',
            alignItems:     'center', justifyContent: 'center',
            background:     'rgba(0,0,0,0.85)',
            fontFamily:     'var(--font)',
          }}>
            <p style={{ fontSize: 32, fontWeight: 700, color: '#f43f5e', letterSpacing: '0.1em', marginBottom: 8 }}>
              GAME OVER
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: 4 }}>
              REPUTATION DEPLETED
            </p>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', marginBottom: 24 }}>
              FINAL: ${revenue}
            </p>
            <button
              onClick={reset}
              style={{
                padding:       '8px 24px',
                border:        '1px solid var(--accent)',
                background:    'var(--accent-bg)',
                color:         'var(--accent)',
                fontFamily:    'var(--font)',
                fontSize:      11,
                letterSpacing: '0.18em',
                cursor:        'pointer',
              }}
            >
              ⟳ RESTART
            </button>
          </div>
        )}
      </div>

      {/* ── Right sidebar ──────────────────────────────────────── */}
      <div style={{
        width:        180,
        flexShrink:   0,
        display:      'flex',
        flexDirection:'column',
        background:   'var(--bg2)',
        borderLeft:   '1px solid var(--border)',
        overflowY:    'auto',
      }}>

        {/* Log */}
        <div style={{ padding: '14px 12px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: 8, flexShrink: 0 }}>
            // LOG
          </p>
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {log.map((l, i) => (
              <p key={i} style={{
                fontSize:      9,
                color:         i === 0 ? 'var(--accent-dim)' : 'var(--text-muted)',
                letterSpacing: '0.06em',
                lineHeight:    1.5,
              }}>
                {l}
              </p>
            ))}
            {log.length === 0 && (
              <p style={{ fontSize: 9, color: 'var(--text-muted)', fontStyle: 'italic', letterSpacing: '0.1em' }}>
                NO EVENTS
              </p>
            )}
          </div>
        </div>

        {/* How to play */}
        <div style={{ padding: '14px 12px', borderTop: '1px solid var(--border-dim)' }}>
          <button
            onClick={() => setShowHow(h => !h)}
            style={{
              width:         '100%',
              textAlign:     'left',
              background:    'none',
              border:        'none',
              color:         'var(--accent)',
              fontFamily:    'var(--font)',
              fontSize:      9,
              letterSpacing: '0.16em',
              cursor:        'pointer',
              marginBottom:  showHow ? 10 : 0,
            }}
          >
            {showHow ? '▲' : '▼'} HOW TO PLAY
          </button>

          {showHow && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['01', 'CLICK a truck to select'],
                ['02', 'CLICK a 📍 to dispatch'],
                ['03', 'Deliver before timer runs out'],
                ['04', 'Return to 🏭 to refuel'],
                ['05', 'Rep 0% = game over'],
              ].map(([n, t]) => (
                <div key={n} style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 8, color: 'var(--accent)', letterSpacing: '0.1em', flexShrink: 0 }}>
                    [{n}]
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: 1.5, letterSpacing: '0.06em' }}>
                    {t}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  )
}