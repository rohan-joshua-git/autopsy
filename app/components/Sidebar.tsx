'use client';

import { useState } from 'react';

export interface SidebarItem {
  icon: string;
  label: string;
  active?: boolean;
  onClick: () => void;
}

interface SidebarProps {
  items: SidebarItem[];
  onSignOut: () => void;
}

function SidebarRow({ icon, label, active, onClick }: SidebarItem) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '8px 20px', fontSize: 13,
        color: active ? '#c8c8c0' : hover ? '#a8a8a0' : '#5a5a52',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
        borderLeft: active ? '2px solid #3a3a30' : '2px solid transparent',
        background: active ? '#111110' : hover ? '#0d0d0c' : 'transparent',
        transition: 'color 0.15s ease, background 0.15s ease',
      }}
    >
      <i className={`ti ${icon}`} style={{ fontSize: 15 }} aria-hidden="true" />
      {label}
    </div>
  );
}

export default function Sidebar({ items, onSignOut }: SidebarProps) {
  const [signOutHover, setSignOutHover] = useState(false);
  return (
    <div style={{ width: 200, background: '#0d0d0b', borderRight: '0.5px solid #1e1e1a', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
      <div style={{ padding: '0 20px 20px', borderBottom: '0.5px solid #1e1e1a', marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#c8c8c0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Autopsy</div>
        <div style={{ fontSize: 10, color: '#2e2e28', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>Failure Intelligence</div>
      </div>
      {items.map(item => <SidebarRow key={item.label} {...item} />)}
      <div style={{ marginTop: 'auto' }}>
        <div
          onClick={onSignOut}
          onMouseEnter={() => setSignOutHover(true)}
          onMouseLeave={() => setSignOutHover(false)}
          style={{
            padding: '8px 20px', fontSize: 13, color: signOutHover ? '#993C1D' : '#3a3a30', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, borderLeft: '2px solid transparent',
            transition: 'color 0.15s ease',
          }}
        >
          <i className="ti ti-logout" style={{ fontSize: 15 }} aria-hidden="true" />
          Sign out
        </div>
      </div>
    </div>
  );
}
