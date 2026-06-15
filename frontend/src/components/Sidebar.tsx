import { Link, useLocation } from 'react-router-dom';
import { Shield, Activity, Clock, BarChart3, User, Radio, UserCircle, Cpu, Car, Target } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Overview', icon: Shield },
    { path: '/monitor', label: 'Monitor', icon: Activity },
    { path: '/autocare', label: 'Autocare AI', icon: Car },
    { path: '/validation', label: 'Validation', icon: Target },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/fleet', label: 'Fleet V2X', icon: Radio },
    { path: '/profile', label: 'Driver Profile', icon: UserCircle },
    { path: '/history', label: 'History', icon: Clock },
  ];

  return (
    <nav
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '280px',
        backgroundColor: '#0c1220',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '28px 16px',
        boxSizing: 'border-box',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 12px', marginBottom: '36px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #63b3ed, #4299e1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={18} style={{ color: '#fff' }} />
        </div>
        <div>
          <h1 style={{ color: '#f7fafc', margin: 0, fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            DriveSafe
          </h1>
          <span style={{ color: '#718096', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>AI Safety System</span>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item, idx) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={idx}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '11px 14px',
                borderRadius: '10px',
                textDecoration: 'none',
                transition: 'all 0.15s',
                backgroundColor: isActive ? 'rgba(99, 179, 237, 0.1)' : 'transparent',
                border: isActive ? '1px solid rgba(99, 179, 237, 0.2)' : '1px solid transparent',
              }}
            >
              <item.icon
                size={17}
                style={{ color: isActive ? '#63b3ed' : '#718096', marginRight: '11px' }}
              />
              <span style={{ color: isActive ? '#f7fafc' : '#a0aec0', fontWeight: 600, fontSize: '0.8rem' }}>
                {item.label}
              </span>
              {isActive && (
                <div style={{ marginLeft: 'auto', width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#63b3ed' }} />
              )}
            </Link>
          );
        })}
      </div>

      {/* Model Status */}
      <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <Cpu size={12} style={{ color: '#63b3ed' }} />
          <span style={{ color: '#718096', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active Models</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { name: 'FaceMesh v0.4', status: 'active' },
            { name: 'COCO-SSD v2.2', status: 'active' },
            { name: 'TinyML Classifier', status: 'active' },
            { name: 'Driver Adaptation', status: 'learning' },
          ].map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#a0aec0', fontSize: '0.6rem' }}>{m.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: m.status === 'active' ? '#48bb78' : '#ed8936' }} />
                <span style={{ color: m.status === 'active' ? '#48bb78' : '#ed8936', fontSize: '0.5rem', fontWeight: 600 }}>{m.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div style={{ paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <p style={{ color: '#4a5568', fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px', paddingLeft: '4px' }}>Team</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { name: 'Mallika', role: 'ML Pipeline' },
            { name: 'Harsh', role: 'Frontend' },
            { name: 'Jivit', role: 'Computer Vision' },
            { name: 'Divyanshu', role: 'Signals' },
            { name: 'Hemant', role: 'Backend' },
          ].map((member, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px' }}>
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%',
                background: i === 0 ? 'linear-gradient(135deg, #63b3ed, #4299e1)' : '#1a202c',
                border: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <User size={10} style={{ color: '#fff' }} />
              </div>
              <span style={{ color: '#a0aec0', fontSize: '0.65rem', fontWeight: 600 }}>{member.name}</span>
              <span style={{ color: '#4a5568', fontSize: '0.55rem', marginLeft: 'auto' }}>{member.role}</span>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
