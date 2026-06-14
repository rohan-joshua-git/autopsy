'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ReflectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const [entry, setEntry] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadEntry = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from('failures')
      .select('*')
      .eq('id', id)
      .single();
    
    if (data) {
      setEntry(data);
      setNotes(data.reflection_notes || '');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from('failures')
      .update({ reflection_notes: notes })
      .eq('id', id);
    setSaving(false);
    router.push('/home');
  };

  if (loading) return <div style={{ background: '#080808', color: '#3a3a30', minHeight: '100vh', padding: 40, fontFamily: 'monospace' }}>LOADING CASE...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#c8c8c0', padding: 40, fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>{entry?.title || 'Case Reflection'}</h1>
        <div style={{ fontSize: 12, color: '#5a5a52', marginBottom: 32 }}>ID: {id}</div>
        
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{
            width: '100%', height: 200, background: '#0d0d0b', border: '0.5px solid #1e1e1a',
            color: '#c8c8c0', padding: 16, borderRadius: 4, outline: 'none', marginBottom: 16,
            fontFamily: 'monospace', fontSize: 13
          }}
          placeholder="Document insights and corrective measures here..."
        />
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleSave} style={{ background: '#1a1a16', border: '0.5px solid #2e2e28', color: '#c8c8c0', padding: '8px 16px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>
            {saving ? 'SAVING...' : 'Save Reflection'}
          </button>
          <button onClick={() => router.push('/home')} style={{ background: 'transparent', border: '0.5px solid #1e1e1a', color: '#5a5a52', padding: '8px 16px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}