'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

type Entry = {
  id: string;
  title: string;
  type: string;
  answers: string[];
  tags: string[];
  created_at: string;
};

const TAG_COLOURS: Record<string, string> = {
  'Logic Flaw': 'bg-red-900 text-red-300',
  'Time Pressure': 'bg-orange-900 text-orange-300',
  'Edge Case Neglect': 'bg-yellow-900 text-yellow-300',
  'Under-tested': 'bg-purple-900 text-purple-300',
  'Conceptual Error': 'bg-orange-900 text-orange-300',
  'Calculation Flaw': 'bg-blue-900 text-blue-300',
  'Incomplete Answer': 'bg-gray-700 text-gray-300',
  'Misreading the Question': 'bg-pink-900 text-pink-300',
  'Algebraic Slip': 'bg-indigo-900 text-indigo-300',
  'Logic Branching Error': 'bg-teal-900 text-teal-300',
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [results, setResults] = useState<Entry[]>([]);
  const [searched, setSearched] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      const { data } = await supabase
        .from('failures')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setAllEntries(data);
    };
    init();
  }, [router]);

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearched(true);

    const q = query.toLowerCase();
    const filtered = allEntries.filter((entry) => {
      const titleMatch = entry.title?.toLowerCase().includes(q);
      const answerMatch = entry.answers?.some((a: string) =>
        a?.toLowerCase().includes(q)
      );
      const tagMatch = entry.tags?.some((t: string) =>
        t?.toLowerCase().includes(q)
      );
      return titleMatch || answerMatch || tagMatch;
    });

    setResults(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const suggestions = [
    'time pressure',
    'conceptual error',
    'ran out of time',
    'edge case',
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-2">Search</h1>
      <p className="text-gray-400 mb-8">
        Search your past failures by title, answers, or root cause tags
      </p>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder='e.g. "when did I run out of time?" or "logic errors"'
          className="flex-1 bg-gray-900 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-white/20"
        />
        <button
          onClick={handleSearch}
          disabled={!query.trim()}
          className="bg-white text-black px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Search
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-8">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => setQuery(s)}
            className="text-sm px-3 py-1 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {!searched && (
        <div className="text-center py-20">
          <p className="text-gray-600 text-lg">Start typing to search your failure library</p>
        </div>
      )}

      {searched && results.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-2">No results found</p>
          <p className="text-gray-600 text-sm">Try a different search term or tag name</p>
        </div>
      )}

      {searched && results.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-gray-500 text-sm">{results.length} result{results.length !== 1 ? 's' : ''} found</p>
          {results.map((entry) => (
            <div
              key={entry.id}
              className="bg-gray-900 rounded-2xl p-6 flex flex-col gap-3 hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <div>
                <h2 className="text-lg font-semibold">{entry.title || 'Untitled Reflection'}</h2>
                <p className="text-gray-500 text-sm">{formatDate(entry.created_at)} - {entry.type}</p>
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