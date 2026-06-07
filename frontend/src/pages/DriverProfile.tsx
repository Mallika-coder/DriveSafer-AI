import { useState, useEffect } from 'react';
import { User, TrendingUp, Clock, AlertTriangle, Calendar, Lightbulb, Award } from 'lucide-react';
import { DriverProfiler } from '../utils/driverProfiling';

const profiler = new DriverProfiler();

export default function DriverProfile() {
  const [profile, setProfile] = useState(profiler.getProfile());
  const [insights, setInsights] = useState(profiler.getInsights());

  useEffect(() => {
    setProfile(profiler.getProfile());
    setInsights(profiler.getInsights());
  }, []);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col h-full animate-fade-in w-full pb-8 gap-6">
      {/* Header */}
      <div style={{ backgroundColor: '#111927', padding: '32px 48px', borderRadius: '32px', border: '2px solid rgba(255, 255, 255, 0.1)' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffffff', fontFamily: 'Orbitron', margin: 0, textTransform: 'uppercase' }}>
          Driver <span style={{ background: 'linear-gradient(to right, #00F0FF, #7000FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Profile</span>
        </h1>
        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <User size={16} style={{ color: '#FF007F' }} /> Longitudinal behavior analysis across sessions
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { icon: Calendar, label: 'Sessions', value: profile.sessions.length.toString(), color: '#00F0FF' },
          { icon: Clock, label: 'Total Drive Time', value: formatDuration(profile.totalDriveTime), color: '#FF007F' },
          { icon: AlertTriangle, label: 'Avg Time to Fatigue', value: `${Math.round(profile.avgTimeToFatigue)}m`, color: '#FFE600' },
          { icon: Award, label: 'Safe Streak', value: `${profile.safeDriveStreak} sessions`, color: '#00FF66' },
        ].map((stat, i) => (
          <div key={i} style={{ backgroundColor: '#111927', padding: '24px', borderRadius: '20px', border: '2px solid rgba(255,255,255,0.1)' }}>
            <stat.icon size={20} style={{ color: stat.color, marginBottom: '8px' }} />
            <p style={{ color: '#6B7280', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' }}>{stat.label}</p>
            <p style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 900, fontFamily: 'Orbitron', margin: 0 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flex: 1, minHeight: 0 }}>
        {/* Insights */}
        <div style={{ backgroundColor: '#111927', padding: '24px', borderRadius: '24px', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: '#fff', fontFamily: 'Orbitron', fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lightbulb size={16} style={{ color: '#FFE600' }} /> Personalized Insights
          </h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
            {insights.map((insight, i) => (
              <div key={i} style={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderLeft: `3px solid ${insight.severity === 'warning' ? '#FFE600' : insight.severity === 'positive' ? '#00FF66' : '#00F0FF'}`,
              }}>
                <p style={{ color: '#fff', fontSize: '0.8rem', lineHeight: 1.5, margin: 0 }}>{insight.message}</p>
                <span style={{ color: '#6B7280', fontSize: '0.6rem', textTransform: 'uppercase', marginTop: '4px', display: 'block' }}>{insight.type.replace(/_/g, ' ')}</span>
              </div>
            ))}
            {insights.length === 0 && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#6B7280', fontSize: '0.8rem', fontStyle: 'italic' }}>Complete 3+ sessions to unlock insights</p>
              </div>
            )}
          </div>
        </div>

        {/* Risk Heatmap */}
        <div style={{ backgroundColor: '#111927', padding: '24px', borderRadius: '24px', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: '#fff', fontFamily: 'Orbitron', fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} style={{ color: '#FF007F' }} /> Weekly Risk Pattern
          </h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
            {dayNames.map((day, i) => {
              const isRisky = profile.riskyDays.includes(i);
              const daySessions = profile.sessions.filter(s => s.dayOfWeek === i);
              const avgScore = daySessions.length > 0
                ? daySessions.reduce((s, p) => s + p.avgDrowsinessScore, 0) / daySessions.length
                : 0;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#6B7280', fontSize: '0.75rem', width: '36px', fontWeight: 700 }}>{day}</span>
                  <div style={{ flex: 1, height: '20px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(avgScore, 100)}%`,
                      height: '100%',
                      backgroundColor: isRisky ? '#FF2A2A' : avgScore > 30 ? '#FFE600' : '#00FF66',
                      borderRadius: '4px',
                      transition: 'width 0.5s',
                    }} />
                  </div>
                  <span style={{ color: '#fff', fontSize: '0.7rem', fontFamily: 'monospace', width: '32px' }}>{Math.round(avgScore)}</span>
                </div>
              );
            })}
          </div>
          <p style={{ color: '#6B7280', fontSize: '0.6rem', marginTop: '12px', textAlign: 'center' }}>
            Average drowsiness score by day of week
          </p>
        </div>
      </div>
    </div>
  );
}
