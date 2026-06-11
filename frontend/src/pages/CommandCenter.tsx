import { useState, useEffect } from 'react';
import { AlertTriangle, Shield, MapPin, Zap } from 'lucide-react';
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
    { label: 'Active Vehicles', value: summary.total.toString(), delta: `${summary.active} online`, up: true, color: '#818cf8' },
    { label: 'Alerts Today', value: alerts.length.toString(), delta: alerts.length > 5 ? '↑ above avg' : 'Normal', up: alerts.length <= 5, color: '#f59e0b' },
    { label: 'Fleet Risk Score', value: Math.round(summary.avgScore).toString(), delta: summary.avgScore < 30 ? '↓ Safe' : '↑ Elevated', up: summary.avgScore < 30, color: '#10b981' },
    { label: 'Critical Drivers', value: summary.critical.toString(), delta: summary.critical === 0 ? 'All clear' : 'Action needed', up: summary.critical === 0, color: '#ef4444' },
  ];

  const hasLiveDriver = vehicles.some(v => v.isLive);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {/* Status Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#f3f4f6', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} style={{ color: '#818cf8' }} /> Command Center
          </h1>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0' }}>
            {hasLiveDriver ? '🟢 Your webcam session is feeding live data' : '⚪ Open /monitor to start live detection'} • Fleet simulation active
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {hasLiveDriver && <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', fontSize: '10px', fontWeight: 600 }}>YOUR DATA: LIVE</span>}
          <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontSize: '10px', fontWeight: 600 }}>FLEET: SIMULATED</span>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{ background: '#0d1017', border: '1px solid #1a1f2e', borderRadius: '12px', padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(to right, ${kpi.color}, transparent)` }} />
            <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{kpi.label}</div>
            <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#f3f4f6' }}>{kpi.value}</div>
            <div style={{ fontSize: '11px', marginTop: '4px', color: kpi.up ? '#10b981' : '#ef4444' }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Main Grid: Map + Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 2fr', gap: '14px', flex: 1, minHeight: 0 }}>
        {/* Fleet Map */}
        <div style={{ background: '#0d1017', border: '1px solid #1a1f2e', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={13} style={{ color: '#818cf8' }} /> Fleet Map — {summary.total} vehicles
          </div>
          <div style={{ flex: 1, borderRadius: '10px', overflow: 'hidden', position: 'relative', minHeight: 0 }}>
            <DrivingScene speed={50} alertLevel={summary.critical > 0 ? 2 : 0} timeOfDay="night" />
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              {vehicles.map((v, i) => {
                const color = v.status === 'critical' ? '#ef4444' : v.status === 'alert' ? '#f59e0b' : '#10b981';
                const top = 12 + (i * 18) % 72;
                const left = 8 + (i * 24) % 78;
                return (
                  <div key={v.id} style={{ position: 'absolute', top: `${top}%`, left: `${left}%`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <div style={{ width: v.isLive ? '12px' : '8px', height: v.isLive ? '12px' : '8px', borderRadius: '50%', background: color, boxShadow: `0 0 ${v.isLive ? '14' : '6'}px ${color}`, border: v.isLive ? '2px solid #fff' : 'none' }} />
                    {v.isLive && <span style={{ fontSize: '7px', color: '#fff', background: 'rgba(0,0,0,0.7)', padding: '1px 4px', borderRadius: '3px' }}>YOU</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Alert Feed */}
        <div style={{ background: '#0d1017', border: '1px solid #1a1f2e', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={13} style={{ color: '#ef4444' }} /> Alerts
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {alerts.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
                <Shield size={24} style={{ color: '#10b981', opacity: 0.4 }} />
                <span style={{ color: '#4b5563', fontSize: '11px' }}>No alerts</span>
              </div>
            ) : (
              alerts.slice(0, 12).map(alert => (
                <div key={alert.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 0', borderBottom: '1px solid #1a1f2e' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: alert.severity >= 3 ? '#ef4444' : alert.severity >= 2 ? '#f59e0b' : '#818cf8', marginTop: '4px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '11px', color: '#d1d5db' }}>{alert.alertType.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: '9px', color: '#4b5563', marginTop: '1px' }}>{alert.vehicleId} • {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Fleet Status Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(vehicles.length, 5)}, 1fr)`, gap: '8px' }}>
        {vehicles.slice(0, 5).map(v => {
          const color = v.status === 'critical' ? '#ef4444' : v.status === 'alert' ? '#f59e0b' : '#10b981';
          return (
            <div key={v.id} style={{ background: '#0d1017', border: `1px solid ${v.isLive ? 'rgba(16,185,129,0.3)' : '#1a1f2e'}`, borderRadius: '10px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '10px', color: '#e5e7eb', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.driverName}</div>
                <div style={{ fontSize: '9px', color: '#4b5563' }}>{Math.round(v.currentScore)}% risk • {v.isLive ? 'Live' : v.id}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
