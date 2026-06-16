import { useState, useEffect } from 'react';
import { BarChart3, Brain, TrendingUp, AlertTriangle, Shield, Cpu } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { fleetManager } from '../utils/fleetManager';
import { FederatedLearningSimulator } from '../utils/federatedLearning';

const flSim = new FederatedLearningSimulator();

export default function Analytics() {
  const [flStatus, setFlStatus] = useState(flSim.getStatus());
  const [alerts, setAlerts] = useState(fleetManager.getAlerts());
  const [vehicles, setVehicles] = useState(fleetManager.getVehicles());
  const [trendData, setTrendData] = useState<{ time: string; risk: number; alerts: number }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAlerts(fleetManager.getAlerts());
      setVehicles(fleetManager.getVehicles());

      // Build trend from vehicle history
      setTrendData(prev => {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const summary = fleetManager.getFleetRiskSummary();
        const next = [...prev, { time: now, risk: Math.round(summary.avgScore), alerts: summary.totalAlerts }];
        return next.slice(-20);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const runFLRound = async () => {
    const status = await flSim.runOneRound();
    setFlStatus(status);
  };

  // Event type distribution from alerts
  const eventTypes = alerts.reduce((acc, a) => {
    const type = a.alertType.replace(/_/g, ' ');
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const pieData = Object.entries(eventTypes).map(([name, value]) => ({ name, value }));
  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#22c55e', '#8b5cf6'];

  const summary = fleetManager.getFleetRiskSummary();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflow: 'auto' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Analytics</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>Real-time fleet data, model performance, and federated learning status</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Fleet Risk', value: `${Math.round(summary.avgScore)}%`, icon: AlertTriangle, color: '#f59e0b' },
          { label: 'Total Alerts', value: summary.totalAlerts.toString(), icon: Shield, color: '#ef4444' },
          { label: 'Active Vehicles', value: summary.total.toString(), icon: Brain, color: '#3b82f6' },
          { label: 'FL Accuracy', value: `${Math.round(flStatus.globalAccuracy * 100)}%`, icon: Cpu, color: '#22c55e' },
        ].map((kpi, i) => (
          <div key={i} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px 18px' }}>
            <kpi.icon size={16} style={{ color: kpi.color, marginBottom: '8px' }} />
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{kpi.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'monospace', color: '#fff' }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', minHeight: '280px' }}>
        {/* Risk Trend */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
          <h3 style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={14} style={{ color: '#3b82f6' }} /> Fleet Risk Trend (Live)
          </h3>
          {trendData.length > 2 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="time" stroke="var(--text-tertiary)" fontSize={10} />
                <YAxis stroke="var(--text-tertiary)" fontSize={10} />
                <Tooltip contentStyle={{ background: 'var(--border)', border: '1px solid #2d3748', borderRadius: '6px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="risk" stroke="#3b82f6" fill="rgba(59,130,246,0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: '12px' }}>
              Collecting trend data...
            </div>
          )}
        </div>

        {/* Event Distribution */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
          <h3 style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BarChart3 size={14} style={{ color: '#f59e0b' }} /> Alert Distribution
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--border)', border: '1px solid #2d3748', borderRadius: '6px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: '12px' }}>
              No alerts yet — start monitoring
            </div>
          )}
        </div>
      </div>

      {/* Federated Learning Section */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={14} style={{ color: '#8b5cf6' }} /> Federated Learning — Privacy-Preserving Model Training
          </h3>
          <button
            onClick={runFLRound}
            disabled={flSim.isComplete()}
            style={{ padding: '6px 14px', borderRadius: '6px', background: flSim.isComplete() ? 'var(--border)' : '#3b82f6', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 500, cursor: flSim.isComplete() ? 'default' : 'pointer' }}
          >
            {flSim.isComplete() ? 'Training Complete' : `Run Round ${flStatus.currentRound + 1}`}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          {[
            { label: 'Round', value: `${flStatus.currentRound}/${flStatus.totalRounds}` },
            { label: 'Global Accuracy', value: `${Math.round(flStatus.globalAccuracy * 100)}%` },
            { label: 'Local Accuracy', value: `${Math.round(flStatus.localAccuracy * 100)}%` },
            { label: 'Privacy Budget', value: `${Math.round(flStatus.privacyBudgetUsed * 100)}% used` },
            { label: 'Participants', value: `${flStatus.participantsThisRound} drivers` },
          ].map((stat, i) => (
            <div key={i} style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>{stat.label}</div>
              <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {flStatus.currentRound > 0 && (
          <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: 0, lineHeight: 1.5 }}>
              FedAvg aggregation with differential privacy (ε-DP). {flStatus.currentRound} rounds completed.
              Model improves across {flStatus.participantsThisRound} drivers without sharing raw sensor data.
              Privacy budget: {Math.round(flStatus.privacyBudgetUsed * 100)}% consumed (Gaussian noise σ applied per round).
            </p>
          </div>
        )}
      </div>

      {/* Driver Risk Distribution */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
        <h3 style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 14px' }}>Driver Risk Distribution (Live)</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          {vehicles.map(v => (
            <div key={v.id} style={{ flex: 1, background: 'var(--bg-primary)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>{v.driverName}</div>
              <div style={{ width: '100%', height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <div style={{
                  width: '24px',
                  height: `${Math.max(4, v.currentScore * 0.6)}px`,
                  background: v.currentScore > 60 ? '#ef4444' : v.currentScore > 30 ? '#f59e0b' : '#22c55e',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.5s',
                }} />
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)', marginTop: '4px' }}>{Math.round(v.currentScore)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
