/** Lightweight inline-SVG charts — no external chart library.
 *  Styling hooks (.chart-tip, .chart-bars, .chart-legend, …) live in the
 *  dashboard stylesheet since these components are dashboard-scoped. */
import { useId, useState } from 'react'

export interface Point {
  label: string
  value: number
}

export interface DonutSlice {
  label: string
  value: number
  color: string
}

const GOLD = '#e8b547'
const GRID = 'rgba(224,168,120,0.14)'

function niceMax(v: number): number {
  if (v <= 0) return 1
  const mag = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / mag
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return step * mag
}

/** Catmull-Rom → cubic Bézier so the series renders as a smooth curve. */
function smoothPath(pts: ReadonlyArray<readonly [number, number]>): string {
  if (pts.length === 0) return ''
  if (pts.length < 3) {
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(i + 2, pts.length - 1)]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d
}

export function LineChart({
  data,
  height = 180,
  stroke = 'var(--saffron)',
  valuePrefix = '',
  formatValue,
}: {
  data: Point[]
  height?: number
  stroke?: string
  valuePrefix?: string
  formatValue?: (v: number) => string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const gid = useId()
  const w = 640
  const h = height
  const padX = 12
  const padY = 18

  if (data.length === 0) return <div className="empty">No data.</div>

  const max = niceMax(Math.max(...data.map((d) => d.value), 0))
  const stepX = (w - padX * 2) / Math.max(data.length - 1, 1)
  const y = (v: number) => padY + (h - padY * 2) * (1 - v / max)
  const pts = data.map((d, i) => [padX + i * stepX, y(d.value)] as const)
  const line = smoothPath(pts)
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${h - padY} L${pts[0][0].toFixed(1)},${h - padY} Z`
  const fmt = (v: number) => (formatValue ? formatValue(v) : `${valuePrefix}${v.toLocaleString()}`)
  const last = data[data.length - 1]

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const frac = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1)
    const idx = Math.round(((frac * w - padX) / Math.max(w - padX * 2, 1)) * (data.length - 1))
    setHover(Math.min(Math.max(idx, 0), data.length - 1))
  }

  const hp = hover != null ? pts[hover] : null

  return (
    <div className="chart" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" role="img">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: stroke }} stopOpacity="0.3" />
            <stop offset="100%" style={{ stopColor: stroke }} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={padX}
            x2={w - padX}
            y1={padY + (h - padY * 2) * f}
            y2={padY + (h - padY * 2) * f}
            stroke={GRID}
            strokeWidth="1"
            strokeDasharray="3 5"
          />
        ))}
        <line x1={padX} x2={w - padX} y1={h - padY} y2={h - padY} stroke={GRID} strokeWidth="1" />
        <path d={area} fill={`url(#${gid})`} />
        <path
          d={line}
          fill="none"
          style={{ stroke }}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {hp && hover != null && (
          <g>
            <line x1={hp[0]} x2={hp[0]} y1={padY} y2={h - padY} stroke={GRID} strokeWidth="1" />
            <circle cx={hp[0]} cy={hp[1]} r="5" style={{ fill: stroke }} fillOpacity="0.25" />
            <circle cx={hp[0]} cy={hp[1]} r="3.2" style={{ fill: stroke }} />
          </g>
        )}
        {hover == null && (
          <>
            <circle
              cx={pts[pts.length - 1][0]}
              cy={pts[pts.length - 1][1]}
              r="6"
              style={{ fill: stroke }}
              fillOpacity="0.25"
            />
            <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.4" style={{ fill: stroke }} />
          </>
        )}
      </svg>
      {hp && hover != null && (
        <div
          className="chart-tip"
          style={{ left: `${(hp[0] / w) * 100}%`, top: `${(hp[1] / h) * 100}%` }}
        >
          <b>{fmt(data[hover].value)}</b>
          <span className="faint">{data[hover].label}</span>
        </div>
      )}
      <div className="row spread chart-foot">
        <span className="faint">{data[0].label}</span>
        <span className="muted">
          latest {fmt(last.value)}
        </span>
        <span className="faint">{last.label}</span>
      </div>
    </div>
  )
}

export function BarChart({
  data,
  height = 180,
  valuePrefix = '',
  colors = [GOLD, '#f4811f'],
  formatValue,
}: {
  data: Point[]
  height?: number
  valuePrefix?: string
  colors?: [string, string]
  formatValue?: (v: number) => string
}) {
  if (data.length === 0) return <div className="empty">No data.</div>
  const max = niceMax(Math.max(...data.map((d) => d.value), 0))
  const fmt = (v: number) => (formatValue ? formatValue(v) : `${valuePrefix}${v.toLocaleString()}`)
  const showLabel = (i: number) =>
    data.length <= 7 || i === 0 || i === data.length - 1 || i === Math.floor((data.length - 1) / 2)

  return (
    <div>
      <div className="chart-bars" style={{ height }}>
        {data.map((d, i) => (
          <div key={`${d.label}-${i}`} className="chart-bar" title={`${d.label}: ${fmt(d.value)}`}>
            <span className={`chart-bar-val${i === data.length - 1 ? ' always' : ''}`}>{fmt(d.value)}</span>
            <div
              className="chart-bar-fill"
              style={{
                height: `${Math.max((d.value / max) * (height - 46), 2)}px`,
                background: `linear-gradient(180deg, ${colors[0]}, ${colors[1]})`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="chart-bar-labels">
        {data.map((d, i) => (
          <span key={`${d.label}-${i}`} className="faint">
            {showLabel(i) ? d.label : ''}
          </span>
        ))}
      </div>
    </div>
  )
}

interface DonutSeg {
  label: string
  color: string
  dash: number
  offset: number
}

/** Pure helper: cumulative stroke geometry for each non-zero slice. */
function donutSegments(slices: DonutSlice[], radius: number): DonutSeg[] {
  const total = slices.reduce((a, s) => a + s.value, 0)
  const C = 2 * Math.PI * radius
  const segs: DonutSeg[] = []
  let acc = 0
  for (const s of slices) {
    if (s.value <= 0) continue
    const frac = s.value / total
    segs.push({
      label: s.label,
      color: s.color,
      dash: Math.max(frac * C - 2.5, 1),
      offset: -acc * C,
    })
    acc += frac
  }
  return segs
}

export function DonutChart({
  slices,
  centerLabel,
  centerSub = 'total',
  formatValue,
}: {
  slices: DonutSlice[]
  centerLabel?: string
  centerSub?: string
  formatValue?: (v: number) => string
}) {
  const total = slices.reduce((a, s) => a + s.value, 0)
  if (total <= 0) return <div className="empty">No data.</div>

  const R = 54
  const C = 2 * Math.PI * R
  const fmt = (v: number) => (formatValue ? formatValue(v) : v.toLocaleString())
  const segs = donutSegments(slices, R)

  return (
    <div className="chart-donut-wrap">
      <div className="chart-donut chart-pop">
        <svg viewBox="0 0 140 140" width="140" height="140" role="img">
          <circle cx="70" cy="70" r={R} fill="none" className="chart-donut-track" strokeWidth="16" />
          {segs.map((s) => (
            <circle
              key={s.label}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              strokeWidth="16"
              style={{ stroke: s.color }}
              strokeDasharray={`${s.dash} ${C - s.dash}`}
              strokeDashoffset={s.offset}
              transform="rotate(-90 70 70)"
            />
          ))}
        </svg>
        <div className="chart-donut-center">
          <div className="chart-donut-total">{centerLabel ?? fmt(total)}</div>
          <div className="chart-donut-sub faint">{centerSub}</div>
        </div>
      </div>
      <ul className="chart-legend">
        {slices.map((s) => (
          <li key={s.label}>
            <span className="chart-legend-dot" style={{ background: s.color }} />
            <span className="chart-legend-label">{s.label}</span>
            <span className="chart-legend-val mono">{fmt(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
