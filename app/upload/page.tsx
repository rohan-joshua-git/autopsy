'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'reflect'>('upload');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [answers, setAnswers] = useState(['', '', '']);
  const [submitted, setSubmitted] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const prompts = [
    "What was the main thing that went wrong?",
    "What were you feeling before this exam?",
    "What would you do differently?",
  ];

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setLoading(true);
    setStatusMessage('Ingesting file...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/parse-exam', { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`Parser returned status: ${response.status}`);
      const parsedData = await response.json();
      sessionStorage.setItem('latest_parsed_exam', JSON.stringify(parsedData));
      setStatusMessage('Analysis complete. Opening case file...');
      setTimeout(() => router.push('/reflect?source=upload'), 800);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Ingestion failed.');
      setLoading(false);
    }
  };

  const sidebarItems = [
    { icon: 'ti-layout-grid', label: 'Case Files', action: () => router.push('/home') },
    { icon: 'ti-upload', label: 'New Intake', active: true, action: () => {} },
    { icon: 'ti-search', label: 'Search', action: () => {} },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#c8c8c0', display: 'flex', fontFamily: 'var(--font-geist-sans, sans-serif)' }}>

      {/* Sidebar */}
      <div style={{ width: 200, background: '#0d0d0b', borderRight: '0.5px solid #1e1e1a', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '0.5px solid #1e1e1a', marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#c8c8c0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Autopsy</div>
          <div style={{ fontSize: 10, color: '#2e2e28', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>Failure Intelligence</div>
        </div>
        {sidebarItems.map(item => (
          <div key={item.label} onClick={item.action} style={{
            padding: '8px 20px', fontSize: 13,
            color: item.active ? '#c8c8c0' : '#5a5a52',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
            borderLeft: item.active ? '2px solid #3a3a30' : '2px solid transparent',
            background: item.active ? '#111110' : 'transparent',
          }}>
            <i className={`ti ${item.icon}`} style={{ fontSize: 15 }} aria-hidden="true" />
            {item.label}
          </div>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Topbar */}
        <div style={{ borderBottom: '0.5px solid #1e1e1a', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#080808' }}>
          <div style={{ fontSize: 12, color: '#3a3a30', letterSpacing: '0.06em' }}>
            case files <span style={{ color: '#5a5a52' }}>/ new intake</span>
          </div>
        </div>

        <div style={{ padding: 40, flex: 1, maxWidth: 720, width: '100%', margin: '0 auto' }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#2e2e28', marginBottom: 8 }}>New intake</div>
            <h1 style={{ fontSize: 22, fontWeight: 500, color: '#c8c8c0', margin: 0 }}>Open a case file</h1>
            <p style={{ fontSize: 13, color: '#3a3a30', marginTop: 6 }}>Upload a marked exam script or log a manual reflection.</p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 32, borderBottom: '0.5px solid #1e1e1a' }}>
            {(['upload', 'reflect'] as const).map(tab => (
              <button key={tab} onClick={() => !loading && setActiveTab(tab)} style={{
                padding: '8px 20px', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: 'transparent', border: 'none',
                borderBottom: activeTab === tab ? '1px solid #c8c8c0' : '1px solid transparent',
                color: activeTab === tab ? '#c8c8c0' : '#3a3a30',
                marginBottom: -1,
              }}>
                {tab === 'upload' ? 'Exam Script' : 'Manual Reflection'}
              </button>
            ))}
          </div>

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
              />
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); if (!loading && e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]); }}
                onClick={() => !loading && fileInputRef.current?.click()}
                style={{
                  border: `0.5px dashed ${dragOver ? '#5a5a52' : '#2e2e28'}`,
                  borderRadius: 6,
                  padding: '64px 24px',
                  textAlign: 'center',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: dragOver ? '#0f0f0d' : '#0a0a08',
                  transition: 'all 0.15s',
                }}
              >
                <i className={`ti ${loading ? 'ti-loader' : 'ti-file-upload'}`} style={{ fontSize: 28, color: '#2e2e28', display: 'block', marginBottom: 16 }} aria-hidden="true" />
                <div style={{ fontSize: 13, color: '#5a5a52', marginBottom: 6 }}>
                  {loading ? 'Analyzing script...' : 'Drop exam script here'}
                </div>
                {!loading && (
                  <div style={{ fontSize: 11, color: '#2e2e28', marginBottom: 20 }}>PDF, JPG, PNG, WEBP accepted</div>
                )}
                {!loading && (
                  <div style={{
                    display: 'inline-block', padding: '6px 16px', border: '0.5px solid #2e2e28',
                    borderRadius: 4, fontSize: 11, color: '#5a5a52', letterSpacing: '0.06em',
                  }}>
                    Browse files
                  </div>
                )}
                {statusMessage && (
                  <div style={{ fontSize: 11, marginTop: 20, fontFamily: 'monospace', color: statusMessage.startsWith('Analysis') ? '#3B6D11' : '#854F0B', letterSpacing: '0.04em' }}>
                    {statusMessage}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 24, padding: 16, border: '0.5px solid #1a1a16', borderRadius: 6, background: '#0a0a08' }}>
                <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2e2e28', marginBottom: 10 }}>What gets extracted</div>
                {[
                  { icon: 'ti-number', label: 'Question numbers and marks lost' },
                  { icon: 'ti-tag', label: 'Root cause classification (18 categories)' },
                  { icon: 'ti-vector-triangle', label: 'Pattern tags for relationship map' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', fontSize: 12, color: '#3a3a30' }}>
                    <i className={`ti ${item.icon}`} style={{ fontSize: 14, color: '#2e2e28' }} aria-hidden="true" />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reflect Tab */}
          {activeTab === 'reflect' && (
            <div>
              {submitted ? (
                <div style={{ border: '0.5px solid #1a2e1a', borderRadius: 6, padding: 32, textAlign: 'center', background: '#0a120a' }}>
                  <i className="ti ti-check" style={{ fontSize: 24, color: '#3B6D11', display: 'block', marginBottom: 12 }} aria-hidden="true" />
                  <div style={{ fontSize: 13, color: '#5a5a52', marginBottom: 16 }}>Reflection logged.</div>
                  <button onClick={() => { setSubmitted(false); setAnswers(['', '', '']); }} style={{
                    background: 'transparent', border: '0.5px solid #2e2e28', color: '#5a5a52',
                    padding: '6px 16px', borderRadius: 4, fontSize: 11, cursor: 'pointer', letterSpacing: '0.06em',
                  }}>
                    Log another
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {prompts.map((prompt, i) => (
                    <div key={i} style={{ border: '0.5px solid #1e1e1a', borderRadius: 6, padding: 20, background: '#0a0a08' }}>
                      <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2e2e28', marginBottom: 8 }}>
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div style={{ fontSize: 13, color: '#5a5a52', marginBottom: 12 }}>{prompt}</div>
                      <textarea
                        value={answers[i]}
                        onChange={e => { const u = [...answers]; u[i] = e.target.value; setAnswers(u); }}
                        placeholder="Enter response..."
                        style={{
                          width: '100%', background: '#080808', border: '0.5px solid #1e1e1a',
                          color: '#c8c8c0', borderRadius: 4, padding: '10px 12px', fontSize: 12,
                          fontFamily: 'monospace', resize: 'none', height: 80, outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => setSubmitted(true)}
                    disabled={answers.every(a => a.trim() === '')}
                    style={{
                      alignSelf: 'flex-start', background: '#1a1a16', border: '0.5px solid #2e2e28',
                      color: '#c8c8c0', padding: '8px 20px', borderRadius: 4, fontSize: 12,
                      cursor: 'pointer', letterSpacing: '0.04em', opacity: answers.every(a => a.trim() === '') ? 0.4 : 1,
                    }}
                  >
                    Commit reflection
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}