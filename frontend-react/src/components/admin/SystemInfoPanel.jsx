import { PageHero, Card } from '../ui';

const HW_SPECS = [
  ['Microcontroller', 'ESP32 (Xtensa LX6 dual-core)'],
  ['IMU Sensor', 'MPU-6050 (Accelerometer + Gyro)'],
  ['GPS Module', 'NEO-6M (u-blox)'],
  ['Communication', 'WiFi 802.11 b/g/n + HTTP REST'],
  ['Sampling Rate', 'Every 5 seconds (10 Hz IMU)'],
  ['Power Supply', 'Solar Panel + LiPo Battery'],
  ['Enclosure', 'Marine-grade ABS · IP67'],
  ['Accel Range', '±16g (MPU-6050)'],
];

const SW_SPECS = [
  ['Firmware Version', 'WG-FW v1.0.0'],
  ['Build Date', '2025-01-10'],
  ['Backend Server', 'Python FastAPI + Uvicorn'],
  ['Database', 'SQLite (via SQLAlchemy ORM)'],
  ['Data Protocol', 'HTTP REST API (JSON)'],
  ['Frontend', 'React + Tailwind CSS'],
  ['Last Firmware Push', '2025-01-15'],
  ['OTA Updates', 'Enabled (ESP32 OTA)'],
];

export default function SystemInfoPanel() {
  return (
    <div className="flex flex-col flex-1 animate-fade-slide-up">
      <PageHero
        eyebrow="Technical Reference"
        title="System Info"
        subtitle="Hardware specifications, firmware version, and deployment details · Read-only reference"
      />
      <div className="px-8 py-7 flex-1">
        <div className="grid grid-cols-2 gap-4.5 mb-5">
          <Card title="Hardware Specification" className="mb-0" bodyClassName="p-0">
            {HW_SPECS.map(([key, val], i) => (
              <div key={i} className={`grid grid-cols-[170px_1fr] px-5 py-3 text-[13px] items-center ${i < HW_SPECS.length - 1 ? 'border-b border-wg-border' : ''}`}>
                <span className="text-wg-muted font-medium">{key}</span>
                <span className="text-navy font-semibold">{val}</span>
              </div>
            ))}
          </Card>
          <Card title="Software & Firmware" className="mb-0" bodyClassName="p-0">
            {SW_SPECS.map(([key, val], i) => (
              <div key={i} className={`grid grid-cols-[170px_1fr] px-5 py-3 text-[13px] items-center ${i < SW_SPECS.length - 1 ? 'border-b border-wg-border' : ''}`}>
                <span className="text-wg-muted font-medium">{key}</span>
                <span className="text-navy font-semibold">{val}</span>
              </div>
            ))}
          </Card>
        </div>

        <Card title="Station Deployment Details" className="mb-0" bodyClassName="p-0">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {['Station', 'Location Name', 'Coordinates', 'Installed', 'Power Source', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 bg-wg-blue-xlt text-wg-blue text-[10px] uppercase tracking-wider font-bold border-b border-wg-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-wg-blue-xlt">
                <td className="px-4 py-2.5 font-semibold">WG-01</td>
                <td className="px-4 py-2.5">Kothamangalam Shore Node</td>
                <td className="px-4 py-2.5">9.9312° N, 76.2673° E</td>
                <td className="px-4 py-2.5">2025-01-15</td>
                <td className="px-4 py-2.5">Solar + LiPo Battery</td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border bg-wg-normal-bg text-wg-normal border-wg-normal-bd">
                    <span className="w-[5px] h-[5px] rounded-full bg-current" />Online
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>

      <div className="bg-navy text-white/30 px-8 py-4 text-[11px]">WaveGuard – Read-Only Reference · No Configuration Controls</div>
    </div>
  );
}
