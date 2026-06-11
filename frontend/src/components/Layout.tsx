import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { LayoutDashboard, MapPin, BarChart3, MessageSquare, Settings, Activity, Clock, Users, Search, Bell, X, LogOut, User } from 'lucide-react';

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const notifications = [
    { id: 1, text: 'Driver Gamma risk score exceeded 55 — monitoring', time: '2 min ago', type: 'warning' },
    { id: 2, text: 'Your session: PERCLOS elevated for 4 seconds', time: '5 min ago', type: 'critical' },
    { id: 3, text: 'Federated learning round completed (acc: 78%)', time: '12 min ago', type: 'info' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gridTemplateRows: '52px 1fr', height: '100vh', width: '100vw', overflow: 'hidden', background: '#07090f' }}>
      {/* Top Bar */}
      <header style={{ gridColumn: '1 / -1', background: '#0d1017', borderBottom: '1px solid #1a1f2e', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '16px', zIndex: 50 }}>
        <span style={{ fontWeight: 800, fontSize: '15px', background: 'linear-gradient(135deg, #818cf8, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Activity size={17} style={{ color: '#818cf8' }} /> FleetMind
        </span>

        <div style={{ flex: 1, maxWidth: '380px', marginLeft: '20px', position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
          <input
            placeholder="Search vehicles, drivers, routes..."
            style={{ width: '100%', background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '7px 11px 7px 32px', color: '#9ca3af', fontSize: '12px', outline: 'none' }}
          />
        </div>

        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
          <span style={{ color: '#10b981', fontSize: '10px', fontWeight: 600 }}>LIVE</span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
              style={{ background: showNotifications ? 'rgba(99,102,241,0.1)' : 'none', border: showNotifications ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent', borderRadius: '8px', cursor: 'pointer', position: 'relative', padding: '7px', display: 'flex', alignItems: 'center' }}
            >
              <Bell size={16} style={{ color: showNotifications ? '#818cf8' : '#6b7280' }} />
              <span style={{ position: 'absolute', top: '3px', right: '3px', background: '#ef4444', color: '#fff', fontSize: '8px', fontWeight: 700, width: '14px', height: '14px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
            </button>

            {showNotifications && (
              <div style={{ position: 'absolute', top: '44px', right: 0, width: '300px', background: '#0d1017', border: '1px solid #1f2937', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', zIndex: 100 }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#e5e7eb', fontSize: '12px', fontWeight: 600 }}>Notifications</span>
                  <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                    <X size={13} style={{ color: '#6b7280' }} />
                  </button>
                </div>
                {notifications.map(n => (
                  <div key={n.id} style={{ padding: '10px 16px', borderBottom: '1px solid #1f2937', display: 'flex', gap: '10px', cursor: 'pointer' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', marginTop: '5px', flexShrink: 0, background: n.type === 'critical' ? '#ef4444' : n.type === 'warning' ? '#f59e0b' : '#818cf8' }} />
                    <div>
                      <p style={{ color: '#d1d5db', fontSize: '11px', margin: 0, lineHeight: 1.4 }}>{n.text}</p>
                      <p style={{ color: '#4b5563', fontSize: '10px', margin: '3px 0 0' }}>{n.time}</p>
                    </div>
                  </div>
                ))}
                <Link to="/history" onClick={() => setShowNotifications(false)} style={{ display: 'block', padding: '10px 16px', textAlign: 'center', color: '#818cf8', fontSize: '11px', textDecoration: 'none', fontWeight: 500 }}>View all</Link>
              </div>
            )}
          </div>

          {/* Profile */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
              style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>MV</span>
            </button>

            {showProfile && (
              <div style={{ position: 'absolute', top: '44px', right: 0, width: '200px', background: '#0d1017', border: '1px solid #1f2937', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', zIndex: 100 }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #1f2937' }}>
                  <p style={{ color: '#e5e7eb', fontSize: '12px', fontWeight: 600, margin: 0 }}>Mallika Verma</p>
                  <p style={{ color: '#6b7280', fontSize: '10px', margin: '3px 0 0' }}>Fleet Admin • Team Lead</p>
                </div>
                <div style={{ padding: '6px' }}>
                  <Link to="/settings" onClick={() => setShowProfile(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '6px', textDecoration: 'none', color: '#d1d5db', fontSize: '11px' }}>
                    <User size={13} style={{ color: '#6b7280' }} /> Profile & Settings
                  </Link>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', width: '100%' }}>
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Icon Sidebar */}
      <nav style={{ background: '#0d1017', borderRight: '1px solid #1a1f2e', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', gap: '2px', overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={item.label}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(129,140,248,0.1))' : 'transparent',
                border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                transition: 'all 0.15s',
                textDecoration: 'none',
              }}
            >
              <item.icon size={17} style={{ color: isActive ? '#818cf8' : '#4b5563' }} />
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main style={{ background: '#07090f', overflow: 'auto', padding: '20px 24px' }} onClick={() => { setShowNotifications(false); setShowProfile(false); }}>
        {children}
      </main>
    </div>
  );
}
