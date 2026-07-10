'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AuthInput from '@/app/components/AuthInput';
import AuthButton from '@/app/components/AuthButton';
import { useToast } from '@/app/components/Toast';

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Email and password required.', 'error');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        showToast(error.message, 'error');
      } else if (data?.user && data.user.identities?.length === 0) {
        showToast('An account with this email already exists. Try logging in instead.', 'error');
      } else if (data?.session) {
        showToast('Case file created. Redirecting...', 'success');
        setTimeout(() => router.push('/welcome'), 800);
      } else {
        showToast('Check your email to confirm your account before logging in.', 'success', 6000);
      }
    } catch (err) {
      showToast('Unexpected error during registration.', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-transition" style={{ minHeight: '100vh', background: '#080808', color: '#c8c8c0', display: 'flex', fontFamily: 'var(--font-geist-sans, sans-serif)' }}>

      {/* Left panel */}
      <div style={{ width: 360, borderRight: '0.5px solid #1e1e1a', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 40, background: '#0d0d0b' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#c8c8c0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Autopsy</div>
          <div style={{ fontSize: 10, color: '#2e2e28', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>Failure Intelligence</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#2e2e28', letterSpacing: '0.08em', marginBottom: 12 }}>// new case</div>
          <div style={{ fontSize: 13, color: '#3a3a30', lineHeight: 1.8 }}>
            You already know what went wrong. This is where you find out why.
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#1e1e1a', letterSpacing: '0.08em', fontFamily: 'monospace' }}>
          AUTOPSY v0.3.0 — ORBITAL 26
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
            <AuthInput
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com"
              disabled={loading}
            />

            <AuthInput
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />

            <AuthButton type="submit" disabled={loading}>
              {loading ? 'Registering...' : 'Create account'}
            </AuthButton>

            <div style={{ fontSize: 11, color: '#2e2e28', textAlign: 'center', marginTop: 4 }}>
              Already have a file?{' '}
              <Link href="/login" style={{ color: '#5a5a52', textDecoration: 'underline' }}>
                Log in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
