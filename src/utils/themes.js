// themes.js
// Every theme is a set of CSS variable values.
// The ThemeProvider applies these to document.documentElement.
// Every component reads var(--accent), var(--bg) etc — they never hardcode colors.

export const THEMES = {
  claude_midnight: {
    id:    'claude_midnight',
    label: 'CLAUDE MIDNIGHT',
    // backgrounds
    '--bg':           '#0f0d0b',
    '--bg2':          '#1a1714',
    '--bg3':          '#241f1a',
    // borders
    '--border':       'rgba(232,132,90,0.18)',
    '--border-dim':   'rgba(232,132,90,0.08)',
    // accent — Claude coral
    '--accent':       '#e8845a',
    '--accent-dim':   'rgba(232,132,90,0.45)',
    '--accent-bg':    'rgba(232,132,90,0.08)',
    // secondary — Slate ink
    '--accent2':      '#94a3b8',
    '--accent2-dim':  'rgba(148,163,184,0.45)',
    // text
    '--text':         '#f0e8de',
    '--text-dim':     'rgba(240,232,222,0.5)',
    '--text-muted':   'rgba(240,232,222,0.25)',
    // glow
    '--glow':         'rgba(232,132,90,0.28)',
    '--glow-strong':  'rgba(232,132,90,0.5)',
    // font
    '--font':         "'Space Mono', monospace",
    '--font-display': "'Space Mono', monospace",
  },

  crt_amber: {
    id:    'crt_amber',
    label: 'CRT AMBER',
    '--bg':           '#050505',
    '--bg2':          '#0d0b08',
    '--bg3':          '#141208',
    '--border':       'rgba(255,176,0,0.28)',
    '--border-dim':   'rgba(255,176,0,0.1)',
    '--accent':       '#FFB000',
    '--accent-dim':   'rgba(255,176,0,0.5)',
    '--accent-bg':    'rgba(255,176,0,0.08)',
    '--accent2':      '#FFB000',
    '--accent2-dim':  'rgba(255,176,0,0.4)',
    '--text':         '#FFB000',
    '--text-dim':     'rgba(255,176,0,0.55)',
    '--text-muted':   'rgba(255,176,0,0.25)',
    '--glow':         'rgba(255,176,0,0.35)',
    '--glow-strong':  'rgba(255,176,0,0.6)',
    '--font':         "'Share Tech Mono', monospace",
    '--font-display': "'VT323', monospace",
  },

  void_purple: {
    id:    'void_purple',
    label: 'VOID PURPLE',
    '--bg':           '#0b0612',
    '--bg2':          '#130d1e',
    '--bg3':          '#1c1228',
    '--border':       'rgba(167,139,250,0.15)',
    '--border-dim':   'rgba(167,139,250,0.07)',
    '--accent':       '#a78bfa',
    '--accent-dim':   'rgba(167,139,250,0.5)',
    '--accent-bg':    'rgba(167,139,250,0.08)',
    '--accent2':      '#c084fc',
    '--accent2-dim':  'rgba(192,132,252,0.45)',
    '--text':         '#e8e0f8',
    '--text-dim':     'rgba(232,224,248,0.5)',
    '--text-muted':   'rgba(232,224,248,0.22)',
    '--glow':         'rgba(167,139,250,0.28)',
    '--glow-strong':  'rgba(167,139,250,0.5)',
    '--font':         "'Space Mono', monospace",
    '--font-display': "'Space Mono', monospace",
  },

  deep_ocean: {
    id:    'deep_ocean',
    label: 'DEEP OCEAN',
    '--bg':           '#040e18',
    '--bg2':          '#091a28',
    '--bg3':          '#0f2234',
    '--border':       'rgba(34,211,238,0.15)',
    '--border-dim':   'rgba(34,211,238,0.07)',
    '--accent':       '#22d3ee',
    '--accent-dim':   'rgba(34,211,238,0.5)',
    '--accent-bg':    'rgba(34,211,238,0.07)',
    '--accent2':      '#38bdf8',
    '--accent2-dim':  'rgba(56,189,248,0.45)',
    '--text':         '#d8f4f8',
    '--text-dim':     'rgba(216,244,248,0.5)',
    '--text-muted':   'rgba(216,244,248,0.22)',
    '--glow':         'rgba(34,211,238,0.28)',
    '--glow-strong':  'rgba(34,211,238,0.5)',
    '--font':         "'Space Mono', monospace",
    '--font-display': "'Space Mono', monospace",
  },

  phosphor: {
    id:    'phosphor',
    label: 'PHOSPHOR',
    '--bg':           '#040d08',
    '--bg2':          '#081408',
    '--bg3':          '#0d1c0d',
    '--border':       'rgba(57,255,107,0.15)',
    '--border-dim':   'rgba(57,255,107,0.07)',
    '--accent':       '#39ff6b',
    '--accent-dim':   'rgba(57,255,107,0.5)',
    '--accent-bg':    'rgba(57,255,107,0.07)',
    '--accent2':      '#00e5a0',
    '--accent2-dim':  'rgba(0,229,160,0.45)',
    '--text':         '#d4f0dd',
    '--text-dim':     'rgba(212,240,221,0.5)',
    '--text-muted':   'rgba(212,240,221,0.22)',
    '--glow':         'rgba(57,255,107,0.28)',
    '--glow-strong':  'rgba(57,255,107,0.5)',
    '--font':         "'Share Tech Mono', monospace",
    '--font-display': "'VT323', monospace",
  },
}

export const DEFAULT_THEME = 'claude_midnight'