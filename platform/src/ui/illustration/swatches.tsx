// Material illustrations generated from the survey record. Never a photograph. The same public ID always
// draws the same picture: a hash of the ID seeds every variation. Drawn on a 480 by 360 board and sliced to
// fill any frame. Two kinds of picture only: a swatch (the material close up at a stated scale, flat even
// light, with a scale bar) and a technical drawing (steel, curtain wall and raised floor). No gradients,
// vignettes, blur, glare or drop shadows.
// Coordinates here are drawing only (P2 allows it inside SVG components).
import type { ReactNode } from 'react'
import type { Spec } from '../../domain/types'
import { between, pick, type Rng } from './rng'
import { BOARD, SAFE, TEXT_SIZE, type DrawingView } from './helpers'
import { INK, PAPER, PanelAxo, PanelElevation, SectionAxo, SectionCard } from './drawings'

const W = BOARD.width
const H = BOARD.height
const FONT = 'Inter Variable, Inter, ui-sans-serif, sans-serif'

/** The illustration for one family, drawn on the shared board. */
/**
 * `plain` draws the technical drawings (steel, curtain wall, raised floor) on white with no grid; swatches are
 * unchanged. `axo` keeps a steel member in axonometric at card size, for the material page's thumbnails.
 */
export function MaterialArt({ spec, r, uid, view = 'card', plain = false, axo = false }: { spec: Spec; r: Rng; uid: string; view?: 'card' | 'detail'; plain?: boolean; axo?: boolean }) {
  switch (spec.family) {
    case 'clay_brick':
      return <Brick r={r} uid={uid} view={view} stock={/stock/i.test(spec.brickType)} lime={/lime/i.test(spec.mortar)} />
    case 'stone_cladding':
      return <Stone r={r} uid={uid} view={view} />
    case 'curtain_wall':
      return <PanelElevation widthM={spec.panelWidthM} heightM={spec.panelHeightM} system={spec.system} seed={r()} view={view} plain={plain} />
    case 'precast_cladding':
      return <Precast r={r} uid={uid} view={view} />
    case 'raised_floor':
      return <PanelAxo sizeMm={panelSize(spec.panelSize)} view={view} plain={plain} />
    case 'timber_joist':
      return <Timber r={r} uid={uid} view={view} />
    case 'natural_slate':
      return <Slate r={r} uid={uid} view={view} />
    case 'stone_paving':
      return <Paving r={r} uid={uid} view={view} />
    case 'carpet_tile':
      return <CarpetTiles r={r} uid={uid} view={view} />
    case 'metal_ceiling_tile':
      return <PanelAxo sizeMm={panelSize(spec.sizeMm)} view={view} plain={plain} />
    case 'glulam_beam':
      return <Glulam r={r} uid={uid} view={view} />
    case 'hollowcore_plank':
      return <Hollowcore r={r} uid={uid} view={view} />
    case 'steel_section':
      // A card shows the cut end at one shared scale, so a page of steel reads member by member; the material page keeps
      // the axonometric, on its stage and on the thumbnails that preview the stage (axo).
      return view === 'card' && !axo ? <SectionCard designation={spec.designation} lengthM={spec.lengthM} uid={uid} /> : <SectionAxo designation={spec.designation} lengthM={spec.lengthM} uid={uid} view={view} plain={plain} />
  }
}

/** "600 by 600" as millimetres; the standard panel when the text does not say. */
function panelSize(text: string): [number, number] {
  const m = /(\d+)\s*by\s*(\d+)/.exec(text)
  return m ? [Number(m[1]), Number(m[2])] : [600, 600]
}

/** A fine grain over a swatch, at most 0.05. Flat light: no gradient and no vignette. */
export function Finish({ uid, grain = 0.05 }: { uid: string; grain?: number }) {
  return (
    <>
      <defs>
        <filter id={`${uid}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.1  0 0 0 0 0.09  0 0 0 0 0.08  0 0 0 1.4 -0.45" />
        </filter>
      </defs>
      <rect width={W} height={H} filter={`url(#${uid}-grain)`} opacity={Math.min(grain, 0.05)} />
    </>
  )
}

/**
 * A scale bar, bottom right inside the frame's safe area (clear of the fit chip on the left): a 2 px ink bar on a
 * paper chip with its length in words. `px` is the drawn length of the stated distance on this board.
 */
export function ScaleBar({ px, label, view = 'card' }: { px: number; label: string; view?: DrawingView }) {
  const size = TEXT_SIZE[view]
  const textW = label.length * size * 0.58
  const right = SAFE.right
  const y = SAFE.bottom - 10
  const x = right - textW - 8 - px
  return (
    <g data-part="scale-bar">
      <rect x={x - 8} y={y - size - 2} width={px + textW + 24} height={size + 12} rx="3" fill={PAPER} opacity="0.94" />
      <rect x={x} y={y - size / 2 - 1} width={px} height="2" fill={INK} />
      <rect x={x} y={y - size / 2 - 5} width="1.25" height="10" fill={INK} />
      <rect x={x + px - 1.25} y={y - size / 2 - 5} width="1.25" height="10" fill={INK} />
      <text x={right} y={y} textAnchor="end" fontFamily={FONT} fontSize={size} fontWeight="500" fill={INK}>
        {label}
      </text>
    </g>
  )
}

// Brick: stretcher bond, 215 by 65 faces with 10 mm joints (a 215 mm face is 46 px, so 100 mm is 21.4 px).
// Each brick has its own fire tint and a few specks.
const CLAY = ['#8f4a37', '#9a5541', '#84432f', '#a05c45', '#a8664f', '#8b4a36', '#7a3f2e', '#96513c']
const STOCK = ['#c2ad8a', '#b5a07e', '#cbb995', '#a8916f', '#bba27f', '#b39d7b', '#9c8666', '#c6b28f']

function Brick({ r, uid, stock, lime, view }: { r: Rng; uid: string; stock: boolean; lime: boolean; view: DrawingView }) {
  const tints = stock ? STOCK : CLAY
  const mortar = lime ? '#ddd5c6' : '#bdbab3'
  const joint = 2.2
  const bw = 46
  const bh = 14
  const course = bh + joint
  const shift = between(r, 0, bw)
  const out: ReactNode[] = []
  let row = 0
  for (let y = -between(r, 0, course); y < H; y += course, row++) {
    const offset = (row % 2 === 0 ? 0 : (bw + joint) / 2) - shift
    for (let x = offset - (bw + joint); x < W; x += bw + joint) {
      const k = `${row}-${x.toFixed(1)}`
      const burnt = r() < 0.04
      out.push(<rect key={`b${k}`} x={x} y={y} width={bw} height={bh} rx="0.6" fill={burnt ? (stock ? '#7d6a50' : '#5e2a1f') : pick(r, tints)} />)
      const specks = Math.floor(between(r, 0, stock ? 5 : 3))
      for (let s = 0; s < specks; s++) {
        out.push(<circle key={`p${k}-${s}`} cx={x + between(r, 2, bw - 2)} cy={y + between(r, 2, bh - 2)} r={between(r, 0.4, 1.1)} fill="#1c1917" opacity={between(r, 0.12, 0.3)} />)
      }
    }
  }
  return (
    <>
      <rect width={W} height={H} fill={mortar} />
      {out}
      <Finish uid={uid} />
      <ScaleBar px={21.4} label="100 mm" view={view} />
    </>
  )
}

// Stone: Portland ashlar in courses on a flat ground, each block its own tone, shell flecks and faint veining.
// The board is 2.4 m wide, so 1 m is 200 px.
function Stone({ r, uid, view }: { r: Rng; uid: string; view: DrawingView }) {
  const ground = pick(r, ['#ebe5d6', '#e7e0cf', '#eee9dd'])
  const courseH = pick(r, [118, 124, 132])
  const blocks: ReactNode[] = []
  let row = 0
  for (let y = -between(r, 0, courseH * 0.6); y < H; y += courseH, row++) {
    let x = -between(r, 20, 160)
    while (x < W) {
      const bwid = between(r, 170, 250)
      blocks.push(<rect key={`k${row}-${x.toFixed(0)}`} x={x} y={y} width={bwid} height={courseH} fill={r() < 0.5 ? '#ffffff' : '#a49878'} opacity={between(r, 0.02, 0.12)} />)
      blocks.push(<rect key={`j${row}-${x.toFixed(0)}`} x={x - 1.2} y={y} width="2.4" height={courseH} fill="#cfc5ad" />)
      x += bwid
    }
    blocks.push(<rect key={`c${row}`} x={0} y={y - 1.2} width={W} height="2.4" fill="#cfc5ad" />)
  }
  const flecks: ReactNode[] = []
  for (let i = 0; i < 160; i++) {
    const cx = between(r, 0, W)
    const cy = between(r, 0, H)
    flecks.push(<ellipse key={`f${i}`} cx={cx} cy={cy} rx={between(r, 0.5, 2.6)} ry={between(r, 0.3, 1.1)} fill={r() < 0.8 ? '#9d9277' : '#f8f5ee'} opacity={between(r, 0.08, 0.25)} transform={`rotate(${between(r, 0, 180).toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})`} />)
  }
  const veins: ReactNode[] = []
  for (let i = 0; i < 5; i++) {
    const y0 = between(r, 0, H)
    const d = `M -10 ${y0.toFixed(1)} C ${between(r, 80, 200).toFixed(1)} ${(y0 + between(r, -50, 50)).toFixed(1)}, ${between(r, 260, 400).toFixed(1)} ${(y0 + between(r, -50, 50)).toFixed(1)}, ${W + 10} ${(y0 + between(r, -30, 30)).toFixed(1)}`
    veins.push(<path key={`v${i}`} d={d} fill="none" stroke="#b5aa8d" strokeWidth={between(r, 0.4, 1)} opacity={between(r, 0.15, 0.32)} />)
  }
  return (
    <>
      <rect width={W} height={H} fill={ground} />
      {flecks}
      {veins}
      {blocks}
      <Finish uid={uid} />
      <ScaleBar px={200} label="1 m" view={view} />
    </>
  )
}

// Precast: grey concrete with exposed aggregate and recessed panel joints, on a flat ground. The board is
// 3 m wide, so 1 m is 160 px.
function Precast({ r, uid, view }: { r: Rng; uid: string; view: DrawingView }) {
  const ground = pick(r, ['#bebfba', '#c4c3bd', '#b9bcb9'])
  const stones = ['#8f918d', '#d9dad6', '#a39c8f', '#7f807b', '#cbc6bb', '#9aa0a3', '#b5ada0']
  const dots: ReactNode[] = []
  for (let i = 0; i < 600; i++) {
    dots.push(<circle key={i} cx={between(r, 0, W).toFixed(1)} cy={between(r, 0, H).toFixed(1)} r={between(r, 0.4, 1.4).toFixed(2)} fill={pick(r, stones)} opacity={between(r, 0.4, 0.7).toFixed(2)} />)
  }
  const jx = between(r, 170, 300)
  const jy = between(r, 120, 240)
  return (
    <>
      <rect width={W} height={H} fill={ground} />
      {dots}
      <rect x={jx - 3} y={0} width="6" height={H} fill="#7c7e7a" opacity="0.75" />
      <rect x={0} y={jy - 3} width={jx - 3} height="6" fill="#7c7e7a" opacity="0.75" />
      <Finish uid={uid} />
      <ScaleBar px={160} label="1 m" view={view} />
    </>
  )
}

// Timber: reclaimed joists side by side, each with flowing grain, the odd knot, a few nail holes and a dark gap
// between. The board is 1.2 m wide, so 100 mm is 40 px.
function Timber({ r, uid, view }: { r: Rng; uid: string; view: DrawingView }) {
  const boards = 5
  const bh = H / boards
  const tints = ['#b08a5e', '#a57f55', '#b8936a', '#9c774e', '#94704a']
  const gap = '#2b1d12'
  const out: ReactNode[] = []
  for (let b = 0; b < boards; b++) {
    const y0 = b * bh
    out.push(<rect key={`b${b}`} x={0} y={y0} width={W} height={bh - 4} fill={pick(r, tints)} />)
    const knotX = r() < 0.7 ? between(r, 60, W - 60) : -100
    const knotY = y0 + between(r, bh * 0.35, bh * 0.6)
    for (let g = 0; g < 14; g++) {
      const y = y0 + between(r, 3, bh - 8)
      const a = between(r, -5, 5)
      const bend = Math.abs(y - knotY) < 18 ? (y < knotY ? -10 : 10) : 0
      const d = `M -10 ${y.toFixed(1)} C ${(knotX - 80).toFixed(0)} ${(y + a).toFixed(1)}, ${(knotX - 30).toFixed(0)} ${(y + bend).toFixed(1)}, ${knotX.toFixed(0)} ${(y + bend).toFixed(1)} S ${(knotX + 120).toFixed(0)} ${(y - a).toFixed(1)}, ${W + 10} ${(y + between(r, -3, 3)).toFixed(1)}`
      out.push(<path key={`g${b}-${g}`} d={d} fill="none" stroke="#6b4a2b" strokeWidth={between(r, 0.4, 1.3)} opacity={between(r, 0.18, 0.45)} />)
    }
    if (knotX > 0) {
      out.push(
        <g key={`k${b}`}>
          <ellipse cx={knotX} cy={knotY} rx={between(r, 6, 10)} ry={between(r, 3.5, 6)} fill="#6b4a2b" opacity="0.7" />
          <ellipse cx={knotX} cy={knotY} rx="15" ry="8" fill="none" stroke="#6b4a2b" strokeWidth="0.8" opacity="0.45" />
        </g>,
      )
    }
    const holes = 2 + Math.floor(between(r, 0, 3))
    for (let n = 0; n < holes; n++) {
      out.push(<circle key={`n${b}-${n}`} cx={between(r, 20, W - 20)} cy={y0 + between(r, 8, bh - 12)} r="1.2" fill={gap} opacity="0.7" />)
    }
    out.push(<rect key={`e${b}`} x={0} y={y0 + bh - 4} width={W} height="4" fill={gap} />)
  }
  return (
    <>
      <rect width={W} height={H} fill={gap} />
      {out}
      <Finish uid={uid} />
      <ScaleBar px={40} label="100 mm" view={view} />
    </>
  )
}

// Slate: dark roofing slates laid in courses, each course lapping the one below, with the odd lighter slate. The
// board is 2.4 m wide, so 250 mm is 50 px.
function Slate({ r, uid, view }: { r: Rng; uid: string; view: DrawingView }) {
  const tints = ['#4f5563', '#565c6b', '#4a4f5c', '#5d6372', '#535867']
  const sw = 50
  const course = 46
  const out: ReactNode[] = []
  let row = 0
  for (let y = -between(r, 0, course); y < H; y += course, row++) {
    const offset = row % 2 === 0 ? 0 : sw / 2
    for (let x = -offset; x < W; x += sw) {
      out.push(<rect key={`s${row}-${x.toFixed(0)}`} x={x + 1} y={y} width={sw - 2} height={course + 18} fill={r() < 0.08 ? '#6b7180' : pick(r, tints)} stroke="#2c303a" strokeWidth="0.8" />)
    }
  }
  return (
    <>
      <rect width={W} height={H} fill="#2c303a" />
      {out}
      <Finish uid={uid} />
      <ScaleBar px={50} label="250 mm" view={view} />
    </>
  )
}

// Paving: square-cut flags in a stretcher bond with sand joints. The board is 3 m wide, so 1 m is 160 px.
function Paving({ r, uid, view }: { r: Rng; uid: string; view: DrawingView }) {
  const tints = ['#cfc6b3', '#c7bea9', '#d6cebd', '#bfb6a1']
  const fh = 96
  const out: ReactNode[] = []
  let row = 0
  for (let y = -between(r, 0, fh * 0.5); y < H; y += fh, row++) {
    let x = -between(r, 0, 120)
    while (x < W) {
      const fw = pick(r, [96, 144, 192])
      out.push(<rect key={`p${row}-${x.toFixed(0)}`} x={x + 2} y={y + 2} width={fw - 4} height={fh - 4} fill={pick(r, tints)} />)
      x += fw
    }
  }
  return (
    <>
      <rect width={W} height={H} fill="#a99f88" />
      {out}
      <Finish uid={uid} />
      <ScaleBar px={160} label="1 m" view={view} />
    </>
  )
}

// Carpet tiles: square tiles laid quarter-turned, so the pile direction alternates; fine loop texture. The board
// is 2 m wide, so 500 mm is 120 px.
function CarpetTiles({ r, uid, view }: { r: Rng; uid: string; view: DrawingView }) {
  const base = pick(r, ['#6f6c78', '#5f6470', '#73706a'])
  const t = 120
  const out: ReactNode[] = []
  for (let y = 0; y < H; y += t) {
    for (let x = 0; x < W; x += t) {
      const turned = (x / t + y / t) % 2 === 1
      out.push(<rect key={`t${x}-${y}`} x={x + 1} y={y + 1} width={t - 2} height={t - 2} fill={base} opacity={turned ? 0.92 : 1} />)
      for (let k = 6; k < t; k += 6) {
        out.push(turned ? <line key={`l${x}-${y}-${k}`} x1={x + k} y1={y + 2} x2={x + k} y2={y + t - 2} stroke="#ffffff" strokeWidth="0.5" opacity="0.08" /> : <line key={`l${x}-${y}-${k}`} x1={x + 2} y1={y + k} x2={x + t - 2} y2={y + k} stroke="#ffffff" strokeWidth="0.5" opacity="0.08" />)
      }
    }
  }
  return (
    <>
      <rect width={W} height={H} fill="#3d3b42" />
      {out}
      <Finish uid={uid} />
      <ScaleBar px={120} label="500 mm" view={view} />
    </>
  )
}

// Glulam: the end grain of a laminated beam, lamellae stacked with their glue lines. The board is 1.2 m wide, so
// 100 mm is 40 px.
function Glulam({ r, uid, view }: { r: Rng; uid: string; view: DrawingView }) {
  const lam = 28
  const tints = ['#c9a06b', '#c49a64', '#cfa874', '#bd935c']
  const out: ReactNode[] = []
  for (let y = 0, i = 0; y < H; y += lam, i++) {
    out.push(<rect key={`m${i}`} x={0} y={y} width={W} height={lam - 1.5} fill={pick(r, tints)} />)
    for (let g = 0; g < 3; g++) {
      const yy = y + between(r, 4, lam - 6)
      out.push(<path key={`g${i}-${g}`} d={`M -10 ${yy.toFixed(1)} C ${between(r, 100, 200).toFixed(0)} ${(yy + between(r, -3, 3)).toFixed(1)}, ${between(r, 260, 380).toFixed(0)} ${(yy + between(r, -3, 3)).toFixed(1)}, ${W + 10} ${yy.toFixed(1)}`} fill="none" stroke="#8a6338" strokeWidth="0.6" opacity="0.35" />)
    }
    out.push(<rect key={`j${i}`} x={0} y={y + lam - 1.5} width={W} height="1.5" fill="#6b4a2b" opacity="0.7" />)
  }
  return (
    <>
      <rect width={W} height={H} fill="#6b4a2b" />
      {out}
      <Finish uid={uid} />
      <ScaleBar px={40} label="100 mm" view={view} />
    </>
  )
}

// Hollowcore: the cut end of a plank with its row of round voids, on a grey ground. The board is 2.4 m wide, so a
// 1,200 mm plank is half of it.
function Hollowcore({ r, uid, view }: { r: Rng; uid: string; view: DrawingView }) {
  const ground = pick(r, ['#bdbbb4', '#c3c1ba'])
  const top = H * 0.32
  const depth = H * 0.36
  const plank = W / 2
  const out: ReactNode[] = []
  for (let p = 0; p < 2; p++) {
    const x0 = p * plank
    out.push(<rect key={`p${p}`} x={x0 + 3} y={top} width={plank - 6} height={depth} fill="#a9a69e" stroke={INK} strokeWidth="1" />)
    const voids = 6
    const pitch = (plank - 6) / voids
    for (let v = 0; v < voids; v++) out.push(<circle key={`v${p}-${v}`} cx={x0 + 3 + pitch * (v + 0.5)} cy={top + depth / 2} r={depth * 0.33} fill={PAPER} stroke={INK} strokeWidth="0.75" />)
  }
  return (
    <>
      <rect width={W} height={H} fill={ground} />
      {out}
      <Finish uid={uid} />
      <ScaleBar px={W / 4} label="600 mm" view={view} />
    </>
  )
}
