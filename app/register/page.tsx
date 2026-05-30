'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
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
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        setIsError(true);
        setMessage(error.message);
      } else if (data?.user) {
        setIsError(false);
        setMessage('✓ Account created! Redirecting...');
        setTimeout(() => router.push('/home'), 800);
      }
    } catch (err) {
      setIsError(true);
      setMessage('An unexpected error occurred during user creation.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-8">
      <div className="bg-gray-900 rounded-2xl p-10 w-full max-w-md border border-gray-800/40">
        <h1 className="text-3xl font-bold mb-2">Create account</h1>
        <p className="text-gray-400 mb-8">Start building your failure library</p>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              disabled={loading}
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
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
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <p className="text-gray-500 text-sm text-center mt-2">
            Already have an account?{' '}
            <Link href="/login" className="text-white underline hover:text-gray-200 transition-colors">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}