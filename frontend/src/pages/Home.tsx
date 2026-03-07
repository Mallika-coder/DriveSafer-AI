import { motion } from 'framer-motion';
import { ShieldAlert, Eye, Smartphone, Car, Activity, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const stats = [
    { icon: Eye, label: 'Drowsiness Detected', value: '12', trend: '-2% this week', color: 'text-warning', glow: 'group-hover:shadow-[0_0_30px_rgba(255,230,0,0.3)]', border: 'group-hover:border-warning/50' },
    { icon: Smartphone, label: 'Phone Distractions', value: '4', trend: '-8% this week', color: 'text-secondary', glow: 'group-hover:shadow-[0_0_30px_rgba(255,0,127,0.3)]', border: 'group-hover:border-secondary/50' },
    { icon: Activity, label: 'Total Scans', value: '14,289', trend: '+14% this week', color: 'text-success', glow: 'group-hover:shadow-[0_0_30px_rgba(0,255,102,0.3)]', border: 'group-hover:border-success/50' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-10 pb-10">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-end bg-surface_light/20 p-6 rounded-2xl border border-white/5 backdrop-blur-sm shadow-glass"
      >
        <div>
          <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-white mb-2 tracking-wide">
            System <span className="text-gradient">Overview</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl">
            Real-time telemetry and <span className="text-primary_light font-semibold">AI analytics</span> for driver safety and hazard prevention.
          </p>
        </div>
        
        <Link to="/monitor">
          <button className="glass-button px-6 py-3 rounded-xl font-bold flex items-center gap-2 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/20 to-accent/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
            <Car size={20} className="group-hover:translate-x-1 group-hover:text-accent transition-all duration-300 relative z-10" />
            <span className="relative z-10">Launch Monitor</span>
          </button>
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx}
            variants={itemVariants}
            whileHover={{ y: -5, scale: 1.02 }}
            className={`glass-panel p-6 flex flex-col gap-4 relative overflow-hidden group transition-all duration-500 cursor-pointer ${stat.border} ${stat.glow}`}
          >
            {/* Background glow orb on hover */}
            <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-[40px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-current ${stat.color}`}></div>
            
            <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:opacity-10 transition-all duration-500 transform group-hover:rotate-12 group-hover:scale-110">
              <stat.icon size={120} />
            </div>
            
            <div className={`p-3 rounded-xl bg-surface_light w-fit ${stat.color} border border-white/5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
              <stat.icon size={28} />
            </div>
            
            <div className="relative z-10 mt-2">
              <p className="text-gray-400 text-sm font-medium mb-1 tracking-wide uppercase">{stat.label}</p>
              <h3 className={`text-4xl font-orbitron font-bold text-white mb-2 group-hover:${stat.color} transition-colors duration-300`}>
                {stat.value}
              </h3>
              <div className="flex items-center gap-2 bg-surface_light/50 w-fit px-2 py-1 rounded-md border border-white/5">
                <Zap size={14} className={stat.color} />
                <p className="text-xs text-gray-300 font-medium">{stat.trend}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Hero Banner Area */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full glass-panel p-10 md:p-14 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-10 border-primary/30 group overflow-hidden relative"
      >
        {/* Animated vibrant gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface via-primary/10 to-accent/10 opacity-80" />
        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-primary/20 to-transparent rotate-45 group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />

        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDEwaDQwTTAgMjBoNDBNMCAzMGg0ME0xMCAwdjQwTTIwIDB2NDBNMzAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiAvPjwvc3ZnPg==')] opacity-[0.15] [mask-image:radial-gradient(ellipse_at_center,black,transparent)] pointer-events-none group-hover:scale-105 transition-transform duration-1000" />

        <div className="max-w-2xl z-10 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 border border-accent/40 text-accent text-xs font-bold font-orbitron mb-6 uppercase tracking-widest shadow-glow-accent animate-pulse-slow">
            <ShieldAlert size={14} /> Active Protection System
          </div>
          
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6 leading-tight text-white drop-shadow-lg">
            Next-Gen <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary_light to-secondary">Cabin Intelligence</span>
          </h2>
          
          <p className="text-gray-300 text-lg leading-relaxed mb-8 backdrop-blur-sm bg-surface/30 p-4 rounded-xl border border-white/5">
            Our neural networks analyze facial anchors and object detection at <span className="text-accent font-bold">30 FPS</span>, providing split-second warnings before accidents occur. Connect your camera stream to begin securing your journey.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link to="/monitor">
              <button className="bg-gradient-to-r from-accent to-primary hover:from-accent_hover hover:to-primary_light text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-glow-accent hover:shadow-glow-purple transform hover:-translate-y-1">
                Start Engine ⚡
              </button>
            </Link>
            <Link to="/history">
              <button className="glass-button-pink px-8 py-3.5 rounded-xl font-bold">
                View Logs
              </button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
