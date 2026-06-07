import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Eye, Smartphone, Car, Activity, Brain, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Home() {
  const [, setSessionCount] = useState(0);
  const [eventCounts, setEventCounts] = useState({ drowsiness: 0, distraction: 0, total: 0 });

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    axios.get(`${apiUrl}/api/sessions`).then(res => {
      const sessions = res.data;
      setSessionCount(sessions.length);
      const allEvents = sessions.flatMap((s: any) => s.events || []);
      setEventCounts({
        drowsiness: allEvents.filter((e: any) => e.event_type?.includes('drowsi') || e.event_type?.includes('yawn')).length,
        distraction: allEvents.filter((e: any) => e.event_type === 'distraction').length,
        total: allEvents.length,
      });
    }).catch(() => {});
  }, []);

  const stats = [
    { icon: Eye, label: 'Drowsiness Events', value: eventCounts.drowsiness.toString(), color: '#FFE600' },
    { icon: Smartphone, label: 'Distractions', value: eventCounts.distraction.toString(), color: '#FF007F' },
    { icon: Activity, label: 'Total Events', value: eventCounts.total.toString(), color: '#00FF66' },
  ];

  const features = [
    { icon: Brain, title: 'Multi-Signal Fusion', desc: 'Combines EAR, MAR, PERCLOS, blink rate, head pose, and gaze stability into a composite drowsiness score' },
    { icon: Eye, title: 'PERCLOS Algorithm', desc: 'Percentage of eye closure — the gold-standard fatigue metric used in research literature' },
    { icon: BarChart3, title: 'Adaptive Calibration', desc: 'Learns your personal baseline metrics for personalized thresholds (not one-size-fits-all)' },
    { icon: ShieldAlert, title: 'Head Pose + Gaze', desc: '3D head orientation (pitch/yaw/roll) and iris tracking for attention monitoring' },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-8 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ backgroundColor: '#111927', border: '2px solid rgba(255, 255, 255, 0.1)', padding: '40px 48px', borderRadius: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#ffffff', fontFamily: 'Orbitron', margin: 0, lineHeight: 1.1 }}>
            DRIVE<span style={{ background: 'linear-gradient(to right, #00F0FF, #7000FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SAFE</span> AI
          </h1>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#9CA3AF', marginTop: '8px', maxWidth: '600px', lineHeight: 1.5 }}>
            Real-time driver fatigue detection using <span style={{ color: '#00F0FF' }}>computer vision</span> and <span style={{ color: '#FF007F' }}>multi-signal ML fusion</span>
          </p>
        </div>

        <Link to="/monitor">
          <button style={{ backgroundColor: '#00F0FF', color: '#050B14', border: 'none', borderRadius: '16px', padding: '16px 32px', fontSize: '1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <Car size={24} /> START MONITORING
          </button>
        </Link>
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            style={{ backgroundColor: '#111927', padding: '32px', borderRadius: '24px', border: '2px solid rgba(255, 255, 255, 0.1)' }}
          >
            <stat.icon size={28} style={{ color: stat.color, marginBottom: '12px' }} />
            <p style={{ color: '#6B7280', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' }}>{stat.label}</p>
            <p style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Orbitron', margin: 0 }}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ML Features */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ backgroundColor: '#111927', padding: '32px', borderRadius: '24px', border: '2px solid rgba(255,255,255,0.1)', flexGrow: 1 }}
      >
        <h2 style={{ color: '#fff', fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1rem', marginBottom: '24px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Brain size={20} style={{ color: '#7000FF' }} /> ML Pipeline Features
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {features.map((f, i) => (
            <div key={i} style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <f.icon size={20} style={{ color: '#00F0FF' }} />
                <h3 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>{f.title}</h3>
              </div>
              <p style={{ color: '#9CA3AF', fontSize: '0.8rem', lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tech Stack */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {['MediaPipe FaceMesh', 'TensorFlow.js', 'COCO-SSD', 'FastAPI', 'WebSocket', 'PERCLOS', 'Head Pose Est.', 'Gaze Tracking', 'Adaptive Calibration'].map(tech => (
          <span key={tech} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(112, 0, 255, 0.1)', border: '1px solid rgba(112, 0, 255, 0.2)', color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 700 }}>
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
}
