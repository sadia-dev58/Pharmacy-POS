/**
 * ChartCard
 * Self-contained SVG chart renderer — bar (vertical/horizontal), line,
 * and pie/doughnut. Deliberately has ZERO external dependency (no
 * Chart.js / CDN), so it always renders even with no internet access
 * or a blocked CDN, which was causing charts to stay blank before.
 */

const CHART_COLORS = ['#1B4B8A', '#E0821E', '#3E7FC1', '#C1443D', '#5C6E87', '#7FA8DC', '#8A4E0C', '#0E2C54', '#B96A2C', '#2E6199'];

function isChartEmpty(data) {
  if (!data || !data.labels || data.labels.length === 0) return true;
  const ds = data.datasets && data.datasets[0];
  if (!ds || !ds.data || ds.data.length === 0) return true;
  const hasValue = ds.data.some((v) => Number(v) > 0);
  return !hasValue;
}

function SvgBarChart({ data, height, horizontal, formatValue }) {
  const labels = data.labels;
  const ds = data.datasets[0];
  const values = ds.data.map((v) => Number(v) || 0);
  const colors = Array.isArray(ds.backgroundColor) ? ds.backgroundColor : labels.map(() => ds.backgroundColor || CHART_COLORS[0]);
  const max = Math.max(...values, 1);
  const pad = { top: 16, right: 16, bottom: horizontal ? 16 : 40, left: horizontal ? 110 : 40 };
  const width = 560;
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  if (horizontal) {
    const barH = Math.max(Math.min(28, plotH / values.length - 8), 4);
    const gap = plotH / values.length;
    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="xMidYMid meet">
        {values.map((v, i) => {
          const w = (v / max) * plotW;
          const y = pad.top + i * gap + (gap - barH) / 2;
          return (
            <g key={i}>
              <text x={pad.left - 8} y={y + barH / 2 + 4} textAnchor="end" fontSize="11.5" fill="#5C6F68" fontFamily="Inter, sans-serif">
                {labels[i].length > 16 ? labels[i].slice(0, 15) + '…' : labels[i]}
              </text>
              <rect x={pad.left} y={y} width={Math.max(w, 2)} height={barH} rx="4" fill={colors[i % colors.length]} />
              <text x={pad.left + w + 6} y={y + barH / 2 + 4} fontSize="11" fill="#16221D" fontFamily="IBM Plex Mono, monospace">
                {formatValue ? formatValue(v) : v}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  const barW = Math.max(Math.min(46, plotW / values.length - 10), 4);
  const gap = plotW / values.length;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="xMidYMid meet">
      <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} stroke="#DCE5DD" />
      <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} stroke="#DCE5DD" />
      {values.map((v, i) => {
        const h = (v / max) * plotH;
        const x = pad.left + i * gap + (gap - barW) / 2;
        const y = height - pad.bottom - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={Math.max(barW, 2)} height={Math.max(h, 1)} rx="4" fill={colors[i % colors.length]} />
            <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="10.5" fill="#16221D" fontFamily="IBM Plex Mono, monospace">
              {v > 0 ? (formatValue ? formatValue(v) : v) : ''}
            </text>
            <text x={x + barW / 2} y={height - pad.bottom + 16} textAnchor="middle" fontSize="10.5" fill="#5C6F68" fontFamily="Inter, sans-serif">
              {labels[i].length > 9 ? labels[i].slice(0, 8) + '…' : labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function SvgLineChart({ data, height, formatValue }) {
  const gradId = React.useId().replace(/:/g, '');
  const labels = data.labels;
  const ds = data.datasets[0];
  const values = ds.data.map((v) => Number(v) || 0);
  const max = Math.max(...values, 1) * 1.15; // headroom so the peak isn't glued to the top
  const pad = { top: 22, right: 20, bottom: 34, left: 50 };
  const width = 620;
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const stepX = values.length > 1 ? plotW / (values.length - 1) : 0;
  const color = ds.borderColor || '#1B4B8A';

  const points = values.map((v, i) => ({
    x: pad.left + i * stepX,
    y: pad.top + plotH - (v / max) * plotH,
  }));

  // Smooth curve through the points using cubic Bezier segments
  function smoothPath(pts) {
    if (pts.length < 2) return pts.length ? `M ${pts[0].x} ${pts[0].y}` : '';
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  }

  const linePath = smoothPath(points);
  const baseline = height - pad.bottom;
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${baseline} L ${points[0].x.toFixed(1)} ${baseline} Z`;

  // Horizontal grid lines (4 bands)
  const gridLines = [0.25, 0.5, 0.75, 1].map((f) => pad.top + plotH * (1 - f));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`lg-${gradId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
        <filter id={`shadow-${gradId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={color} floodOpacity="0.25" />
        </filter>
      </defs>

      {gridLines.map((y, i) => (
        <line key={i} x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="#DDE6F4" strokeDasharray="3 4" />
      ))}
      <line x1={pad.left} y1={pad.top} x2={pad.left} y2={baseline} stroke="#C7D6EC" />
      <line x1={pad.left} y1={baseline} x2={width - pad.right} y2={baseline} stroke="#C7D6EC" />

      <path d={areaPath} fill={`url(#lg-${gradId})`} stroke="none" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter={`url(#shadow-${gradId})`} />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4.5" fill="#fff" stroke={color} strokeWidth="2.5" />
        </g>
      ))}

      {labels.map((l, i) => {
        const skip = labels.length > 10 ? Math.ceil(labels.length / 8) : 1;
        if (i % skip !== 0 && i !== labels.length - 1) return null;
        return (
          <text key={i} x={points[i].x} y={height - pad.bottom + 18} textAnchor="middle" fontSize="10.5" fill="#5C6E87" fontFamily="Inter, sans-serif">
            {l}
          </text>
        );
      })}
    </svg>
  );
}

function SvgPieChart({ data, height, doughnut }) {
  const labels = data.labels;
  const ds = data.datasets[0];
  const values = ds.data.map((v) => Number(v) || 0);
  const colors = Array.isArray(ds.backgroundColor) ? ds.backgroundColor : CHART_COLORS;
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const cx = 90, cy = 90, r = 78, inner = doughnut ? 42 : 0;

  let angle = -90;
  const slices = values.map((v, i) => {
    const frac = v / total;
    const startAngle = angle;
    const endAngle = angle + frac * 360;
    angle = endAngle;
    const toXY = (a, radius) => {
      const rad = (Math.PI / 180) * a;
      return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
    };
    const [x1, y1] = toXY(startAngle, r);
    const [x2, y2] = toXY(endAngle, r);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    let path;
    if (inner > 0) {
      const [ix1, iy1] = toXY(endAngle, inner);
      const [ix2, iy2] = toXY(startAngle, inner);
      path = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${inner} ${inner} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
    } else {
      path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    }
    return { path, color: colors[i % colors.length], label: labels[i], value: v, pct: ((v / total) * 100).toFixed(1) };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, height }}>
      <svg viewBox="0 0 180 180" width={Math.min(height, 200)} height={Math.min(height, 200)} style={{ flexShrink: 0 }}>
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth="1.5" />)}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5, overflowY: 'auto', maxHeight: height }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }}></span>
            <span style={{ color: '#16221D' }}>{s.label}</span>
            <span style={{ color: '#5C6F68', marginLeft: 'auto', fontFamily: 'IBM Plex Mono, monospace' }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * SvgHeatMap
 * Renders a rows x columns grid where each cell's color intensity reflects
 * its value - light for low, deep red for high. Used for the Expiry
 * Report's "category x status" risk heatmap.
 * data shape: { rows: [label,...], cols: [label,...], matrix: [[v,...],...] }
 */
function heatColor(t) {
  // 0 -> soft blue-white, 0.5 -> amber, 1 -> deep red (a "risk" gradient)
  const stops = [
    { p: 0,   c: [232, 240, 250] },
    { p: 0.5, c: [224, 130, 30] },
    { p: 1,   c: [193, 68, 61] },
  ];
  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].p && t <= stops[i + 1].p) { lo = stops[i]; hi = stops[i + 1]; break; }
  }
  const span = hi.p - lo.p || 1;
  const localT = (t - lo.p) / span;
  const rgb = lo.c.map((v, i) => Math.round(v + (hi.c[i] - v) * localT));
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function isHeatmapEmpty(data) {
  if (!data || !data.rows || !data.rows.length || !data.cols || !data.cols.length || !data.matrix) return true;
  const total = data.matrix.flat().reduce((a, b) => a + Number(b || 0), 0);
  return total === 0;
}

function SvgHeatMap({ data, height }) {
  const { rows, cols, matrix } = data;
  const max = Math.max(1, ...matrix.flat().map(Number));
  const labelW = 120;
  const cellW = Math.max(70, Math.min(120, (620 - labelW) / cols.length));
  const cellH = 42;
  const headerH = 26;
  const width = labelW + cols.length * cellW;
  const totalHeight = headerH + rows.length * cellH;

  return (
    <svg viewBox={`0 0 ${width} ${totalHeight}`} width="100%" height={Math.min(height, totalHeight + 10)} preserveAspectRatio="xMidYMid meet">
      {cols.map((c, ci) => (
        <text key={ci} x={labelW + ci * cellW + (cellW - 6) / 2} y={16} textAnchor="middle" fontSize="11" fill="#5C6E87" fontFamily="Inter, sans-serif">{c}</text>
      ))}
      {rows.map((r, ri) => (
        <g key={ri}>
          <text x={4} y={headerH + ri * cellH + cellH / 2 + 4} fontSize="11.5" fill="#16221D" fontFamily="Inter, sans-serif">
            {r.length > 14 ? r.slice(0, 13) + '…' : r}
          </text>
          {cols.map((c, ci) => {
            const v = Number(matrix[ri][ci] || 0);
            const t = v / max;
            return (
              <g key={ci}>
                <rect
                  x={labelW + ci * cellW} y={headerH + ri * cellH}
                  width={cellW - 6} height={cellH - 6} rx="7"
                  fill={v === 0 ? '#F1F5FB' : heatColor(t)}
                />
                <text
                  x={labelW + ci * cellW + (cellW - 6) / 2} y={headerH + ri * cellH + (cellH - 6) / 2 + 4}
                  textAnchor="middle" fontSize="12.5" fontWeight="700" fontFamily="IBM Plex Mono, monospace"
                  fill={v === 0 ? '#B7C3D6' : (t > 0.55 ? '#fff' : '#16221D')}
                >
                  {v}
                </text>
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

function ChartCard({ title, type, data, options, height = 240, empty }) {
  const isEmpty = empty !== undefined ? empty : (type === 'heatmap' ? isHeatmapEmpty(data) : isChartEmpty(data));
  const horizontal = options && options.indexAxis === 'y';

  return (
    <div className="card">
      {title && <div className="section-title">{title}</div>}
      {isEmpty ? (
        <div className="empty-state" style={{ padding: '30px 10px' }}>No data for this period yet</div>
      ) : (
        <div style={{ width: '100%' }}>
          {type === 'bar' && <SvgBarChart data={data} height={height} horizontal={horizontal} />}
          {type === 'line' && <SvgLineChart data={data} height={height} />}
          {(type === 'pie' || type === 'doughnut') && <SvgPieChart data={data} height={height} doughnut={type === 'doughnut'} />}
          {type === 'heatmap' && <SvgHeatMap data={data} height={height} />}
        </div>
      )}
    </div>
  );
}
