import { useState, useEffect } from 'react';
import { BarChart3, Brain, Clock, AlertTriangle, Target } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

interface SessionData {
  id: number;
  start_time: string;
  end_time: string | null;
  duration: number;
  total_distance: number;
  events: { event_type: string; severity: number; ear_value: number; timestamp: string }[];
}

export default function Analytics() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    axios.get(`${apiUrl}/api/sessions`)
      .then(res => setSessions(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalEvents = sessions.reduce((sum, s) => sum + (s.events?.length || 0), 0);
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
  const avgEventsPerSession = sessions.length > 0 ? (totalEvents / sessions.length).toFixed(1) : '0';

  const eventsByType = sessions.flatMap(s => s.events || []).reduce((acc, e) => {
    acc[e.event_type] = (acc[e.event_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(eventsByType).map(([name, value]) => ({ name, value }));
  const COLORS = ['#00F0FF', '#FF007F', '#FFE600', '#7000FF', '#00FF66'];

  const sessionTrend = sessions.slice(0, 10).reverse().map((s, i) => ({
    session: `S${i + 1}`,
    events: s.events?.length || 0,
    duration: Math.round(s.duration / 60),
    severity: s.events?.reduce((sum, e) => sum + e.severity, 0) || 0,
  }));

  const riskDistribution = [
    { range: 'Safe (0-20)', count: 0 },
    { range: 'Mild (20-45)', count: 0 },
    { range: 'Moderate (45-70)', count: 0 },
    { range: 'Severe (70-100)', count: 0 },
  ];

  sessions.flatMap(s => s.events || []).forEach(e => {
    if (e.severity === 1) riskDistribution[1].count++;
    else if (e.severity === 2) riskDistribution[2].count++;
    else if (e.severity === 3) riskDistribution[3].count++;
    else riskDistribution[0].count++;
  });

  return (
    <div className="flex flex-col h-full animate-fade-in w-full pb-8 gap-10">
      {/* Header */}
      <div style={{ backgroundColor: '#111927', padding: '48px', borderRadius: '40px', border: '2px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '3.75rem', fontWeight: 900, color: '#ffffff', fontFamily: 'Orbitron', margin: 0, textTransform: 'uppercase' }}>
            ML <span style={{ background: 'linear-gradient(to right, #00F0FF, #7000FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Analytics</span>
          </h1>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#9CA3AF', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Brain size={24} style={{ color: '#FF007F' }} /> Multi-signal drowsiness pattern analysis
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
        {[
          { icon: BarChart3, label: 'Total Sessions', value: sessions.length.toString(), color: '#00F0FF' },
          { icon: AlertTriangle, label: 'Total Events', value: totalEvents.toString(), color: '#FF2A2A' },
          { icon: Target, label: 'Avg Events/Session', value: avgEventsPerSession, color: '#FFE600' },
          { icon: Clock, label: 'Total Drive Time', value: `${Math.round(totalDuration / 60)}m`, color: '#00FF66' },
        ].map((kpi, i) => (
          <div key={i} style={{ backgroundColor: '#111927', padding: '32px', borderRadius: '24px', border: '2px solid rgba(255,255,255,0.1)' }}>
            <kpi.icon size={28} style={{ color: kpi.color, marginBottom: '12px' }} />
            <p style={{ color: '#6B7280', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>{kpi.label}</p>
            <p style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Orbitron', margin: '8px 0 0' }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', flexGrow: 1, minHeight: 0 }}>
        {/* Session Trend */}
        <div style={{ backgroundColor: '#111927', padding: '32px', borderRadius: '24px', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: '#fff', fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1rem', marginBottom: '24px', textTransform: 'uppercase' }}>
            Session Risk Trend
          </h3>
          {sessionTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={sessionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="session" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1C2541', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="events" stroke="#FF007F" fill="rgba(255, 0, 127, 0.2)" strokeWidth={2} />
                <Area type="monotone" dataKey="severity" stroke="#FFE600" fill="rgba(255, 230, 0, 0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: '#6B7280', fontStyle: 'italic' }}>Start monitoring to collect analytics data</p>
            </div>
          )}
        </div>

        {/* Event Distribution */}
        <div style={{ backgroundColor: '#111927', padding: '32px', borderRadius: '24px', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: '#fff', fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1rem', marginBottom: '24px', textTransform: 'uppercase' }}>
            Event Distribution
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1C2541', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: '#6B7280', fontStyle: 'italic' }}>No events recorded yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Risk Distribution */}
      <div style={{ backgroundColor: '#111927', padding: '32px', borderRadius: '24px', border: '2px solid rgba(255,255,255,0.1)' }}>
        <h3 style={{ color: '#fff', fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1rem', marginBottom: '24px', textTransform: 'uppercase' }}>
          Severity Distribution
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {riskDistribution.map((r, i) => (
            <div key={i} style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '16px', textAlign: 'center' }}>
              <p style={{ color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', margin: '0 0 8px' }}>{r.range}</p>
              <p style={{ color: COLORS[i], fontSize: '2rem', fontWeight: 900, fontFamily: 'monospace', margin: 0 }}>{r.count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
