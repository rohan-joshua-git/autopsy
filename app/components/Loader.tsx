export default function Loader({ label }: { label: string }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#080808', color: '#3a3a30',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 18, fontSize: 12, letterSpacing: '0.1em', fontFamily: 'monospace',
    }}>
      <div style={{ width: 220, height: 70, overflow: 'hidden' }}>
        <svg width={440} height={70} viewBox="0 0 440 70" style={{ display: 'block' }}>
          <defs>
            <path
              id="ekg-wave"
              d="M0,35 L40,35 L48,22 L56,35 L70,35 L80,8 L88,62 L96,35 L110,35 L118,26 L126,35 L220,35"
            />
          </defs>
          <g style={{ animation: 'ekg-scroll 1.8s linear infinite' }}>
            <use
              href="#ekg-wave"
              stroke="#5C9A1B" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 5px rgba(92, 154, 27, 0.55))' }}
            />
            <use
              href="#ekg-wave" x={220}
              stroke="#5C9A1B" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 5px rgba(92, 154, 27, 0.55))' }}
            />
          </g>
        </svg>
      </div>
      {label}
    </div>
  );
}
