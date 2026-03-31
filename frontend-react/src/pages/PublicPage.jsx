import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchStatus } from '../services/api';

const SAFETY_RULES = {
  normal: [
    { emoji: '🏖️', en: 'Beach conditions are safe — enjoy the coast', ml: 'കടൽത്തീരം സുരക്ഷിതമാണ് — ആസ്വദിക്കൂ' },
    { emoji: '🏊', en: 'Swim only in lifeguard-monitored zones', ml: 'ലൈഫ്‌ഗാർഡ് നിരീക്ഷിക്കുന്ന മേഖലകളിൽ മാത്രം നീന്തുക' },
    { emoji: '👀', en: 'Keep an eye on children near the water', ml: 'വെള്ളത്തിനടുത്ത് കുട്ടികളെ ശ്രദ്ധിക്കുക' },
    { emoji: '📻', en: 'Stay informed — conditions can change quickly', ml: 'വിവരങ്ങൾ അറിഞ്ഞിരിക്കുക — സാഹചര്യം പെട്ടെന്ന് മാറാം' },
  ],
  watch: [
    { emoji: '⚠️', en: 'Avoid swimming in deep water', ml: 'ആഴമുള്ള വെള്ളത്തിൽ നീന്തൽ ഒഴിവാക്കുക' },
    { emoji: '⛵', en: 'Fishermen should exercise caution while sailing', ml: 'മത്സ്യത്തൊഴിലാളികൾ ജാഗ്രത പാലിക്കുക' },
    { emoji: '🌊', en: 'Stay alert near the shoreline — waves may surge', ml: 'കടൽത്തീരത്ത് ജാഗ്രത പാലിക്കുക — തിരമാലകൾ ഉയരാം' },
    { emoji: '🚸', en: 'Supervise children closely near the water', ml: 'വെള്ളത്തിനടുത്ത് കുട്ടികളെ കർശനമായി നിരീക്ഷിക്കുക' },
  ],
  warning: [
    { emoji: '🚫', en: 'Do not enter the sea', ml: 'കടലിലേക്ക് പോകരുത്' },
    { emoji: '⛵', en: 'Fishermen should avoid sailing', ml: 'മത്സ്യത്തൊഴിലാളികൾ കടലിൽ പോകുന്നത് ഒഴിവാക്കുക' },
    { emoji: '🌊', en: 'Stay away from the shoreline', ml: 'കടൽത്തീരത്ത് നിന്ന് അകലം പാലിക്കുക' },
    { emoji: '🚸', en: 'Keep children away from the water', ml: 'കുട്ടികളെ കടലിനോട് ചേർന്നിടത്ത് കളിക്കാൻ അനുവദിക്കരുത്' },
  ],
};

const EMERGENCY_CONTACTS = [
  { title: 'Coast Guard', number: '1554' },
  { title: 'Disaster Management', number: '1070' },
  { title: 'Police', number: '100' },
  { title: 'Ambulance', number: '108' },
];

const STATUS_VIEWS = {
  normal: {
    titleEn: 'Sea conditions are safe',
    titleMl: 'കടൽ സുരക്ഷിതമാണ്',
    subEn: 'No immediate danger detected on your coastline. Stay informed for updates.',
    subMl: 'നിലവിൽ അപായമൊന്നുമില്ല',
    pulseColor: 'bg-pub-safe',
    pulseGlow: 'shadow-[0_0_50px_var(--color-pub-safe)]',
    ringBorder: 'border-pub-safe',
  },
  watch: {
    titleEn: 'Condition: Watch',
    titleMl: 'സൂക്ഷിക്കുക',
    subEn: 'Minor turbulence detected in the sea. Exercise caution while approaching shore.',
    subMl: 'കടലിൽ നേരിയ പ്രക്ഷുബ്ധതയ്ക്ക് സാധ്യതയുണ്ട്',
    titleColor: 'text-pub-caution',
    pulseColor: 'bg-pub-caution',
    pulseGlow: 'shadow-[0_0_50px_var(--color-pub-caution)]',
    ringBorder: 'border-pub-caution',
  },
  warning: {
    titleEn: 'DANGER ALERT!',
    titleMl: 'അപായ മുന്നറിയിപ്പ്!',
    subEn: 'High waves and life-threatening currents detected. Stay away from the ocean immediately.',
    subMl: 'കടലിൽ വലിയ തിരമാലകൾക്ക് സാധ്യത',
    titleColor: 'text-pub-danger',
    pulseColor: 'bg-pub-danger',
    pulseGlow: 'shadow-[0_0_50px_var(--color-pub-danger)]',
    ringBorder: 'border-pub-danger',
  },
};

export default function PublicPage() {
  const [lang, setLang] = useState(() => localStorage.getItem('wg_lang') || 'en');
  const [status, setStatus] = useState('normal');

  const changeLang = (l) => { setLang(l); localStorage.setItem('wg_lang', l); };
  const t = (en, ml) => lang === 'ml' ? ml : en;

  const pollStatus = useCallback(async () => {
    try {
      const data = await fetchStatus();
      setStatus((data.fusion_status || 'NORMAL').toLowerCase());
    } catch { /* backend offline */ }
  }, []);

  useEffect(() => { pollStatus(); const id = setInterval(pollStatus, 5000); return () => clearInterval(id); }, [pollStatus]);

  // Listen for lang change across tabs
  useEffect(() => {
    const handler = (e) => { if (e.key === 'wg_lang') setLang(e.newValue || 'en'); };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const view = STATUS_VIEWS[status] || STATUS_VIEWS.normal;
  const bannerBg = status === 'warning'
    ? 'before:bg-[radial-gradient(circle,rgba(239,68,68,0.15)_0%,transparent_70%)]'
    : status === 'watch'
    ? 'before:bg-[radial-gradient(circle,rgba(245,158,11,0.15)_0%,transparent_70%)]'
    : 'before:bg-[radial-gradient(circle,rgba(16,185,129,0.15)_0%,transparent_70%)]';

  return (
    <div className="min-h-screen bg-pub-bg text-white flex flex-col relative overflow-x-hidden font-[family-name:var(--font-family-sora)]">
      {/* Watermark */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <img src="/assets/shield_logo_light.png" alt="" className="w-[90%] h-[90%] object-contain opacity-[0.07]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 px-8 py-6 flex justify-between items-center">
        <div className="flex items-center pl-2">
          <img src="/assets/shield_logo_light.png" className="h-[110px] w-auto object-contain drop-shadow-md" alt="WaveGuard" />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => changeLang('ml')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${lang === 'ml'
              ? 'bg-gradient-to-r from-blue-900 to-blue-500 text-white shadow-lg shadow-blue-500/45 border-transparent'
              : 'bg-white/90 text-pub-bg border border-black/10 shadow-md hover:bg-white hover:-translate-y-0.5'
            }`}
          >
            🌐 മലയാളം
          </button>
          <button
            onClick={() => changeLang('en')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${lang === 'en'
              ? 'bg-gradient-to-r from-blue-900 to-blue-500 text-white shadow-lg shadow-blue-500/45 border-transparent'
              : 'bg-white/90 text-pub-bg border border-black/10 shadow-md hover:bg-white hover:-translate-y-0.5'
            }`}
          >
            🌐 English
          </button>
        </div>
      </nav>

      {/* Status Banner */}
      <div className={`relative px-6 py-[120px] text-center min-h-[540px] flex flex-col justify-center items-center bg-pub-bg transition-all duration-1000 overflow-hidden ${bannerBg} before:absolute before:w-[600px] before:h-[600px] before:top-[-150px] before:right-[-150px] before:z-[1] before:transition-all before:duration-1000`}>
        <div className="relative z-10 bg-white/[0.03] backdrop-blur-3xl border border-white/10 px-12 py-16 rounded-[40px] max-w-[800px] w-[90%] shadow-[0_40px_100px_rgba(0,0,0,0.5)] animate-hero-float">
          <div className="text-xs font-extrabold uppercase tracking-[5px] text-pub-accent mb-8 opacity-80">
            {t('Coastal Safety Monitor', 'തീരദേശ സുരക്ഷാ മുന്നറിയിപ്പ്')}
          </div>

          {/* Pulse */}
          <div className={`relative w-[100px] h-[100px] ${view.pulseColor} rounded-full mx-auto mb-8 ${view.pulseGlow} transition-all duration-500`}>
            <div className={`absolute -inset-[15px] border-2 ${view.ringBorder} rounded-full animate-pulse-ring opacity-40`} />
          </div>

          <h1 className={`text-[56px] font-extrabold mb-4 leading-[1.1] tracking-[-2px] ${view.titleColor || ''}`}>
            {t(view.titleEn, view.titleMl)}
          </h1>
          <p className="text-xl opacity-60 max-w-[600px] mx-auto font-normal">
            {t(view.subEn, view.subMl)}
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-6 py-10 max-w-[640px] mx-auto w-full relative z-10">
        {/* Safety Instructions — dynamic per status */}
        {(() => {
          const rules = SAFETY_RULES[status] || SAFETY_RULES.normal;
          const headerIcon = status === 'warning' ? '🚨' : status === 'watch' ? '⚠️' : '✅';
          const headerTitle = status === 'warning'
            ? t('Urgent Safety Instructions', 'അടിയന്തര സുരക്ഷാ നിർദ്ദേശങ്ങൾ')
            : status === 'watch'
            ? t('Safety Precautions', 'മുൻകരുതൽ നിർദ്ദേശങ്ങൾ')
            : t('General Safety Tips', 'പൊതു സുരക്ഷാ നിർദ്ദേശങ്ങൾ');
          const borderAccent = status === 'warning'
            ? 'border-red-500/30'
            : status === 'watch'
            ? 'border-amber-500/30'
            : 'border-white/[0.08]';
          const headerBg = status === 'warning'
            ? 'bg-red-500/[0.08]'
            : status === 'watch'
            ? 'bg-amber-500/[0.06]'
            : 'bg-white/[0.06]';
          const iconBg = status === 'warning'
            ? 'bg-red-500/[0.15] border-red-500/25'
            : status === 'watch'
            ? 'bg-amber-500/[0.15] border-amber-500/25'
            : 'bg-blue-500/[0.12] border-blue-500/20';
          return (
            <div className={`bg-white/[0.04] backdrop-blur-xl rounded-3xl border ${borderAccent} shadow-[0_12px_40px_rgba(0,0,0,0.3)] mb-8 overflow-hidden hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] transition-all duration-300`}>
              <div className={`px-6 py-5 text-lg font-bold flex items-center gap-3 ${headerBg} border-b ${borderAccent}`}>
                <span className="text-xl">{headerIcon}</span>
                {headerTitle}
              </div>
              <div className="p-6">
                <ul className="flex flex-col gap-1.5">
                  {rules.map((rule, i) => (
                    <li key={i} className="flex gap-4 items-center text-[15px] font-medium text-white/85 leading-snug px-4 py-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.07] transition-colors">
                      <div className={`w-11 h-11 ${iconBg} rounded-[14px] flex items-center justify-center text-xl shrink-0`}>
                        {rule.emoji}
                      </div>
                      <span>{t(rule.en, rule.ml)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })()}

        {/* Emergency Contacts */}
        <div className="bg-white/[0.04] backdrop-blur-xl rounded-3xl border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.3)] mb-8 overflow-hidden hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] transition-all duration-300">
          <div className="px-6 py-5 text-lg font-bold flex items-center gap-3 bg-white/[0.06] border-b border-white/[0.08]">
            <span className="text-xl">🚨</span>
            {t('Emergency Contacts', 'അടിയന്തര സഹായം')}
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-2.5">
              {EMERGENCY_CONTACTS.map((c, i) => (
                <div key={i} className="bg-white/[0.04] border border-white/[0.07] px-5 py-4.5 rounded-[18px] flex justify-between items-center hover:bg-white/[0.08] hover:border-blue-500/25 transition-all duration-200">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400/80">{c.title}</span>
                    <span className="text-[28px] font-extrabold tracking-tight">{c.number}</span>
                  </div>
                  <a
                    href={`tel:${c.number}`}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white no-underline px-5 py-2.5 rounded-[14px] font-bold text-[13px] shadow-lg shadow-blue-500/30 border border-blue-400/30 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-xl hover:shadow-blue-500/45 transition-all duration-200"
                  >
                    {t('📞 Call Now', '📞 വിളിക്കുക')}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center px-6 py-10 text-sm text-slate-400 border-t border-white/10">
        <div>{t('WaveGuard Coastal Safety System', 'WaveGuard തീരദേശ സുരക്ഷാ സംവിധാനം')}</div>
        <Link
          to="/admin"
          className="inline-block mt-3 text-xs font-semibold text-slate-400 no-underline px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white hover:text-pub-bg hover:border-pub-bg transition-all duration-200"
        >
          Admin Dashboard Access
        </Link>
      </footer>
    </div>
  );
}
