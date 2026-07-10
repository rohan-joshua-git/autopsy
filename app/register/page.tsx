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
      setMessage('Email and password required.');
      return;
    }
    setLoading(true);
    setMessage('');
    setIsError(false);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setIsError(true);
        setMessage(error.message);
      } else if (data?.user && data.user.identities?.length === 0) {
        setIsError(true);
        setMessage('An account with this email already exists. Try logging in instead.');
      } else if (data?.session) {
        setIsError(false);
        setMessage('Case file created. Redirecting...');
        setTimeout(() => router.push('/home'), 800);
      } else {
        setIsError(false);
        setMessage('Check your email to confirm your account before logging in.');
      }
    } catch (err) {
      setIsError(true);
      setMessage('Unexpected error during registration.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#c8c8c0', display: 'flex', fontFamily: 'var(--font-geist-sans, sans-serif)' }}>

      {/* Left panel */}
      <div style={{ width: 360, borderRight: '0.5px solid #1e1e1a', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 40, background: '#0d0d0b' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#c8c8c0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Autopsy</div>
          <div style={{ fontSize: 10, color: '#2e2e28', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>Failure Intelligence</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#2e2e28', letterSpacing: '0.08em', marginBottom: 12 }}>// intake protocol</div>
          <div style={{ fontSize: 13, color: '#3a3a30', lineHeight: 1.8 }}>
            Every failure is a data point. Every pattern is a lesson waiting to be classified.
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#1e1e1a', letterSpacing: '0.08em', fontFamily: 'monospace' }}>
          AUTOPSY v0.1.0 — ORBITAL 26
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 360 }}>

          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#2e2e28', marginBottom: 8 }}>New subject</div>
            <h1 style={{ fontSize: 22, fontWeight: 500, color: '#c8c8c0', margin: 0 }}>Open a case file</h1>
            <p style={{ fontSize: 12, color: '#3a3a30', marginTop: 6 }}>Register to begin building your failure library.</p>
          </div>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2e2e28', marginBottom: 6 }}>Email</div>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                disabled={loading}
                style={{
                  width: '100%', background: '#0a0a08', border: '0.5px solid #2e2e28',
                  color: '#c8c8c0', borderRadius: 4, padding: '10px 12px', fontSize: 13,
                  outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace',
                  opacity: loading ? 0.5 : 1,
                }}
              />
            </div>

            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2e2e28', marginBottom: 6 }}>Password</div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                style={{
                  width: '100%', background: '#0a0a08', border: '0.5px solid #2e2e28',
                  color: '#c8c8c0', borderRadius: 4, padding: '10px 12px', fontSize: 13,
                  outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace',
                  opacity: loading ? 0.5 : 1,
                }}
              />
            </div>

            {message && (
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: isError ? '#993C1D' : '#3B6D11', letterSpacing: '0.04em' }}>
                {message}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              background: '#1a1a16', border: '0.5px solid #2e2e28', color: '#c8c8c0',
              padding: '10px 20px', borderRadius: 4, fontSize: 12, cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 4,
              opacity: loading ? 0.5 : 1,
            }}>
              {loading ? 'Registering...' : 'Create account'}
            </button>

            <div style={{ fontSize: 11, color: '#2e2e28', textAlign: 'center', marginTop: 4 }}>
              Already have a file?{' '}
              <Link href="/login" style={{ color: '#5a5a52', textDecoration: 'underline' }}>
                Authenticate
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}