// HashBreaker.jsx
// Real SHA-256 via Web Crypto API.
// Player finds the nonce that makes the hash start with the target prefix.
// That's literally how blockchain proof-of-work works.

import { useState, useEffect, useRef, useCallback } from 'react'
import { sounds } from '../../utils/useSound.js'

const DIFFICULTIES = [
  { id: 'easy',   label: 'EASY',   target: '0',   desc: 'Starts with 0'   },
  { id: 'medium', label: 'MEDIUM', target: '00',  desc: 'Starts with 00'  },
  { id: 'hard',   label: 'HARD',   target: '000', desc: 'Starts with 000' },
]

// SHA-256 via browser's native Web Crypto — no library needed
async function sha256(str) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(str)
  )
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Randomly mutate a few characters in the hash for the scramble animation
function scramble(hash) {
  const chars = '0123456789abcdef'
  return hash.split('').map(c =>
    Math.random() < 0.18
      ? chars[Math.floor(Math.random() * chars.length)]
      : c
  ).join('')
}

let blockSeq = 1

function makeBlock(prevHash = '0000000000000000000000000000000000000000000000000000000000000000') {
  return {
    id:       blockSeq++,
    prevHash,
    data:     `TX:${Math.floor(Math.random() * 9999).toString().padStart(4, '0')} AMT:${Math.floor(Math.random() * 999)}`,
    nonce:    0,
    hash:     '',
    locked:   false,
    minedAt:  null,
  }
}

// Highlight the target prefix in the hash display
function HashDisplay({ hash, target, scrambling }) {
  if (!hash) return (
    <span style={{ color: 'var(--text-muted)' }}>—</span>
  )

  const prefix = hash.slice(0, target.length)
  const rest   = hash.slice(target.length)
  const match  = prefix === target

  return (
    <span>
      <span style={{
        color:      match ? '#34d399' : '#f43f5e',
        fontWeight: 700,
        textShadow: match ? '0 0 8px rgba(52,211,153,0.5)' : 'none',
      }}>
        {prefix}
      </span>
      <span style={{ color: scrambling ? 'var(--accent-dim)' : 'var(--text-dim)' }}>
        {rest}
      </span>
    </span>
  )
}

export default function HashBreaker() {
  const [diff,       setDiff]       = useState(0)
  const [chain,      setChain]      = useState([makeBlock()])
  const [activeIdx,  setActiveIdx]  = useState(0)
  const [display,    setDisplay]    = useState('')
  const [mining,     setMining]     = useState(false)
  const [attempts,   setAttempts]   = useState(0)
  const [rate,       setRate]       = useState(0)

  const mineRef    = useRef(false)
  const scrambleId = useRef(null)
  const rateRef    = useRef({ count: 0, last: Date.now() })

  const target = DIFFICULTIES[diff].target
  const block  = chain[activeIdx]

  // Recompute hash when nonce or data changes
  useEffect(() => {
    if (!block || block.locked) return
    sha256(`${block.id}${block.prevHash}${block.data}${block.nonce}`)
      .then(h => {
        setChain(c => c.map((b, i) => i === activeIdx ? { ...b, hash: h } : b))
        setDisplay(h)
      })
  }, [block?.nonce, block?.data, activeIdx])

  // Scramble animation while mining
  useEffect(() => {
    if (!mining) {
      clearInterval(scrambleId.current)
      return
    }
    scrambleId.current = setInterval(() => {
      setDisplay(d => scramble(d))
    }, 55)
    return () => clearInterval(scrambleId.current)
  }, [mining])

  // Hash rate counter — updates every second
  useEffect(() => {
    const id = setInterval(() => {
      const now     = Date.now()
      const elapsed = (now - rateRef.current.last) / 1000
      const r       = Math.round(rateRef.current.count / elapsed)
      setRate(r)
      rateRef.current = { count: 0, last: now }
    }, 1000)
    return () => clearInterval(id)
  }, [])

  function stopMining() {
    mineRef.current = false
    setMining(false)
    clearInterval(scrambleId.current)
  }

  const handleLock = useCallback((nonce, hash) => {
    stopMining()
    setChain(c => c.map((b, i) =>
      i === activeIdx
        ? { ...b, nonce, hash, locked: true, minedAt: new Date().toISOString() }
        : b
    ))
    setDisplay(hash)
    sounds.success()
  }, [activeIdx])

  // Manual: increment nonce once
  async function mineOnce() {
    if (block?.locked) return
    const newNonce = block.nonce + 1
    setChain(c => c.map((b, i) => i === activeIdx ? { ...b, nonce: newNonce } : b))
    setAttempts(a => a + 1)
    rateRef.current.count++
    const h = await sha256(`${block.id}${block.prevHash}${block.data}${newNonce}`)
    if (h.startsWith(target)) handleLock(newNonce, h)
  }

  // Auto: hammer the nonce as fast as the browser allows
  async function autoMine() {
    if (block?.locked || mining) return
    setMining(true)
    mineRef.current = true
    let nonce = block.nonce

    const tick = async () => {
      if (!mineRef.current) return
      // Process a batch per frame so UI stays responsive
      for (let i = 0; i < 12; i++) {
        nonce++
        rateRef.current.count++
        const h = await sha256(`${block.id}${block.prevHash}${block.data}${nonce}`)
        setAttempts(a => a + 1)
        if (h.startsWith(target)) {
          setChain(c => c.map((b, ii) => ii === activeIdx ? { ...b, nonce } : b))
          handleLock(nonce, h)
          return
        }
      }
      setChain(c => c.map((b, i) => i === activeIdx ? { ...b, nonce } : b))
      if (mineRef.current) setTimeout(tick, 0)
    }
    tick()
  }

  function addBlock() {
    if (!block?.locked) return
    const nb = makeBlock(block.hash)
    setChain(c => [...c, nb])
    setActiveIdx(chain.length)
    setAttempts(0)
    sounds.click()
  }

  function reset() {
    blockSeq = 1
    stopMining()
    setChain([makeBlock()])
    setActiveIdx(0)
    setAttempts(0)
    setDisplay('')
  }

  function switchDiff(idx) {
    stopMining()
    setDiff(idx)
    reset()
  }

  function switchBlock(idx) {
    stopMining()
    setActiveIdx(idx)
    setAttempts(0)
  }

  const isMatch = display.startsWith(target)

  return (
    <div style={{
      display:    'flex',
      height:     '100%',
      overflow:   'hidden',
      background: 'var(--bg)',
      fontFamily: 'var(--font)',
    }}>

      {/* ── Left sidebar ─────────────────────────────────────── */}
      <div style={{
        width:        188,
        flexShrink:   0,
        display:      'flex',
        flexDirection:'column',
        background:   'var(--bg2)',
        borderRight:  '1px solid var(--border)',
        overflowY:    'auto',
      }}>

        {/* Difficulty */}
        <div style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-dim)' }}>
          <p style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: 8 }}>
            // DIFFICULTY
          </p>
          {DIFFICULTIES.map((d, i) => (
            <button
              key={d.id}
              onClick={() => switchDiff(i)}
              style={{
                display:       'flex',
                alignItems:    'center',
                gap:           8,
                width:         '100%',
                padding:       '7px 10px',
                marginBottom:  3,
                border:        '1px solid var(--border)',
                background:    diff === i ? 'var(--accent-bg)' : 'transparent',
                color:         diff === i ? 'var(--accent)' : 'var(--text-muted)',
                fontFamily:    'var(--font)',
                fontSize:      10,
                letterSpacing: '0.14em',
                textAlign:     'left',
                cursor:        'pointer',
              }}
            >
              <span style={{
                width:      6, height: 6,
                background: diff === i ? 'var(--accent)' : 'transparent',
                border:     '1px solid var(--border)',
                flexShrink: 0,
              }} />
              <div>
                <div>{d.label}</div>
                <div style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 1 }}>{d.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Mining controls */}
        <div style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-dim)' }}>
          <p style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: 8 }}>
            // CONTROLS
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

            {!block?.locked && !mining && (
              <button onClick={mineOnce} style={btnStyle('var(--bg3)', 'var(--text-dim)')}>
                ⛏ MINE ONCE
              </button>
            )}

            {!block?.locked && !mining && (
              <button onClick={autoMine} style={btnStyle('var(--accent-bg)', 'var(--accent)')}>
                ▶▶ AUTO MINE
              </button>
            )}

            {mining && (
              <button onClick={stopMining} style={btnStyle('rgba(244,63,94,0.1)', '#f43f5e')}>
                ■ STOP
              </button>
            )}

            {block?.locked && (
              <button onClick={addBlock} style={btnStyle('rgba(52,211,153,0.08)', '#34d399')}>
                + NEW BLOCK
              </button>
            )}

            <button onClick={reset} style={btnStyle('transparent', 'var(--text-muted)')}>
              ⟳ RESET CHAIN
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-dim)' }}>
          <p style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: 8 }}>
            // STATS
          </p>
          {[
            ['ATTEMPTS',    attempts.toLocaleString()],
            ['HASH/SEC',    mining ? rate.toLocaleString() : '—'],
            ['CHAIN LEN',   chain.length],
            ['MINED',       chain.filter(b => b.locked).length],
          ].map(([label, val]) => (
            <div key={label} style={{
              display:       'flex',
              justifyContent:'space-between',
              padding:       '5px 0',
              borderBottom:  '1px solid var(--border-dim)',
              fontSize:      10,
            }}>
              <span style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{label}</span>
              <span style={{ color: 'var(--accent)', letterSpacing: '0.08em', fontWeight: 700 }}>{val}</span>
            </div>
          ))}
        </div>

        {/* How to play */}
        <div style={{ padding: '14px 12px' }}>
          <p style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: 8 }}>
            // HOW TO PLAY
          </p>
          {[
            ['01', 'Edit the DATA field'],
            ['02', 'Click MINE ONCE or AUTO MINE'],
            ['03', 'Find a hash that starts with the target prefix'],
            ['04', 'Block locks — add the next one to the chain'],
          ].map(([n, t]) => (
            <div key={n} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
              <span style={{ fontSize: 8, color: 'var(--accent)', letterSpacing: '0.1em', flexShrink: 0 }}>
                [{n}]
              </span>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: 1.55, letterSpacing: '0.06em' }}>
                {t}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main area ─────────────────────────────────────────── */}
      <div style={{
        flex:      1,
        display:   'flex',
        flexDirection: 'column',
        overflow:  'hidden',
        padding:   20,
        gap:       12,
      }}>

        {/* Chain navigator */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        6,
          padding:    '10px 14px',
          border:     '1px solid var(--border)',
          background: 'var(--bg2)',
          overflowX:  'auto',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.16em', flexShrink: 0 }}>
            CHAIN:
          </span>
          {chain.map((b, i) => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => switchBlock(i)}
                style={{
                  padding:       '4px 10px',
                  border:        `1px solid ${i === activeIdx ? 'var(--accent)' : 'var(--border)'}`,
                  background:    i === activeIdx ? 'var(--accent-bg)' : 'transparent',
                  color:         i === activeIdx ? 'var(--accent)' : 'var(--text-muted)',
                  fontFamily:    'var(--font)',
                  fontSize:      9,
                  letterSpacing: '0.12em',
                  cursor:        'pointer',
                  flexShrink:    0,
                }}
              >
                {b.locked ? '🔒' : '⛏'} BLOCK #{b.id}
              </button>
              {i < chain.length - 1 && (
                <span style={{ color: 'var(--border)', fontSize: 12 }}>→</span>
              )}
            </div>
          ))}
        </div>

        {/* Block editor */}
        <div style={{
          flex:       1,
          border:     `1px solid ${block?.locked ? 'rgba(52,211,153,0.3)' : 'var(--border)'}`,
          background: 'var(--bg2)',
          overflow:   'auto',
          padding:    20,
          display:    'flex',
          flexDirection: 'column',
          gap:        14,
        }}>

          {/* Block header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.16em' }}>
              BLOCK #{block?.id}
            </span>
            <span style={{
              fontSize:      9,
              letterSpacing: '0.16em',
              padding:       '3px 10px',
              border:        `1px solid ${block?.locked ? 'rgba(52,211,153,0.4)' : 'var(--border)'}`,
              color:         block?.locked ? '#34d399' : 'var(--text-muted)',
            }}>
              {block?.locked ? '🔒 LOCKED' : '⛏ OPEN'}
            </span>
          </div>

          <div style={{ height: 1, background: 'var(--border-dim)' }} />

          {/* Fields */}
          {[
            { label: 'BLOCK NUMBER', val: `#${block?.id}`,                  mono: true  },
            { label: 'PREV HASH',    val: block?.prevHash?.slice(0, 32) + '…', mono: true },
          ].map(({ label, val }) => (
            <div key={label}>
              <p style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--text-muted)', marginBottom: 5 }}>
                {label}
              </p>
              <div style={{
                padding:    '8px 12px',
                border:     '1px solid var(--border-dim)',
                background: 'var(--bg)',
                fontSize:   11,
                color:      'var(--text-dim)',
                letterSpacing: '0.04em',
                wordBreak:  'break-all',
              }}>
                {val}
              </div>
            </div>
          ))}

          {/* Editable data */}
          <div>
            <p style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--text-muted)', marginBottom: 5 }}>
              DATA
            </p>
            <textarea
              rows={2}
              readOnly={block?.locked}
              value={block?.data ?? ''}
              onChange={e => setChain(c => c.map((b, i) =>
                i === activeIdx ? { ...b, data: e.target.value } : b
              ))}
              style={{
                width:          '100%',
                padding:        '8px 12px',
                border:         '1px solid var(--border-dim)',
                background:     'var(--bg)',
                color:          'var(--text)',
                fontFamily:     'var(--font)',
                fontSize:       11,
                letterSpacing:  '0.04em',
                resize:         'none',
                outline:        'none',
              }}
            />
          </div>

          {/* Nonce */}
          <div>
            <p style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--text-muted)', marginBottom: 5 }}>
              NONCE
            </p>
            <div style={{
              padding:    '10px 12px',
              border:     '1px solid var(--border-dim)',
              background: 'var(--bg)',
              fontSize:   18,
              fontWeight: 700,
              color:      'var(--accent)',
              letterSpacing: '0.06em',
            }}>
              {block?.nonce?.toLocaleString()}
            </div>
          </div>

          {/* Hash output */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <p style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--text-muted)' }}>
                SHA-256 OUTPUT
              </p>
              <p style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--text-muted)' }}>
                TARGET: <span style={{ color: 'var(--accent)' }}>"{target}..."</span>
              </p>
            </div>
            <div style={{
              padding:       '10px 12px',
              border:        `1px solid ${
                block?.locked ? 'rgba(52,211,153,0.35)' :
                isMatch       ? 'rgba(52,211,153,0.25)' :
                                'var(--border-dim)'
              }`,
              background:    block?.locked ? 'rgba(52,211,153,0.05)' : 'var(--bg)',
              fontSize:      11,
              letterSpacing: '0.05em',
              wordBreak:     'break-all',
              lineHeight:    1.7,
              minHeight:     48,
            }}>
              <HashDisplay hash={display} target={target} scrambling={mining} />
            </div>
            {!block?.locked && (
              <p style={{
                fontSize:      9,
                marginTop:     5,
                letterSpacing: '0.1em',
                color:         isMatch ? '#34d399' : 'var(--text-muted)',
              }}>
                {isMatch
                  ? '✓ HASH MATCHES TARGET — BLOCK READY TO LOCK'
                  : `NEED HASH STARTING WITH "${target}"`}
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

// Small helper so buttons don't repeat inline styles
function btnStyle(bg, color) {
  return {
    width:         '100%',
    padding:       '8px 0',
    border:        '1px solid var(--border)',
    background:    bg,
    color:         color,
    fontFamily:    'var(--font)',
    fontSize:      10,
    letterSpacing: '0.16em',
    cursor:        'pointer',
    marginBottom:  3,
  }
}