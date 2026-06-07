import { Link, useLocation } from 'react-router-dom';
import { Shield, Activity, Clock, BarChart3, User, Sparkles } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Shield },
    { path: '/monitor', label: 'Monitor', icon: Activity },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/history', label: 'History', icon: Clock },
  ];

  return (
    <nav
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '280px',
        backgroundColor: '#0B132B',
        borderRight: '1px solid rgba(0, 240, 255, 0.15)',
        padding: '32px 20px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '48px', gap: '12px', padding: '0 8px' }}>
        <div style={{ padding: '10px', border: '2px solid #00F0FF', borderRadius: '12px', backgroundColor: 'rgba(0, 240, 255, 0.1)' }}>
          <Shield size={28} style={{ color: '#00F0FF' }} />
        </div>
        <div>
          <h1 style={{ color: '#ffffff', margin: 0, fontSize: '1.25rem', fontWeight: 900, fontFamily: 'Orbitron' }}>
            Drive<span style={{ color: '#00F0FF' }}>Safe</span>
          </h1>
          <span style={{ color: '#6B7280', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>AI Safety System</span>
        </div>
      </div>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {navItems.map((item, idx) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={idx}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 16px',
                borderRadius: '12px',
                textDecoration: 'none',
                transition: 'all 0.2s',
                backgroundColor: isActive ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                border: isActive ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid transparent',
              }}
            >
              <item.icon
                size={20}
                style={{
                  color: isActive ? '#00F0FF' : '#6B7280',
                  marginRight: '12px',
                }}
              />
              <span
                style={{
                  color: isActive ? '#ffffff' : '#9CA3AF',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  letterSpacing: '0.05em',
                }}
              >
                {item.label}
              </span>
              {isActive && (
                <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00F0FF', boxShadow: '0 0 8px #00F0FF' }} />
              )}
            </Link>
          );
        })}
      </div>

      {/* ML Model Info */}
      <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(112, 0, 255, 0.05)', border: '1px solid rgba(112, 0, 255, 0.2)', marginBottom: '16px' }}>
        <span style={{ color: '#7000FF', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active Models</span>
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ color: '#9CA3AF', fontSize: '0.65rem' }}>MediaPipe FaceMesh v0.4</span>
          <span style={{ color: '#9CA3AF', fontSize: '0.65rem' }}>TF.js COCO-SSD v2.2</span>
          <span style={{ color: '#9CA3AF', fontSize: '0.65rem' }}>Custom Drowsiness Model</span>
        </div>
      </div>

      {/* Team */}
      <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <p style={{ color: '#6B7280', fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 10px' }}>
          <Sparkles size={10} style={{ display: 'inline', marginRight: '4px' }} />Team
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { name: 'Mallika', role: 'ML Pipeline' },
            { name: 'Harsh', role: 'Frontend' },
            { name: 'Jivit', role: 'Computer Vision' },
            { name: 'Divyanshu', role: 'Signal Processing' },
            { name: 'Hemant', role: 'Backend' },
          ].map((member, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: i === 0 ? 'linear-gradient(to right, #00F0FF, #7000FF)' : '#1C2541', display: 'flex', alignItems: 'center', justifyContent: 'center', border: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
                <User size={12} style={{ color: '#fff' }} />
              </div>
              <div>
                <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}>{member.name}</span>
                <span style={{ color: '#6B7280', fontSize: '0.55rem', marginLeft: '6px' }}>{member.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
