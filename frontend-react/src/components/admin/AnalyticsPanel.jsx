import { useMemo } from 'react';
import { PageHero, KpiCard, Card } from '../ui';

export default function AnalyticsPanel({ data }) {
  const d = data || {};
  const analytics = d.analytics || {};
  const history = d.history || [];

  // Motion Index SVG chart
  const motionChart = useMemo(() => {
    if (!history.length) return { line: '', area: '' };
    const W = 480, H = 110, pad = 8;
    const maxMotion = Math.max(...history.map(h => h.motion * 100), 100);
    const step = (W - pad * 2) / Math.max(history.length - 1, 1);
    const points = history.map((h, i) => {
      const x = pad + i * step;
      const y = H - pad - ((h.motion * 100 / maxMotion) * (H - pad * 2));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const first = points[0];
    const lastX = parseFloat(points[points.length - 1].split(',')[0]);
    return {
      line: points.join(' '),
      area: `M${first} ${points.join(' L')} L${lastX},${H - pad} L${pad},${H - pad}Z`,
    };
  }, [history]);

  // Speed SVG chart
  const speedChart = useMemo(() => {
    if (!history.length) return { line: '', area: '' };
    const W = 480, H = 110, pad = 8;
    const maxSpeed = Math.max(...history.map(h => h.speed || 0), 0.5);
    const step = (W - pad * 2) / Math.max(history.length - 1, 1);
    const points = history.map((h, i) => {
      const x = pad + i * step;
      const y = H - pad - (((h.speed || 0) / maxSpeed) * (H - pad * 2));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const first = points[0];
    const lastX = parseFloat(points[points.length - 1].split(',')[0]);
    return {
      line: points.join(' '),
      area: `M${first} ${points.join(' L')} L${lastX},${H - pad} L${pad},${H - pad}Z`,
    };
  }, [history]);

  const barData = [
    { label: 'Mon', val: 2, pct: 40 },
    { label: 'Tue', val: 4, pct: 70 },
    { label: 'Wed', val: 1, pct: 20 },
    { label: 'Thu', val: 6, pct: 100, warn: true },
    { label: 'Fri', val: 3, pct: 50 },
    { label: 'Sat', val: 2, pct: 30 },
    { label: 'Sun', val: 5, pct: 60, watch: true },
  ];

  return (
    <div className="flex flex-col flex-1 animate-fade-slide-up">
      <PageHero
        eyebrow="Historical Data"
        title="Analytics"
        subtitle="Past sensor readings only · No predictions · No ML output"
      />
      <div className="px-8 py-7 flex-1">
        {/* Time Range */}
        <div className="flex gap-2 items-center flex-wrap mb-5">
          <span className="text-xs text-wg-muted font-semibold">Time Range:</span>
          {['24h', '7 Days', '30 Days'].map((r, i) => (
            <button key={r} className={`px-3.5 py-1.5 rounded-[7px] text-xs font-medium cursor-pointer border-[1.5px] transition-all font-[family-name:var(--font-family-sora)] ${i === 0 ? 'bg-wg-blue-xlt border-wg-blue-3 text-wg-blue' : 'border-wg-border text-wg-muted bg-white'}`}>
              {r}
            </button>
          ))}
          <span className="text-xs text-wg-muted font-semibold ml-3">Station:</span>
          <select className="px-3 py-1.5 border-[1.5px] border-wg-border rounded-[7px] text-xs text-navy bg-white outline-none font-[family-name:var(--font-family-sora)]">
            <option>All Stations</option><option>WG-01</option>
          </select>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3.5 mb-5">
          <KpiCard label="Peak Motion Index" value={analytics.peak_motion ?? '--'} sub="From last 50 buoy readings" accent="blue" delay={50} />
          <KpiCard label="Avg Motion Index" value={analytics.avg_motion ?? '--'} sub="From last 50 buoy readings" accent="blue" delay={100} />
          <KpiCard label="WARNING Readings" value={<span className="text-wg-warn">{analytics.warning_count ?? '--'}</span>} sub="In last 50 readings" accent="warn" delay={150} />
          <KpiCard label="WATCH Readings" value={<span className="text-wg-watch">{analytics.watch_count ?? '--'}</span>} sub="In last 50 readings" accent="watch" delay={200} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-4.5 mb-5">
          <Card title="Buoy Motion Index — Real-time History (last 50 readings)" className="mb-0" bodyClassName="pb-3">
            <svg viewBox="0 0 480 110" preserveAspectRatio="none" className="w-full h-[110px]">
              <defs>
                <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1870cc" stopOpacity=".22" />
                  <stop offset="100%" stopColor="#1870cc" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="70" x2="480" y2="70" stroke="#b87000" strokeWidth="1" strokeDasharray="5,4" opacity=".5" />
              <text x="4" y="66" fontSize="9" fill="#b87000" opacity=".7">WATCH (20)</text>
              <line x1="0" y1="35" x2="480" y2="35" stroke="#be3018" strokeWidth="1" strokeDasharray="5,4" opacity=".5" />
              <text x="4" y="31" fontSize="9" fill="#be3018" opacity=".7">WARNING (60)</text>
              <path d={motionChart.area} fill="url(#wg)" />
              <polyline points={motionChart.line} fill="none" stroke="#1870cc" strokeWidth="2.5" strokeLinejoin="round" />
            </svg>
            <div className="flex justify-between text-[10px] text-wg-muted-2 mt-1.5">
              <span>Oldest</span><span>Latest</span>
            </div>
          </Card>

          <Card title="Wave Speed Over Time (m/s)" className="mb-0" bodyClassName="pb-3">
            <svg viewBox="0 0 480 110" preserveAspectRatio="none" className="w-full h-[110px]">
              <defs>
                <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3a9ee8" stopOpacity=".18" />
                  <stop offset="100%" stopColor="#3a9ee8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={speedChart.area} fill="url(#tg)" />
              <polyline points={speedChart.line} fill="none" stroke="#3a9ee8" strokeWidth="2.5" strokeLinejoin="round" />
            </svg>
            <div className="flex justify-between text-[10px] text-wg-muted-2 mt-1.5">
              <span>Oldest</span><span>Latest</span>
            </div>
          </Card>
        </div>

        {/* Bar Chart */}
        <Card title="Alert Events per Day — Historical Count" className="mb-0" bodyClassName="pb-3.5">
          <div className="flex items-end gap-2 h-[100px] px-0.5">
            {barData.map((b, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-[4px] transition-[height] duration-300"
                  style={{
                    height: `${b.pct}%`,
                    background: b.warn
                      ? 'linear-gradient(180deg, #f08070, var(--color-wg-warn))'
                      : b.watch
                      ? 'linear-gradient(180deg, #f0c040, var(--color-wg-watch))'
                      : 'linear-gradient(180deg, var(--color-wg-blue-3), var(--color-wg-blue-2))',
                  }}
                />
                <div className="text-[10px] text-wg-muted">{b.val}</div>
                <div className="text-[10px] text-wg-muted-2">{b.label}</div>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-wg-muted-2 mt-2.5 text-center">
            Red bars = days with WARNING events · Amber bars = days with WATCH only
          </div>
        </Card>
      </div>

      <div className="bg-navy text-white/30 px-8 py-4 text-[11px]">WaveGuard – Historical Data Only · No Predictions · No ML Output</div>
    </div>
  );
}
