import { useState, useEffect } from 'react';
import { Radio, AlertTriangle, Shield, Truck, Clock, MapPin } from 'lucide-react';
import { fleetManager } from '../utils/fleetManager';

export default function FleetDashboard() {
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

  const statusColor = (status: string) => {
    if (status === 'critical') return '#FF2A2A';
    if (status === 'alert') return '#FFE600';
    return '#00FF66';
  };

  return (
    <div className="flex flex-col h-full animate-fade-in w-full pb-8 gap-6">
      {/* Header */}
      <div style={{ backgroundColor: '#111927', padding: '32px 48px', borderRadius: '32px', border: '2px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffffff', fontFamily: 'Orbitron', margin: 0, textTransform: 'uppercase' }}>
            Fleet <span style={{ background: 'linear-gradient(to right, #00F0FF, #7000FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Command</span>
          </h1>
          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <Radio size={16} style={{ color: '#00FF66' }} /> V2X Fleet Monitoring — Simulated
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {[
            { label: 'Active', count: summary.active, color: '#00FF66' },
            { label: 'Alert', count: summary.alert, color: '#FFE600' },
            { label: 'Critical', count: summary.critical, color: '#FF2A2A' },
          ].map(s => (
            <div key={s.label} style={{ padding: '10px 20px', borderRadius: '12px', backgroundColor: `${s.color}15`, border: `1px solid ${s.color}40`, textAlign: 'center' }}>
              <p style={{ color: s.color, fontSize: '1.5rem', fontWeight: 900, margin: 0, fontFamily: 'monospace' }}>{s.count}</p>
              <p style={{ color: '#9CA3AF', fontSize: '0.6rem', margin: 0, textTransform: 'uppercase' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flex: 1, minHeight: 0 }}>
        {/* Vehicle Grid */}
        <div style={{ backgroundColor: '#111927', padding: '24px', borderRadius: '24px', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <h3 style={{ color: '#fff', fontFamily: 'Orbitron', fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={16} style={{ color: '#00F0FF' }} /> Fleet Vehicles
          </h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {vehicles.map(v => (
              <div key={v.id} style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)', border: `1px solid ${statusColor(v.status)}30`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: statusColor(v.status), boxShadow: `0 0 8px ${statusColor(v.status)}` }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}>{v.driverName}</span>
                    <span style={{ color: statusColor(v.status), fontSize: '0.75rem', fontWeight: 900, fontFamily: 'monospace' }}>{Math.round(v.currentScore)}%</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                    <span style={{ color: '#6B7280', fontSize: '0.65rem' }}>{v.id}</span>
                    <span style={{ color: '#6B7280', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={10} /> {Math.floor(v.sessionDuration / 60)}m
                    </span>
                  </div>
                </div>
                <div style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: `${statusColor(v.status)}20`, border: `1px solid ${statusColor(v.status)}40` }}>
                  <span style={{ color: statusColor(v.status), fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>{v.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alert Feed */}
        <div style={{ backgroundColor: '#111927', padding: '24px', borderRadius: '24px', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <h3 style={{ color: '#fff', fontFamily: 'Orbitron', fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} style={{ color: '#FF2A2A' }} /> Alert Feed
          </h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {alerts.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <Shield size={32} style={{ color: '#00FF66', margin: '0 auto 8px' }} />
                  <p style={{ color: '#6B7280', fontSize: '0.8rem' }}>No alerts — fleet is safe</p>
                </div>
              </div>
            ) : (
              alerts.slice(0, 15).map(a => (
                <div key={a.id} style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)', borderLeft: `3px solid ${a.severity >= 3 ? '#FF2A2A' : '#FFE600'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>{a.alertType.replace(/_/g, ' ')}</span>
                    <span style={{ color: '#6B7280', fontSize: '0.6rem', fontFamily: 'monospace' }}>{new Date(a.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                    <span style={{ color: '#6B7280', fontSize: '0.6rem' }}>{a.vehicleId}</span>
                    <span style={{ color: '#6B7280', fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={10} /> {a.location.lat.toFixed(3)}, {a.location.lng.toFixed(3)}
                    </span>
                    <span style={{ color: '#FF2A2A', fontSize: '0.6rem', fontWeight: 700 }}>Score: {Math.round(a.drowsinessScore)}</span>
                  </div>
                  <p style={{ color: '#00F0FF', fontSize: '0.6rem', margin: '4px 0 0', fontStyle: 'italic' }}>{a.actionTaken}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
