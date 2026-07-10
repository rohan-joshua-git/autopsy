'use client';

import { useState, ButtonHTMLAttributes } from 'react';

export default function AuthButton({ style, disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const [hover, setHover] = useState(false);
  return (
    <button
      {...props}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover && !disabled ? '#22221c' : '#1a1a16',
        border: `0.5px solid ${hover && !disabled ? '#3a3a30' : '#2e2e28'}`,
        color: '#c8c8c0',
        padding: '10px 20px', borderRadius: 4, fontSize: 12, cursor: disabled ? 'not-allowed' : 'pointer',
        letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 4,
        opacity: disabled ? 0.5 : 1,
        transform: hover && !disabled ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'background 0.15s ease, border-color 0.15s ease, transform 0.15s ease',
        ...style,
      }}
    />
  );
}
