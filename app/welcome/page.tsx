'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthButton from '@/app/components/AuthButton';

const STEPS = [
  {
    icon: 'ti-file-upload',
    title: 'New Intake: open a case file',
    body: 'Upload a marked exam script and Autopsy extracts each question you lost marks on, then tags the root cause automatically. No exam yet? Switch to the Manual Reflection tab and answer three guided prompts instead.',
  },
  {
    icon: 'ti-layout-grid',
    title: 'Case Files: your dashboard',
    body: 'Every case lands here: total cases, marks lost, your most common pattern, and how many are still pending reflection. Click any row to open it.',
  },
  {
    icon: 'ti-vector-triangle',
    title: 'Relationship map',
    body: 'The graph on your dashboard connects failures that share a root cause. Bigger nodes mean more marks lost or a more frequent pattern, click one to see how it links to the rest.',
  },
  {
    icon: 'ti-alert-triangle',
    title: 'Red flags',
    body: 'When a new entry repeats a root cause pattern from a past case, Autopsy flags it in the sidebar. That is the signal to stop treating it as a one-off mistake.',
  },
  {
    icon: 'ti-search',
    title: 'Search by meaning',
    body: 'Use Search in the sidebar to find past failures by what happened, not just keywords, e.g. "ran out of time". Switch off "Relevant only" to also see weaker matches, color-coded green to red by how confident the match is.',
  },
  {
    icon: 'ti-edit',
    title: 'Reflect on a case',
    body: 'Opening a case lets you write what happened and what you would do differently. This is what actually turns a mistake into a lesson, not just a tagged entry.',
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;

  const finish = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('autopsy_onboarded', '1');
    }
    router.push('/home');
  };

  const current = STEPS[step];

  return (
    <div className="page-transition" style={{ minHeight: '100vh', background: '#080808', color: '#c8c8c0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-geist-sans, sans-serif)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#c8c8c0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Autopsy</div>
          <div style={{ fontSize: 10, color: '#2e2e28', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>Failure Intelligence</div>
        </div>

        <div style={{ border: '0.5px solid #1e1e1a', borderRadius: 6, padding: 32, background: '#0a0a08' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 8, background: '#111110', border: '0.5px solid #1e1e1a',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
          }}>
            <i className={`ti ${current.icon}`} style={{ fontSize: 20, color: '#a8a8a0' }} aria-hidden="true" />
          </div>

          <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#2e2e28', marginBottom: 8 }}>
            Step {step + 1} of {STEPS.length}
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: '#c8c8c0', margin: 0, marginBottom: 12 }}>{current.title}</h1>
          <p style={{ fontSize: 13, color: '#5a5a52', lineHeight: 1.7, marginBottom: 28 }}>{current.body}</p>

          <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 2, borderRadius: 1,
                background: i <= step ? '#5a5a52' : '#1a1a16',
                transition: 'background 0.2s ease',
              }} />
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={finish}
              style={{ background: 'transparent', border: 'none', color: '#3a3a30', fontSize: 12, cursor: 'pointer', letterSpacing: '0.04em' }}
            >
              Skip tutorial
            </button>

            <div style={{ display: 'flex', gap: 12 }}>
              {step > 0 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  style={{ background: 'transparent', border: '0.5px solid #2e2e28', color: '#5a5a52', padding: '10px 18px', borderRadius: 4, fontSize: 12, cursor: 'pointer', letterSpacing: '0.06em' }}
                >
                  Back
                </button>
              )}
              <AuthButton onClick={() => (isLast ? finish() : setStep(s => s + 1))}>
                {isLast ? 'Get started' : 'Next'}
              </AuthButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
