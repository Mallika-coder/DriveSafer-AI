import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Shield, Activity, Clock, Settings, User, Sparkles } from 'lucide-react';
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
    <nav className="w-64 h-full glass-panel border-l-0 border-y-0 border-r border-white/10 flex flex-col p-6 rounded-none z-10 relative bg-surface/80">
      <div className="flex items-center gap-3 mb-12 animate-fade-in group cursor-pointer relative">
        <div className="absolute -inset-2 bg-gradient-to-r from-accent to-primary_light rounded-xl blur-lg opacity-20 group-hover:opacity-60 transition duration-500"></div>
        <Shield size={32} className="text-accent relative z-10 animate-glow-shift" />
        <h1 className="text-2xl font-bold font-orbitron tracking-wider text-white relative z-10">DriveSafe</h1>
      </div>

      <div className="flex-grow space-y-4 font-sans focus:outline-none">
        {navItems.map((item, idx) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={idx} 
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                isActive 
                  ? 'bg-gradient-to-r from-accent/20 to-primary/20 text-white border border-accent/40 shadow-glow-accent' 
                  : 'text-gray-400 hover:text-white hover:bg-surface_light border border-transparent'
              }`}
            >
              {isActive && <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent w-full h-full opacity-50 pointer-events-none" />}
              <item.icon size={20} className={`relative z-10 ${isActive ? 'text-accent' : 'group-hover:text-primary_light transition-colors duration-300'}`} />
              <span className="font-medium tracking-wide relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto border-t border-white/10 pt-6 flex items-center gap-3 group cursor-pointer hover:bg-white/[0.02] p-2 rounded-xl transition-colors">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent via-primary_light to-secondary flex items-center justify-center shadow-glow-purple group-hover:shadow-glow-pink transition-all duration-500 p-[2px]">
          <div className="w-full h-full bg-surface rounded-full flex items-center justify-center overflow-hidden relative">
            <User size={18} className="text-white relative z-10" />
            <div className="absolute bottom-0 w-full h-1/2 bg-white/10" />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-accent group-hover:to-primary_light transition-all">Mallika Verma</p>
          <p className="text-xs text-primary_light font-mono flex items-center gap-1"><Sparkles size={10} /> Admin</p>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="h-screen w-screen overflow-hidden bg-background text-white flex font-sans relative">
        {/* Colorful dynamic background glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[150px] pointer-events-none mix-blend-screen animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-primary/20 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
        <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-secondary/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse-slow max-delay-[1s]" />

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
