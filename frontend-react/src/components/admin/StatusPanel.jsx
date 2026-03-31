import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PageHero, StatusBadge } from '../ui';
import { getStatusConfig } from '../../utils/statusConfig';

// Fix default Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function getBuoyIcon(status) {
  const colors = { normal: ['#1a8c50', '#0f5c34'], watch: ['#f0c040', '#cf9b20'], warning: ['#be3018', '#8f2210'] };
  const [fill, stroke] = colors[(status || 'normal').toLowerCase()] || colors.normal;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="${fill}" stroke="${stroke}" stroke-width="2"/><circle cx="16" cy="16" r="6" fill="#fff" opacity="0.6"/><path d="M16 6 v20 M6 16 h20" stroke="#fff" stroke-width="2" stroke-opacity="0.8"/></svg>`;
  return L.divIcon({ html: svg, className: 'buoy-marker', iconSize: [28, 28], iconAnchor: [14, 14] });
}

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);

  // Fix grey tiles on panel show
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

/** Convert device_status text to a human label & color */
function getDeviceStatusDisplay(deviceStatus) {
  if (!deviceStatus) return { label: '--', color: 'text-wg-muted-2', dotColor: 'bg-wg-muted-2' };
  const s = deviceStatus.toUpperCase();
  if (s === 'CALM' || s === 'NORMAL' || s === 'SAFE')
    return { label: s, color: 'text-wg-normal', dotColor: 'bg-wg-normal' };
  if (s === 'MODERATE')
    return { label: 'MODERATE', color: 'text-amber-500', dotColor: 'bg-amber-500' };
  if (s === 'ROUGH' || s === 'WARNING' || s === 'DANGER' || s === 'HIGH WAVE' || s === 'HIGH')
    return { label: s, color: 'text-wg-warn', dotColor: 'bg-wg-warn' };
  return { label: s, color: 'text-wg-blue-3', dotColor: 'bg-wg-blue-3' };
}

export default function StatusPanel({ data }) {
  const d = data || {};
  const buoyStatus = d.buoy_status || 'NORMAL';
  const satStatus = d.satellite_status || 'NORMAL';
  const fusionStatus = d.fusion_status || 'NORMAL';
  const buoyOnline = d.buoy_online !== false;
  const motionIndex = d.avg_motion != null ? d.avg_motion.toFixed(4) : '--';
  const waveSpeed = d.wave_speed != null ? Number(d.wave_speed).toFixed(2) : '--';
  const waveHeightCm = d.wave_height != null ? Math.round(d.wave_height * 100) : null;
  const hs = d.wave_height || 0;
  const lastReading = d.updated_at ? new Date(d.updated_at).toLocaleTimeString('en-IN', { hour12: false }) : '--:--:--';
  const lat = d.lat || 10.0515;
  const lon = d.lon || 76.6134;

  // New fields from buoy device
  const eta = d.eta != null ? Number(d.eta).toFixed(2) : '--';
  const deviceStatus = d.device_status || null;
  const deviceStatusDisplay = getDeviceStatusDisplay(deviceStatus);

  const buoyCfg = getStatusConfig(buoyStatus);
  const satCfg = getStatusConfig(satStatus);

  const satHsLabel = hs >= 2.5 ? 'DANGEROUS' : hs >= 1.5 ? 'Elevated' : 'Normal';
  const satHsColor = hs >= 2.5 ? 'text-wg-warn' : hs >= 1.5 ? 'text-wg-watch' : 'text-wg-muted';

  return (
    <div className="flex flex-col flex-1 animate-fade-slide-up">
      <PageHero
        eyebrow="Live Monitoring"
        title="System Status"
        subtitle="WG-01 real-time readings · Auto-refreshed every 5 seconds · Read-only"
      />
      <div className="px-8 py-7 flex-1">
        {/* Buoy offline banner */}
        {!buoyOnline && (
          <div className="flex items-center gap-3 bg-amber-50 border-[1.5px] border-amber-300 rounded-[10px] px-4.5 py-3.5 mb-5 text-amber-800 text-[13px] font-semibold">
            <span className="text-xl">📡</span>
            <div>
              <strong>Physical buoy not connected</strong> — System is running on satellite data only.<br />
              <span className="font-normal text-xs">Once the buoy device POSTs to <code className="bg-amber-200/50 px-1.5 py-0.5 rounded text-[11px]">/api/buoy</code>, this banner will disappear automatically.</span>
            </div>
          </div>
        )}

        <div className="text-[10px] font-bold tracking-[1.2px] uppercase text-wg-blue mb-3.5 flex items-center gap-2.5 after:content-[''] after:flex-1 after:h-px after:bg-wg-border">
          Live Station Readings
        </div>

        <div className="grid grid-cols-2 gap-4.5 mb-5">
          {/* Buoy Panel */}
          <div className="bg-white rounded-xl border border-wg-border shadow-sm overflow-hidden">
            <div className="px-4.5 py-3.5 flex items-center justify-between border-b border-wg-border bg-wg-blue-xlt">
              <div className="text-sm font-bold flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] bg-wg-blue-xlt border border-wg-blue-lt text-wg-blue rounded font-bold">H1</span>
                BUOY MONITORING — LOCAL SENSOR
              </div>
              <StatusBadge status={buoyStatus} />
            </div>

            <div className="grid grid-cols-2 gap-px bg-wg-border">
              {/* Motion Index - spans 2 cols */}
              <div className={`bg-white px-4 py-3.5 col-span-2 flex flex-col items-center justify-center min-h-[100px] transition-opacity ${!buoyOnline ? 'opacity-45' : ''}`}
                style={{ background: buoyStatus === 'WARNING' ? 'var(--color-wg-warn-bg)' : buoyStatus === 'WATCH' ? 'var(--color-wg-watch-bg)' : '' }}>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-wg-muted-2 mb-2">Live Motion Index</div>
                <div className="text-[42px] font-extrabold leading-none font-[family-name:var(--font-family-sora)]" style={{ color: `var(--color-wg-${buoyStatus === 'WARNING' ? 'warn' : buoyStatus === 'WATCH' ? 'watch' : 'blue-3'})` }}>
                  {buoyOnline ? motionIndex : '—'}
                </div>
                <div className="flex items-center gap-1.5 mt-3">
                  <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_var(--color-wg-blue-3)] ${buoyOnline ? 'bg-wg-blue-3 animate-pulse-live' : 'bg-wg-muted-2'}`} />
                  <span className="text-[11px] text-wg-muted-2 font-semibold uppercase tracking-wide">
                    {buoyOnline ? 'Buoy Streaming' : 'Buoy Offline'}
                  </span>
                </div>
              </div>

              <ReadingBox label="Wave Speed" value={buoyOnline ? waveSpeed : '—'} unit="m/s" sub="Buoy Velocity" />
              <ReadingBox
                label="Device Status"
                value={
                  buoyOnline && deviceStatus ? (
                    <span className={`text-[15px] font-bold flex items-center gap-1.5 ${deviceStatusDisplay.color}`}>
                      <span className={`w-[7px] h-[7px] rounded-full ${deviceStatusDisplay.dotColor}`} />
                      {deviceStatusDisplay.label}
                    </span>
                  ) : '—'
                }
                sub="On-Device Classification"
              />
              <ReadingBox
                label="Signal"
                value={
                  buoyOnline ? (
                    <span className="text-[15px] text-wg-normal flex items-center gap-1.5">
                      <span className="w-[7px] h-[7px] rounded-full bg-wg-normal animate-pulse-live" />
                      Online
                    </span>
                  ) : (
                    <span className="text-[15px] text-wg-muted-2 flex items-center gap-1.5">
                      <span className="w-[7px] h-[7px] rounded-full bg-wg-muted-2" />
                      Offline
                    </span>
                  )
                }
                sub={buoyOnline ? 'Signal strong' : 'No signal'}
              />
              <ReadingBox
                label="ETA"
                value={buoyOnline ? eta : '—'}
                unit={buoyOnline && d.eta != null ? 'min' : ''}
                sub="Wave Arrival Estimate"
              />
              <ReadingBox label="GPS Latitude" value={buoyOnline && d.lat ? d.lat.toFixed(6) : '--'} sub="Neo 6M North" valueClass="text-wg-blue-3" />
              <ReadingBox label="GPS Longitude" value={buoyOnline && d.lon ? d.lon.toFixed(6) : '--'} sub="Neo 6M East" valueClass="text-wg-blue-3" />
              <ReadingBox label="Uptime" value={d.analytics ? `${d.analytics.total_readings} ticks` : '—'} sub="Since last boot" />
              <ReadingBox label="System Status" value={buoyOnline ? buoyCfg.label : 'OFFLINE'} sub="Backend Classification" span={1} valueClass={buoyOnline ? buoyCfg.color : 'text-wg-muted-2'} />
            </div>

            <div className="px-4.5 py-2.5 text-[11px] text-wg-muted-2 border-t border-wg-border flex items-center gap-1.5">
              <span className={`w-[7px] h-[7px] rounded-full ${buoyOnline ? 'bg-wg-normal animate-pulse-live' : 'bg-wg-muted-2'}`} />
              Last reading: {lastReading} · Power: Solar + Battery
            </div>
          </div>

          {/* Satellite Panel */}
          <div className="bg-white rounded-xl border border-wg-border shadow-sm overflow-hidden flex flex-col">
            <div className="px-4.5 py-3.5 flex items-center justify-between border-b border-wg-border bg-wg-blue-xlt">
              <div className="text-sm font-bold flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] bg-wg-blue-xlt border border-wg-blue-lt text-wg-blue rounded font-bold">H2</span>
                SATELLITE OCEAN MONITORING
              </div>
              <StatusBadge status={satStatus} />
            </div>

            <div className="grid grid-cols-2 gap-px bg-wg-border flex-1">
              {/* Wave Height Hero - spans 2 cols */}
              <div className="bg-white px-4 py-3.5 col-span-2 flex flex-col items-center justify-center min-h-[100px]"
                style={{ background: satStatus === 'WARNING' ? 'var(--color-wg-warn-bg)' : satStatus === 'WATCH' ? 'var(--color-wg-watch-bg)' : '' }}>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-wg-muted-2 mb-2">Significant Wave Height (Hs)</div>
                {/* Gauge Arc */}
                <div className="relative w-[140px] h-[75px] mb-1">
                  <svg viewBox="0 0 140 75" className="w-full h-full">
                    {/* Background arc */}
                    <path d="M 15 70 A 55 55 0 0 1 125 70" fill="none" stroke="#e8f0f8" strokeWidth="8" strokeLinecap="round" />
                    {/* Green zone 0-1.5m */}
                    <path d="M 15 70 A 55 55 0 0 1 52 22" fill="none" stroke="#1a8c50" strokeWidth="8" strokeLinecap="round" opacity="0.3" />
                    {/* Amber zone 1.5-2.5m */}
                    <path d="M 52 22 A 55 55 0 0 1 88 22" fill="none" stroke="#b87000" strokeWidth="8" strokeLinecap="round" opacity="0.3" />
                    {/* Red zone 2.5m+ */}
                    <path d="M 88 22 A 55 55 0 0 1 125 70" fill="none" stroke="#be3018" strokeWidth="8" strokeLinecap="round" opacity="0.3" />
                    {/* Needle */}
                    {(() => {
                      const clampedHs = Math.min(hs, 4);
                      const angle = -180 + (clampedHs / 4) * 180;
                      const rad = (angle * Math.PI) / 180;
                      const nx = 70 + 42 * Math.cos(rad);
                      const ny = 70 + 42 * Math.sin(rad);
                      const needleColor = hs >= 2.5 ? '#be3018' : hs >= 1.5 ? '#b87000' : '#1a8c50';
                      return (
                        <>
                          <line x1="70" y1="70" x2={nx} y2={ny} stroke={needleColor} strokeWidth="2.5" strokeLinecap="round" />
                          <circle cx="70" cy="70" r="4" fill={needleColor} />
                          <circle cx="70" cy="70" r="2" fill="#fff" />
                        </>
                      );
                    })()}
                    {/* Scale labels */}
                    <text x="10" y="72" fontSize="8" fill="#98b4c8" textAnchor="middle">0</text>
                    <text x="33" y="30" fontSize="8" fill="#98b4c8" textAnchor="middle">1</text>
                    <text x="70" y="17" fontSize="8" fill="#98b4c8" textAnchor="middle">2</text>
                    <text x="107" y="30" fontSize="8" fill="#98b4c8" textAnchor="middle">3</text>
                    <text x="130" y="72" fontSize="8" fill="#98b4c8" textAnchor="middle">4m</text>
                  </svg>
                </div>
                <div className="text-[38px] font-extrabold leading-none font-[family-name:var(--font-family-sora)]"
                  style={{ color: hs >= 2.5 ? 'var(--color-wg-warn)' : hs >= 1.5 ? 'var(--color-wg-watch)' : 'var(--color-wg-blue-3)' }}>
                  {hs ? hs.toFixed(2) : '--'}
                  <span className="text-[14px] text-wg-muted-2 font-semibold ml-1">m</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse-live ${d.is_live_data ? 'bg-wg-normal shadow-[0_0_10px_var(--color-wg-normal)]' : 'bg-amber-400 shadow-[0_0_10px_#f0c040]'}`} />
                  <span className="text-[11px] text-wg-muted-2 font-semibold uppercase tracking-wide">
                    {d.is_live_data ? 'Live Satellite Feed' : 'Fallback Data'}
                  </span>
                </div>
              </div>

              <ReadingBox label="Wave Period (T)" value={d.wave_period || '--'} unit="s" sub="Dominant Period" />
              <ReadingBox
                label="Wave Direction"
                value={
                  d.wave_direction ? (
                    <span className="flex items-center gap-2">
                      {/* Compass mini-icon */}
                      <span className="relative inline-flex items-center justify-center w-[26px] h-[26px] rounded-full border border-wg-blue-lt bg-wg-blue-xlt">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                          <circle cx="12" cy="12" r="10" fill="none" stroke="#deeefb" strokeWidth="1.5" />
                          {(() => {
                            const dirMap = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };
                            const deg = dirMap[d.wave_direction] || 0;
                            const rad = ((deg - 90) * Math.PI) / 180;
                            const tx = 12 + 7 * Math.cos(rad);
                            const ty = 12 + 7 * Math.sin(rad);
                            return <line x1="12" y1="12" x2={tx} y2={ty} stroke="#1870cc" strokeWidth="2" strokeLinecap="round" />;
                          })()}
                          <circle cx="12" cy="12" r="2" fill="#1870cc" />
                        </svg>
                      </span>
                      {d.wave_direction}
                    </span>
                  ) : '--'
                }
                sub="Incoming Direction"
              />
              <ReadingBox label="Swell Height" value={d.swell_wave_height != null ? Number(d.swell_wave_height).toFixed(2) : '--'} unit="m" sub="Ocean Swell" />
              <ReadingBox label="Swell Period" value={d.swell_wave_period != null ? Number(d.swell_wave_period).toFixed(1) : '--'} unit="s" sub="Swell Timing" />
              <ReadingBox
                label="Sea Condition"
                value={
                  <span className={`text-[15px] font-bold flex items-center gap-1.5 ${satHsColor}`}>
                    <span className={`w-[7px] h-[7px] rounded-full ${hs >= 2.5 ? 'bg-wg-warn' : hs >= 1.5 ? 'bg-wg-watch' : 'bg-wg-normal'}`} />
                    {satHsLabel}
                  </span>
                }
                sub="Wave Classification"
              />
              <ReadingBox
                label="Data Source"
                value={
                  <span className="text-[14px] font-semibold flex items-center gap-1.5">
                    <span className={`w-[7px] h-[7px] rounded-full ${d.is_live_data ? 'bg-wg-normal animate-pulse-live' : 'bg-amber-400'}`} />
                    <span className={d.is_live_data ? 'text-wg-normal' : 'text-amber-500'}>
                      {d.is_live_data ? 'Open-Meteo Live' : 'Fallback'}
                    </span>
                  </span>
                }
                sub="Marine Forecast API"
              />
            </div>

            <div className="px-4.5 py-2.5 text-[11px] text-wg-muted-2 border-t border-wg-border flex items-center gap-1.5">
              <span className={`w-[7px] h-[7px] rounded-full ${d.is_live_data ? 'bg-wg-normal animate-pulse-live' : 'bg-amber-400'}`} />
              Last Update: {new Date().toTimeString().slice(0, 8)} · Source: {d.is_live_data ? 'Open-Meteo Marine API' : 'Fallback Model'} · Kochi Coast
            </div>
          </div>
        </div>

        {/* Coastal Map */}
        <div className="bg-white rounded-xl border border-wg-border shadow-sm overflow-hidden mb-5">
          <div className="px-5 py-3 border-b border-wg-border text-[11px] font-bold tracking-wider uppercase text-wg-muted bg-wg-blue-xlt">
            Coastal Monitoring Map
          </div>
          <div className="h-[350px]">
            <MapContainer center={[lat, lon]} zoom={7} scrollWheelZoom={true} style={{ width: '100%', height: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
              <Circle center={[lat, lon]} radius={50000} pathOptions={{ color: '#3a9ee8', weight: 1, fillColor: '#3a9ee8', fillOpacity: 0.1, dashArray: '4, 4' }} />
              <Marker position={[lat, lon]} icon={getBuoyIcon(fusionStatus)}>
                <Popup>
                  <b>WaveGuard Buoy WG-01</b><br />
                  Status: <b>{fusionStatus}</b><br />
                  {deviceStatus && <>Device: <b>{deviceStatus}</b><br /></>}
                  Wave Height: {waveHeightCm != null ? (waveHeightCm / 100).toFixed(1) : '--'} m<br />
                  Motion Index: {motionIndex}<br />
                  {d.eta != null && <>ETA: {eta} min<br /></>}
                </Popup>
              </Marker>
              <MapUpdater center={[lat, lon]} />
            </MapContainer>
          </div>
        </div>

        {/* Aggregated Summary */}
        <div className="bg-white rounded-xl border border-wg-border shadow-sm overflow-hidden mb-0">
          <div className="px-5 py-3 border-b border-wg-border text-[11px] font-bold tracking-wider uppercase text-wg-muted bg-wg-blue-xlt">
            Aggregated System Summary
          </div>
          <div className="px-5 py-4 flex gap-9 flex-wrap">
            <SummaryItem label="Stations Online" value="1 / 1" />
            <SummaryItem label="Fusion Decision" value={getStatusConfig(fusionStatus).label} valueColor={`var(--color-wg-${fusionStatus === 'WARNING' ? 'warn' : fusionStatus.toLowerCase()})`} />
            <SummaryItem label="Buoy Status" value={buoyStatus} />
            <SummaryItem label="Device Status" value={deviceStatus || '--'} />
            <SummaryItem label="Satellite Status" value={satStatus} />
            <SummaryItem label="Wave Speed" value={`${waveSpeed} m/s`} />
            <SummaryItem label="ETA" value={d.eta != null ? `${eta} min` : '--'} />
          </div>
        </div>
      </div>

      <div className="bg-navy text-white/30 px-8 py-4 text-[11px] flex items-center justify-between">
        <span>WaveGuard – Visualization Only · No hardware control</span>
      </div>
    </div>
  );
}

function ReadingBox({ label, value, unit, sub, span = 1, valueClass = '' }) {
  return (
    <div className={`bg-white px-4 py-3.5 ${span === 2 ? 'col-span-2' : ''}`}>
      <div className="text-[10px] font-semibold tracking-wide uppercase text-wg-muted-2 mb-1">{label}</div>
      <div className={`text-xl font-bold text-navy ${valueClass}`}>
        {value}
        {unit && <span className="text-[11px] text-wg-muted-2 ml-0.5">{unit}</span>}
      </div>
      {sub && <div className="text-[11px] text-wg-muted mt-0.5">{sub}</div>}
    </div>
  );
}

function SummaryItem({ label, value, valueColor }) {
  return (
    <div>
      <div className="text-[10px] text-wg-muted-2 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-xl font-bold" style={valueColor ? { color: valueColor } : {}}>{value}</div>
    </div>
  );
}
