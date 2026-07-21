/** Lightweight inline-SVG charts — no external chart library. */

export interface Point {
  label: string
  value: number
}

const SAFFRON = '#f4811f'
const GOLD = '#e8b547'

function niceMax(v: number): number {
  if (v <= 0) return 1
  const mag = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / mag
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return step * mag
}

export function LineChart({
  data,
  height = 180,
  stroke = SAFFRON,
  valuePrefix = '',
}: {
  data: Point[]
  height?: number
  stroke?: string
  valuePrefix?: string
}) {
  const w = 640
  const h = height
  const padX = 8
  const padY = 16
  if (data.length === 0) return <div className="empty">No data.</div>
  const max = niceMax(Math.max(...data.map((d) => d.value), 0))
  const stepX = (w - padX * 2) / Math.max(data.length - 1, 1)
  const y = (v: number) => padY + (h - padY * 2) * (1 - v / max)
  const pts = data.map((d, i) => [padX + i * stepX, y(d.value)] as const)
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const area = `${path} L${pts[pts.length - 1][0].toFixed(1)},${h - padY} L${pts[0][0].toFixed(1)},${h - padY} Z`
  const last = data[data.length - 1]

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" role="img">
        <defs>
          <linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={padX} x2={w - padX} y1={padY + (h - padY * 2) * f} y2={padY + (h - padY * 2) * f}
            stroke="rgba(224,168,120,0.12)" strokeWidth="1" />
        ))}
        <path d={area} fill="url(#lc-fill)" />
        <path d={path} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 4 : 2.5} fill={stroke} />
        ))}
      </svg>
      <div className="row spread" style={{ fontSize: 12 }}>
        <span className="faint">{data[0].label}</span>
        <span className="muted">
          latest {valuePrefix}{last.value.toLocaleString()}
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
}: {
  data: Point[]
  height?: number
  valuePrefix?: string
}) {
  if (data.length === 0) return <div className="empty">No data.</div>
  const max = niceMax(Math.max(...data.map((d) => d.value), 0))
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height, padding: '0 2px' }}>
        {data.map((d) => (
          <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--gold)' }}>
              {valuePrefix}{d.value.toLocaleString()}
            </span>
            <div
              title={`${d.label}: ${d.value}`}
              style={{
                width: '70%',
                height: `${Math.max((d.value / max) * (height - 40), 2)}px`,
                background: `linear-gradient(180deg, ${GOLD}, ${SAFFRON})`,
                borderRadius: '6px 6px 0 0',
              }}
            />
          </div>
        ))}
      </div>
      <div className="row" style={{ marginTop: 6 }}>
        {data.map((d) => (
          <span key={d.label} className="faint" style={{ flex: 1, textAlign: 'center', fontSize: 11 }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}
