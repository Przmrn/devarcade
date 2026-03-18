// PathQuest.jsx
// The main pathfinding visualizer.
// Coordinates between: useGrid (state), dijkstra (algorithm), Cell (rendering)

import { useState, useRef, useCallback, useEffect } from 'react'
import { Play, Trash2, Shuffle, Zap, ZapOff } from 'lucide-react'
import Cell from './Cell.jsx'
import { useGrid, ROWS, COLS } from './useGrid.js'
import { runDijkstra, getShortestPath } from './dijkstra.js'
import { sounds } from '../../utils/useSound.js'

const DRAW_MODES = [
  { id: 'wall',   label: '■  Wall'   },
  { id: 'weight', label: '⬡  Weight' },
  { id: 'erase',  label: '✕  Erase'  },
]

const LEGEND = [
  { color: '#34d399', label: 'Start'       },
  { color: '#f43f5e', label: 'End'         },
  { color: '#0f172a', label: 'Wall',  border: true },
  { color: '#1c0a00', label: 'Weight ×5'  },
  { color: '#4338ca', label: 'Visited'     },
  { color: '#fde047', label: 'Path'        },
]

export default function PathQuest() {
  const [mode,    setMode]    = useState('wall')
  const [speed,   setSpeed]   = useState(18)
  const [running, setRunning] = useState(false)
  const [status,  setStatus]  = useState(null) // null | 'done' | 'blocked'

  // Refs for values used inside callbacks
  // (using refs avoids stale closure bugs)
  const modeRef    = useRef('wall')
  const runRef     = useRef(false)
  const timeoutIds = useRef([])

  const {
    grid,
    startRef,
    endRef,
    clearBoard,
    clearVisualization,
    randomiseWalls,
    toggleCell,
    paintCell,
    moveStart,
    moveEnd,
    animateVisited,
    animatePath,
  } = useGrid()

  // Keep refs in sync with state
  const setMode2 = (v) => { modeRef.current = v; setMode(v) }
  const setRun   = (v) => { runRef.current  = v; setRunning(v) }

  function killAnimations() {
    timeoutIds.current.forEach(clearTimeout)
    timeoutIds.current = []
  }

  // ── Button handlers ────────────────────────────────────────
  function handleClear() {
    if (runRef.current) return
    killAnimations()
    setStatus(null)
    clearBoard()
    sounds.click()
  }

  function handleRandom() {
    if (runRef.current) return
    killAnimations()
    setStatus(null)
    randomiseWalls()
    sounds.click()
  }

  function handleVisualize() {
    if (runRef.current) return

    killAnimations()
    setStatus(null)
    clearVisualization()

    const sp = startRef.current
    const ep = endRef.current

    // Deep copy the grid for the algorithm to mutate freely
    // We NEVER mutate React state directly inside the algorithm
    const gridCopy = grid.map(row =>
      row.map(node => ({
        ...node,
        distance:      node.isStart ? 0 : Infinity,
        previousNode:  null,
        isVisited:     false,
        isPath:        false,
      }))
    )

    const startNode = gridCopy[sp.row][sp.col]
    const endNode   = gridCopy[ep.row][ep.col]

    // Run algorithm synchronously — pure computation, instant
    const visitedInOrder = runDijkstra(gridCopy, startNode, endNode)
    const shortestPath   = getShortestPath(endNode)
    const reached        = endNode.isVisited

    // Now animate the results back into React state, one node at a time
    setRun(true)

    visitedInOrder.forEach((node, i) => {
      const tid = setTimeout(() => {
        animateVisited(node.row, node.col)
      }, i * speed)
      timeoutIds.current.push(tid)
    })

    const visitDelay = visitedInOrder.length * speed

    if (reached) {
      shortestPath.forEach((node, i) => {
        const tid = setTimeout(() => {
          animatePath(node.row, node.col)
          if (i === shortestPath.length - 1) {
            setRun(false)
            setStatus('done')
            sounds.success()
          }
        }, visitDelay + i * speed * 3)
        timeoutIds.current.push(tid)
      })
    } else {
      const tid = setTimeout(() => {
        setRun(false)
        setStatus('blocked')
        sounds.error()
      }, visitDelay + 200)
      timeoutIds.current.push(tid)
    }
  }

  // ── Mouse interaction ──────────────────────────────────────
  const isMouseDown = useRef(false)
  const dragTarget  = useRef(null) // 'start' | 'end' | null

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

  // Release drag if mouse leaves the window
  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseUp])

  // ── Cell size — fills available space ──────────────────────
  const cellSize = Math.floor(
    Math.min(
      (window.innerWidth - 240) / COLS,
      (window.innerHeight - 120) / ROWS
    )
  )

  return (
    <div className="flex h-full overflow-hidden bg-slate-950">

      {/* ── Sidebar ── */}
      <div className="w-48 flex-shrink-0 flex flex-col gap-3 p-4 bg-slate-900/50 border-r border-white/5">

        {/* Visualize button */}
        <button
          onClick={handleVisualize}
          disabled={running}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90 disabled:opacity-30 transition-all"
        >
          <Play size={13} />
          {running ? 'Running…' : 'Visualize'}
        </button>

        <button
          onClick={handleClear}
          disabled={running}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all"
        >
          <Trash2 size={12} /> Clear
        </button>

        <button
          onClick={handleRandom}
          disabled={running}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all"
        >
          <Shuffle size={12} /> Random
        </button>

        <div className="h-px bg-white/5 my-1" />

        {/* Draw mode selector */}
        <p className="text-[10px] text-slate-500 font-semibold tracking-wider">DRAW MODE</p>
        <div className="flex flex-col gap-1.5">
          {DRAW_MODES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setMode2(id)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold text-left transition-all ${
                mode === id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 bg-white/5 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="h-px bg-white/5 my-1" />

        {/* Speed slider */}
        <p className="text-[10px] text-slate-500 font-semibold tracking-wider">SPEED</p>
        <div className="flex items-center gap-2">
          <ZapOff size={10} className="text-slate-600 flex-shrink-0" />
          <input
            type="range"
            min="3"
            max="60"
            value={63 - speed}
            onChange={e => setSpeed(63 - Number(e.target.value))}
            className="flex-1 accent-violet-500"
          />
          <Zap size={10} className="text-yellow-400 flex-shrink-0" />
        </div>

        {/* Status message */}
        {status && (
          <div className={`mt-1 px-3 py-2 rounded-lg text-xs leading-snug ${
            status === 'done'
              ? 'bg-emerald-950/60 border border-emerald-800/50 text-emerald-400'
              : 'bg-rose-950/60 border border-rose-800/50 text-rose-400'
          }`}>
            {status === 'done'
              ? '✓ Shortest path found!'
              : '✕ End node is unreachable.'}
          </div>
        )}

        {/* Spacer pushes legend to bottom */}
        <div className="flex-1" />

        {/* Legend */}
        <div className="space-y-1.5">
          {LEGEND.map(({ color, label, border }) => (
            <div key={label} className="flex items-center gap-2 text-[10px] text-slate-500">
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{
                  background:  color,
                  border:      border ? '1px solid #334155' : 'none',
                }}
              />
              {label}
            </div>
          ))}
        </div>

        <p className="text-[9px] text-slate-700 leading-snug">
          Drag ▶ or ◉ to reposition
        </p>
      </div>

      {/* ── Grid ── */}
      <div
        className="flex-1 flex items-center justify-center p-2 overflow-hidden"
        onDragStart={e => e.preventDefault()}
      >
        <div
          style={{
            display:               'grid',
            gridTemplateColumns:   `repeat(${COLS}, ${cellSize}px)`,
            gridTemplateRows:      `repeat(${ROWS}, ${cellSize}px)`,
            borderRadius:          8,
            overflow:              'hidden',
            border:                '1px solid #1e293b',
          }}
        >
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