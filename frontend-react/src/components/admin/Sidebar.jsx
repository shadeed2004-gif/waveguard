import { useEffect } from 'react';
import { getStatusConfig } from '../../utils/statusConfig';

export default function Sidebar({ panels, activePanel, onNavigate, fusionStatus, onLogout, isOpen, onClose }) {
  const statusCfg = getStatusConfig(fusionStatus);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[99] md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`w-[220px] bg-gradient-to-b from-navy to-navy-2 min-h-screen fixed top-0 left-0 bottom-0 flex flex-col z-[100] shadow-[4px_0_24px_rgba(0,0,0,0.15)] transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="px-4 py-5 flex items-center justify-between border-b border-white/[0.08] shrink-0 bg-black/15">
          <img
            src="/assets/shield_logo_light.png"
            className="w-[160px] h-auto max-h-[72px] object-contain drop-shadow-[0_3px_10px_rgba(0,0,0,0.4)] brightness-110 cursor-pointer"
            alt="WaveGuard"
            onClick={() => { onNavigate('home'); onClose?.(); }}
          />
          <button
            onClick={onClose}
            className="md:hidden bg-white/10 border-none text-white w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer text-lg hover:bg-white/20 transition-colors"
          >&#x2715;</button>
        </div>

        <div className="text-[10px] font-bold tracking-[1.2px] uppercase text-white/25 px-5 pt-5 pb-2">
          Navigation
        </div>

        <nav className="flex-1 px-2.5 py-2">
          {panels.map((panel) => (
            <button
              key={panel.id}
              onClick={() => { onNavigate(panel.id); onClose?.(); }}
              className={`flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-150 mb-0.5 border-none bg-transparent font-[family-name:var(--font-family-sora)] ${
                activePanel === panel.id
                  ? 'bg-wg-blue-3/[0.18] text-white border-l-[3px] border-l-wg-blue-3 pl-[9px]'
                  : 'text-white/55 hover:bg-white/[0.07] hover:text-white/90'
              }`}
            >
              <span className="text-base shrink-0 w-5 text-center">{panel.icon}</span>
              <span>{panel.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-2.5 py-3.5 border-t border-white/[0.07]">
          <div className="bg-white/[0.06] rounded-lg px-3.5 py-3 mb-2">
            <div className="text-[10px] text-white/35 tracking-wider uppercase mb-1.5">System Status</div>
            <div className={`inline-flex items-center gap-1.5 text-xs font-bold tracking-wide px-2.5 py-1 rounded-xl border ${statusCfg.pillClass}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-live" />
              {statusCfg.label}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium text-white/40 cursor-pointer border-none bg-transparent hover:bg-red-500/[0.12] hover:text-red-400 transition-all duration-150 font-[family-name:var(--font-family-sora)]"
          >
            <span className="text-base w-5 text-center">&#x21a9;</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
