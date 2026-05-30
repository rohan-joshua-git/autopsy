'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const TAG_COLOURS: Record<string, string> = {
  'Logic Flaw': 'bg-red-900 text-red-300',
  'Time Pressure': 'bg-orange-900 text-orange-300',
  'Edge Case Neglect': 'bg-yellow-900 text-yellow-300',
  'Under-tested': 'bg-purple-900 text-purple-300',
  'Conceptual Error': 'bg-blue-900 text-blue-300',
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

  useEffect(() => {
    const fetchEntries = async () => {
      const { data, error } = await supabase
        .from('failures')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setEntries(data);
      }
      setLoading(false);
    };

    fetchEntries();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

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

      {loading ? (
        <p className="text-gray-500">Loading your entries...</p>
      ) : entries.length === 0 ? (
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