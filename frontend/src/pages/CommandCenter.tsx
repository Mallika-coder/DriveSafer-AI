import { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Car } from 'lucide-react';
import { fleetManager } from '../utils/fleetManager';

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
    { label: 'Total Vehicles', value: summary.total.toString(), delta: `${summary.active} online`, up: true },
    { label: 'Active Alerts', value: alerts.length.toString(), delta: alerts.length > 5 ? 'Above avg' : 'Normal', up: alerts.length <= 5 },
    { label: 'Avg Risk Score', value: Math.round(summary.avgScore).toString(), delta: summary.avgScore < 30 ? 'Safe' : 'Elevated', up: summary.avgScore < 30 },
    { label: 'Fleet Status', value: summary.critical.toString(), delta: summary.critical === 0 ? 'All clear' : 'Action needed', up: summary.critical === 0 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Command Center</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>Real-time fleet monitoring and alert management</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px 20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{kpi.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{kpi.value}</div>
            <div style={{ fontSize: '12px', marginTop: '4px', color: kpi.up ? 'var(--success)' : 'var(--danger)' }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', flex: 1, minHeight: 0 }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px 20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={14} style={{ color: 'var(--warning)' }} />
            Alert Feed
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {alerts.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', padding: '40px' }}>
                <Shield size={20} style={{ color: 'var(--text-tertiary)' }} />
                <span style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>No active alerts</span>
              </div>
            ) : (
              alerts.slice(0, 15).map(alert => (
                <div key={alert.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: alert.severity >= 3 ? 'var(--danger)' : alert.severity >= 2 ? 'var(--warning)' : 'var(--accent)', marginTop: '5px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{alert.alertType.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{alert.vehicleId} — {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em', color: alert.severity >= 3 ? 'var(--danger)' : alert.severity >= 2 ? 'var(--warning)' : 'var(--text-tertiary)' }}>
                    {alert.severity >= 3 ? 'Critical' : alert.severity >= 2 ? 'Warning' : 'Info'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px 20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Car size={14} style={{ color: 'var(--accent)' }} />
            Fleet Status
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {vehicles.map(v => {
              const statusColor = v.status === 'critical' ? 'var(--danger)' : v.status === 'alert' ? 'var(--warning)' : 'var(--success)';
              const statusLabel = v.status === 'critical' ? 'Critical' : v.status === 'alert' ? 'Alert' : 'Normal';
              return (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.driverName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '1px' }}>{v.id}{v.isLive ? ' — Live' : ''}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{Math.round(v.currentScore)}</div>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{statusLabel}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
