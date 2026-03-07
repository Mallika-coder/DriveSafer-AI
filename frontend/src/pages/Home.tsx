import { motion } from 'framer-motion';
import { ShieldAlert, Eye, Smartphone, Car, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const stats = [
    { icon: Eye, label: 'Drowsiness Detected', value: '12', trend: '-2% this week', color: 'text-warning' },
    { icon: Smartphone, label: 'Phone Distractions', value: '4', trend: '-8% this week', color: 'text-critical' },
    { icon: Activity, label: 'Total Scans', value: '14,289', trend: '+14% this week', color: 'text-success' },
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
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-10">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-end"
      >
        <div>
          <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-white mb-2">
            System <span className="text-gradient">Overview</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl">
            Real-time telemetry and AI analytics for driver safety and hazard prevention.
          </p>
        </div>
        
        <Link to="/monitor">
          <button className="glass-button px-6 py-3 rounded-lg font-bold flex items-center gap-2 group">
            <Car size={20} className="group-hover:translate-x-1 transition-transform" />
            Launch Monitor
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
            className="glass-panel p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-accent/40 transition-colors"
          >
            <div className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon size={120} />
            </div>
            <div className={`p-3 rounded-xl bg-surface_light w-fit ${stat.color} border border-white/5`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
              <h3 className="text-3xl font-orbitron font-bold text-white">{stat.value}</h3>
              <p className="text-xs text-gray-500 mt-2 font-medium">{stat.trend}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Hero Banner Area */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full glass-panel p-10 md:p-14 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-10 border-accent/20 bg-gradient-to-br from-surface to-accent/5 overflow-hidden relative"
      >
        {/* Decorative circuit/lines */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDEwaDQwTTAgMjBoNDBNMCAzMGg0ME0xMCAwdjQwTTIwIDB2NDBNMzAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiAvPjwvc3ZnPg==')] opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent)] pointer-events-none" />

        <div className="max-w-2xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold font-orbitron mb-6 uppercase tracking-wider animate-pulse-slow">
            <ShieldAlert size={14} /> Active Protection
          </div>
          <h2 className="text-3xl md:text-4xl font-orbitron font-bold mb-4 leading-tight">
            Next-Gen Cabin <br/>Intelligence
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-8">
            Our neural networks analyze facial anchors and object detection at 30 FPS, providing split-second warnings before accidents occur. Connect your camera stream to begin securing your journey.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/monitor">
              <button className="bg-accent hover:bg-white text-background font-bold px-8 py-3 rounded-xl transition-colors shadow-glow-accent">
                Start Engine
              </button>
            </Link>
            <Link to="/history">
              <button className="glass-button px-8 py-3 rounded-xl font-bold">
                View Logs
              </button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
