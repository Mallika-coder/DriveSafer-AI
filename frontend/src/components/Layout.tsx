import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { LayoutDashboard, MapPin, BarChart3, MessageSquare, Settings, Activity, Clock, Users, Search, Bell } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Command Center' },
  { path: '/monitor', icon: Activity, label: 'Live Monitor' },
  { path: '/fleet', icon: MapPin, label: 'Fleet Map' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/chat', icon: MessageSquare, label: 'AI Chat' },
  { path: '/drivers', icon: Users, label: 'Drivers' },
  { path: '/history', icon: Clock, label: 'History' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [alertCount] = useState(3);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gridTemplateRows: '56px 1fr', height: '100vh', width: '100vw', overflow: 'hidden', background: '#0a0b0f' }}>
      {/* Top Bar */}
      <header style={{ gridColumn: '1 / -1', background: '#111318', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '16px', zIndex: 50 }}>
        <span style={{ fontWeight: 700, fontSize: '16px', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={18} /> FleetMind
        </span>

        <div style={{ flex: 1, maxWidth: '420px', marginLeft: '24px', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input
            placeholder="Search vehicles, drivers, routes..."
            style={{ width: '100%', background: '#1a1d27', border: '1px solid #2d3748', borderRadius: '8px', padding: '8px 12px 8px 34px', color: '#94a3b8', fontSize: '13px', outline: 'none' }}
          />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <Bell size={18} style={{ color: '#64748b' }} />
            {alertCount > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '-6px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 600, padding: '1px 5px', borderRadius: '10px' }}>{alertCount}</span>
            )}
          </div>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#fff' }}>
            MK
          </div>
        </div>
      </header>

      {/* Icon Sidebar */}
      <nav style={{ background: '#111318', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: '4px', overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={item.label}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive ? '#1e3a5f' : 'transparent',
                transition: 'background 0.15s',
                textDecoration: 'none',
              }}
            >
              <item.icon size={19} style={{ color: isActive ? '#3b82f6' : '#64748b' }} />
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main style={{ background: '#0f1117', overflow: 'auto', padding: '24px' }}>
        {children}
      </main>
    </div>
  );
}
