'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

const prompts = [
  "What was the main thing that went wrong?",
  "What were you feeling before this exam?",
  "What would you do differently?",
];

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'reflect'>('upload');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [answers, setAnswers] = useState(['', '', '']);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (index: number, value: string) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setLoading(true);
    setStatusMessage('Ingesting file...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/parse-exam', { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`Parser returned status: ${response.status}`);
      const parsedData = await response.json();
      sessionStorage.setItem('latest_parsed_exam', JSON.stringify(parsedData));
      setStatusMessage('Analysis complete. Opening case file...');
      setTimeout(() => router.push('/reflect?source=upload'), 800);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Ingestion failed.');
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { error } = await supabase.from('failures').insert({
      user_id: user.id,
      type: 'reflection',
      answers: answers,
      tags: [],
    });

    if (error) {
      setError('Something went wrong saving your reflection. Please try again.');
      console.error(error);
    } else {
      setSubmitted(true);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-2">New Entry</h1>
      <p className="text-gray-400 mb-8">Upload an exam script or write a reflection</p>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-6 py-2 rounded-full font-medium transition-colors ${
            activeTab === 'upload'
              ? 'bg-white text-black'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Upload Exam Script
        </button>
        <button
          onClick={() => setActiveTab('reflect')}
          className={`px-6 py-2 rounded-full font-medium transition-colors ${
            activeTab === 'reflect'
              ? 'bg-white text-black'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Write Reflection
        </button>
      </div>

      {activeTab === 'upload' && (
        <div
          className="border-2 border-dashed border-gray-700 rounded-2xl p-16 text-center cursor-pointer hover:border-gray-500 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleFileUpload(file);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
          <p className="text-4xl mb-4">📄</p>
          <p className="text-gray-300 text-lg mb-2">Drop your exam PDF here</p>
          <p className="text-gray-500 mb-6">or</p>
          <button className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-gray-200 transition-colors">
            Upload Exam Script
          </button>
          {statusMessage && <p className="text-gray-400 text-sm mt-4">{statusMessage}</p>}
        </div>
      )}

      {activeTab === 'reflect' && (
        <div>
          {submitted ? (
            <div className="bg-green-900/40 border border-green-500 rounded-2xl p-8 text-center">
              <p className="text-green-400 text-xl font-medium">Reflection saved!</p>
              <p className="text-gray-400 text-sm mt-2">It will appear in your Failure Library</p>
              <div className="flex gap-4 justify-center mt-4">
                <button
                  onClick={() => { setSubmitted(false); setAnswers(['', '', '']); }}
                  className="text-gray-400 underline text-sm"
                >
                  Write another
                </button>
                <a href="/home" className="text-white underline text-sm">
                  View Library
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {prompts.map((prompt, index) => (
                <div key={index} className="bg-gray-900 rounded-2xl p-6">
                  <p className="text-gray-300 font-medium mb-3">
                    {index + 1}. {prompt}
                  </p>
                  <textarea
                    value={answers[index]}
                    onChange={(e) => handleChange(index, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full bg-gray-800 text-white rounded-xl p-4 h-28 resize-none outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
              ))}

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={loading || answers.every(a => a.trim() === '')}
                className="bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed self-start"
              >
                {loading ? 'Saving...' : 'Save Reflection'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}