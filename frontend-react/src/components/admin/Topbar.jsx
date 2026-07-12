import { useState, useEffect } from 'react';

export default function Topbar({ title, subtitle, backendOnline, lastSuccessTime, username, onMenuOpen }) {
  const [clock, setClock] = useState('--:--:--');
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    const tick = () => setClock(new Date().toTimeString().slice(0, 8));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (!lastSuccessTime) return;
      const sec = Math.round((Date.now() - lastSuccessTime) / 1000);
      setLastUpdated(sec <= 1 ? 'just now' : `${sec}s ago`);
    }, 1000);
    return () => clearInterval(id);
  }, [lastSuccessTime]);

  return (
    <div className="h-[58px] bg-white border-b border-wg-border px-4 md:px-8 flex items-center justify-between sticky top-0 z-50 shadow-[0_1px_8px_rgba(8,25,46,0.06)] gap-2">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuOpen}
          className="md:hidden shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-wg-border bg-wg-off text-navy text-lg cursor-pointer hover:bg-wg-blue-xlt transition-colors"
          aria-label="Open menu"
        >&#9776;</button>
        <div className="flex flex-col min-w-0">
          <div className="text-sm md:text-base font-bold text-navy truncate">{title}</div>
          <div className="text-[11px] text-wg-muted-2 mt-px hidden sm:block truncate">WaveGuard Admin &middot; <span>{subtitle}</span></div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3.5 shrink-0">
        <div className="flex items-center gap-1.5 px-2 md:px-3 py-1 rounded-full bg-wg-blue-xlt border border-wg-border">
          <div
            className="w-2 h-2 rounded-full shrink-0 transition-all duration-400"
            style={{
              background: backendOnline === true ? 'var(--color-wg-normal)' : backendOnline === false ? 'var(--color-wg-warn)' : 'var(--color-wg-muted-2)',
              boxShadow: backendOnline === true ? '0 0 0 3px rgba(26,140,80,.25)' : backendOnline === false ? '0 0 0 3px rgba(190,48,24,.25)' : 'none',
            }}
          />
          <span className="text-[11px] font-semibold whitespace-nowrap transition-colors hidden sm:inline" style={{ color: backendOnline === true ? 'var(--color-wg-normal)' : backendOnline === false ? 'var(--color-wg-warn)' : 'var(--color-wg-muted)' }}>
            {backendOnline === true ? 'Backend Online' : backendOnline === false ? 'Backend Offline' : 'Connecting…'}
          </span>
          {lastUpdated && <span className="text-[10px] text-wg-muted-2 font-normal ml-0.5 hidden md:inline">{lastUpdated}</span>}
        </div>
        <div className="text-[13px] font-semibold text-wg-muted tabular-nums hidden sm:block">{clock}</div>
        <div className="flex items-center gap-2 bg-wg-blue-xlt border border-wg-blue-lt px-2 md:px-3.5 py-1.5 rounded-full text-xs font-semibold text-wg-blue">
          <div className="w-6 h-6 rounded-full bg-wg-blue-2 flex items-center justify-center text-white text-[11px] font-bold">
            {(username || 'A')[0].toUpperCase()}
          </div>
          <span className="hidden md:inline">{username}</span>
        </div>
      </div>
    </div>
  );
}
