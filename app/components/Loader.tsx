export default function Loader({ label }: { label: string }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#080808', color: '#3a3a30',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 14, fontSize: 12, letterSpacing: '0.1em', fontFamily: 'monospace',
    }}>
      <div style={{ display: 'flex', gap: 5 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%', background: '#5a5a52',
            animation: 'pulse-dot 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.15}s`,
          }} />
        ))}
      </div>
      {label}
    </div>
  );
}
