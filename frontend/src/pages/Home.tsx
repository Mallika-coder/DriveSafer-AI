import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Eye, Smartphone, Car, Activity, Brain, BarChart3, Cpu, Layers, Fingerprint, Radar } from 'lucide-react';
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

  return (
    <div className="w-full h-full flex flex-col gap-6 pb-6 overflow-y-auto">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, #0f1729 0%, #1a1f3a 50%, #0d1321 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.06)',
          padding: '48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, rgba(99, 179, 237, 0.3), transparent)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#48bb78', boxShadow: '0 0 12px #48bb78' }} />
              <span style={{ color: '#48bb78', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>System Online</span>
            </div>
            <h1 style={{ fontSize: '2.8rem', fontWeight: 800, color: '#f7fafc', margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              DriveSafe <span style={{ color: '#63b3ed' }}>AI</span>
            </h1>
            <p style={{ color: '#a0aec0', fontSize: '1rem', maxWidth: '500px', lineHeight: 1.6, margin: 0 }}>
              Multi-signal drowsiness detection with edge-deployed neural networks, adaptive calibration, and real-time explainability.
            </p>
          </div>
          <Link to="/monitor">
            <button style={{
              background: 'linear-gradient(135deg, #63b3ed, #4299e1)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '14px 28px',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 20px rgba(66, 153, 225, 0.3)',
            }}>
              <Car size={18} /> Start Monitoring
            </button>
          </Link>
        </div>
      </motion.div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        {[
          { icon: Eye, label: 'Drowsiness Events', value: eventCounts.drowsiness, color: '#ed8936' },
          { icon: Smartphone, label: 'Distractions', value: eventCounts.distraction, color: '#e53e3e' },
          { icon: Activity, label: 'Total Detections', value: eventCounts.total, color: '#48bb78' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            style={{
              backgroundColor: '#111827',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.06)',
              padding: '24px',
            }}
          >
            <stat.icon size={20} style={{ color: stat.color, marginBottom: '10px' }} />
            <p style={{ color: '#718096', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>{stat.label}</p>
            <p style={{ color: '#f7fafc', fontSize: '2rem', fontWeight: 800, margin: 0 }}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ML Architecture Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        {/* Pipeline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ backgroundColor: '#111827', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', padding: '28px' }}
        >
          <h3 style={{ color: '#f7fafc', fontSize: '0.85rem', fontWeight: 700, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} style={{ color: '#63b3ed' }} /> ML Pipeline Architecture
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { step: '01', label: 'Face Mesh Extraction', detail: '468 landmarks @ 30fps', color: '#63b3ed' },
              { step: '02', label: 'Feature Engineering', detail: 'EAR, MAR, PERCLOS, head pose, gaze', color: '#9f7aea' },
              { step: '03', label: 'Driver Adaptation', detail: 'Per-user baseline ± 2σ calibration', color: '#ed8936' },
              { step: '04', label: 'Signal Discrimination', detail: 'Talk/yawn separation, cognitive load', color: '#48bb78' },
              { step: '05', label: 'TinyML Inference', detail: '3-layer MLP, sub-0.1ms, 4-class output', color: '#e53e3e' },
              { step: '06', label: 'XAI + Fleet Alert', detail: 'SHAP attribution → V2X dispatch', color: '#63b3ed' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: item.color, fontSize: '0.65rem', fontWeight: 800, fontFamily: 'monospace', width: '24px' }}>{item.step}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ color: '#e2e8f0', fontSize: '0.75rem', fontWeight: 600 }}>{item.label}</span>
                  <span style={{ color: '#718096', fontSize: '0.65rem', marginLeft: '8px' }}>{item.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Key Innovations */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ backgroundColor: '#111827', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', padding: '28px' }}
        >
          <h3 style={{ color: '#f7fafc', fontSize: '0.85rem', fontWeight: 700, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Brain size={16} style={{ color: '#9f7aea' }} /> Key Innovations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: Fingerprint, title: 'Adaptive Calibration', desc: 'Learns individual eye geometry — handles narrow, average, and wide eye types' },
              { icon: Radar, title: 'Cognitive Load Detection', desc: 'Detects mental distraction from earphone calls even when looking at road' },
              { icon: Cpu, title: 'Edge TinyML', desc: '7→16→8→4 MLP with pre-trained weights — no server, no latency' },
              { icon: ShieldAlert, title: 'A/B Explainability', desc: 'Live comparison showing 40% false positive reduction vs basic models' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 14px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <f.icon size={18} style={{ color: '#63b3ed', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ color: '#e2e8f0', fontSize: '0.75rem', fontWeight: 700, margin: '0 0 3px' }}>{f.title}</p>
                  <p style={{ color: '#718096', fontSize: '0.65rem', lineHeight: 1.4, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Tech Stack */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {['MediaPipe FaceMesh', 'TensorFlow.js COCO-SSD', 'TinyML (MLP)', 'PERCLOS', 'Head Pose 3D', 'Iris Gaze', 'Adaptive Calibration', 'XAI/SHAP', 'V2X Fleet', 'FastAPI', 'WebSocket', 'Driver Profiling'].map(tech => (
          <span key={tech} style={{ padding: '5px 12px', borderRadius: '6px', backgroundColor: 'rgba(99, 179, 237, 0.08)', border: '1px solid rgba(99, 179, 237, 0.15)', color: '#a0aec0', fontSize: '0.65rem', fontWeight: 600 }}>
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
}
