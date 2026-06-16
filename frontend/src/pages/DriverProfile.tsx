import { useState, useEffect } from 'react';
import { User, TrendingUp, Clock, AlertTriangle, Calendar, Lightbulb, Award, Settings, Users } from 'lucide-react';
import { DriverProfiler } from '../utils/driverProfiling';
import { AdaptiveCalibrator } from '../utils/calibration';

const profiler = new DriverProfiler();

export default function DriverProfile() {
  const [profile, setProfile] = useState(profiler.getProfile());
  const [insights, setInsights] = useState(profiler.getInsights());
  const [calibration, setCalibration] = useState(AdaptiveCalibrator.loadCalibration());
  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'calibration'>('profile');

  useEffect(() => {
    setProfile(profiler.getProfile());
    setInsights(profiler.getInsights());
    setCalibration(AdaptiveCalibrator.loadCalibration());
  }, []);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const team = [
    { name: 'Mallika Verma', role: 'ML Pipeline & Architecture', github: 'Mallika-coder', tasks: 'Drowsiness fusion model, temporal transformer, TinyML, federated learning, adaptive calibration, XAI, pipeline integration' },
    { name: 'Harsh', role: 'Frontend & UI/UX', github: 'SimplyHarsh33', tasks: 'Layout system, canvas driving scene, visualizations, design system, responsive pages' },
    { name: 'Jivit Kumar', role: 'Computer Vision', github: 'jivit-kumar', tasks: 'Head pose estimation, gaze tracking, EAR/MAR, FaceMesh hooks, COCO-SSD, LLM coach' },
    { name: 'Divyanshu', role: 'Signal Processing', github: 'Divyanshu64', tasks: 'Talking detector, cognitive load, audio fatigue, anomaly detection, analytics' },
    { name: 'Hemant Pal', role: 'Backend & Data', github: 'hemant-pal164', tasks: 'FastAPI, WebSocket, SQLite, session management, drivers page, history' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Settings & Profile</h1>
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>Driver profile, calibration data, and team</p>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-primary)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border)' }}>
          {[
            { key: 'profile' as const, label: 'My Profile', icon: User },
            { key: 'calibration' as const, label: 'Calibration', icon: Settings },
            { key: 'team' as const, label: 'Team', icon: Users },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === tab.key ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: activeTab === tab.key ? '#818cf8' : 'var(--text-tertiary)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <tab.icon size={12} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflow: 'auto' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { icon: Calendar, label: 'Sessions', value: profile.sessions.length.toString(), color: '#818cf8' },
              { icon: Clock, label: 'Total Drive Time', value: formatDuration(profile.totalDriveTime), color: '#f59e0b' },
              { icon: AlertTriangle, label: 'Avg to Fatigue', value: `${Math.round(profile.avgTimeToFatigue)}m`, color: '#ef4444' },
              { icon: Award, label: 'Safe Streak', value: `${profile.safeDriveStreak}`, color: '#10b981' },
            ].map((stat, i) => (
              <div key={i} style={{ background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border)', padding: '14px 16px' }}>
                <stat.icon size={15} style={{ color: stat.color, marginBottom: '6px' }} />
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '3px' }}>{stat.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)' }}>{stat.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', flex: 1 }}>
            {/* Insights */}
            <div style={{ background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border)', padding: '16px', overflow: 'auto' }}>
              <h3 style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lightbulb size={13} style={{ color: '#f59e0b' }} /> Personalized Insights
              </h3>
              {insights.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '11px', fontStyle: 'italic' }}>Complete 3+ monitoring sessions to unlock AI-generated insights about your driving patterns.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {insights.map((insight, i) => (
                    <div key={i} style={{ padding: '10px 12px', borderRadius: '8px', background: '#111827', borderLeft: `1px solid ${insight.severity === 'warning' ? '#f59e0b' : insight.severity === 'positive' ? '#10b981' : '#818cf8'}` }}>
                      <p style={{ color: 'var(--text-primary)', fontSize: '11px', lineHeight: 1.5, margin: 0 }}>{insight.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weekly Heatmap */}
            <div style={{ background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border)', padding: '16px' }}>
              <h3 style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={13} style={{ color: '#818cf8' }} /> Weekly Risk Pattern
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {dayNames.map((day, i) => {
                  const isRisky = profile.riskyDays.includes(i);
                  const daySessions = profile.sessions.filter(s => s.dayOfWeek === i);
                  const avgScore = daySessions.length > 0 ? daySessions.reduce((s, p) => s + p.avgDrowsinessScore, 0) / daySessions.length : 0;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '10px', width: '28px', fontWeight: 600 }}>{day}</span>
                      <div style={{ flex: 1, height: '14px', background: '#111827', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(avgScore, 100)}%`, height: '100%', background: isRisky ? '#ef4444' : avgScore > 30 ? '#f59e0b' : '#10b981', borderRadius: '3px', transition: 'width 0.5s' }} />
                      </div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '10px', fontFamily: 'monospace', width: '24px' }}>{Math.round(avgScore)}</span>
                    </div>
                  );
                })}
              </div>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '9px', marginTop: '10px', textAlign: 'center' }}>Average drowsiness score per day (from your sessions)</p>
            </div>
          </div>
        </div>
      )}

      {/* Calibration Tab */}
      {activeTab === 'calibration' && (
        <div style={{ background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border)', padding: '24px' }}>
          <h3 style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 6px' }}>Adaptive Calibration Data</h3>
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '0 0 20px' }}>
            Calibration personalizes detection thresholds to YOUR face. Go to /monitor → click CALIBRATE → look at camera for 15 seconds.
          </p>

          {calibration ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
              {[
                { label: 'Your Baseline EAR', value: calibration.baselineEAR.toFixed(3), desc: 'Your normal eye openness' },
                { label: 'Adapted EAR Threshold', value: calibration.earThreshold.toFixed(3), desc: 'Alert triggers below this' },
                { label: 'MAR Threshold', value: calibration.marThreshold.toFixed(3), desc: 'Yawn detected above this' },
                { label: 'Samples Collected', value: calibration.samplesCollected.toString(), desc: 'Frames analyzed' },
                { label: 'Calibrated At', value: new Date(calibration.calibratedAt).toLocaleString(), desc: 'When calibration was done' },
                { label: 'Formula', value: 'μ - 1.5σ', desc: 'baseline minus 1.5 standard deviations' },
              ].map((item, i) => (
                <div key={i} style={{ background: '#111827', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#818cf8' }}>{item.value}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', background: '#111827', borderRadius: '10px' }}>
              <Settings size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '0 0 6px' }}>Not calibrated yet</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '11px', margin: 0 }}>Open /monitor → click CALIBRATE → look straight for 15 seconds.<br />The system will learn YOUR eye shape and set personalized thresholds.</p>
            </div>
          )}

          <div style={{ marginTop: '20px', padding: '14px', background: '#111827', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 8px' }}>How Calibration Works:</h4>
            <ol style={{ color: 'var(--text-tertiary)', fontSize: '11px', lineHeight: 1.8, margin: 0, paddingLeft: '16px' }}>
              <li>You look at camera with neutral face for 15 seconds</li>
              <li>System collects ~300 EAR/MAR samples at 30fps</li>
              <li>Computes your personal mean and standard deviation</li>
              <li>Sets threshold = mean - 1.5σ (statistically, only 7% of normal readings fall below)</li>
              <li>Stores in browser (localStorage) — valid for 24 hours</li>
              <li>All detection now uses YOUR personalized threshold instead of default 0.25</li>
            </ol>
          </div>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflow: 'auto' }}>
          {team.map((member, i) => (
            <div key={i} style={{ background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border)', padding: '16px 20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: i === 0 ? 'linear-gradient(135deg, #6366f1, #818cf8)' : '#111827', border: i === 0 ? 'none' : '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={16} style={{ color: '#fff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>{member.name}</span>
                  {i === 0 && <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontSize: '9px', fontWeight: 600 }}>LEAD</span>}
                </div>
                <div style={{ color: '#818cf8', fontSize: '11px', fontWeight: 500, marginBottom: '6px' }}>{member.role}</div>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '10px', lineHeight: 1.5, margin: 0 }}>{member.tasks}</p>
                <a href={`https://github.com/${member.github}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-tertiary)', fontSize: '10px', textDecoration: 'none', marginTop: '4px', display: 'inline-block' }}>
                  github.com/{member.github}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
