import { useState, useEffect } from 'react';
import { fleetManager } from '../utils/fleetManager';

export default function Drivers() {
  const [vehicles, setVehicles] = useState(fleetManager.getVehicles());
  const [search, setSearch] = useState('');

  useEffect(() => {
    const interval = setInterval(() => setVehicles(fleetManager.getVehicles()), 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = vehicles.filter(v =>
    v.driverName.toLowerCase().includes(search.toLowerCase()) || v.id.toLowerCase().includes(search.toLowerCase())
  );

  const statusPill = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      active: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' },
      alert: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
      critical: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
      offline: { bg: 'rgba(100,116,139,0.15)', text: '#64748b' },
    };
    const c = colors[status] || colors.offline;
    return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 500, background: c.bg, color: c.text }}>{status}</span>;
  };

  const riskColor = (score: number) => score > 60 ? '#ef4444' : score > 30 ? '#f59e0b' : '#22c55e';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', margin: 0 }}>Fleet Drivers</h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>{vehicles.length} total drivers • {vehicles.filter(v => v.status === 'active').length} active</p>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search drivers..."
          style={{ background: '#1a1d27', border: '1px solid #2d3748', borderRadius: '8px', padding: '8px 14px', color: '#e2e8f0', fontSize: '13px', width: '240px', outline: 'none' }}
        />
      </div>

      <div style={{ flex: 1, overflow: 'auto', borderRadius: '10px', border: '1px solid #1e293b' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', background: '#161922' }}>
          <thead>
            <tr style={{ background: '#111318' }}>
              {['Driver', 'Vehicle', 'Status', 'Risk Score', 'Location', 'Hours Driven', 'Last Alert'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 500, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #1e293b' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(v => (
              <tr key={v.id} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '12px 16px', color: '#e2e8f0', fontWeight: 500 }}>{v.driverName}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}>{v.id}</td>
                <td style={{ padding: '12px 16px' }}>{statusPill(v.status)}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '14px', color: riskColor(v.currentScore) }}>
                    {Math.round(v.currentScore)}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '11px' }}>En route</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8', fontFamily: 'monospace' }}>{(v.sessionDuration / 3600).toFixed(1)}h</td>
                <td style={{ padding: '12px 16px', color: '#475569', fontSize: '11px' }}>
                  {v.alerts.length > 0 ? new Date(v.alerts[0].timestamp).toLocaleTimeString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
