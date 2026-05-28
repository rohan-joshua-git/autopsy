'use client';

import { useState } from 'react';

const prompts = [
  "What was the main thing that went wrong?",
  "What were you feeling before this exam?",
  "What would you do differently?",
];

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'reflect'>('reflect');
  const [answers, setAnswers] = useState(['', '', '']);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (index: number, value: string) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  const handleSubmit = () => {
    console.log('Reflection submitted:', answers);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      {/* Header */}
      <h1 className="text-3xl font-bold mb-2">New Entry</h1>
      <p className="text-gray-400 mb-8">Upload an exam script or write a reflection</p>

      {/* Tabs */}
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

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="border-2 border-dashed border-gray-700 rounded-2xl p-16 text-center">
          <p className="text-4xl mb-4">📄</p>
          <p className="text-gray-300 text-lg mb-2">Drop your exam PDF here</p>
          <p className="text-gray-500 mb-6">or</p>
          <button className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-gray-200 transition-colors">
            Upload Exam Script
          </button>
        </div>
      )}

      {/* Reflect Tab */}
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
              <button
                onClick={handleSubmit}
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