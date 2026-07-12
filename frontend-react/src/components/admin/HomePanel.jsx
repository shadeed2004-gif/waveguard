import { useState, useEffect } from 'react';
import { PageHero, KpiCard, Card, StatusBadge } from '../ui';
import { getStatusConfig } from '../../utils/statusConfig';

export default function HomePanel({ data }) {
  const [clock, setClock] = useState('--:--:--');
  useEffect(() => {
    const tick = () => setClock(new Date().toTimeString().slice(0, 8));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const d = data || {};
  const waveHeightCm = d.wave_height != null ? Math.round(d.wave_height * 100) : '--';
  const waveSpeed = d.wave_speed != null ? Number(d.wave_speed).toFixed(2) : '--';
  const eta = d.eta != null ? Number(d.eta).toFixed(1) : '--';
  const fusionStatus = d.fusion_status || 'NORMAL';
  const fusionCfg = getStatusConfig(fusionStatus);
  const lastReading = d.updated_at ? new Date(d.updated_at).toLocaleTimeString('en-IN', { hour12: false }) : '--:--:--';

  const recentActivity = (d.history || []).slice(-4).reverse().map(h => ({
    time: new Date(h.time).toLocaleTimeString('en-IN', { hour12: false }).slice(0, 5),
    event: `Station WG-01 reported status → ${h.status}`,
    status: h.status,
  }));

  return (
    <div className="flex flex-col flex-1 min-w-0 animate-fade-slide-up">
      <PageHero
        eyebrow="Authority Dashboard"
        title="System Overview"
        subtitle="Kerala Coast – Kothamangalam Zone · WG-01 active · Auto-refreshing every 5s"
      />
      <div className="px-4 md:px-8 py-7 flex-1">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          <KpiCard label="Avg Wave Height" value={waveHeightCm} unit="cm" sub="WG-01 buoy station" accent="blue" delay={50} />
          <KpiCard label="Wave Speed" value={waveSpeed} unit="m/s" sub="Latest buoy reading" accent="blue" delay={100} />
          <KpiCard label="ETA" value={eta} unit="min" sub="Wave arrival estimate" accent="watch" delay={125} />
          <KpiCard label="Stations Online" value="1" unit="/ 1" sub="All systems operational" accent="normal" delay={150} />
          <KpiCard label="Last Updated" value={clock} sub="Auto-refreshes every 5s" accent="blue" delay={200} />
        </div>

        {/* Map Placeholder + Activity */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-4.5 mb-5">
          <Card title="Station Location Map">
            <div className="bg-gradient-to-br from-sky-200 to-sky-300 rounded-[7px] min-h-[200px] flex flex-col items-center justify-center relative overflow-hidden border border-wg-blue-lt">
              <div className="absolute right-2.5 bottom-[-10px] text-[110px] opacity-[0.07] pointer-events-none">🗺</div>
              <div className="text-[13px] font-semibold text-wg-blue mb-3">Kerala Coast – Kothamangalam Zone</div>
              <div className="flex items-center gap-2 text-[13px] font-medium text-wg-blue">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: `var(--color-wg-${fusionStatus.toLowerCase() === 'warning' ? 'warn' : fusionStatus.toLowerCase()})` }} />
                WG-01 — {fusionCfg.label}
              </div>
            </div>
          </Card>

          <Card title="Recent Activity">
            <div className="flex flex-col">
              {recentActivity.length === 0 && (
                <div className="text-center text-wg-muted-2 py-8 text-sm">Loading activity…</div>
              )}
              {recentActivity.map((item, i) => (
                <div key={i} className="flex gap-3 py-2.5 border-b border-wg-border last:border-b-0 items-start text-[13px]">
                  <div className="text-[11px] text-wg-muted-2 whitespace-nowrap pt-0.5 min-w-[44px]">{item.time}</div>
                  <div className="text-navy leading-relaxed">
                    Station WG-01 reported status → <StatusBadge status={item.status} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Station Quick Table */}
        <Card title="Station Quick Overview" className="mb-0">
          <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px] min-w-[600px]">
            <thead>
              <tr>
                {['Station', 'Status', 'Device', 'Wave Height', 'Wave Speed', 'ETA', 'Last Reading', 'Connectivity'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 bg-wg-blue-xlt text-wg-blue text-[10px] uppercase tracking-wider font-bold border-b border-wg-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-wg-blue-xlt">
                <td className="px-4 py-2.5 border-b border-wg-border font-semibold">WG-01</td>
                <td className="px-4 py-2.5 border-b border-wg-border"><StatusBadge status={fusionStatus} /></td>
                <td className="px-4 py-2.5 border-b border-wg-border font-medium text-[12px]">{d.device_status || '--'}</td>
                <td className="px-4 py-2.5 border-b border-wg-border">{waveHeightCm} cm</td>
                <td className="px-4 py-2.5 border-b border-wg-border">{waveSpeed} m/s</td>
                <td className="px-4 py-2.5 border-b border-wg-border">{eta} min</td>
                <td className="px-4 py-2.5 border-b border-wg-border">{lastReading}</td>
                <td className="px-4 py-2.5 border-b border-wg-border">
                  <div className="flex items-center gap-1.5 pt-px">
                    <div className="w-[7px] h-[7px] rounded-full bg-wg-normal animate-pulse-live" />
                    Online
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </Card>
      </div>

      <div className="bg-navy text-white/30 px-4 md:px-8 py-4 text-[11px] flex items-center justify-between">
        <span>WaveGuard – Admin Dashboard · Visualization Only</span>
        <span>Kothamangalam, Kerala</span>
      </div>
    </div>
  );
}
