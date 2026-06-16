import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LayoutDashboard, MapPin, BarChart3, MessageSquare, Settings, Activity, Clock, Users, Bell, X, Car, Target } from 'lucide-react';
import { fleetManager } from '../utils/fleetManager';

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Command Center' },
  { path: '/monitor', icon: Activity, label: 'Live Monitor' },
  { path: '/autocare', icon: Car, label: 'Autocare AI' },
  { path: '/validation', icon: Target, label: 'Validation' },
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
  const [notifications, setNotifications] = useState<{ id: number; text: string; time: string; type: string }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const alerts = fleetManager.getAlerts();
      const notifs = alerts.slice(0, 5).map((a, i) => ({
        id: i,
        text: `${a.vehicleId === 'V-SELF' ? 'You' : a.vehicleId}: ${a.alertType.replace(/_/g, ' ')} (score: ${Math.round(a.drowsinessScore)})`,
        time: getTimeAgo(a.timestamp),
        type: a.severity >= 3 ? 'critical' : a.severity >= 2 ? 'warning' : 'info',
      }));
      setNotifications(notifs);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const currentPage = NAV_ITEMS.find(item => item.path === location.pathname);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gridTemplateRows: '48px 1fr', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {/* Top Bar */}
      <header style={{ gridColumn: '1 / -1', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '16px', zIndex: 50 }}>
        <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={12} style={{ color: '#fff' }} />
          </div>
          DriveSafer
        </span>

        {currentPage && (
          <div style={{ marginLeft: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>/</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>{currentPage.label}</span>
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} />
            <span style={{ color: 'var(--success)', fontSize: '11px', fontWeight: 500 }}>LIVE</span>
          </div>

          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ background: 'none', border: '1px solid transparent', borderRadius: '6px', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
            >
              <Bell size={16} style={{ color: 'var(--text-tertiary)' }} />
              {notifications.length > 0 && <span style={{ position: 'absolute', top: '2px', right: '2px', background: 'var(--danger)', width: '6px', height: '6px', borderRadius: '50%' }} />}
            </button>

            {showNotifications && (
              <div style={{ position: 'absolute', top: '40px', right: 0, width: '320px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', zIndex: 100 }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}>Notifications</span>
                  <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                    <X size={14} style={{ color: 'var(--text-tertiary)' }} />
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px' }}>No alerts yet</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', marginTop: '5px', flexShrink: 0, background: n.type === 'critical' ? 'var(--danger)' : n.type === 'warning' ? 'var(--warning)' : 'var(--accent)' }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0, lineHeight: 1.4 }}>{n.text}</p>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '11px', margin: '3px 0 0' }}>{n.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Avatar */}
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff' }}>MV</span>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <nav style={{ background: 'var(--bg-primary)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '12px 8px', gap: '2px', overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                textDecoration: 'none',
                transition: 'all 150ms ease',
                background: isActive ? 'var(--accent-subtle)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >
              <item.icon size={16} style={{ color: isActive ? 'var(--accent)' : 'var(--text-tertiary)', flexShrink: 0 }} />
              <span style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '13px', fontWeight: isActive ? 500 : 400 }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main style={{ background: 'var(--bg-primary)', overflow: 'auto', padding: '24px' }} onClick={() => setShowNotifications(false)}>
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
