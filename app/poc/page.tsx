'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const DEMO_ENTRIES = [
  {
    id: 'e1', title: 'CS2040 Finals', date: '28 May 2026',
    tags: ['Logic Branching Error', 'Edge Case Neglect'],
    marks: 12,
    questions: [
      { q: '3a', error: 'Logic Branching Error', marks: 5, note: 'Failed to handle null pointer in recursive case.' },
      { q: '4b', error: 'Edge Case Neglect', marks: 7, note: 'Did not consider empty input array.' },
    ]
  },
  {
    id: 'e2', title: 'MA2001 Midterm', date: '20 May 2026',
    tags: ['Calculation Flaw', 'Algebraic Slip'],
    marks: 8,
    questions: [
      { q: '2', error: 'Calculation Flaw', marks: 4, note: 'Arithmetic error in final integration step.' },
      { q: '5a', error: 'Algebraic Slip', marks: 4, note: 'Sign error when expanding brackets.' },
    ]
  },
  {
    id: 'e3', title: 'PC1201 Quiz 3', date: '14 May 2026',
    tags: ['Conceptual Error', 'Misreading the Question'],
    marks: 5,
    questions: [
      { q: '1', error: 'Conceptual Error', marks: 3, note: 'Confused electric field with potential.' },
      { q: '3', error: 'Misreading the Question', marks: 2, note: 'Solved for velocity instead of acceleration.' },
    ]
  },
  {
    id: 'e4', title: 'ST2334 Finals', date: '28 Apr 2026',
    tags: ['Calculation Flaw', 'Conceptual Error', 'Incomplete Answer'],
    marks: 18,
    questions: [
      { q: '2b', error: 'Calculation Flaw', marks: 6, note: 'Wrong denominator in Bayes theorem.' },
      { q: '4', error: 'Conceptual Error', marks: 8, note: 'Misidentified distribution type.' },
      { q: '6', error: 'Incomplete Answer', marks: 4, note: 'Did not show full working for final step.' },
    ]
  },
  {
    id: 'e5', title: 'Group Project PM', date: '02 May 2026',
    tags: ['Time Pressure', 'Edge Case Neglect'],
    marks: 3,
    questions: [
      { q: 'Deliverable', error: 'Time Pressure', marks: 2, note: 'Last-minute submission lacked polish.' },
      { q: 'Testing', error: 'Edge Case Neglect', marks: 1, note: 'Edge cases untested under deadline.' },
    ]
  },
];

const TAG_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'Calculation Flaw':       { bg: '#0c1a2e', color: '#185FA5', border: '#0e2040' },
  'Algebraic Slip':         { bg: '#0c1a2e', color: '#185FA5', border: '#0e2040' },
  'Formula Misapplication': { bg: '#1e0a08', color: '#993C1D', border: '#2a1008' },
  'Conceptual Error':       { bg: '#1e0a08', color: '#993C1D', border: '#2a1008' },
  'Logic Branching Error':  { bg: '#1a1028', color: '#534AB7', border: '#221438' },
  'Edge Case Neglect':      { bg: '#0a1a12', color: '#0F6E56', border: '#0c2018' },
  'Time Pressure':          { bg: '#1e1400', color: '#854F0B', border: '#2a1c00' },
  'Incomplete Answer':      { bg: '#1e1400', color: '#854F0B', border: '#2a1c00' },
  'Misreading the Question':{ bg: '#0a1a12', color: '#0F6E56', border: '#0c2018' },
};
const DEFAULT_TAG = { bg: '#1a1a16', color: '#5F5E5A', border: '#2e2e28' };
const getTag = (t: string) => TAG_COLORS[t] || DEFAULT_TAG;

const CYTOSCAPE_COLORS: Record<string, string> = {
  'Calculation Flaw': '#185FA5',
  'Algebraic Slip': '#185FA5',
  'Conceptual Error': '#993C1D',
  'Logic Branching Error': '#534AB7',
  'Edge Case Neglect': '#0F6E56',
  'Time Pressure': '#854F0B',
  'Incomplete Answer': '#854F0B',
  'Misreading the Question': '#0F6E56',
};

// ── Shared layout ──────────────────────────────────────────────────────────
function Sidebar({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <div style={{ width: 200, background: '#0d0d0b', borderRight: '0.5px solid #1e1e1a', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
      <div style={{ padding: '0 20px 20px', borderBottom: '0.5px solid #1e1e1a', marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#c8c8c0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Autopsy</div>
        <div style={{ fontSize: 10, color: '#2e2e28', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>Failure Intelligence</div>
      </div>
      {[
        { icon: 'ti-layout-grid', label: 'Case Files', action: () => router.push('/home') },
        { icon: 'ti-upload', label: 'New Intake', action: () => router.push('/upload') },
        { icon: 'ti-flask', label: 'POC Demo', active: true, action: () => {} },
      ].map(item => (
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
  );
}

// ── Tab 1: Relationship Map ────────────────────────────────────────────────
function RelationshipMap() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    let cy: any;
    import('cytoscape').then(mod => {
      const cytoscape = mod.default;
      const elements: any[] = [];

      DEMO_ENTRIES.forEach(e => {
        elements.push({ data: { id: e.id, label: e.title, type: 'failure', marks: e.marks } });
      });

      const tagSet = new Set(DEMO_ENTRIES.flatMap(e => e.tags));
      tagSet.forEach(tag => {
        elements.push({ data: { id: `tag-${tag}`, label: tag, type: 'tag', color: CYTOSCAPE_COLORS[tag] || '#5F5E5A' } });
      });

      DEMO_ENTRIES.forEach(e => {
        e.tags.forEach(tag => {
          elements.push({ data: { id: `${e.id}-${tag}`, source: e.id, target: `tag-${tag}` } });
        });
      });

      cy = cytoscape({
        container: ref.current,
        elements,
        style: [
          {
            selector: 'node[type = "failure"]',
            style: {
              'background-color': '#1a1a16',
              'border-width': 1, 'border-color': '#3a3a30',
              'label': 'data(label)',
              'color': '#c8c8c0', 'font-size': '11px',
              'text-valign': 'center', 'text-halign': 'center',
              'width': 110, 'height': 40, 'shape': 'roundrectangle',
              'text-wrap': 'wrap', 'text-max-width': '100px',
            },
          },
          {
            selector: 'node[type = "tag"]',
            style: {
              'background-color': 'data(color)',
              'label': 'data(label)',
              'color': '#fff', 'font-size': '10px',
              'text-valign': 'center', 'text-halign': 'center',
              'width': 130, 'height': 34, 'shape': 'roundrectangle',
              'text-wrap': 'wrap', 'text-max-width': '120px',
            },
          },
          {
            selector: 'edge',
            style: { 'width': 1, 'line-color': '#2e2e28', 'curve-style': 'bezier' },
          },
          {
            selector: 'node:selected',
            style: { 'border-width': 2, 'border-color': '#c8c8c0' },
          },
          {
            selector: '.highlighted',
            style: { 'border-width': 2, 'border-color': '#854F0B' },
          },
        ],
        layout: { name: 'cose', animate: false, padding: 40, nodeRepulsion: () => 10000, idealEdgeLength: () => 90 },
      });

      cy.on('tap', 'node[type = "failure"]', (evt: any) => {
        cy.elements().removeClass('highlighted');
        evt.target.addClass('highlighted');
        evt.target.neighborhood().addClass('highlighted');
      });

      cy.on('tap', 'node[type = "tag"]', (evt: any) => {
        cy.elements().removeClass('highlighted');
        evt.target.addClass('highlighted');
        evt.target.neighborhood().addClass('highlighted');
      });
    });
    return () => cy?.destroy();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#2e2e28', marginBottom: 6 }}>Feature 3 — Cytoscape.js Relationship Map</div>
        <p style={{ fontSize: 12, color: '#3a3a30' }}>Nodes = exam entries. Coloured clusters = shared error tags. Click any node to highlight its connections and discover high-risk clusters.</p>
      </div>
      <div ref={ref} style={{ width: '100%', height: 460, background: '#0a0a08', border: '0.5px solid #1e1e1a', borderRadius: 6 }} />
      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
        {Object.entries(CYTOSCAPE_COLORS).slice(0, 5).map(([tag, color]) => (
          <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#3a3a30' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
            {tag}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab 2: Semantic Search ─────────────────────────────────────────────────
function SemanticSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<typeof DEMO_ENTRIES>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
  if (!query.trim()) return;
  setLoading(true);
  setSearched(false);

  try {
    const response = await fetch('/api/gemini', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: `You are a semantic search engine for a student failure library. Given a search query and a list of exam failure entries, return ONLY a raw JSON array of the most relevant entry IDs. No explanation, no markdown, just the array. Example: ["e1","e3"]\n\nQuery: "${query}"\n\nEntries:\n${DEMO_ENTRIES.map(e => `ID: ${e.id} | Title: ${e.title} | Tags: ${e.tags.join(', ')} | Notes: ${e.questions.map(q => q.note).join('; ')}`).join('\n')}`
  })
});
const data = await response.json();
const ids: string[] = JSON.parse(data.text.replace(/```json|```/g, '').trim());
setResults(DEMO_ENTRIES.filter(e => ids.includes(e.id)));
  } catch {
    setResults([]);
  } finally {
    setLoading(false);
    setSearched(true);
  }
};

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#2e2e28', marginBottom: 6 }}>Feature 4 — Semantic Failure Search</div>
        <p style={{ fontSize: 12, color: '#3a3a30', marginBottom: 16 }}>Search past failures using natural language. Powered by Gemini — finds contextually relevant entries, not just keyword matches.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder='e.g. "when did I panic under pressure?" or "math calculation mistakes"'
            style={{
              flex: 1, background: '#0a0a08', border: '0.5px solid #2e2e28',
              color: '#c8c8c0', borderRadius: 4, padding: '10px 14px',
              fontSize: 12, fontFamily: 'monospace', outline: 'none',
            }}
          />
          <button onClick={handleSearch} disabled={loading || !query.trim()} style={{
            background: '#1a1a16', border: '0.5px solid #2e2e28', color: '#c8c8c0',
            padding: '10px 20px', borderRadius: 4, fontSize: 11, cursor: 'pointer',
            letterSpacing: '0.06em', opacity: loading || !query.trim() ? 0.5 : 1,
          }}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {['when did I run out of time?', 'logic and code errors', 'conceptual misunderstandings'].map(s => (
            <button key={s} onClick={() => { setQuery(s); }} style={{
              background: 'transparent', border: '0.5px solid #1e1e1a', color: '#3a3a30',
              padding: '4px 12px', borderRadius: 3, fontSize: 11, cursor: 'pointer', letterSpacing: '0.04em',
            }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#3a3a30', letterSpacing: '0.06em' }}>
          Querying semantic index...
        </div>
      )}

      {searched && !loading && results.length === 0 && (
        <div style={{ fontSize: 12, color: '#2e2e28', fontStyle: 'italic' }}>No relevant entries found.</div>
      )}

      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {results.map(entry => (
            <div key={entry.id} style={{ background: '#0a0a08', border: '0.5px solid #1e1e1a', borderRadius: 4, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#a8a8a0' }}>{entry.title}</span>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#993C1D' }}>−{entry.marks} marks</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {entry.tags.map(tag => {
                  const s = getTag(tag);
                  return <span key={tag} style={{ padding: '2px 8px', borderRadius: 3, fontSize: 10, background: s.bg, color: s.color, border: `0.5px solid ${s.border}` }}>{tag}</span>;
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab 3: Red Flag System ─────────────────────────────────────────────────
function RedFlagSystem() {
  const patternCounts: Record<string, string[]> = {};
  DEMO_ENTRIES.forEach(e => {
    e.tags.forEach(tag => {
      if (!patternCounts[tag]) patternCounts[tag] = [];
      patternCounts[tag].push(e.title);
    });
  });

  const redFlags = Object.entries(patternCounts)
    .filter(([, entries]) => entries.length >= 2)
    .sort((a, b) => b[1].length - a[1].length);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#2e2e28', marginBottom: 6 }}>Feature 5 — Behavioral Red Flag System</div>
        <p style={{ fontSize: 12, color: '#3a3a30' }}>Automatically detects when the same error pattern appears across multiple entries. Alerts trigger when a tag appears in 2 or more case files.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {redFlags.map(([tag, entries]) => {
          const s = getTag(tag);
          const isCritical = entries.length >= 3;
          return (
            <div key={tag} style={{
              background: isCritical ? '#1a0800' : '#0f0f0d',
              border: `0.5px solid ${isCritical ? '#2a1000' : '#1e1e1a'}`,
              borderRadius: 4, padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isCritical && <i className="ti ti-alert-triangle" style={{ fontSize: 14, color: '#854F0B' }} aria-hidden="true" />}
                  <span style={{ padding: '2px 8px', borderRadius: 3, fontSize: 10, background: s.bg, color: s.color, border: `0.5px solid ${s.border}` }}>{tag}</span>
                  {isCritical && <span style={{ fontSize: 10, color: '#854F0B', letterSpacing: '0.08em' }}>CRITICAL</span>}
                </div>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: isCritical ? '#854F0B' : '#3a3a30' }}>
                  {entries.length}x detected
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#3a3a30' }}>
                Appears in: {entries.join(', ')}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: '#0a0a08', border: '0.5px solid #1e1e1a', borderRadius: 4, padding: 16 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2e2e28', marginBottom: 10 }}>All pattern frequencies</div>
        {Object.entries(patternCounts).sort((a, b) => b[1].length - a[1].length).map(([tag, entries]) => {
          const max = Math.max(...Object.values(patternCounts).map(e => e.length));
          return (
            <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: '0.5px solid #111110' }}>
              <div style={{ width: 140, fontSize: 11, color: '#5a5a52', flexShrink: 0 }}>{tag}</div>
              <div style={{ flex: 1, height: 2, background: '#1a1a16', borderRadius: 1 }}>
                <div style={{ height: 2, background: '#3a3a30', borderRadius: 1, width: `${(entries.length / max) * 100}%` }} />
              </div>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#3a3a30', width: 20, textAlign: 'right' }}>{entries.length}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab 4: Failure Fingerprint ─────────────────────────────────────────────
function FailureFingerprint() {
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState('');

  const generateReport = async () => {
  setLoading(true);
  try {
    const response = await fetch('/api/gemini', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: `You are an academic performance analyst generating a "Failure Fingerprint". Write in a clinical, direct tone. Plain text, no markdown. 3 sections: "Primary Failure Patterns", "Behavioral Analysis", "Remediation Protocol". Each 2-3 sentences. Under 200 words.\n\nStudent history:\n${DEMO_ENTRIES.map(e => `${e.title} (${e.date}): Lost ${e.marks} marks. Errors: ${e.tags.join(', ')}. Notes: ${e.questions.map(q => q.note).join('; ')}`).join('\n')}`
  })
});
const data = await response.json();
setReport(data.text || 'Report generation failed.');
    setGenerated(true);
  } catch {
    setReport('Failed to generate report.');
    setGenerated(true);
  } finally {
    setLoading(false);
  }
};
  const totalMarks = DEMO_ENTRIES.reduce((s, e) => s + e.marks, 0);
  const patternCounts: Record<string, number> = {};
  DEMO_ENTRIES.forEach(e => e.tags.forEach(t => { patternCounts[t] = (patternCounts[t] || 0) + 1; }));
  const topPattern = Object.entries(patternCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#2e2e28', marginBottom: 6 }}>Feature 6 — Failure Fingerprint Report</div>
        <p style={{ fontSize: 12, color: '#3a3a30' }}>AI-generated monthly summary of your most recurring failure patterns, behavioral triggers, and a personalised remediation protocol.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, marginBottom: 24, background: '#1a1a16', border: '0.5px solid #1a1a16', borderRadius: 6, overflow: 'hidden' }}>
        {[
          { label: 'Cases this period', value: DEMO_ENTRIES.length },
          { label: 'Total marks lost', value: totalMarks },
          { label: 'Dominant pattern', value: topPattern?.[0].split(' ')[0] ?? '—' },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#0d0d0b', padding: 16 }}>
            <div style={{ fontSize: 10, color: '#3a3a30', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>{stat.label}</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: '#c8c8c0' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {!generated ? (
        <button onClick={generateReport} disabled={loading} style={{
          background: '#1a1a16', border: '0.5px solid #2e2e28', color: '#c8c8c0',
          padding: '10px 24px', borderRadius: 4, fontSize: 12, cursor: loading ? 'not-allowed' : 'pointer',
          letterSpacing: '0.06em', textTransform: 'uppercase', opacity: loading ? 0.6 : 1,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className="ti ti-dna" style={{ fontSize: 14 }} aria-hidden="true" />
          {loading ? 'Generating fingerprint...' : 'Generate failure fingerprint'}
        </button>
      ) : (
        <div>
          <div style={{ background: '#0a0a08', border: '0.5px solid #1e1e1a', borderRadius: 4, padding: 24, marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2e2e28', marginBottom: 16 }}>
              Failure Fingerprint — May 2026
            </div>
            <pre style={{ fontSize: 12, color: '#7a7a70', lineHeight: 1.8, fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0 }}>
              {report}
            </pre>
          </div>
          <button onClick={() => { setGenerated(false); setReport(''); }} style={{
            background: 'transparent', border: '0.5px solid #1e1e1a', color: '#3a3a30',
            padding: '6px 16px', borderRadius: 4, fontSize: 11, cursor: 'pointer', letterSpacing: '0.04em',
          }}>
            Regenerate
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main POC Page ──────────────────────────────────────────────────────────
export default function POCPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'map' | 'search' | 'redflag' | 'fingerprint'>('map');

  const tabs = [
    { id: 'map', label: 'Relationship Map', icon: 'ti-vector-triangle' },
    { id: 'search', label: 'Semantic Search', icon: 'ti-search' },
    { id: 'redflag', label: 'Red Flags', icon: 'ti-alert-triangle' },
    { id: 'fingerprint', label: 'Fingerprint', icon: 'ti-dna' },
  ] as const;

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#c8c8c0', display: 'flex', fontFamily: 'var(--font-geist-sans, sans-serif)' }}>
      <Sidebar router={router} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{ borderBottom: '0.5px solid #1e1e1a', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#080808' }}>
          <div style={{ fontSize: 12, color: '#3a3a30', letterSpacing: '0.06em' }}>
            case files <span style={{ color: '#5a5a52' }}>/ poc demo</span>
          </div>
          <div style={{ fontSize: 10, color: '#2e2e28', letterSpacing: '0.08em', fontFamily: 'monospace' }}>
            DEMO DATA — 5 CASES LOADED
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ borderBottom: '0.5px solid #1e1e1a', display: 'flex', padding: '0 24px', background: '#080808' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '10px 20px', fontSize: 12, letterSpacing: '0.06em',
              background: 'transparent', border: 'none', cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '1px solid #c8c8c0' : '1px solid transparent',
              color: activeTab === tab.id ? '#c8c8c0' : '#3a3a30',
              marginBottom: -1, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <i className={`ti ${tab.icon}`} style={{ fontSize: 14 }} aria-hidden="true" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
          {activeTab === 'map' && <RelationshipMap />}
          {activeTab === 'search' && <SemanticSearch />}
          {activeTab === 'redflag' && <RedFlagSystem />}
          {activeTab === 'fingerprint' && <FailureFingerprint />}
        </div>
      </div>
    </div>
  );
}