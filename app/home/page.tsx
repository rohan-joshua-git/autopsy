'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface FailureEntry {
  id: string;
  title: string;
  type: string;
  tags: string[];
  created_at: string;
}

export default function HomePage() {
  const router = useRouter();
  const [entries, setEntries] = useState<FailureEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('failures')
        .select('id, title, type, tags, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setEntries(data || []);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-500 text-sm animate-pulse">Loading your library...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Failure Library</h1>
          <p className="text-gray-400 mt-1">Track and learn from every mistake</p>
        </div>
        <button
          onClick={() => router.push('/upload')}
          className="bg-white text-black px-6 py-2.5 rounded-full font-semibold hover:bg-gray-200 transition-colors"
        >
          + New Entry
        </button>
      </div>

      {/* Grid */}
      {entries.length === 0 ? (
        <div className="border-2 border-dashed border-gray-800 rounded-2xl p-16 text-center">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-gray-400 mb-2">No entries yet</p>
          <p className="text-gray-600 text-sm mb-6">Upload your first exam script to get started</p>
          <button
            onClick={() => router.push('/upload')}
            className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-gray-200 transition-colors"
          >
            Upload Exam Script
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => router.push(`/reflect?id=${entry.id}`)}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-5 cursor-pointer hover:border-gray-600 transition-all space-y-3"
            >
              <div className="flex justify-between items-start">
                <h2 className="font-semibold text-white truncate pr-2">{entry.title}</h2>
                <span className="text-xs text-gray-500 shrink-0">
                  {new Date(entry.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-gray-500">{entry.type}</p>
              <div className="flex gap-2 flex-wrap">
                {entry.tags?.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-xs bg-gray-800 border border-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
                {entry.tags?.length > 3 && (
                  <span className="text-xs text-gray-600">+{entry.tags.length - 3} more</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}