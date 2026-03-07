import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Shield, Activity, Clock, Settings, User } from 'lucide-react';
import Home from './pages/Home';
import Monitor from './pages/Monitor';
import History from './pages/History';

function Sidebar() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: Shield },
    { path: '/monitor', label: 'Monitor', icon: Activity },
    { path: '/history', label: 'History', icon: Clock },
    { path: '#', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="w-64 h-full glass-panel border-l-0 border-y-0 border-r border-[#1f2d47] flex flex-col p-6 rounded-none z-10 relative">
      <div className="flex items-center gap-3 mb-12 animate-fade-in text-gradient">
        <Shield size={32} className="text-accent" />
        <h1 className="text-2xl font-bold font-orbitron tracking-wider">DriveSafe</h1>
      </div>

      <div className="flex-grow space-y-4 font-sans">
        {navItems.map((item, idx) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={idx} 
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-accent/15 text-accent border border-accent/30 shadow-glow-accent' 
                  : 'text-gray-400 hover:text-white hover:bg-surface_light border border-transparent'
              }`}
            >
              <item.icon size={20} className={isActive ? 'text-accent' : 'group-hover:text-accent transition-colors'} />
              <span className="font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto border-t border-white/5 pt-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-blue-600 flex items-center justify-center shadow-glow-accent">
          <User size={20} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Mallika Verma</p>
          <p className="text-xs text-accent">Admin</p>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="h-screen w-screen overflow-hidden bg-background text-white flex font-sans relative">
        {/* Background glow effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

        <Sidebar />
        
        <main className="flex-1 h-full overflow-y-auto relative z-10 p-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/monitor" element={<Monitor />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
