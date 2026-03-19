// PathQuest.jsx
// Uses CSS variables for all UI chrome.
// Game-state colours (visited, path, wall) stay hardcoded — they're functional.

import { useState, useRef, useCallback, useEffect } from 'react'
import Cell from './Cell.jsx'
import { useGrid, ROWS, COLS } from './useGrid.js'
import { runDijkstra, getShortestPath } from './dijkstra.js'
import { sounds } from '../../utils/useSound.js'

const DRAW_MODES = [
  { id: 'wall',   label: 'WALL'   },
  { id: 'weight', label: 'WEIGHT' },
  { id: 'erase',  label: 'ERASE'  },
]

const LEGEND = [
  { color: '#34d399', label: 'START'    },
  { color: '#f43f5e', label: 'END'      },
  { color: '#0f172a', label: 'WALL', border: true },
  { color: '#1c0a00', label: 'WEIGHT'   },
  { color: '#4338ca', label: 'VISITED'  },
  { color: '#fde047', label: 'PATH'     },
]

// Tidy labelled stat box
function Stat({ label, value, accent }) {
  return (
    <div style={{
      padding:    '8px 10px',
      border:     '1px solid var(--border)',
      background: 'var(--bg2)',
    }}>
      <p style={{ fontSize: 9, letterSpacing: '0.16em', color: 'var(--text-muted)', marginBottom: 3 }}>
        {label}
      </p>
      <p style={{ fontSize: 13, fontWeight: 700, color: accent ? 'var(--accent)' : 'var(--text)', letterSpacing: '0.08em' }}>
        {value}
      </p>
    </div>
  )
}

// Terminal-style button
function TermBtn({ onClick, disabled, children, primary }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width:         '100%',
        padding:       '8px 0',
        border:        '1px solid var(--border)',
        background:    primary
          ? (hov ? 'var(--accent)' : 'var(--accent-bg)')
          : (hov ? 'var(--bg3)'   : 'transparent'),
        color:         primary
          ? (hov ? 'var(--bg)'    : 'var(--accent)')
          : 'var(--text-dim)',
        fontFamily:    'var(--font)',
        fontSize:      10,
        letterSpacing: '0.16em',
        cursor:        disabled ? 'not-allowed' : 'pointer',
        opacity:       disabled ? 0.3 : 1,
        transition:    'none',
      }}
    >
      {children}
    </button>
  )
}

export default function PathQuest() {
  const [mode,    setMode]    = useState('wall')
  const [speed,   setSpeed]   = useState(18)
  const [running, setRunning] = useState(false)
  const [status,  setStatus]  = useState(null)
  const [visited, setVisited] = useState(0)
  const [pathLen, setPathLen] = useState(0)

  const modeRef    = useRef('wall')
  const runRef     = useRef(false)
  const timeoutIds = useRef([])

  const {
    grid, startRef, endRef,
    clearBoard, clearVisualization, randomiseWalls,
    toggleCell, paintCell, moveStart, moveEnd,
    animateVisited, animatePath,
  } = useGrid()

  const setMode2 = v => { modeRef.current = v; setMode(v) }
  const setRun   = v => { runRef.current  = v; setRunning(v) }

  function killAnimations() {
    timeoutIds.current.forEach(clearTimeout)
    timeoutIds.current = []
  }

  function handleClear() {
    if (runRef.current) return
    killAnimations(); setStatus(null)
    setVisited(0); setPathLen(0)
    clearBoard(); sounds.click()
  }

  function handleRandom() {
    if (runRef.current) return
    killAnimations(); setStatus(null)
    setVisited(0); setPathLen(0)
    randomiseWalls(); sounds.click()
  }

  function handleVisualize() {
    if (runRef.current) return
    killAnimations(); setStatus(null)
    setVisited(0); setPathLen(0)
    clearVisualization()

    const sp = startRef.current
    const ep = endRef.current
    const gridCopy = grid.map(row =>
      row.map(node => ({
        ...node,
        distance:     node.isStart ? 0 : Infinity,
        previousNode: null,
        isVisited:    false,
        isPath:       false,
      }))
    )

    const startNode = gridCopy[sp.row][sp.col]
    const endNode   = gridCopy[ep.row][ep.col]
    const visitedInOrder = runDijkstra(gridCopy, startNode, endNode)
    const shortestPath   = getShortestPath(endNode)
    const reached        = endNode.isVisited

    setRun(true)
    setVisited(visitedInOrder.length)

    visitedInOrder.forEach((node, i) => {
      timeoutIds.current.push(
        setTimeout(() => animateVisited(node.row, node.col), i * speed)
      )
    })

    const visitDelay = visitedInOrder.length * speed

    if (reached) {
      setPathLen(shortestPath.length)
      shortestPath.forEach((node, i) => {
        timeoutIds.current.push(
          setTimeout(() => {
            animatePath(node.row, node.col)
            if (i === shortestPath.length - 1) {
              setRun(false); setStatus('done'); sounds.success()
            }
          }, visitDelay + i * speed * 3)
        )
      })
    } else {
      timeoutIds.current.push(
        setTimeout(() => {
          setRun(false); setStatus('blocked'); sounds.error()
        }, visitDelay + 200)
      )
    }
  }

  // Mouse interaction
  const isMouseDown = useRef(false)
  const dragTarget  = useRef(null)

  const handleMouseDown = useCallback((row, col) => {
    if (runRef.current) return
    isMouseDown.current = true
    const node = grid[row][col]
    if (node.isStart) { dragTarget.current = 'start'; return }
    if (node.isEnd)   { dragTarget.current = 'end';   return }
    dragTarget.current = null
    toggleCell(row, col, modeRef.current)
  }, [grid])

  const handleMouseEnter = useCallback((row, col) => {
    if (!isMouseDown.current || runRef.current) return
    if (dragTarget.current === 'start') { moveStart(row, col); return }
    if (dragTarget.current === 'end')   { moveEnd(row, col);   return }
    paintCell(row, col, modeRef.current)
  }, [])

  const handleMouseUp = useCallback(() => {
    isMouseDown.current = false
    dragTarget.current  = null
  }, [])

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseUp])

  const cellSize = Math.floor(
    Math.min(
      (window.innerWidth - 220) / COLS,
      (window.innerHeight - 100) / ROWS
    )
  )

  // Speed label
  const speedLabel = speed <= 8 ? 'FAST' : speed <= 20 ? 'MED' : 'SLOW'

  return (
    <div style={{
      display:    'flex',
      height:     '100%',
      overflow:   'hidden',
      background: 'var(--bg)',
      fontFamily: 'var(--font)',
    }}>

      {/* ── Sidebar ────────────────────────────────────────────── */}
      <div style={{
        width:        200,
        flexShrink:   0,
        display:      'flex',
        flexDirection:'column',
        gap:          1,
        background:   'var(--bg2)',
        borderRight:  '1px solid var(--border)',
        overflowY:    'auto',
      }}>

        {/* Section: Actions */}
        <div style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-dim)' }}>
          <p style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: 8 }}>
            // ACTIONS
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <TermBtn onClick={handleVisualize} disabled={running} primary>
              {running ? '■ RUNNING' : '▶ VISUALIZE'}
            </TermBtn>
            <TermBtn onClick={handleClear} disabled={running}>
              ✕ CLEAR
            </TermBtn>
            <TermBtn onClick={handleRandom} disabled={running}>
              ⟳ RANDOM
            </TermBtn>
          </div>
        </div>

        {/* Section: Draw mode */}
        <div style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-dim)' }}>
          <p style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: 8 }}>
            // DRAW MODE
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {DRAW_MODES.map(({ id, label }) => {
              const active = mode === id
              return (
                <button
                  key={id}
                  onClick={() => setMode2(id)}
                  style={{
                    padding:       '7px 10px',
                    border:        '1px solid var(--border)',
                    background:    active ? 'var(--accent-bg)' : 'transparent',
                    color:         active ? 'var(--accent)' : 'var(--text-muted)',
                    fontFamily:    'var(--font)',
                    fontSize:      10,
                    letterSpacing: '0.16em',
                    textAlign:     'left',
                    cursor:        'pointer',
                    display:       'flex',
                    alignItems:    'center',
                    gap:           8,
                  }}
                >
                  <span style={{
                    width:        6, height: 6,
                    borderRadius: '50%',
                    background:   active ? 'var(--accent)' : 'transparent',
                    border:       '1px solid var(--border)',
                    flexShrink:   0,
                  }} />
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Section: Speed */}
        <div style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-dim)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-muted)' }}>
              // SPEED
            </p>
            <p style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--accent)' }}>
              {speedLabel}
            </p>
          </div>

          {/* Custom styled slider track */}
          <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
            <div style={{
              position:   'absolute',
              left: 0, right: 0,
              height:     2,
              background: 'var(--border)',
            }} />
            <div style={{
              position:   'absolute',
              left: 0,
              width:      `${((63 - speed) / 60) * 100}%`,
              height:     2,
              background: 'var(--accent)',
            }} />
            <input
              type="range"
              min="3" max="60"
              value={63 - speed}
              onChange={e => setSpeed(63 - Number(e.target.value))}
              style={{
                position:   'absolute',
                left: 0, right: 0,
                width:      '100%',
                opacity:    0,
                cursor:     'pointer',
                height:     20,
                margin:     0,
              }}
            />
            {/* Thumb indicator */}
            <div style={{
              position:   'absolute',
              left:       `calc(${((63 - speed) / 60) * 100}% - 5px)`,
              width:      10, height: 10,
              background: 'var(--accent)',
              pointerEvents: 'none',
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>SLOW</span>
            <span style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>FAST</span>
          </div>
        </div>

        {/* Section: Stats */}
        <div style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-dim)' }}>
          <p style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: 8 }}>
            // STATS
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Stat label="NODES VISITED" value={visited || '—'} />
            <Stat label="PATH LENGTH"   value={pathLen || '—'} accent />
          </div>
        </div>

        {/* Status message */}
        {status && (
          <div style={{
            margin:     '0 12px',
            padding:    '8px 10px',
            border:     `1px solid ${status === 'done' ? 'rgba(52,211,153,0.3)' : 'rgba(244,63,94,0.3)'}`,
            background: status === 'done' ? 'rgba(52,211,153,0.06)' : 'rgba(244,63,94,0.06)',
          }}>
            <p style={{
              fontSize:      10,
              letterSpacing: '0.12em',
              color:         status === 'done' ? '#34d399' : '#f43f5e',
            }}>
              {status === 'done' ? '✓ PATH FOUND' : '✕ UNREACHABLE'}
            </p>
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Section: Legend */}
        <div style={{ padding: '14px 12px', borderTop: '1px solid var(--border-dim)' }}>
          <p style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: 8 }}>
            // LEGEND
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {LEGEND.map(({ color, label, border }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width:        10, height: 10,
                  background:   color,
                  flexShrink:   0,
                  border:       border ? '1px solid #334155' : 'none',
                }} />
                <span style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--text-muted)' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.5, letterSpacing: '0.08em' }}>
            DRAG ▶ OR ◉ TO MOVE
          </p>
        </div>

      </div>

      {/* ── Grid ───────────────────────────────────────────────── */}
      <div
        style={{
          flex:           1,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        12,
          overflow:       'hidden',
          background:     'var(--bg)',
        }}
        onDragStart={e => e.preventDefault()}
      >
        <div style={{
          display:             'grid',
          gridTemplateColumns: `repeat(${COLS}, ${cellSize}px)`,
          gridTemplateRows:    `repeat(${ROWS}, ${cellSize}px)`,
          border:              '1px solid var(--border)',
          overflow:            'hidden',
        }}>
          {grid.flat().map(node => (
            <Cell
              key={`${node.row}-${node.col}`}
              node={node}
              onMouseDown={() => handleMouseDown(node.row, node.col)}
              onMouseEnter={() => handleMouseEnter(node.row, node.col)}
              onMouseUp={handleMouseUp}
            />
          ))}
        </div>
      </div>

    </div>
  )
}