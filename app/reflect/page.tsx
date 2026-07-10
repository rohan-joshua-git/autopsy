'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/app/components/Toast';
import Loader from '@/app/components/Loader';
import AuthButton from '@/app/components/AuthButton';

function ReflectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const id = searchParams.get('id');
  const [entry, setEntry] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState(false);

  const loadEntry = useCallback(async () => {
    if (!id) {
      router.push('/home');
      return;
    }

    const { data } = await supabase
      .from('failures')
      .select('*')
      .eq('id', id)
      .single();

    if (data) {
      setEntry(data);
      setNotes(data.reflection_notes || '');
    }
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('failures')
      .update({ reflection_notes: notes })
      .eq('id', id);
    setSaving(false);
    if (error) {
      showToast(error.message, 'error');
      return;
    }
    showToast('Reflection saved.', 'success');
    router.push('/home');
  };

  if (loading) return <Loader label="LOADING CASE..." />;

  return (
    <div className="page-transition" style={{ minHeight: '100vh', background: '#080808', color: '#c8c8c0', padding: 40, fontFamily: 'var(--font-geist-sans, sans-serif)' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>{entry?.title || 'Case Reflection'}</h1>
        <div style={{ fontSize: 12, color: '#5a5a52', marginBottom: 32 }}>ID: {id}</div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', height: 200, background: '#0d0d0b',
            border: `0.5px solid ${focused ? '#5a5a52' : '#1e1e1a'}`,
            boxShadow: focused ? '0 0 0 3px rgba(90, 90, 82, 0.15)' : 'none',
            color: '#c8c8c0', padding: 16, borderRadius: 4, outline: 'none', marginBottom: 16,
            fontFamily: 'monospace', fontSize: 13, boxSizing: 'border-box', resize: 'vertical',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          }}
          placeholder="Document insights and corrective measures here..."
        />

        <div style={{ display: 'flex', gap: 12 }}>
          <AuthButton onClick={handleSave} disabled={saving} style={{ marginTop: 0 }}>
            {saving ? 'Saving...' : 'Save Reflection'}
          </AuthButton>
          <button onClick={() => router.push('/home')} style={{ background: 'transparent', border: '0.5px solid #1e1e1a', color: '#5a5a52', padding: '8px 16px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReflectPage() {
  return (
    <Suspense fallback={<Loader label="LOADING CASE..." />}>
      <ReflectContent />
    </Suspense>
  );
}
