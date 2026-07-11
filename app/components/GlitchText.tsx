'use client';

import { useEffect, useState, CSSProperties } from 'react';

const SCRAMBLE_CHARS = '!<>-_\\/[]{}=+*^?#';

function scrambleChar() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

function buildDisplay(phrase: string, revealCount: number) {
  return phrase
    .split('')
    .map((ch, i) => (ch === ' ' || i < revealCount ? ch : scrambleChar()))
    .join('');
}

interface GlitchTextProps {
  phrases: string[];
  intervalMs?: number;
  style?: CSSProperties;
}

export default function GlitchText({ phrases, intervalMs = 4500, style }: GlitchTextProps) {
  const [displayText, setDisplayText] = useState(() => phrases[0] || '');
  const [scrambling, setScrambling] = useState(false);

  useEffect(() => {
    if (phrases.length <= 1) return;
    let phraseIndex = 0;
    let revealCount = 0;
    let scrambleTimer: ReturnType<typeof setInterval> | null = null;

    const outer = setInterval(() => {
      phraseIndex = (phraseIndex + 1) % phrases.length;
      revealCount = 0;
      setScrambling(true);

      const target = phrases[phraseIndex].length;
      if (scrambleTimer) clearInterval(scrambleTimer);
      scrambleTimer = setInterval(() => {
        revealCount += 1;
        if (revealCount >= target) {
          if (scrambleTimer) clearInterval(scrambleTimer);
          setScrambling(false);
          setDisplayText(phrases[phraseIndex]);
        } else {
          setDisplayText(buildDisplay(phrases[phraseIndex], revealCount));
        }
      }, 30);
    }, intervalMs);

    return () => {
      clearInterval(outer);
      if (scrambleTimer) clearInterval(scrambleTimer);
    };
  }, [phrases, intervalMs]);

  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: 'monospace',
        textShadow: scrambling ? '1px 0 #5a1e1e, -1px 0 #1e3a5a' : 'none',
        animation: scrambling ? 'glitch-jitter 0.15s steps(2, end) infinite' : 'none',
        ...style,
      }}
    >
      {displayText}
    </span>
  );
}
