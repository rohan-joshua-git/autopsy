'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

interface FailureEntry {
  id: string;
  title: string;
  type: string;
  tags: string[];
  created_at: string;
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

type Entry = {
  id: string;
  type: string;
  answers: string[];
  tags: string[];
  created_at: string;
};

export default function HomePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('failures')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setEntries(data);
      }
      setLoading(false);
    };

    init();
  }, [router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold">Failure Library</h1>
        <a
          href="/upload"
          className="bg-white text-black px-5 py-2 rounded-full font-medium hover:bg-gray-200 transition-colors text-sm"
        >
          + New Entry
        </a>
      </div>
      <p className="text-gray-400 mb-8">Your personal history of setbacks and growth</p>

      {entries.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-4">No entries yet</p>
          <a href="/upload" className="text-white underline">
            Add your first reflection
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-gray-900 rounded-2xl p-6 flex flex-col gap-3 hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <div>
                <h2 className="text-lg font-semibold capitalize">{entry.type ?? 'Reflection'}</h2>
                <p className="text-gray-500 text-sm">{formatDate(entry.created_at)}</p>
              </div>
              {entry.answers && entry.answers[0] && (
                <p className="text-gray-400 text-sm line-clamp-2">{entry.answers[0]}</p>
              )}
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-xs font-medium px-3 py-1 rounded-full ${TAG_COLOURS[tag] ?? 'bg-gray-700 text-gray-300'}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}