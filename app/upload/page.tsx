'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // FIXED: Default tab state is now 'upload' instead of 'reflect'
  const [activeTab, setActiveTab] = useState<'upload' | 'reflect'>('upload');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Manual Reflection State
  const [answers, setAnswers] = useState(['', '', '']);
  const [submitted, setSubmitted] = useState(false);

  const prompts = [
    "What was the main thing that went wrong?",
    "What were you feeling before this exam?",
    "What would you do differently?",
  ];

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setLoading(true);
    setStatusMessage('Uploading and parsing script with Gemini...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Post raw payload directly to your NextJS backend processing engine
      const response = await fetch('/api/parse-exam', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Parser route returned status code: ${response.status}`);
      }

      const parsedData = await response.json();

      // Commit the Gemini structure response down to client session cache
      sessionStorage.setItem('latest_parsed_exam', JSON.stringify(parsedData));

      setStatusMessage('✓ Parsing complete! Preparing diagnostic layout...');
      
      // FIXED: Forces the '?source=upload' parameter flag to prevent empty screens
      setTimeout(() => {
        router.push('/reflect?source=upload');
      }, 800);

    } catch (err) {
      console.error('[upload] File transaction failure:', err);
      setStatusMessage(err instanceof Error ? err.message : 'Failed to parse file asset.');
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (loading) return;
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileUpload(droppedFile);
    }
  };

  const handleTextChange = (index: number, value: string) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      {/* Header */}
      <h1 className="text-3xl font-bold mb-2">New Entry</h1>
      <p className="text-gray-400 mb-8">Upload an exam script or write a reflection</p>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => !loading && setActiveTab('upload')}
          disabled={loading}
          className={`px-6 py-2 rounded-full font-medium transition-colors disabled:opacity-50 ${
            activeTab === 'upload' ? 'bg-white text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Upload Exam Script
        </button>
        <button
          onClick={() => !loading && setActiveTab('reflect')}
          disabled={loading}
          className={`px-6 py-2 rounded-full font-medium transition-colors disabled:opacity-50 ${
            activeTab === 'reflect' ? 'bg-white text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Write Reflection
        </button>
      </div>

      {/* Upload Tab View */}
      {activeTab === 'upload' && (
        <div 
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-16 text-center transition-all ${
            loading ? 'border-blue-500/50 bg-blue-950/10' : 'border-gray-700 hover:border-gray-600 bg-gray-900/20'
          }`}
        >
          {/* Hidden functional file router system */}
          <input 
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            accept="image/*,application/pdf"
            className="hidden"
          />

          <p className="text-4xl mb-4">{loading ? '⏳' : '📄'}</p>
          <p className="text-gray-300 text-lg mb-2">
            {loading ? 'Analyzing data profiles...' : 'Drop your exam PDF or image here'}
          </p>
          
          {!loading && (
            <>
              <p className="text-gray-500 mb-6">or</p>
              <button 
                onClick={handleButtonClick}
                className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-gray-200 transition-colors"
              >
                Browse Files
              </button>
            </>
          )}

          {statusMessage && (
            <p className={`text-sm mt-6 font-medium ${statusMessage.startsWith('✓') ? 'text-green-400' : 'text-blue-400 animate-pulse'}`}>
              {statusMessage}
            </p>
          )}
        </div>
      )}

      {/* Manual Reflection Tab View */}
      {activeTab === 'reflect' && (
        <div>
          {submitted ? (
            <div className="bg-green-900/40 border border-green-500 rounded-2xl p-8 text-center">
              <p className="text-green-400 text-xl font-medium">✅ Reflection saved!</p>
              <button
                onClick={() => { setSubmitted(false); setAnswers(['', '', '']); }}
                className="mt-4 text-gray-400 underline text-sm"
              >
                Write another
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {prompts.map((prompt, index) => (
                <div key={index} className="bg-gray-900 rounded-2xl p-6 border border-gray-800/40">
                  <p className="text-gray-300 font-medium mb-3">
                    {index + 1}. {prompt}
                  </p>
                  <textarea
                    value={answers[index]}
                    onChange={(e) => handleTextChange(index, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full bg-gray-800 text-white rounded-xl p-4 h-28 resize-none outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
              ))}
              <button
                onClick={() => setSubmitted(true)}
                disabled={answers.every(a => a.trim() === '')}
                className="bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed self-start"
              >
                Save Reflection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}