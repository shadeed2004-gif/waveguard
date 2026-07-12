import { PageHero, Card } from '../ui';

const TEAM = [
  { role: 'Project Lead', name: 'MUHAMMED AJMAL P' },
  { role: 'Hardware Engineer', name: 'MUHAMMED AJMAL P, SINAN RAHMAN MP' },
  { role: 'Software Developer', name: 'MOHAMMED SHADEED P, MUHAMMED ADIL PP' },
  { role: 'Faculty Adviser', name: 'PROF. ELDO P ELIAS' },
];

const TECH_CHIPS = ['ESP32', 'MPU-6050', 'NEO-6M GPS', 'Firebase', 'SQLite', 'SQLAlchemy', 'React + Tailwind', 'WiFi 802.11'];

export default function AboutPanel() {
  return (
    <div className="flex flex-col flex-1 animate-fade-slide-up">
      <PageHero
        eyebrow="Project Documentation"
        title="About WaveGuard"
        subtitle="Project background, team, institution, and funding acknowledgment"
      />
      <div className="px-8 py-7 flex-1">
        {/* Hero Block */}
        <div className="bg-gradient-to-br from-navy-2 to-wg-blue px-8 py-8 text-white rounded-xl mb-5 relative overflow-hidden">
          <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 text-[180px] opacity-[0.04] pointer-events-none leading-none">〰</div>
          <div className="text-[10px] opacity-50 tracking-[1.4px] uppercase mb-2.5">System Overview</div>
          <div className="font-[family-name:var(--font-family-dm-serif)] text-[32px] mb-2">WaveGuard</div>
          <div className="text-[15px] opacity-80 max-w-[560px] leading-relaxed font-light">
            Smart Near-Shore Swell Surge Early Warning System — An academic-funded IoT prototype for coastal community safety and disaster preparedness in Kanayannur, Kerala.
          </div>
          <div className="mt-4.5 flex gap-2.5 flex-wrap">
            {['Version 1.0.0', 'Academic Prototype 2024–25', 'Visualization Only'].map(tag => (
              <span key={tag} className="bg-white/[0.14] border border-white/[0.22] px-3.5 py-1 rounded-full text-[11px] font-semibold">{tag}</span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4.5 mb-5">
          <Card title="Mission Statement" className="mb-0">
            <div className="text-sm leading-relaxed text-wg-muted">
              WaveGuard is designed to provide early warning of dangerous swell surge conditions to coastal communities, fishermen, and local authorities in the Kanayannur coastal zone of Kerala.
              <br /><br />
              The website serves purely as a <strong className="text-navy">visualization and monitoring interface</strong>. All alert decisions are made autonomously by the ESP32 hardware based on sensor thresholds. The web platform displays those decisions to authority personnel and the public.
            </div>
          </Card>

          <Card title="Project Team" className="mb-0">
            <div className="grid grid-cols-2 gap-2.5">
              {TEAM.map((m, i) => (
                <div key={i} className="bg-wg-off rounded-[7px] px-3.5 py-3">
                  <div className="text-[10px] text-wg-muted-2 uppercase tracking-wide mb-0.5">{m.role}</div>
                  <div className="text-sm font-semibold">{m.name}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4.5">
          <Card title="Technology Stack" className="mb-0">
            <div className="flex flex-wrap gap-2 mt-2.5">
              {TECH_CHIPS.map(c => (
                <span key={c} className="px-3 py-1 rounded-full text-[11px] font-semibold bg-wg-blue-xlt text-wg-blue border border-wg-blue-lt">{c}</span>
              ))}
            </div>
          </Card>

          <Card title="Institution & Funding" className="mb-0">
            <div className="text-[13px] leading-[2] text-wg-muted">
              <div><strong className="text-navy">Institution:</strong> MACE KOTHAMANGALAM</div>
              <div><strong className="text-navy">Department:</strong> COMPUTER SCIENCE AND ENGINEERING</div>
              <div><strong className="text-navy">Funding Body:</strong> ALUMINI</div>
              <div><strong className="text-navy">Project Type:</strong> Academic Funded Prototype</div>
              <div><strong className="text-navy">Academic Year:</strong> 2024–25</div>
              <div><strong className="text-navy">Location:</strong> KOTHAMANGALAM, KERALA, INDIA</div>
            </div>
          </Card>
        </div>
      </div>

      <div className="bg-navy text-white/30 px-8 py-4 text-[11px] flex items-center justify-between">
        <span>WaveGuard – Smart Near-Shore Swell Surge Early Warning System · Visualization Only</span>
        <span>Kothamangalam, Kerala</span>
      </div>
    </div>
  );
}
