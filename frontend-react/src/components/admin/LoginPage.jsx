import { useState } from 'react';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('waveguard2024');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter username and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onLogin(username.trim(), password);
    } catch (err) {
      setError(err.message || 'Cannot reach the backend server. Is it running on port 8000?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: `linear-gradient(145deg, rgba(8,25,46,0.85) 0%, rgba(12,36,68,0.75) 100%), url('/assets/buoy_ocean_bg.png') center/cover no-repeat`,
      }}
    >
      {/* Decorative wave */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[200px] pointer-events-none"
        style={{
          background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 200'%3E%3Cpath fill='%23ffffff05' d='M0,100 C360,160 720,40 1080,100 C1260,130 1350,80 1440,100 L1440,200 L0,200Z'/%3E%3C/svg%3E") bottom/cover no-repeat`,
        }}
      />

      {/* Decorative text */}
      <div className="absolute text-[320px] text-white/[0.025] top-1/2 left-1/2 -translate-x-[40%] -translate-y-1/2 select-none pointer-events-none leading-none">
        〰
      </div>

      <div className="bg-white/95 backdrop-blur-xl rounded-[18px] w-[400px] shadow-[0_24px_64px_rgba(8,25,46,0.6)] overflow-hidden relative z-10 border border-white/20">
        {/* Header */}
        <div className="bg-gradient-to-br from-navy-2 to-wg-blue px-8 py-8 text-center text-white">
          <div className="w-[180px] h-auto mx-auto mb-5 flex items-center justify-center">
            <img
              src="/assets/shield_logo_light.png"
              className="w-full h-auto object-contain drop-shadow-[0_4px_20px_rgba(0,0,0,0.45)] brightness-[1.15]"
              alt="WaveGuard"
            />
          </div>
          <div className="font-[family-name:var(--font-family-dm-serif)] text-2xl mb-1">WaveGuard Admin</div>
          <div className="text-xs opacity-65 font-light">Authority Access · Visualization Dashboard</div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-7 pb-8">
          <label className="block text-[11px] font-bold tracking-wider uppercase text-wg-muted mb-1.5">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            className="w-full px-3.5 py-2.5 border-[1.5px] border-wg-border rounded-[7px] text-sm text-navy bg-white outline-none focus:border-wg-blue-3 transition-colors mb-4 font-[family-name:var(--font-family-sora)]"
          />

          <label className="block text-[11px] font-bold tracking-wider uppercase text-wg-muted mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full px-3.5 py-2.5 border-[1.5px] border-wg-border rounded-[7px] text-sm text-navy bg-white outline-none focus:border-wg-blue-3 transition-colors mb-4 font-[family-name:var(--font-family-sora)]"
          />

          {error && (
            <div className="bg-wg-warn-bg border border-wg-warn-bd text-wg-warn text-xs font-medium px-3.5 py-2 rounded-[7px] mb-3.5 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-wg-blue-2 text-white border-none rounded-[7px] text-sm font-bold cursor-pointer hover:bg-wg-blue transition-colors tracking-wide disabled:opacity-60 font-[family-name:var(--font-family-sora)]"
          >
            {loading ? 'Verifying…' : 'Login to Dashboard →'}
          </button>

          <div className="text-center mt-4 text-[11px] text-wg-muted-2">
            Contact your system administrator for credentials.
          </div>
        </form>
      </div>
    </div>
  );
}
