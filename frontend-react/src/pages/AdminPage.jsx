import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchStatus, login as apiLogin, logout as apiLogout } from '../services/api';
import { getStatusConfig } from '../utils/statusConfig';
import { Toast } from '../components/ui';
import LoginPage from '../components/admin/LoginPage';
import Sidebar from '../components/admin/Sidebar';
import Topbar from '../components/admin/Topbar';
import HomePanel from '../components/admin/HomePanel';
import StatusPanel from '../components/admin/StatusPanel';
import AlertsPanel from '../components/admin/AlertsPanel';
import AnalyticsPanel from '../components/admin/AnalyticsPanel';
import SystemInfoPanel from '../components/admin/SystemInfoPanel';
import AboutPanel from '../components/admin/AboutPanel';
import RecipientsPanel from '../components/admin/RecipientsPanel';

const PANELS = [
  { id: 'home', label: 'Home', icon: '🏠', title: 'Admin Home', sub: 'Dashboard Overview' },
  { id: 'status', label: 'System Status', icon: '📡', title: 'System Status', sub: 'Live Station Readings' },
  { id: 'alerts', label: 'Alerts Log', icon: '🔔', title: 'Alerts Log', sub: 'Chronological Alert History' },
  { id: 'analytics', label: 'Analytics', icon: '📊', title: 'Analytics', sub: 'Historical Sensor Trends' },
  { id: 'sysinfo', label: 'System Info', icon: '🔧', title: 'System Info', sub: 'Hardware & Deployment Reference' },
  { id: 'about', label: 'About Project', icon: '📄', title: 'About Project', sub: 'Project Documentation' },
  { id: 'recipients', label: 'Alert Recipients', icon: '📱', title: 'Alert Recipients', sub: 'SMS Alert Contact Management' },
];

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activePanel, setActivePanel] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mode, setMode] = useState('live');
  const [data, setData] = useState(null);
  const [backendOnline, setBackendOnline] = useState(null);
  const [lastSuccessTime, setLastSuccessTime] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const prevFusionRef = useRef(null);

  // Check for persisted session (validate token with backend)
  useEffect(() => {
    const token = sessionStorage.getItem('wg_token');
    if (token) {
      fetch('/api/health', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) setIsLoggedIn(true);
          else { sessionStorage.removeItem('wg_token'); sessionStorage.removeItem('wg_user'); }
        })
        .catch(() => { sessionStorage.removeItem('wg_token'); sessionStorage.removeItem('wg_user'); });
    }
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 6000);
  }, []);

  // Poll backend
  const poll = useCallback(async () => {
    try {
      const d = await fetchStatus(mode);
      setData(d);
      setBackendOnline(true);
      setLastSuccessTime(Date.now());

      // Check for escalation
      const newStatus = d.fusion_status || 'NORMAL';
      const prev = prevFusionRef.current;
      if (prev !== null) {
        const levels = { NORMAL: 0, WATCH: 1, WARNING: 2 };
        const p = levels[prev] || 0;
        const n = levels[newStatus] || 0;
        if (n > p) {
          if (newStatus === 'WARNING') showToast('🚨 ALERT — Status escalated to WARNING. Issue urgent advisory.', 'error');
          else if (newStatus === 'WATCH') showToast('⚠️ WATCH level — Elevated wave activity detected.', 'warn');
        } else if (p > 0 && n === 0) {
          showToast('✅ Status returned to NORMAL. Sea conditions safe.', 'success');
        }
      }
      prevFusionRef.current = newStatus;
    } catch {
      setBackendOnline(false);
    }
  }, [showToast, mode]);

  useEffect(() => {
    if (!isLoggedIn) return;
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [isLoggedIn, poll]);

  const handleLogin = async (username, password) => {
    const res = await apiLogin(username, password);
    sessionStorage.setItem('wg_token', res.token);
    sessionStorage.setItem('wg_user', username);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    const token = sessionStorage.getItem('wg_token');
    if (token) await apiLogout(token);
    sessionStorage.removeItem('wg_token');
    sessionStorage.removeItem('wg_user');
    setIsLoggedIn(false);
    setData(null);
    prevFusionRef.current = null;
  };

  const fusionStatus = data?.fusion_status || 'NORMAL';
  const panelInfo = PANELS.find(p => p.id === activePanel) || PANELS[0];

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-wg-off font-[family-name:var(--font-family-sora)]">
      <Sidebar
        panels={PANELS}
        activePanel={activePanel}
        onNavigate={setActivePanel}
        fusionStatus={fusionStatus}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="md:ml-[220px] flex-1 flex flex-col min-w-0 min-h-screen relative">
        {/* Watermark */}
        <div className="fixed pointer-events-none z-0" style={{
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '85%', height: '85%',
        }}>
          <img src="/assets/shield_logo_light.png" alt="" className="w-full h-full object-contain opacity-[0.05]" />
        </div>

        <Topbar
          title={panelInfo.title}
          subtitle={panelInfo.sub}
          backendOnline={backendOnline}
          lastSuccessTime={lastSuccessTime}
          username={sessionStorage.getItem('wg_user') || 'Admin'}
          onMenuOpen={() => setSidebarOpen(true)}
        />

        {/* Historical Mode Toggle */}
        <div className="relative z-20 px-8 pt-2 pb-0 flex items-center gap-3">
          <button
            id="historical-mode-toggle"
            onClick={() => setMode(m => m === 'live' ? 'historical' : 'live')}
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide border transition-all duration-300 flex items-center gap-2 ${
              mode === 'historical'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-lg shadow-amber-500/10'
                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            {mode === 'historical' ? '📜' : '🔴'}
            {mode === 'historical' ? 'Historical Mode (Jun 2023 Monsoon)' : 'Live Mode'}
          </button>
          {mode === 'historical' && (
            <span className="text-[11px] text-amber-400/70 font-medium animate-pulse">
              ⚡ Showing archived storm data for demo
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          {activePanel === 'home' && <HomePanel data={data} />}
          {activePanel === 'status' && <StatusPanel data={data} />}
          {activePanel === 'alerts' && <AlertsPanel data={data} />}
          {activePanel === 'analytics' && <AnalyticsPanel data={data} />}
          {activePanel === 'sysinfo' && <SystemInfoPanel />}
          {activePanel === 'about' && <AboutPanel />}
          {activePanel === 'recipients' && <RecipientsPanel showToast={showToast} />}
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </div>
  );
}
