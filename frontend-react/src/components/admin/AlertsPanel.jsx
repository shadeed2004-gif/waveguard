import { PageHero, KpiCard, Card, StatusBadge } from '../ui';
import { getStatusConfig } from '../../utils/statusConfig';

export default function AlertsPanel({ data }) {
  const d = data || {};
  const analytics = d.analytics || {};
  const history = d.history || [];

  const exportCSV = () => {
    let csv = 'ID,Timestamp,Station,Status,Wave Height (cm),Type\n';
    history.slice(-15).reverse().forEach((h, i) => {
      const time = h.time ? h.time.replace('T', ' ').split('.')[0] : '--';
      const heightCm = h.motion ? Math.round(h.motion) : '--';
      csv += `${i + 1},${time},WG-01,${h.status},${heightCm},${i === 0 ? 'Live' : 'Log Entry'}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'waveguard-alerts.csv';
    a.click();
  };

  return (
    <div className="flex flex-col flex-1 animate-fade-slide-up">
      <PageHero
        eyebrow="Audit Record"
        title="Alerts Log"
        subtitle="Chronological record of all status transitions · Immutable audit log"
      />
      <div className="px-4 md:px-8 py-7 flex-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <KpiCard label="Total Events" value={analytics.total_readings || '--'} sub="Last 30 days" accent="blue" delay={50} />
          <KpiCard label="WARNING Events" value={<span className="text-wg-warn">{analytics.warning_count ?? '--'}</span>} sub="Last 30 days" accent="warn" delay={100} />
          <KpiCard label="WATCH Events" value={<span className="text-wg-watch">{analytics.watch_count ?? '--'}</span>} sub="Last 30 days" accent="watch" delay={150} />
          <KpiCard label="NORMAL Returns" value={<span className="text-wg-normal">{analytics.total_readings != null ? analytics.total_readings - (analytics.warning_count || 0) - (analytics.watch_count || 0) : '--'}</span>} sub="Last 30 days" accent="normal" delay={200} />
        </div>

        <Card
          title={<>
            <div className="flex gap-2.5 items-center flex-wrap">
              <select className="px-3 py-1.5 border-[1.5px] border-wg-border rounded-[7px] text-xs text-navy bg-white outline-none font-[family-name:var(--font-family-sora)]">
                <option>All Stations</option><option>WG-01</option>
              </select>
              <select className="px-3 py-1.5 border-[1.5px] border-wg-border rounded-[7px] text-xs text-navy bg-white outline-none font-[family-name:var(--font-family-sora)]">
                <option>All Status</option><option>WARNING</option><option>WATCH</option><option>NORMAL</option>
              </select>
              <select className="px-3 py-1.5 border-[1.5px] border-wg-border rounded-[7px] text-xs text-navy bg-white outline-none font-[family-name:var(--font-family-sora)]">
                <option>Last 7 Days</option><option>Today</option><option>Last 30 Days</option>
              </select>
            </div>
            <button onClick={exportCSV} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[11px] font-semibold border-[1.5px] border-wg-blue-2 bg-wg-blue-2 text-white hover:bg-wg-blue transition-colors cursor-pointer font-[family-name:var(--font-family-sora)]">
              ↓ Export CSV
            </button>
          </>}
          className="mb-0"
          bodyClassName="p-0"
        >
          <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px] min-w-[540px]">
            <thead>
              <tr>
                {['#', 'Timestamp', 'Station', 'From', 'To', 'Wave Height', 'Duration'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 bg-wg-blue-xlt text-wg-blue text-[10px] uppercase tracking-wider font-bold border-b border-wg-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-wg-muted-2 py-10">No alerts recorded in the current session.</td></tr>
              ) : (
                history.slice(-15).reverse().map((h, idx) => {
                  const time = h.time ? h.time.replace('T', ' ').split('.')[0] : '--';
                  const cfg = getStatusConfig(h.status);
                  return (
                    <tr key={idx} className="hover:bg-wg-blue-xlt">
                      <td className="px-4 py-2.5 border-b border-wg-border text-wg-muted-2 text-[11px]">{String(history.length - idx).padStart(3, '0')}</td>
                      <td className="px-4 py-2.5 border-b border-wg-border text-xs">{time}</td>
                      <td className="px-4 py-2.5 border-b border-wg-border font-semibold">WG-01</td>
                      <td className="px-4 py-2.5 border-b border-wg-border">—</td>
                      <td className="px-4 py-2.5 border-b border-wg-border"><StatusBadge status={h.status} /></td>
                      <td className="px-4 py-2.5 border-b border-wg-border">{d.wave_height != null ? Math.round(d.wave_height * 100) : 0} cm</td>
                      <td className="px-4 py-2.5 border-b border-wg-border">{idx === 0 ? 'Live' : 'Log Entry'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-t border-wg-border text-xs text-wg-muted-2">
            <span>Showing {Math.min(history.length, 15)} of {history.length} records</span>
            <div className="flex gap-1.5">
              <button className="px-3 py-1.5 rounded-[7px] text-[11px] font-semibold border-[1.5px] border-wg-border text-wg-muted bg-white cursor-pointer hover:border-wg-blue-2 hover:text-wg-blue transition-colors">← Prev</button>
              <button className="px-3 py-1.5 rounded-[7px] text-[11px] font-semibold border-[1.5px] border-wg-border text-wg-muted bg-white cursor-pointer hover:border-wg-blue-2 hover:text-wg-blue transition-colors">Next →</button>
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-navy text-white/30 px-4 md:px-8 py-4 text-[11px]">WaveGuard – Visualization Only · Immutable Audit Log</div>
    </div>
  );
}
