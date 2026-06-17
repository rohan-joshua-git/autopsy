'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface FailureEntry {
  id: string;
  title: string;
  type: string;
  tags: string[];
  created_at: string;
  answers?: string[];
  breakdown_data?: { marksDeducted: number }[];
}

const TAG_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'Calculation Flaw':             { bg: '#0c1a2e', color: '#185FA5', border: '#0e2040' },
  'Algebraic Slip':               { bg: '#0c1a2e', color: '#185FA5', border: '#0e2040' },
  'Arithmetic Error':             { bg: '#0c1a2e', color: '#185FA5', border: '#0e2040' },
  'Formula Misapplication':       { bg: '#1e0a08', color: '#993C1D', border: '#2a1008' },
  'Conceptual Error':             { bg: '#1e0a08', color: '#993C1D', border: '#2a1008' },
  'Misunderstanding Core Principle': { bg: '#1e0a08', color: '#993C1D', border: '#2a1008' },
  'Logic Branching Error':        { bg: '#1a1028', color: '#534AB7', border: '#221438' },
  'Edge Case Neglect':            { bg: '#0a1a12', color: '#0F6E56', border: '#0c2018' },
  'Syntax / Off-by-One':          { bg: '#1a1028', color: '#534AB7', border: '#221438' },
  'Time Pressure':                { bg: '#1e1400', color: '#854F0B', border: '#2a1c00' },
  'Incomplete Answer':            { bg: '#1e1400', color: '#854F0B', border: '#2a1c00' },
  'Rushed Execution':             { bg: '#1e1400', color: '#854F0B', border: '#2a1c00' },
  'Misreading the Question':      { bg: '#0a1a12', color: '#0F6E56', border: '#0c2018' },
  'Overlooking Constraints':      { bg: '#0a1a12', color: '#0F6E56', border: '#0c2018' },
  'Incorrect Assumption':         { bg: '#0a1a12', color: '#0F6E56', border: '#0c2018' },
  'Type Mismatch':                { bg: '#1a1028', color: '#534AB7', border: '#221438' },
  'Sloppy Handwriting / Notation':{ bg: '#1a1a10', color: '#5F5E5A', border: '#222218' },
  'Panic / Brain Fade':           { bg: '#1e1400', color: '#854F0B', border: '#2a1c00' },
};

const DEFAULT_TAG = { bg: '#1a1a16', color: '#5F5E5A', border: '#2e2e28' };
const getTagStyle = (tag: string) => TAG_COLORS[tag] || DEFAULT_TAG;

function getTotalMarksLost(entry: FailureEntry): number {
  if (!entry.breakdown_data) return 0;
  return entry.breakdown_data.reduce((sum, q) => sum + (q.marksDeducted || 0), 0);
}

function SeverityBar({ marks }: { marks: number }) {
  const level = marks >= 15 ? 5 : marks >= 10 ? 4 : marks >= 6 ? 3 : marks >= 3 ? 2 : 1;
  const color = level >= 4 ? '#993C1D' : level >= 3 ? '#854F0B' : '#3B6D11';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            width: 6, height: 14, borderRadius: 1,
            background: i <= level ? color : '#1a1a16'
          }} />
        ))}
      </div>
      <span style={{ fontSize: 11, fontFamily: 'monospace', color }}>{marks > 0 ? `−${marks}` : '—'}</span>
    </div>
  );
}

function PatternBar({ count, max }: { count: number; max: number }) {
  return (
    <div style={{ height: 2, background: '#1a1a16', borderRadius: 1, marginTop: 4 }}>
      <div style={{ height: 2, background: '#3a3a30', borderRadius: 1, width: `${Math.round((count / max) * 100)}%` }} />
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [entries, setEntries] = useState<FailureEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'exam' | 'reflection'>('all');

  useEffect(() => {
    async function load() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { router.push('/login'); return; }

      const { data } = await supabase
        .from('failures')
        .select('*')
        .order('created_at', { ascending: false });

      setEntries(data || []);
      setLoading(false);
    }
    load();
  }, [router]);

  const filtered = entries.filter(e => {
    if (filter === 'exam') return e.type === 'Exam Script';
    if (filter === 'reflection') return e.type !== 'Exam Script';
    return true;
  });

  const patternCounts: Record<string, number> = {};
  entries.forEach(e => (e.tags || []).forEach(t => { patternCounts[t] = (patternCounts[t] || 0) + 1; }));
  const topPatterns = Object.entries(patternCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxPattern = topPatterns[0]?.[1] || 1;
  const totalMarksLost = entries.reduce((sum, e) => sum + getTotalMarksLost(e), 0);
  const openCases = entries.filter(e => !e.breakdown_data || e.breakdown_data.length === 0).length;
  const latestEntry = entries[0];
  const redFlagMatches = latestEntry
    ? entries.slice(1).filter(e => {
        const shared = (e.tags || []).filter(t => (latestEntry.tags || []).includes(t));
        return shared.length >= 2;
      })
    : [];
  const redFlagSharedTags = latestEntry
    ? [...new Set(redFlagMatches.flatMap(e => (e.tags || []).filter(t => (latestEntry.tags || []).includes(t))))]
    : [];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#080808', color: '#3a3a30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, letterSpacing: '0.1em', fontFamily: 'monospace' }}>
        LOADING CASE FILES...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#c8c8c0', display: 'flex', fontFamily: 'var(--font-geist-sans, sans-serif)' }}>

      {/* Sidebar */}
      <div style={{ width: 200, background: '#0d0d0b', borderRight: '0.5px solid #1e1e1a', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '0.5px solid #1e1e1a', marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#c8c8c0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Autopsy</div>
          <div style={{ fontSize: 10, color: '#2e2e28', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>Failure Intelligence</div>
        </div>
        {[
          { icon: 'ti-layout-grid', label: 'Case Files', active: true, action: () => {} },
          { icon: 'ti-upload', label: 'New Intake', action: () => router.push('/upload') },
          { icon: 'ti-flask', label: 'POC Demo', action: () => router.push('/poc') },
          { icon: 'ti-search', label: 'Search', action: () => {} },
        ].map(item => (
          <div key={item.label} onClick={item.action} style={{
            padding: '8px 20px', fontSize: 13,
            color: (item as any).active ? '#c8c8c0' : '#5a5a52',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
            borderLeft: (item as any).active ? '2px solid #3a3a30' : '2px solid transparent',
            background: (item as any).active ? '#111110' : 'transparent',
          }}>
            <i className={`ti ${item.icon}`} style={{ fontSize: 15 }} aria-hidden="true" />
            {item.label}
          </div>
        ))}
        <div style={{ marginTop: 'auto' }}>
          <div onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} style={{
            padding: '8px 20px', fontSize: 13, color: '#3a3a30', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, borderLeft: '2px solid transparent',
          }}>
            <i className="ti ti-logout" style={{ fontSize: 15 }} aria-hidden="true" />
            Sign out
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{ borderBottom: '0.5px solid #1e1e1a', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#080808' }}>
          <div style={{ fontSize: 12, color: '#3a3a30', letterSpacing: '0.06em' }}>
            case files <span style={{ color: '#5a5a52' }}>/ all</span>
          </div>
          <button onClick={() => router.push('/upload')} style={{
            background: '#1a1a16', border: '0.5px solid #2e2e28', color: '#c8c8c0',
            padding: '7px 16px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.04em',
          }}>
            <i className="ti ti-plus" style={{ fontSize: 13 }} aria-hidden="true" />
            New intake
          </button>
        </div>

        <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, marginBottom: 24, background: '#1a1a16', border: '0.5px solid #1a1a16', borderRadius: 6, overflow: 'hidden' }}>
            {[
              { label: 'Total cases', value: entries.length, sub: `${entries.length === 1 ? '1 entry' : `${entries.length} entries`}` },
              { label: 'Marks lost', value: totalMarksLost, sub: 'across all scripts' },
              { label: 'Top pattern', value: topPatterns[0]?.[0]?.split(' ')[0] ?? '—', sub: topPatterns[0] ? `${topPatterns[0][1]} occurrences` : 'no data yet' },
              { label: 'Open cases', value: openCases, sub: 'pending reflection' },
            ].map(stat => (
              <div key={stat.label} style={{ background: '#0d0d0b', padding: 16 }}>
                <div style={{ fontSize: 10, color: '#3a3a30', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>{stat.label}</div>
                <div style={{ fontSize: 22, fontWeight: 500, color: '#c8c8c0' }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: '#3a3a30', marginTop: 3 }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {(['all', 'exam', 'reflection'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '4px 12px', borderRadius: 3, fontSize: 11, letterSpacing: '0.06em',
                cursor: 'pointer', border: '0.5px solid',
                borderColor: filter === f ? '#3a3a30' : '#1e1e1a',
                color: filter === f ? '#a8a8a0' : '#3a3a30',
                background: filter === f ? '#111110' : 'transparent',
              }}>
                {f === 'all' ? 'All' : f === 'exam' ? 'Exam scripts' : 'Reflections'}
              </button>
            ))}
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div style={{ border: '0.5px dashed #1e1e1a', borderRadius: 6, padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#2e2e28', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>No cases on file</div>
              <div style={{ fontSize: 12, color: '#3a3a30', marginBottom: 20 }}>Upload your first exam script to open a case.</div>
              <button onClick={() => router.push('/upload')} style={{
                background: '#1a1a16', border: '0.5px solid #2e2e28', color: '#a8a8a0',
                padding: '8px 20px', borderRadius: 4, fontSize: 12, cursor: 'pointer', letterSpacing: '0.04em',
              }}>
                Open first case
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Case ID', 'Subject', 'Root causes', 'Severity', 'Date'].map(h => (
                    <th key={h} style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2e2e28', padding: '8px 12px', textAlign: 'left', borderBottom: '0.5px solid #1a1a16' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => {
                  const marks = getTotalMarksLost(entry);
                  const caseNum = String(entries.indexOf(entry) + 1).padStart(4, '0');
                  return (
                    <tr key={entry.id} onClick={() => router.push(`/reflect?id=${entry.id}`)} style={{ cursor: 'pointer' }}
                      onMouseEnter={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => { (c as HTMLTableCellElement).style.background = '#0f0f0d'; (c as HTMLTableCellElement).style.color = '#c8c8c0'; })}
                      onMouseLeave={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => { (c as HTMLTableCellElement).style.background = ''; (c as HTMLTableCellElement).style.color = ''; })}
                    >
                      <td style={{ padding: '10px 12px', borderBottom: '0.5px solid #111110', fontFamily: 'monospace', fontSize: 11, color: '#3a3a30' }}>#{caseNum}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '0.5px solid #111110', fontSize: 13, color: '#a8a8a0' }}>
                        {entry.title || entry.type || 'Untitled'}
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '0.5px solid #111110' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(entry.tags || []).slice(0, 2).map(tag => {
                            const s = getTagStyle(tag);
                            return (
                              <span key={tag} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 3, fontSize: 10, letterSpacing: '0.06em', background: s.bg, color: s.color, border: `0.5px solid ${s.border}` }}>
                                {tag}
                              </span>
                            );
                          })}
                          {(entry.tags || []).length > 2 && <span style={{ fontSize: 10, color: '#3a3a30' }}>+{entry.tags.length - 2}</span>}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '0.5px solid #111110' }}>
                        <SeverityBar marks={marks} />
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '0.5px solid #111110', fontSize: 11, fontFamily: 'monospace', color: '#3a3a30' }}>
                        {new Date(entry.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: 200, padding: '24px 16px', borderLeft: '0.5px solid #1e1e1a', background: '#0a0a08', display: 'flex', flexDirection: 'column', gap: 24, flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2e2e28', marginBottom: 10 }}>Top patterns</div>
          {topPatterns.length === 0 ? (
            <div style={{ fontSize: 11, color: '#2e2e28' }}>No data yet</div>
          ) : topPatterns.map(([tag, count]) => (
            <div key={tag} style={{ paddingBottom: 8, marginBottom: 8, borderBottom: '0.5px solid #111110' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, color: '#5a5a52' }}>{tag}</div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#3a3a30' }}>{count}</div>
              </div>
              <PatternBar count={count} max={maxPattern} />
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2e2e28', marginBottom: 10 }}>Recent activity</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {entries.slice(0, 3).map(e => (
              <div key={e.id} style={{ fontSize: 11, color: '#3a3a30', borderLeft: '2px solid #1e1e1a', paddingLeft: 8 }}>
                <div style={{ color: '#5a5a52' }}>{e.title || e.type || 'Untitled'}</div>
                <div style={{ marginTop: 2 }}>{new Date(e.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
              </div>
            ))}
          </div>
        </div>

        {redFlagMatches.length > 0 && (
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2e2e28', marginBottom: 10 }}>Red flags</div>
            <div style={{ background: '#1a0800', border: '0.5px solid #2a1000', borderRadius: 4, padding: 10 }}>
              <div style={{ fontSize: 11, color: '#854F0B', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="ti ti-alert-triangle" style={{ fontSize: 13 }} aria-hidden="true" />
                Repeating pattern
              </div>
              <div style={{ fontSize: 11, color: '#5a5a52', marginBottom: 8, lineHeight: 1.6 }}>
                Latest entry repeats patterns from {redFlagMatches.length} past case{redFlagMatches.length > 1 ? 's' : ''}.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {redFlagSharedTags.map(tag => {
                  const s = getTagStyle(tag);
                  return (
                    <span key={tag} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 3, fontSize: 10, letterSpacing: '0.06em', background: s.bg, color: s.color, border: `0.5px solid ${s.border}` }}>
                      {tag}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}