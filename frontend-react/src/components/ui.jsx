import { getStatusConfig } from '../utils/statusConfig';

export function StatusBadge({ status, className = '' }) {
  const cfg = getStatusConfig(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${cfg.badgeClass} ${className}`}>
      <span className={`w-[5px] h-[5px] rounded-full bg-current`} />
      {cfg.label}
    </span>
  );
}

export function KpiCard({ label, value, unit, sub, accent = 'blue', delay = 0 }) {
  const borderColors = {
    blue: 'border-t-wg-blue-2',
    normal: 'border-t-wg-normal',
    watch: 'border-t-wg-watch',
    warn: 'border-t-wg-warn',
  };
  return (
    <div
      className={`bg-white rounded-xl border border-wg-border/60 shadow-sm p-4.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-t-[3px] ${borderColors[accent] || borderColors.blue} animate-fade-slide-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-[10px] font-bold tracking-wider uppercase text-wg-muted-2 mb-2">{label}</div>
      <div className="text-[26px] font-bold text-navy leading-none">
        {value}
        {unit && <span className="text-[13px] text-wg-muted-2 font-normal ml-1">{unit}</span>}
      </div>
      {sub && <div className="text-[11px] text-wg-muted mt-1.5">{sub}</div>}
    </div>
  );
}

export function Card({ title, children, className = '', bodyClassName = '' }) {
  return (
    <div className={`bg-white/[0.98] rounded-xl border border-wg-border/80 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-slide-up ${className}`}>
      {title && (
        <div className="px-5 py-3 border-b border-wg-border text-[11px] font-bold tracking-wider uppercase text-wg-muted bg-wg-blue-xlt flex items-center justify-between">
          {title}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
}

export function PageHero({ eyebrow, title, subtitle }) {
  return (
    <div className="relative overflow-hidden min-h-[180px] px-12 py-10 flex flex-col justify-center text-white bg-navy" style={{
      background: `linear-gradient(90deg, rgba(8,25,46,0.9) 0%, rgba(12,36,68,0.5) 45%, transparent 100%), url('/assets/buoy_ultra_wide_bg.png') center right / cover no-repeat, #08192e`
    }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 50% 80% at 90% 50%, rgba(58,158,232,.1) 0%, transparent 70%)' }} />
      <div className="relative z-10">
        <div className="text-[10px] font-bold tracking-[1.6px] uppercase text-wg-blue-3 mb-2">{eyebrow}</div>
        <h2 className="font-[family-name:var(--font-family-dm-serif)] text-[26px] leading-tight mb-1.5">{title}</h2>
        <p className="text-[13px] opacity-65 font-light">{subtitle}</p>
      </div>
      <div className="absolute bottom-[-2px] left-0 right-0 h-14" style={{
        background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 56'%3E%3Cpath fill='%23f4f7fb' d='M0,28 C360,56 720,0 1080,28 C1260,42 1350,14 1440,28 L1440,56 L0,56Z'/%3E%3C/svg%3E") bottom/cover no-repeat`
      }} />
    </div>
  );
}

export function Toast({ message, type = 'info', show }) {
  const colorMap = { success: 'toast-success', error: 'toast-error', warn: 'toast-warn', info: 'toast-info' };
  return (
    <div className="toast-container">
      <div className={`toast-item ${colorMap[type] || colorMap.info} ${show ? 'show' : ''}`}>
        {message}
      </div>
    </div>
  );
}
