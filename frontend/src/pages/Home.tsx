import { motion, type Variants } from 'framer-motion';
import { ShieldAlert, Eye, Smartphone, Car, Activity, Zap, Shield } from 'lucide-react';
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

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-12 pb-12">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center bg-[#111927] p-12 rounded-[2.5rem] border-2 border-white/10 shadow-3xl relative overflow-hidden"
        style={{ backgroundColor: '#111927', border: '2px solid rgba(255, 255, 255, 0.1)', padding: '48px', borderRadius: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
        
        <div className="relative z-10 w-full xl:w-2/3">
          <h1 
            className="text-6xl md:text-8xl font-orbitron font-black text-white mb-6 tracking-tighter leading-none uppercase"
            style={{ fontSize: '5rem', fontWeight: 900, color: '#ffffff', marginBottom: '24px', fontFamily: 'Orbitron', lineHeight: 1 }}
          >
            SYSTEM <span className="text-gradient" style={{ background: 'linear-gradient(to right, #00F0FF, #7000FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>OVERVIEW</span>
          </h1>
          <p 
            className="text-2xl font-bold max-w-3xl leading-relaxed"
            style={{ fontSize: '1.5rem', fontWeight: 700, color: '#E5E7EB', lineHeight: 1.6, maxWidth: '800px' }}
          >
            Real-time telemetry and <span style={{ color: '#00F0FF', textDecoration: 'underline' }}>AI ANALYTICS</span> for next-gen driver safety and cabin intelligence.
          </p>
        </div>
        
        <div className="hidden xl:block">
          <Link to="/monitor">
            <button 
              className="hover:bg-white px-12 py-7 rounded-3xl font-black text-2xl flex items-center gap-5 transition-all hover:scale-110 active:scale-95"
              style={{ backgroundColor: '#00F0FF', color: '#050B14', border: 'none', borderRadius: '24px', padding: '28px 48px', fontSize: '1.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer' }}
            >
              <Car size={36} /> 
              <span className="uppercase tracking-[0.1em]">Live Monitor</span>
            </button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-10"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}
      >
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx}
            variants={itemVariants}
            className="p-12 flex flex-col gap-8 relative overflow-hidden bg-[#111927] shadow-2xl"
            style={{ backgroundColor: '#111927', padding: '48px', borderRadius: '32px', border: '2px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', gap: '32px' }}
          >
            <div 
              className="p-6 rounded-3xl w-fit"
              style={{ padding: '24px', backgroundColor: '#1C2541', borderRadius: '24px', border: '2px solid rgba(255, 255, 255, 0.1)', width: 'fit-content' }}
            >
              <stat.icon size={48} style={{ color: stat.color === 'text-accent' ? '#00F0FF' : stat.color === 'text-secondary' ? '#FF007F' : '#FFE600' }} />
            </div>
            
            <div className="relative z-10">
              <p style={{ color: '#9CA3AF', fontSize: '1.125rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>{stat.label}</p>
              <h3 style={{ color: '#ffffff', fontSize: '4.5rem', fontWeight: 900, fontFamily: 'Orbitron', margin: 0, marginBottom: '24px' }}>
                {stat.value}
              </h3>
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '12px 24px', borderRadius: '16px', width: 'fit-content', border: '1px solid rgba(255, 255, 255, 0.1)' }}
              >
                <Zap size={22} style={{ color: '#00F0FF' }} />
                <p style={{ color: '#ffffff', fontSize: '1.125rem', fontWeight: 900, margin: 0 }}>{stat.trend}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Hero Banner Area */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full p-16 md:p-24 rounded-[4rem] border-2 flex flex-col xl:flex-row items-center justify-between gap-16 relative shadow-2xl flex-grow"
        style={{ background: 'linear-gradient(to bottom right, #111927, #1C2541)', padding: '80px', borderRadius: '64px', border: '2px solid rgba(112, 0, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '64px' }}
      >
        <div className="max-w-4xl z-10 relative">
          <div 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '16px', padding: '12px 32px', borderRadius: '9999px', backgroundColor: 'rgba(255, 42, 42, 0.1)', border: '2px solid #FF2A2A', color: '#FF2A2A', fontSize: '1.125rem', fontWeight: 900, fontFamily: 'Orbitron', marginBottom: '48px', textTransform: 'uppercase', letterSpacing: '0.2em' }}
          >
            <ShieldAlert size={28} /> Neural Shield Active
          </div>
          
          <h2 
            style={{ fontSize: '5rem', fontWeight: 900, color: '#ffffff', fontFamily: 'Orbitron', marginBottom: '48px', lineHeight: 1, letterSpacing: '-0.02em' }}
          >
            NEXT-GEN <br/>
            <span style={{ background: 'linear-gradient(to right, #00F0FF, #7000FF, #FF007F)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>INTELLIGENCE</span>
          </h2>
          
          <p 
            style={{ color: '#ffffff', fontSize: '1.875rem', fontWeight: 700, lineHeight: 1.4, marginBottom: '64px', maxWidth: '800px', borderLeft: '8px solid #00F0FF', paddingLeft: '40px' }}
          >
            Analyzing <span style={{ color: '#FF007F', fontWeight: 900 }}>68 facial landmarks</span> and cabin objects at sub-10ms latency.
          </p>
          
          <div className="flex flex-wrap gap-10">
            <Link to="/monitor">
              <button 
                style={{ backgroundColor: '#00F0FF', color: '#050B14', fontWeight: 900, fontSize: '1.875rem', padding: '24px 64px', borderRadius: '24px', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em', boxShadow: '0 20px 50px rgba(0, 240, 255, 0.3)' }}
              >
                START SCAN ⚡
              </button>
            </Link>
          </div>
        </div>

        <div className="hidden xl:flex relative flex-1 justify-center">
           <div style={{ width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0, 240, 255, 0.1) 0%, transparent 70%)', position: 'absolute', filter: 'blur(80px)' }} />
           <Shield size={400} style={{ color: 'rgba(255, 255, 255, 0.05)', position: 'relative', zIndex: 10 }} />
        </div>
      </motion.div>
    </div>
  );
}
