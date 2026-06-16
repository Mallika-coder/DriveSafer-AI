import { useState, useEffect } from 'react';
import { Radio, AlertTriangle, Shield, TrendingUp } from 'lucide-react';
import { fleetManager } from '../utils/fleetManager';
import { DrivingAnomalyDetector } from '../utils/anomalyDetector';
import { PredictiveFatigueModel } from '../utils/predictiveFatigue';
import DrivingScene from '../components/DrivingScene';

const anomalyDetector = new DrivingAnomalyDetector();
const predictiveModel = new PredictiveFatigueModel();

export default function FleetDashboard() {
  const [vehicles, setVehicles] = useState(fleetManager.getVehicles());
  const [alerts, setAlerts] = useState(fleetManager.getAlerts());
  const [summary, setSummary] = useState(fleetManager.getFleetRiskSummary());
  const [anomalyStatus, setAnomalyStatus] = useState('Normal driving pattern');
  const [prediction, setPrediction] = useState<{ minutesToFatigue: number | null; factors: string[] }>({ minutesToFatigue: null, factors: [] });

  useEffect(() => {
    const interval = setInterval(() => {
      const v = fleetManager.getVehicles();
      setVehicles(v);
      setAlerts(fleetManager.getAlerts());
      setSummary(fleetManager.getFleetRiskSummary());

      // Run anomaly detection on fleet aggregate
      const selfVehicle = v.find(veh => veh.isLive);
      if (selfVehicle) {
        const result = anomalyDetector.detect({
          ear: 0.28,
          mar: 0.3,
          headYaw: 0,
          headPitch: 0,
          blinkRate: 15,
          gazeStability: 0.9,
          sessionMinute: selfVehicle.sessionDuration / 60,
        });
        setAnomalyStatus(result.explanation);

        predictiveModel.update(selfVehicle.currentScore, Date.now(), new Date().getHours());
        const pred = predictiveModel.predict();
        setPrediction({ minutesToFatigue: pred.minutesToFatigue, factors: pred.factors });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = (status: string) => {
    if (status === 'critical') return '#ef4444';
    if (status === 'alert') return '#f59e0b';
    return '#22c55e';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={18} style={{ color: '#22c55e' }} /> Fleet Intelligence Map
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>Live vehicle tracking with predictive analytics and anomaly detection</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { label: 'Safe', count: summary.active, color: '#22c55e' },
            { label: 'Warning', count: summary.alert, color: '#f59e0b' },
            { label: 'Critical', count: summary.critical, color: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={{ padding: '6px 14px', borderRadius: '8px', background: `${s.color}15`, border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color }} />
              <span style={{ color: s.color, fontSize: '11px', fontWeight: 600 }}>{s.count} {s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map + Side Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', flex: 1, minHeight: 0 }}>
        {/* Map */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
          <DrivingScene speed={60} alertLevel={summary.critical > 0 ? 2 : 0} timeOfDay="night" />
          {/* Vehicle markers */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {vehicles.map((v, i) => {
              const top = 15 + (i * 19) % 65;
              const left = 10 + (i * 27) % 75;
              return (
                <div key={v.id} style={{ position: 'absolute', top: `${top}%`, left: `${left}%`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: v.isLive ? '14px' : '10px', height: v.isLive ? '14px' : '10px', borderRadius: '50%', background: statusColor(v.status), boxShadow: `0 0 ${v.isLive ? '12' : '6'}px ${statusColor(v.status)}`, border: v.isLive ? '1px solid #fff' : 'none' }} />
                  <span style={{ fontSize: '8px', color: '#fff', marginTop: '2px', background: 'rgba(0,0,0,0.6)', padding: '1px 4px', borderRadius: '3px' }}>{v.id}</span>
                </div>
              );
            })}
          </div>
          <div style={{ position: 'absolute', top: '12px', left: '12px', padding: '6px 12px', background: 'rgba(0,0,0,0.7)', borderRadius: '6px' }}>
            <span style={{ color: '#94a3b8', fontSize: '10px' }}>LIVE — {vehicles.length} vehicles</span>
          </div>
        </div>

        {/* Side Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'auto' }}>
          {/* Predictive Fatigue */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px' }}>
            <h4 style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={12} style={{ color: '#8b5cf6' }} /> Fatigue Prediction
            </h4>
            {prediction.minutesToFatigue !== null ? (
              <div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', color: prediction.minutesToFatigue < 15 ? '#ef4444' : '#f59e0b' }}>
                  {prediction.minutesToFatigue} min
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>until fatigue threshold</div>
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#22c55e', fontWeight: 500 }}>No fatigue predicted</div>
            )}
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {prediction.factors.slice(0, 3).map((f, i) => (
                <span key={i} style={{ fontSize: '10px', color: '#94a3b8' }}>• {f}</span>
              ))}
            </div>
          </div>

          {/* Anomaly Status */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px' }}>
            <h4 style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={12} style={{ color: '#3b82f6' }} /> Anomaly Detection
            </h4>
            <p style={{ color: anomalyStatus.includes('Normal') ? '#22c55e' : '#f59e0b', fontSize: '12px', margin: 0 }}>{anomalyStatus}</p>
          </div>

          {/* Alert Feed */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', flex: 1, overflow: 'auto' }}>
            <h4 style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={12} style={{ color: '#ef4444' }} /> Recent Alerts
            </h4>
            {alerts.length === 0 ? (
              <p style={{ color: '#475569', fontSize: '11px' }}>No alerts — fleet is safe</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {alerts.slice(0, 8).map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: a.severity >= 3 ? '#ef4444' : '#f59e0b', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ color: '#cbd5e1', fontSize: '11px' }}>{a.vehicleId}</span>
                      <span style={{ color: '#475569', fontSize: '10px', marginLeft: '6px' }}>{new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
