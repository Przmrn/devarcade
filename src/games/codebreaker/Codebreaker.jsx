// Codebreaker.jsx
// Mastermind clone. 4-peg secret code, 10 attempts.
// Black peg = right color right position.
// White peg = right color wrong position.
// The peg algorithm handles duplicate colors correctly.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sounds } from "../../utils/useSound.js";

const COLORS = [
  { id: "red", hex: "#ef4444", label: "RED" },
  { id: "blue", hex: "#3b82f6", label: "BLU" },
  { id: "green", hex: "#22c55e", label: "GRN" },
  { id: "yellow", hex: "#eab308", label: "YLW" },
  { id: "purple", hex: "#a855f7", label: "PRP" },
  { id: "orange", hex: "#f97316", label: "ORG" },
];

const CODE_LEN = 4;
const MAX_TURNS = 10;

function hexOf(id) {
  return COLORS.find((c) => c.id === id)?.hex ?? "transparent";
}

function randCode() {
  return Array.from(
    { length: CODE_LEN },
    () => COLORS[Math.floor(Math.random() * COLORS.length)].id,
  );
}

// Core Mastermind algorithm.
// Counts blacks first (exact matches), then whites (color present but wrong position).
// Handles duplicates by tracking remaining counts carefully.
function calcPegs(guess, secret) {
  let black = 0;
  const sCnt = {};
  const gCnt = {};

  for (let i = 0; i < CODE_LEN; i++) {
    if (guess[i] === secret[i]) {
      black++;
    } else {
      sCnt[secret[i]] = (sCnt[secret[i]] || 0) + 1;
      gCnt[guess[i]] = (gCnt[guess[i]] || 0) + 1;
    }
  }

  let white = 0;
  for (const c in gCnt) white += Math.min(gCnt[c], sCnt[c] || 0);

  return { black, white };
}

// One row of the board — past guess or current input
function BoardRow({ guess, pegs, rowNum, isCurrent, onSlotClick }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "7px 14px",
        borderBottom: "1px solid var(--border-dim)",
        background: isCurrent ? "var(--accent-bg)" : "transparent",
      }}
    >
      {/* Row number */}
      <span
        style={{
          width: 20,
          fontSize: 9,
          color: isCurrent ? "var(--accent)" : "var(--text-muted)",
          letterSpacing: "0.1em",
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {String(rowNum).padStart(2, "0")}
      </span>

      {/* Guess slots */}
      <div style={{ display: "flex", gap: 6 }}>
        {Array.from({ length: CODE_LEN }, (_, i) => {
          const color = guess[i] ? hexOf(guess[i]) : "transparent";
          return (
            <div
              key={i}
              onClick={() => onSlotClick?.(i)}
              style={{
                width: 28,
                height: 28,
                background: color,
                border: `1px solid ${guess[i] ? "rgba(0,0,0,0.2)" : "var(--border)"}`,
                cursor: isCurrent && guess[i] ? "pointer" : "default",
                boxShadow: guess[i] ? `0 0 6px ${color}55` : "none",
                flexShrink: 0,
              }}
            />
          );
        })}
      </div>

      {/* Feedback pegs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 3,
          marginLeft: 6,
        }}
      >
        {Array.from({ length: CODE_LEN }, (_, k) => {
          const isBlack = pegs && k < pegs.black;
          const isWhite =
            pegs && k >= pegs.black && k < pegs.black + pegs.white;
          return (
            <motion.div
              key={k}
              initial={pegs ? { scale: 0 } : false}
              animate={pegs ? { scale: 1 } : false}
              transition={{ delay: k * 0.07, type: "spring", stiffness: 300 }}
              style={{
                width: 9,
                height: 9,
                background: isBlack
                  ? "#1e293b"
                  : isWhite
                    ? "#f8fafc"
                    : "transparent",
                border: isBlack
                  ? "1px solid #0f172a"
                  : isWhite
                    ? "1px solid #cbd5e1"
                    : "1px solid var(--border)",
              }}
            />
          );
        })}
      </div>

      {/* Peg count label */}
      {pegs && (
        <span
          style={{
            fontSize: 9,
            color: "var(--text-muted)",
            letterSpacing: "0.08em",
            marginLeft: 4,
            flexShrink: 0,
          }}
        >
          {pegs.black}B {pegs.white}W
        </span>
      )}
    </div>
  );
}

export default function Codebreaker() {
  const [secret, setSecret] = useState(randCode);
  const [rows, setRows] = useState([]);
  const [current, setCurrent] = useState([]);
  const [phase, setPhase] = useState("playing"); // playing | won | lost

  const turnsLeft = MAX_TURNS - rows.length;

  function pickColor(colorId) {
    if (phase !== "playing" || current.length >= CODE_LEN) return;
    sounds.click();
    setCurrent((c) => [...c, colorId]);
  }

  function removeSlot(i) {
    if (phase !== "playing") return;
    sounds.click();
    setCurrent((c) => c.filter((_, j) => j !== i));
  }

  function removeLast() {
    if (phase !== "playing") return;
    sounds.click();
    setCurrent((c) => c.slice(0, -1));
  }

  function submitGuess() {
    if (current.length !== CODE_LEN || phase !== "playing") return;
    sounds.click();
    const pegs = calcPegs(current, secret);
    const newRows = [...rows, { guess: [...current], pegs }];
    setRows(newRows);
    setCurrent([]);

    if (pegs.black === CODE_LEN) {
      setPhase("won");
      sounds.success();
      return;
    }
    if (newRows.length >= MAX_TURNS) {
      setPhase("lost");
      sounds.error();
    }
  }

  function reset() {
    setSecret(randCode());
    setRows([]);
    setCurrent([]);
    setPhase("playing");
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        overflow: "hidden",
        background: "var(--bg)",
        fontFamily: "var(--font)",
      }}
    >
      {/* ── Board ─────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Board header */}
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg2)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 10,
              letterSpacing: "0.2em",
              color: "var(--text-muted)",
            }}
          >
            // GUESS BOARD
          </span>
          <div style={{ display: "flex", gap: 16 }}>
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.14em",
                color: "var(--text-muted)",
              }}
            >
              TURN:{" "}
              <span style={{ color: "var(--accent)" }}>{rows.length + 1}</span>
              /10
            </span>
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.14em",
                color: "var(--text-muted)",
              }}
            >
              LEFT:{" "}
              <span
                style={{ color: turnsLeft <= 3 ? "#f43f5e" : "var(--accent)" }}
              >
                {turnsLeft}
              </span>
            </span>
          </div>
        </div>

        {/* Past rows + current row */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {rows.map((r, i) => (
            <BoardRow
              key={i}
              rowNum={i + 1}
              guess={r.guess}
              pegs={r.pegs}
              isCurrent={false}
            />
          ))}

          {phase === "playing" && (
            <BoardRow
              rowNum={rows.length + 1}
              guess={current}
              pegs={null}
              isCurrent={true}
              onSlotClick={removeSlot}
            />
          )}

          {/* Empty future rows */}
          {phase === "playing" &&
            Array.from({ length: MAX_TURNS - rows.length - 1 }, (_, i) => (
              <BoardRow
                key={`empty-${i}`}
                rowNum={rows.length + i + 2}
                guess={[]}
                pegs={null}
                isCurrent={false}
              />
            ))}
        </div>

        {/* Submit bar */}
        {/* Submit bar */}
        {phase === "playing" && (
          <div
            style={{
              padding: "14px 16px",
              borderTop: "1px solid var(--border)",
              background: "var(--bg2)",
              flexShrink: 0,
            }}
          >
            {/* Progress dots — shows how many pegs are filled */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              {Array.from({ length: CODE_LEN }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: 10,
                    height: 10,
                    background:
                      i < current.length ? "var(--accent)" : "transparent",
                    border: "1px solid var(--border)",
                  }}
                />
              ))}
            </div>

            {/* Two buttons stacked — DEL above, SUBMIT below */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button
                onClick={removeLast}
                disabled={current.length === 0}
                style={{
                  width: "100%",
                  padding: "9px 0",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font)",
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  cursor: current.length === 0 ? "not-allowed" : "pointer",
                  opacity: current.length === 0 ? 0.25 : 1,
                }}
              >
                ← REMOVE LAST
              </button>

              <button
                onClick={submitGuess}
                disabled={current.length !== CODE_LEN}
                style={{
                  width: "100%",
                  padding: "13px 0",
                  border: `1px solid ${current.length === CODE_LEN ? "var(--accent)" : "var(--border)"}`,
                  background:
                    current.length === CODE_LEN
                      ? "var(--accent-bg)"
                      : "transparent",
                  color:
                    current.length === CODE_LEN
                      ? "var(--accent)"
                      : "var(--text-muted)",
                  fontFamily: "var(--font)",
                  fontSize: 12,
                  letterSpacing: "0.2em",
                  fontWeight: 700,
                  cursor:
                    current.length !== CODE_LEN ? "not-allowed" : "pointer",
                  opacity: current.length !== CODE_LEN ? 0.3 : 1,
                  textShadow:
                    current.length === CODE_LEN
                      ? "0 0 10px var(--glow)"
                      : "none",
                }}
              >
                ▶ SUBMIT GUESS
              </button>
            </div>
          </div>
        )}

        {/* Result banner */}
        <AnimatePresence>
          {phase !== "playing" && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: "16px 20px",
                borderTop: "1px solid var(--border)",
                background: "var(--bg2)",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: phase === "won" ? "#34d399" : "#f43f5e",
                  marginBottom: 8,
                }}
              >
                {phase === "won" ? "✓ CODE CRACKED" : "✕ CODE UNKNOWN"}
              </p>

              {phase === "won" && (
                <p
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    letterSpacing: "0.14em",
                    marginBottom: 12,
                  }}
                >
                  SOLVED IN {rows.length} TURN{rows.length === 1 ? "" : "S"}
                </p>
              )}

              {phase === "lost" && (
                <div style={{ marginBottom: 12 }}>
                  <p
                    style={{
                      fontSize: 9,
                      color: "var(--text-muted)",
                      letterSpacing: "0.14em",
                      marginBottom: 8,
                    }}
                  >
                    THE CODE WAS:
                  </p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    {secret.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          width: 28,
                          height: 28,
                          background: hexOf(c),
                          boxShadow: `0 0 6px ${hexOf(c)}55`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={reset}
                style={{
                  ...btnStyle,
                  padding: "8px 24px",
                  width: "auto",
                  display: "inline-block",
                  background: "var(--accent-bg)",
                  color: "var(--accent)",
                }}
              >
                ⟳ NEW GAME
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Right panel: color palette + instructions ─────────── */}
      <div
        style={{
          width: 220,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          background: "var(--bg2)",
          overflowY: "auto",
        }}
      >
        {/* Color palette */}
        <div
          style={{
            padding: "14px 12px",
            borderBottom: "1px solid var(--border-dim)",
          }}
        >
          <p
            style={{
              fontSize: 9,
              letterSpacing: "0.2em",
              color: "var(--text-muted)",
              marginBottom: 10,
            }}
          >
            // COLOR PALETTE
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 6,
            }}
          >
            {COLORS.map((c) => {
              const count = current.filter((id) => id === c.id).length;
              const disabled =
                phase !== "playing" || current.length >= CODE_LEN;

              return (
                <motion.button
                  key={c.id}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => pickColor(c.id)}
                  disabled={disabled}
                  style={{
                    padding: "10px 0",
                    background: c.hex,
                    border: "1px solid rgba(0,0,0,0.2)",
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.4 : 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: "rgba(0,0,0,0.6)",
                      fontFamily: "var(--font)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {c.label}
                  </span>
                  {count > 0 && (
                    <span
                      style={{
                        fontSize: 8,
                        color: "rgba(0,0,0,0.5)",
                        fontFamily: "var(--font)",
                      }}
                    >
                      ×{count}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Current guess preview */}
        <div
          style={{
            padding: "14px 12px",
            borderBottom: "1px solid var(--border-dim)",
          }}
        >
          <p
            style={{
              fontSize: 9,
              letterSpacing: "0.2em",
              color: "var(--text-muted)",
              marginBottom: 10,
            }}
          >
            // CURRENT GUESS [{current.length}/{CODE_LEN}]
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            {Array.from({ length: CODE_LEN }, (_, i) => (
              <div
                key={i}
                onClick={() => removeSlot(i)}
                style={{
                  width: 36,
                  height: 36,
                  background: current[i] ? hexOf(current[i]) : "transparent",
                  border: `1px solid ${current[i] ? "rgba(0,0,0,0.2)" : "var(--border)"}`,
                  cursor: current[i] ? "pointer" : "default",
                  boxShadow: current[i]
                    ? `0 0 6px ${hexOf(current[i])}55`
                    : "none",
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
          <p
            style={{
              fontSize: 8,
              color: "var(--text-muted)",
              marginTop: 6,
              letterSpacing: "0.1em",
            }}
          >
            CLICK A SLOT TO REMOVE
          </p>
        </div>

        {/* How to play */}
        <div style={{ padding: "14px 12px" }}>
          <p
            style={{
              fontSize: 9,
              letterSpacing: "0.2em",
              color: "var(--text-muted)",
              marginBottom: 10,
            }}
          >
            // HOW TO PLAY
          </p>
          {[
            ["PICK", "Select 4 colors from the palette"],
            ["SUBMIT", "Submit your guess"],
            ["B PEG", "Right color, right position"],
            ["W PEG", "Right color, wrong position"],
            ["GOAL", "Crack the code in 10 turns"],
          ].map(([cmd, desc]) => (
            <div
              key={cmd}
              style={{ display: "flex", gap: 10, marginBottom: 8 }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "var(--accent)",
                  letterSpacing: "0.1em",
                  flexShrink: 0,
                  width: 38,
                }}
              >
                {cmd}
              </span>
              <span
                style={{
                  fontSize: 9,
                  color: "var(--text-muted)",
                  lineHeight: 1.55,
                  letterSpacing: "0.06em",
                }}
              >
                {desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Shared button base style
const btnStyle = {
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--text-dim)",
  fontFamily: "var(--font)",
  fontSize: 10,
  letterSpacing: "0.16em",
  cursor: "pointer",
  padding: "7px 0",
  width: "100%",
};
