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
    { id: 1, text: 'Driver Alpha risk score exceeded 60', time: '2 min ago', type: 'critical' },
    { id: 2, text: 'Vehicle V-003 route deviation detected', time: '8 min ago', type: 'warning' },
    { id: 3, text: 'Federated learning round 5 complete', time: '15 min ago', type: 'info' },
  ];

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
          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: '6px' }}
            >
              <Bell size={18} style={{ color: showNotifications ? '#3b82f6' : '#64748b' }} />
              <span style={{ position: 'absolute', top: '2px', right: '2px', background: '#ef4444', color: '#fff', fontSize: '9px', fontWeight: 600, padding: '1px 4px', borderRadius: '10px' }}>3</span>
            </button>

            {showNotifications && (
              <div style={{ position: 'absolute', top: '42px', right: 0, width: '320px', background: '#161922', border: '1px solid #1e293b', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 100 }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 600 }}>Notifications</span>
                  <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={14} style={{ color: '#64748b' }} />
                  </button>
                </div>
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {notifications.map(n => (
                    <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b', display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', marginTop: '5px', flexShrink: 0, background: n.type === 'critical' ? '#ef4444' : n.type === 'warning' ? '#f59e0b' : '#3b82f6' }} />
                      <div>
                        <p style={{ color: '#cbd5e1', fontSize: '12px', margin: 0 }}>{n.text}</p>
                        <p style={{ color: '#475569', fontSize: '11px', margin: '3px 0 0' }}>{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '10px 16px', borderTop: '1px solid #1e293b', textAlign: 'center' }}>
                  <Link to="/history" onClick={() => setShowNotifications(false)} style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none', fontWeight: 500 }}>View all alerts</Link>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
              style={{ background: showProfile ? '#1e3a5f' : '#3b82f6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>MK</span>
            </button>

            {showProfile && (
              <div style={{ position: 'absolute', top: '42px', right: 0, width: '220px', background: '#161922', border: '1px solid #1e293b', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 100 }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #1e293b' }}>
                  <p style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 600, margin: 0 }}>Mallika Verma</p>
                  <p style={{ color: '#64748b', fontSize: '11px', margin: '4px 0 0' }}>Fleet Admin</p>
                </div>
                <div style={{ padding: '6px' }}>
                  <Link to="/settings" onClick={() => setShowProfile(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '6px', textDecoration: 'none', color: '#cbd5e1', fontSize: '12px' }}>
                    <User size={14} style={{ color: '#64748b' }} /> Profile & Settings
                  </Link>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '6px', background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', width: '100%' }}>
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </div>
            )}
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
      <main style={{ background: '#0f1117', overflow: 'auto', padding: '24px' }} onClick={() => { setShowNotifications(false); setShowProfile(false); }}>
        {children}
      </main>
    </div>
  );
}
