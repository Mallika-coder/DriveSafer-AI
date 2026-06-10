import { useState, useEffect } from 'react';
import { AlertTriangle, Shield, MapPin } from 'lucide-react';
import { fleetManager } from '../utils/fleetManager';
import DrivingScene from '../components/DrivingScene';

export default function CommandCenter() {
  const [vehicles, setVehicles] = useState(fleetManager.getVehicles());
  const [alerts, setAlerts] = useState(fleetManager.getAlerts());
  const [summary, setSummary] = useState(fleetManager.getFleetRiskSummary());

  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles(fleetManager.getVehicles());
      setAlerts(fleetManager.getAlerts());
      setSummary(fleetManager.getFleetRiskSummary());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const kpis = [
    { label: 'Active Vehicles', value: summary.total.toString(), delta: `${summary.active} online`, up: true },
    { label: 'Alerts Today', value: alerts.length.toString(), delta: alerts.length > 5 ? '↑ above avg' : 'Normal', up: alerts.length <= 5 },
    { label: 'Fleet Risk Score', value: Math.round(summary.avgScore).toString(), delta: summary.avgScore < 30 ? '↓ Safe' : '↑ Elevated', up: summary.avgScore < 30 },
    { label: 'Critical Drivers', value: summary.critical.toString(), delta: summary.critical === 0 ? 'All clear' : 'Action needed', up: summary.critical === 0 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{ background: '#161922', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px 20px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{kpi.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'monospace', color: '#fff' }}>{kpi.value}</div>
            <div style={{ fontSize: '12px', marginTop: '4px', color: kpi.up ? '#22c55e' : '#ef4444' }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Main Grid: Map + Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', flex: 1, minHeight: 0 }}>
        {/* Fleet Map (using driving scene as placeholder) */}
        <div style={{ background: '#161922', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={14} style={{ color: '#3b82f6' }} /> Live Fleet Map — {summary.total} vehicles tracked
          </div>
          <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', position: 'relative', minHeight: 0 }}>
            <DrivingScene speed={40} alertLevel={summary.critical > 0 ? 2 : 0} timeOfDay="night" />
            {/* Vehicle dots overlay */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              {vehicles.map((v, i) => {
                const color = v.status === 'critical' ? '#ef4444' : v.status === 'alert' ? '#f59e0b' : '#22c55e';
                const top = 15 + (i * 17) % 70;
                const left = 10 + (i * 23) % 80;
                return (
                  <div key={v.id} style={{ position: 'absolute', top: `${top}%`, left: `${left}%`, width: '10px', height: '10px', borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
                );
              })}
            </div>
          </div>
        </div>

        {/* Alert Feed */}
        <div style={{ background: '#161922', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={14} style={{ color: '#ef4444' }} /> Live Alerts
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {alerts.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
                <Shield size={28} style={{ color: '#22c55e', opacity: 0.5 }} />
                <span style={{ color: '#64748b', fontSize: '12px' }}>Fleet is safe — no alerts</span>
              </div>
            ) : (
              alerts.slice(0, 10).map(alert => (
                <div key={alert.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: '1px solid #1e293b' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: alert.severity >= 3 ? '#ef4444' : alert.severity >= 2 ? '#f59e0b' : '#3b82f6', marginTop: '4px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#cbd5e1' }}>{alert.alertType.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{new Date(alert.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Fleet Status Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
        {vehicles.slice(0, 5).map(v => {
          const color = v.status === 'critical' ? '#ef4444' : v.status === 'alert' ? '#f59e0b' : '#22c55e';
          return (
            <div key={v.id} style={{ background: '#161922', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
              <div>
                <div style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 600 }}>{v.driverName}</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>{v.id} • {Math.round(v.currentScore)}% risk</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
