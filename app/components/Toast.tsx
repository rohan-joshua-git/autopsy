'use client';

import { createContext, useCallback, useContext, useState, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';
interface ToastItem { id: number; message: string; type: ToastType; }
interface ToastContextValue { showToast: (message: string, type?: ToastType, durationMs?: number) => void; }

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const TOAST_STYLES: Record<ToastType, { border: string; color: string }> = {
  success: { border: '#0c2018', color: '#3B6D11' },
  error: { border: '#2a1008', color: '#993C1D' },
  info: { border: '#1e1e1a', color: '#c8c8c0' },
};

let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', durationMs = 4000) => {
    const id = ++idCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, durationMs);
  }, []);

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed', top: 20, right: 20, zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const s = TOAST_STYLES[t.type];
          return (
            <div
              key={t.id}
              onClick={() => dismiss(t.id)}
              style={{
                background: '#0d0d0b', border: `0.5px solid ${s.border}`, color: s.color,
                borderRadius: 4, padding: '10px 16px', fontSize: 12, fontFamily: 'monospace',
                letterSpacing: '0.02em', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                animation: 'toast-in 0.2s ease', minWidth: 240, maxWidth: 380,
                pointerEvents: 'auto', cursor: 'pointer',
              }}
            >
              {t.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
