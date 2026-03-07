import { Link, useLocation } from 'react-router-dom';
import { Shield, Activity, Clock, Settings, User, Sparkles } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: Shield },
    { path: '/monitor', label: 'Monitor', icon: Activity },
    { path: '/history', label: 'History', icon: Clock },
    { path: '#', label: 'Settings', icon: Settings },
  ];

  return (
    <nav 
      className="h-full bg-[#0B132B] border-r-2 border-accent/20 flex flex-col p-10 shrink-0 z-30 shadow-[10px_0_50px_rgba(0,0,0,0.8)]"
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        width: '320px', 
        backgroundColor: '#0B132B',
        borderRight: '2px solid rgba(0, 240, 255, 0.2)',
        padding: '40px',
        boxSizing: 'border-box'
      }}
    >
      <div 
        className="flex items-center gap-5 mb-20 group cursor-pointer" 
        style={{ display: 'flex', alignItems: 'center', marginBottom: '80px', gap: '20px' }}
      >
        <div 
          className="p-3 rounded-2xl bg-accent/20 border-2 border-accent/40"
          style={{ padding: '12px', border: '2px solid #00F0FF', borderRadius: '16px', backgroundColor: 'rgba(0, 240, 255, 0.1)' }}
        >
          <Shield size={40} style={{ color: '#00F0FF' }} />
        </div>
        <h1 
          className="text-3xl font-orbitron font-black tracking-tighter uppercase antialiased"
          style={{ color: '#ffffff', margin: 0, fontSize: '1.875rem', fontWeight: 900, fontFamily: 'Orbitron' }}
        >
          Drive<span style={{ color: '#00F0FF', textDecoration: 'underline', textDecorationColor: '#7000FF', textDecorationThickness: '4px', textUnderlineOffset: '8px' }}>Safe</span>
        </h1>
      </div>

      <div 
        className="flex-grow space-y-4" 
        style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}
      >
        {navItems.map((item, idx) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={idx} 
              to={item.path}
              className="group"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '24px', 
                borderRadius: '16px', 
                textDecoration: 'none',
                transition: 'all 0.3s',
                backgroundColor: isActive ? '#00F0FF' : 'transparent',
                border: isActive ? '2px solid #00F0FF' : '2px solid transparent',
                boxShadow: isActive ? '0 0 30px rgba(0, 240, 255, 0.5)' : 'none',
                transform: isActive ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              <item.icon 
                size={28} 
                style={{ 
                  color: isActive ? '#050B14' : '#00F0FF', 
                  marginRight: '20px',
                  transition: 'all 0.3s'
                }} 
              />
              <span 
                style={{ 
                  color: isActive ? '#050B14' : '#ffffff', 
                  fontWeight: 900, 
                  textTransform: 'uppercase', 
                  fontSize: '1.25rem', 
                  letterSpacing: '0.15em',
                  fontFamily: 'Orbitron'
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      <div 
        className="mt-auto pt-10 border-t-2 border-white/10 flex items-center gap-6" 
        style={{ marginTop: 'auto', paddingTop: '40px', borderTop: '2px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '24px' }}
      >
        <div 
          className="w-16 h-16 rounded-full bg-gradient-to-tr from-accent to-secondary flex items-center justify-center p-[3px]"
          style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(to top right, #00F0FF, #7000FF)', padding: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div 
            className="w-full h-full bg-black rounded-full flex items-center justify-center overflow-hidden"
            style={{ width: '100%', height: '100%', backgroundColor: '#000000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <User size={32} style={{ color: '#ffffff' }} />
          </div>
        </div>
        <div style={{ overflow: 'hidden' }}>
          <p style={{ color: '#ffffff', fontWeight: 900, fontSize: '1.25rem', margin: 0, textTransform: 'uppercase' }}>Mallika Verma</p>
          <p style={{ color: '#00F0FF', fontWeight: 900, fontSize: '0.75rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.3em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} /> ADMIN
          </p>
        </div>
      </div>
    </nav>
  );
}
