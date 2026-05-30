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

export default function ReflectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Core state matrix
  const [title, setTitle] = useState('New Exam Analysis');
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [overallTags, setOverallTags] = useState<string[]>([]);
  const [reflectionText, setReflectionText] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    async function loadDataAndSession() {
      try {
        // 1. Verify live user session with Supabase auth bank
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/login');
          return;
        }

        // 2. Read parsed payload out of temporary session storage
        const source = searchParams.get('source');
        if (source === 'upload') {
          const rawData = sessionStorage.getItem('latest_parsed_exam');
          
          if (rawData) {
            const parsed = JSON.parse(rawData);
            setTitle(parsed.title || 'Untitled Exam Script');
            setQuestions(parsed.entries || []);
            setOverallTags(parsed.overallTags || []);
          } else {
            setStatusMessage('No fresh parser data found. Head back to Upload.');
          }
        }
      } catch (err) {
        console.error('[reflect] Parsing error during client mount:', err);
        setStatusMessage('Error loading cached parser payloads.');
      } finally {
        setLoading(false);
      }
    }

    loadDataAndSession();
  }, [router, searchParams]);

  // Handle saving reflection text + metrics directly to Supabase
  const handleSaveReflection = async () => {
    if (!reflectionText.trim()) return;
    
    setSaving(true);
    setStatusMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication session timed out. Please log in again.');

      // Execute live transactional network write matching your SQL schema layout
      const { error } = await supabase.from('failures').insert({
        user_id: user.id,
        title: title,
        type: 'Exam Script',
        tags: overallTags,
        reflection_notes: reflectionText,
        breakdown_data: questions, 
      });

      if (error) throw error;

      setStatusMessage('✓ Reflection committed successfully to your Library!');
      
      // Clear cache and clear user path back to home workspace view
      sessionStorage.removeItem('latest_parsed_exam');
      setTimeout(() => {
        router.push('/home');
      }, 1500);

    } catch (err) {
      console.error('[reflect] Database write transaction failure:', err);
      setStatusMessage(err instanceof Error ? err.message : 'Database sync failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-500 text-sm animate-pulse">Mounting reflection workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 flex justify-center">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Left Column: Live Gemini Parser Diagnosis Output */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight truncate">{title}</h1>
            <p className="text-gray-400 text-sm mt-1">AI-Generated Flaw Diagnostics</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {overallTags.map((tag) => (
              <span key={tag} className="text-xs bg-gray-900 border border-gray-800 text-gray-300 font-medium px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {questions.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No specific errors mapped for this item.</p>
            ) : (
              questions.map((q, idx) => (
                <div key={idx} className="bg-gray-900 border border-gray-800/40 p-5 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-blue-400">Question {q.questionNumber}</span>
                    <span className="text-xs font-mono font-bold bg-red-950/50 text-red-400 px-2 py-0.5 rounded border border-red-900/30">
                      -{q.marksDeducted} Marks
                    </span>
                  </div>
                  <p className="text-xs font-medium text-yellow-500/90">{q.errorCategory}</p>
                  <p className="text-sm text-gray-400 leading-relaxed">{q.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: User Log Retrospective Text Editor */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4 sticky top-8">
          <div>
            <h2 className="text-lg font-bold">Retrospective Analysis</h2>
            <p className="text-xs text-gray-400">What went wrong conceptually? How will you isolate this pattern next time?</p>
          </div>

          <textarea
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            disabled={saving}
            placeholder="Write down your takeaways, actionable remediation goals, or notes here..."
            className="w-full h-64 bg-gray-950 border border-gray-800 text-white rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-white/10 resize-none disabled:opacity-50 font-sans leading-relaxed"
          />

          {statusMessage && (
            <p className={`text-xs font-medium ${statusMessage.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
              {statusMessage}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => router.push('/home')}
              disabled={saving}
              className="px-5 py-2.5 rounded-full text-xs font-medium text-gray-400 hover:text-white transition-all"
            >
              Discard
            </button>
            <button
              onClick={handleSaveReflection}
              disabled={saving || !reflectionText.trim()}
              className="px-6 py-2.5 rounded-full text-xs font-semibold bg-white text-black hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-600 transition-all flex items-center gap-2"
            >
              {saving ? 'Saving to Database...' : 'Save to Library'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}