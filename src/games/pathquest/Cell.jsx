// Cell.jsx
// A single node on the pathfinding grid.
// React.memo means this only re-renders when ITS node prop changes.
// Without memo, all 576 cells re-render every animation frame.

import { memo } from 'react'

function Cell({ node, onMouseDown, onMouseEnter, onMouseUp }) {
    const { isStart, isEnd, isWall, isWeight, isVisited, isPath } = node

    // Decide background colour based on node state
    let bg = 'bg-slate-950'
    let anim = ''
    let shadow = ''

    if (isStart) {
        bg = 'bg-emerald-400'
        shadow = 'shadow-[0_0_6px_rgba(52,211,153,0.5)]'
    } else if (isEnd) {
        bg = 'bg-rose-500'
        shadow = 'shadow-[0_0_6px_rgba(244,63,94,0.5)]'
    } else if (isPath) {
        bg = 'bg-yellow-300'
        anim = 'anim-path'
        shadow = 'shadow-[0_0_4px_rgba(253,224,71,0.4)]'
    } else if (isVisited) {
        bg = 'bg-indigo-700'
        anim = 'anim-vis'
    } else if (isWall) {
        bg = 'bg-slate-900'
        anim = 'anim-wall'
    } else if (isWeight) {
        bg = 'bg-amber-950'
    }

    return (
        <div
            className={`
        border border-slate-800/40
        flex items-center justify-center
        cursor-crosshair
        hover:brightness-125
        transition-colors duration-75
        ${bg} ${shadow} ${anim}
      `}
            onMouseDown={onMouseDown}
            onMouseEnter={onMouseEnter}
            onMouseUp={onMouseUp}
        >
            {isStart && <span className="text-emerald-900 text-[9px] font-black pointer-events-none">▶</span>}
            {isEnd && <span className="text-white text-[9px] font-black pointer-events-none">◉</span>}
            {isWeight && !isStart && !isEnd && (
                <span className="text-amber-900 pointer-events-none" style={{ fontSize: 7 }}>⬡</span>
            )}
        </div>
    )
}

export default memo(Cell)