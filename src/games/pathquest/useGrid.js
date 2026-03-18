// useGrid.js
// Custom hook that owns all grid state.
// Keeps PathQuest.jsx clean — it just calls these functions.

import { useState, useRef, useCallback } from 'react'

export const ROWS = 18
export const COLS = 32

const DEFAULT_START = { row: 9, col: 4 }
const DEFAULT_END = { row: 9, col: 27 }

function createNode(row, col, start, end) {
    return {
        row,
        col,
        isStart: row === start.row && col === start.col,
        isEnd: row === end.row && col === end.col,
        isWall: false,
        isWeight: false,
        isVisited: false,
        isPath: false,
        distance: Infinity,
        previousNode: null,
    }
}

export function buildGrid(start = DEFAULT_START, end = DEFAULT_END) {
    return Array.from({ length: ROWS }, (_, r) =>
        Array.from({ length: COLS }, (_, c) => createNode(r, c, start, end))
    )
}

// Strip only visualisation state — keep walls and weights
function clearVizNode(node) {
    return {
        ...node,
        isVisited: false,
        isPath: false,
        distance: Infinity,
        previousNode: null,
    }
}

export function useGrid() {
    const [grid, setGrid] = useState(() => buildGrid())
    const [startPos, setStartPos] = useState(DEFAULT_START)
    const [endPos, setEndPos] = useState(DEFAULT_END)

    // Refs mirror state so event handler callbacks never go stale
    const startRef = useRef(DEFAULT_START)
    const endRef = useRef(DEFAULT_END)

    const syncStart = (pos) => { startRef.current = pos; setStartPos(pos) }
    const syncEnd = (pos) => { endRef.current = pos; setEndPos(pos) }

    // ── Board operations ─────────────────────────────────────────

    const clearBoard = useCallback(() => {
        setGrid(buildGrid(startRef.current, endRef.current))
    }, [])

    const clearVisualization = useCallback(() => {
        setGrid(g => g.map(row => row.map(clearVizNode)))
    }, [])

    const randomiseWalls = useCallback(() => {
        setGrid(prev => prev.map(row => row.map(node => {
            if (node.isStart || node.isEnd) return {
                ...node, isWall: false, isWeight: false,
                isVisited: false, isPath: false
            }
            const r = Math.random()
            return {
                ...node,
                isWall: r < 0.28,
                isWeight: r >= 0.28 && r < 0.40,
                isVisited: false,
                isPath: false,
            }
        })))
    }, [])

    // ── Cell drawing ─────────────────────────────────────────────

    // Toggle on click (first press)
    const toggleCell = useCallback((row, col, mode) => {
        setGrid(prev => {
            const node = prev[row][col]
            if (node.isStart || node.isEnd) return prev
            const next = prev.map(r => [...r])
            const n = { ...next[row][col] }
            if (mode === 'wall') { n.isWall = !n.isWall; n.isWeight = false }
            if (mode === 'weight') { n.isWeight = !n.isWeight; n.isWall = false }
            if (mode === 'erase') { n.isWall = false; n.isWeight = false }
            next[row][col] = n
            return next
        })
    }, [])

    // Paint on drag (always sets, never toggles)
    const paintCell = useCallback((row, col, mode) => {
        setGrid(prev => {
            const node = prev[row][col]
            if (node.isStart || node.isEnd) return prev
            const next = prev.map(r => [...r])
            const n = { ...next[row][col] }
            if (mode === 'wall') { n.isWall = true; n.isWeight = false }
            if (mode === 'weight') { n.isWeight = true; n.isWall = false }
            if (mode === 'erase') { n.isWall = false; n.isWeight = false }
            next[row][col] = n
            return next
        })
    }, [])

    // ── Drag start/end nodes ─────────────────────────────────────

    const moveStart = useCallback((row, col) => {
        if (row === endRef.current.row && col === endRef.current.col) return
        syncStart({ row, col })
        setGrid(prev => prev.map(r => r.map(node => ({
            ...node,
            isStart: node.row === row && node.col === col,
            isWall: (node.row === row && node.col === col) ? false : node.isWall,
            isWeight: (node.row === row && node.col === col) ? false : node.isWeight,
        }))))
    }, [])

    const moveEnd = useCallback((row, col) => {
        if (row === startRef.current.row && col === startRef.current.col) return
        syncEnd({ row, col })
        setGrid(prev => prev.map(r => r.map(node => ({
            ...node,
            isEnd: node.row === row && node.col === col,
            isWall: (node.row === row && node.col === col) ? false : node.isWall,
            isWeight: (node.row === row && node.col === col) ? false : node.isWeight,
        }))))
    }, [])

    // ── Animation setters ────────────────────────────────────────

    const animateVisited = useCallback((row, col) => {
        setGrid(g => {
            const next = g.map(r => [...r])
            next[row][col] = { ...next[row][col], isVisited: true }
            return next
        })
    }, [])

    const animatePath = useCallback((row, col) => {
        setGrid(g => {
            const next = g.map(r => [...r])
            next[row][col] = { ...next[row][col], isPath: true }
            return next
        })
    }, [])

    return {
        grid,
        startPos,
        endPos,
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
    }
}