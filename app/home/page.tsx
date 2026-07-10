'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import GraphView from './GraphView';
import Sidebar from '@/app/components/Sidebar';

interface FailureEntry {
  id: string;
  title: string;
  type: string;
  tags: string[];
  created_at: string;
  answers?: string[];
  breakdown_data?: { marksDeducted: number }[];
}

interface VectorSearchResult {
  id: string;
  title: string;
  type: string;
  tags: string[];
  reflection_notes: string;
  similarity: number;
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

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<FailureEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'exam' | 'reflection'>('all');

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VectorSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

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

  useEffect(() => {
    if (searchParams.get('search') === '1') setIsSearchOpen(true);
  }, [searchParams]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError('');
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, limit: 5 }),
      });

      if (!res.ok) throw new Error('Failed to fetch semantic search matches.');
      const data = await res.json();
      setSearchResults(data.matches || []);
    } catch (err: any) {
      setSearchError(err.message || 'Error conducting similarity search.');
    } finally {
      setIsSearching(false);
    }
  };

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

  const graphCompatibleEntries = entries.flatMap(entry => {
    return (entry.tags || []).map(tag => ({
      id: `${entry.id}-${tag}`,
      module_code: entry.title?.split(' ')[0] || 'Unknown',
      assessment_name: entry.title || entry.type || 'Assessment',
      question_number: tag.split(' ')[0] || 'Error',
      error_category: tag,
      marks_deducted: getTotalMarksLost(entry)
    }));
  });

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#080808', color: '#3a3a30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, letterSpacing: '0.1em', fontFamily: 'monospace' }}>
        LOADING CASE FILES...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#c8c8c0', display: 'flex', fontFamily: 'var(--font-geist-sans, sans-serif)', position: 'relative', overflow: 'hidden' }}>

      <Sidebar
        items={[
          { icon: 'ti-layout-grid', label: 'Case Files', active: !isSearchOpen, onClick: () => setIsSearchOpen(false) },
          { icon: 'ti-upload', label: 'New Intake', onClick: () => router.push('/upload') },
          { icon: 'ti-search', label: 'Search', active: isSearchOpen, onClick: () => setIsSearchOpen(true) },
          { icon: 'ti-help-circle', label: 'How it works', onClick: () => router.push('/welcome') },
        ]}
        onSignOut={() => supabase.auth.signOut().then(() => router.push('/login'))}
      />

      {/* Main Container Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

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

          <div style={{ background: '#0d0d0b', border: '0.5px solid #1e1e1a', borderRadius: 6, padding: 20, marginBottom: 24 }}>
            <GraphView entries={graphCompatibleEntries} />
          </div>

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

      {/* Right Column Context Panel */}
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

      {/* Slide-out Semantic Vector Search Panel Layer */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: 440, background: '#0d0d0b', borderLeft: '0.5px solid #1e1e1a',
        transform: isSearchOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 100, display: 'flex', flexDirection: 'column',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
      }}>
        <div style={{ padding: '24px 24px 16px', borderBottom: '0.5px solid #1e1e1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#c8c8c0', letterSpacing: '0.04em' }}>Semantic Latent Search</div>
            <div style={{ fontSize: 10, color: '#5a5a52', marginTop: 2 }}>Query case archives using natural language vector math</div>
          </div>
          <button onClick={() => setIsSearchOpen(false)} style={{ background: 'transparent', border: 'none', color: '#3a3a30', cursor: 'pointer', fontSize: 16 }}>
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        <div style={{ padding: 24, borderBottom: '0.5px solid #1e1e1a' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="e.g., dynamic programming complexity slips..."
              style={{
                flex: 1, background: '#080808', border: '0.5px solid #2e2e28',
                color: '#c8c8c0', borderRadius: 4, padding: '8px 12px', fontSize: 12,
                outline: 'none', fontFamily: 'monospace'
              }}
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              style={{
                background: '#1a1a16', border: '0.5px solid #2e2e28', color: '#c8c8c0',
                padding: '0 16px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
                opacity: isSearching || !searchQuery.trim() ? 0.5 : 1
              }}
            >
              {isSearching ? 'Matching...' : 'Query'}
            </button>
          </form>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {searchError && (
            <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#993C1D' }}>{searchError}</div>
          )}

          {!isSearching && searchResults.length === 0 && !searchError && (
            <div style={{ fontSize: 11, color: '#3a3a30', fontFamily: 'monospace', textAlign: 'center', marginTop: 40 }}>
              ENTER COGNITIVE PATTERN QUERY TO MATCH EMBEDDINGS
            </div>
          )}

          {searchResults.map(match => (
            <div
              key={match.id}
              onClick={() => { setIsSearchOpen(false); router.push(`/reflect?id=${match.id}`); }}
              style={{
                background: '#080808', border: '0.5px solid #1e1e1a', borderRadius: 4,
                padding: 16, cursor: 'pointer', transition: 'border-color 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#3a3a30'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#1e1e1a'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#a8a8a0' }}>{match.title}</span>
                <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#3B6D11', background: '#0a1a0c', padding: '1px 6px', borderRadius: 3, border: '0.5px solid #0c200e' }}>
                  {(match.similarity * 100).toFixed(1)}% Match
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                {(match.tags || []).map(t => {
                  const s = getTagStyle(t);
                  return (
                    <span key={t} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 2, background: s.bg, color: s.color, border: `0.5px solid ${s.border}` }}>
                      {t}
                    </span>
                  );
                })}
              </div>

              {match.reflection_notes && (
                <p style={{ fontSize: 11, color: '#5a5a52', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {match.reflection_notes}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#080808', color: '#3a3a30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, letterSpacing: '0.1em', fontFamily: 'monospace' }}>
        LOADING CASE FILES...
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}