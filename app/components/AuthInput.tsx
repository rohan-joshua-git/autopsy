'use client';

import { useState, InputHTMLAttributes } from 'react';

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function AuthInput({ label, style, ...props }: AuthInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2e2e28', marginBottom: 6 }}>{label}</div>
      <input
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={{
          width: '100%', background: '#0a0a08',
          border: `0.5px solid ${focused ? '#5a5a52' : '#2e2e28'}`,
          boxShadow: focused ? '0 0 0 3px rgba(90, 90, 82, 0.15)' : 'none',
          color: '#c8c8c0', borderRadius: 4, padding: '10px 12px', fontSize: 13,
          outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace',
          opacity: props.disabled ? 0.5 : 1,
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          ...style,
        }}
      />
    </div>
  );
}
