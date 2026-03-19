// Cell.jsx
// Single grid node. React.memo prevents re-renders unless this
// specific node's data changes — critical for animation performance.

import { memo } from 'react'

// Game colours — intentionally NOT themed.
// These encode algorithm state so they must be visually distinct
// regardless of which theme is active.
const STATE = {
  start:   { bg: '#34d399', shadow: '0 0 7px rgba(52,211,153,0.55)' },
  end:     { bg: '#f43f5e', shadow: '0 0 7px rgba(244,63,94,0.55)'  },
  path:    { bg: '#fde047', shadow: '0 0 5px rgba(253,224,71,0.45)', anim: 'anim-path' },
  visited: { bg: '#4338ca', shadow: 'none',                           anim: 'anim-vis'  },
  wall:    { bg: '#0f172a', shadow: 'none',                           anim: 'anim-wall' },
  weight:  { bg: '#1c0a00', shadow: 'none'                           },
  empty:   { bg: 'transparent', shadow: 'none'                       },
}

function Cell({ node, onMouseDown, onMouseEnter, onMouseUp }) {
  const { isStart, isEnd, isWall, isWeight, isVisited, isPath } = node

  let state = STATE.empty
  if      (isStart)   state = STATE.start
  else if (isEnd)     state = STATE.end
  else if (isPath)    state = STATE.path
  else if (isVisited) state = STATE.visited
  else if (isWall)    state = STATE.wall
  else if (isWeight)  state = STATE.weight

  return (
    <div
      className={state.anim ?? ''}
      style={{
        background: state.bg,
        boxShadow:  state.shadow,
        border:     '1px solid var(--border-dim)',
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor:     'crosshair',
      }}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseUp={onMouseUp}
    >
      {isStart && (
        <span style={{ fontSize: 9, fontWeight: 900, color: '#064e3b', pointerEvents: 'none', userSelect: 'none' }}>▶</span>
      )}
      {isEnd && (
        <span style={{ fontSize: 9, fontWeight: 900, color: 'white', pointerEvents: 'none', userSelect: 'none' }}>◉</span>
      )}
      {isWeight && !isStart && !isEnd && (
        <span style={{ fontSize: 7, color: '#92400e', pointerEvents: 'none', userSelect: 'none' }}>⬡</span>
      )}
    </div>
  )
}

export default memo(Cell)