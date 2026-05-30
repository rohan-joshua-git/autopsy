'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setIsError(true);
      setMessage('Please enter both email and password parameters.');
      return;
    }

    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      // Execute the live Supabase sign-in profile verification sequence
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setIsError(true);
        setMessage(error.message);
      } else if (data?.user) {
        setIsError(false);
        setMessage('✓ Secure session established! Redirecting...');
        
        // Push the authenticated user straight into the dashboard workspace
        setTimeout(() => {
          router.push('/home');
        }, 600);
      }
    } catch (err) {
      setIsError(true);
      setMessage('An unexpected error occurred during session initialization.');
      console.error('[login] Transaction failure:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-8">
      <div className="bg-gray-900 rounded-2xl p-10 w-full max-w-md border border-gray-800/40">
        <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
        <p className="text-gray-400 mb-8">Log in to your Autopsy account</p>

        {/* Form element handles 'Enter' key submission triggers natively */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              disabled={loading}
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 transition-all"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 transition-all"
            />
          </div>

          {message && (
            <p className={`text-sm mt-1 ${isError ? 'text-red-400' : 'text-green-400'}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-gray-200 transition-colors mt-2 disabled:opacity-50 flex justify-center items-center"
          >
            {loading ? 'Verifying Session...' : 'Log In'}
          </button>

          <p className="text-gray-500 text-sm text-center mt-2">
            Don't have an account?{' '}
            <Link href="/register" className="text-white underline hover:text-gray-200 transition-colors">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}