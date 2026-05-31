'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ParsedQuestion {
  questionNumber: string;
  marksDeducted: number;
  errorCategory: string;
  description: string;
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
};
const DEFAULT_TAG = { bg: '#1a1a16', color: '#5F5E5A', border: '#2e2e28' };
const getTagStyle = (tag: string) => TAG_COLORS[tag] || DEFAULT_TAG;

export default function ReflectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState('Untitled Case');
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [overallTags, setOverallTags] = useState<string[]>([]);
  const [reflectionText, setReflectionText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const isReadOnly = !!searchParams.get('id');

  useEffect(() => {
    async function load() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) { router.push('/login'); return; }

        const source = searchParams.get('source');
        const existingId = searchParams.get('id');

        if (source === 'upload') {
          const rawData = sessionStorage.getItem('latest_parsed_exam');
          if (rawData) {
            const parsed = JSON.parse(rawData);
            setTitle(parsed.title || 'Untitled Exam Script');
            setQuestions(parsed.data?.entries || []);
            setOverallTags(parsed.data?.overallTags || []);
          } else {
            setStatusMessage('No parser data found. Return to upload.');
          }
        } else if (existingId) {
          const { data, error } = await supabase.from('failures').select('*').eq('id', existingId).single();
          if (error) throw error;
          if (data) {
            setTitle(data.title);
            setReflectionText(data.reflection_notes || '');
            setOverallTags(data.tags || []);
            setQuestions(data.breakdown_data || []);
          }
        }
      } catch (err) {
        console.error('[reflect]', err);
        setStatusMessage('Error loading case data.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router, searchParams]);

  const handleSave = async () => {
    if (isReadOnly || !reflectionText.trim()) return;
    setSaving(true);
    setStatusMessage('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Session expired.');
      const { error } = await supabase.from('failures').insert({
        user_id: user.id,
        title,
        type: 'Exam Script',
        tags: overallTags,
        reflection_notes: reflectionText,
        breakdown_data: questions,
      });
      if (error) throw error;
      setStatusMessage('Case filed successfully.');
      sessionStorage.removeItem('latest_parsed_exam');
      setTimeout(() => router.push('/home'), 1500);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Database write failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#080808', color: '#3a3a30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, letterSpacing: '0.1em', fontFamily: 'monospace' }}>
        LOADING CASE FILE...
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
          { icon: 'ti-layout-grid', label: 'Case Files', action: () => router.push('/home') },
          { icon: 'ti-upload', label: 'New Intake', action: () => router.push('/upload') },
          { icon: 'ti-search', label: 'Search', action: () => {} },
        ].map(item => (
          <div key={item.label} onClick={item.action} style={{
            padding: '8px 20px', fontSize: 13, color: '#5a5a52',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
            borderLeft: '2px solid transparent',
          }}>
            <i className={`ti ${item.icon}`} style={{ fontSize: 15 }} aria-hidden="true" />
            {item.label}
          </div>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{ borderBottom: '0.5px solid #1e1e1a', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#080808' }}>
          <div style={{ fontSize: 12, color: '#3a3a30', letterSpacing: '0.06em' }}>
            case files <span style={{ color: '#5a5a52' }}>/ {isReadOnly ? 'archive' : 'new'}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => router.push('/home')} style={{
              background: 'transparent', border: '0.5px solid #1e1e1a', color: '#5a5a52',
              padding: '6px 14px', borderRadius: 4, fontSize: 11, cursor: 'pointer', letterSpacing: '0.04em',
            }}>
              {isReadOnly ? 'Back' : 'Discard'}
            </button>
            {!isReadOnly && (
              <button onClick={handleSave} disabled={saving || !reflectionText.trim()} style={{
                background: saving || !reflectionText.trim() ? '#111110' : '#1a1a16',
                border: '0.5px solid #2e2e28', color: saving || !reflectionText.trim() ? '#3a3a30' : '#c8c8c0',
                padding: '6px 14px', borderRadius: 4, fontSize: 11, cursor: 'pointer', letterSpacing: '0.04em',
              }}>
                {saving ? 'Filing...' : 'File case'}
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Left: Diagnosis */}
          <div style={{ flex: 1, padding: 32, overflowY: 'auto', borderRight: '0.5px solid #1e1e1a' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#2e2e28', marginBottom: 8 }}>
                {isReadOnly ? 'Archived case' : 'AI diagnosis'}
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 500, color: '#c8c8c0', margin: 0 }}>{title}</h1>
            </div>

            {/* Tags */}
            {overallTags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
                {overallTags.map(tag => {
                  const s = getTagStyle(tag);
                  return (
                    <span key={tag} style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 3, fontSize: 10, letterSpacing: '0.06em', background: s.bg, color: s.color, border: `0.5px solid ${s.border}` }}>
                      {tag}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Question breakdown */}
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2e2e28', marginBottom: 12 }}>
              Findings — {questions.length} error{questions.length !== 1 ? 's' : ''} identified
            </div>

            {questions.length === 0 ? (
              <div style={{ fontSize: 12, color: '#2e2e28', fontStyle: 'italic' }}>No errors mapped.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {questions.map((q, idx) => {
                  const s = getTagStyle(q.errorCategory);
                  return (
                    <div key={idx} style={{ background: '#0a0a08', border: '0.5px solid #1a1a16', borderRadius: 4, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#3a3a30', letterSpacing: '0.08em' }}>Q{q.questionNumber}</span>
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 3, fontSize: 10, background: s.bg, color: s.color, border: `0.5px solid ${s.border}` }}>
                            {q.errorCategory}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#993C1D' }}>−{q.marksDeducted}</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#5a5a52', margin: 0, lineHeight: 1.6 }}>{q.description}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Reflection */}
          <div style={{ width: 340, padding: 32, background: '#0a0a08', display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#2e2e28', marginBottom: 8 }}>
                {isReadOnly ? 'Archived notes' : 'Post-mortem'}
              </div>
              <div style={{ fontSize: 12, color: '#3a3a30' }}>
                {isReadOnly ? 'Your recorded takeaways for this case.' : 'What went wrong? How do you isolate this pattern?'}
              </div>
            </div>

            <textarea
              value={reflectionText}
              onChange={e => setReflectionText(e.target.value)}
              disabled={saving || isReadOnly}
              placeholder="Document your findings..."
              style={{
                flex: 1, minHeight: 320, background: '#080808', border: '0.5px solid #1e1e1a',
                color: '#c8c8c0', borderRadius: 4, padding: '12px 14px', fontSize: 12,
                fontFamily: 'monospace', resize: 'none', outline: 'none', lineHeight: 1.7,
                opacity: isReadOnly ? 0.6 : 1,
              }}
            />

            {statusMessage && (
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: statusMessage.startsWith('Case filed') ? '#3B6D11' : '#993C1D', letterSpacing: '0.04em' }}>
                {statusMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}