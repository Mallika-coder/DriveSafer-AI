import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Bell, MapPin, Phone, Shield, CheckCircle } from 'lucide-react';
import { fleetManager } from '../utils/fleetManager';

export default function Drivers() {
  const [vehicles, setVehicles] = useState(fleetManager.getVehicles());
  const [search, setSearch] = useState('');
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const handleAction = (action: string, vehicleId: string, driverName: string) => {
    if (action === 'alert') {
      const result = fleetManager.sendAlertToDriver(vehicleId);
      setActionFeedback(result);
    } else if (action === 'track') {
      setActionFeedback(`Tracking ${driverName} — location updated`);
    } else if (action === 'call') {
      setActionFeedback(`Calling ${driverName}...`);
    }
    setTimeout(() => setActionFeedback(null), 3000);
  };

  useEffect(() => {
    const interval = setInterval(() => setVehicles(fleetManager.getVehicles()), 3000);
    return () => clearInterval(interval);
  }, []);

  const filtered = vehicles
    .filter(v => filter === 'all' || v.status === filter)
    .filter(v => v.driverName.toLowerCase().includes(search.toLowerCase()) || v.id.toLowerCase().includes(search.toLowerCase()));

  const statusPill = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      active: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' },
      alert: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
      critical: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
      offline: { bg: 'rgba(100,116,139,0.15)', text: 'var(--text-tertiary)' },
    };
    const c = colors[status] || colors.offline;
    return <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 500, background: c.bg, color: c.text }}>{status}</span>;
  };

  const riskColor = (score: number) => score > 60 ? '#ef4444' : score > 30 ? '#f59e0b' : '#22c55e';

  const riskBar = (score: number) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: '60px', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(score, 100)}%`, height: '100%', background: riskColor(score), borderRadius: '3px', transition: 'width 0.5s' }} />
      </div>
      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '13px', color: riskColor(score), width: '28px' }}>{Math.round(score)}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', position: 'relative' }}>
      {/* Action Feedback Toast */}
      {actionFeedback && (
        <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--bg-secondary)', border: '1px solid #22c55e', borderRadius: '8px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
          <CheckCircle size={14} style={{ color: '#22c55e' }} />
          <span style={{ color: 'var(--text-primary)', fontSize: '12px' }}>{actionFeedback}</span>
        </div>
      )}
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', margin: 0 }}>Fleet Drivers</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>
            {vehicles.length} drivers • {vehicles.filter(v => v.status === 'active').length} active •
            {vehicles.filter(v => v.status === 'critical').length} critical
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Filters */}
          {['all', 'active', 'alert', 'critical'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: filter === f ? '1px solid #3b82f6' : '1px solid #2d3748',
                background: filter === f ? 'rgba(59,130,246,0.1)' : '#1a1d27',
                color: filter === f ? '#3b82f6' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            style={{ background: '#1a1d27', border: '1px solid #2d3748', borderRadius: '8px', padding: '7px 12px', color: 'var(--text-primary)', fontSize: '12px', width: '160px', outline: 'none' }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', borderRadius: '10px', border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', background: 'var(--bg-secondary)' }}>
          <thead>
            <tr style={{ background: '#111318' }}>
              <th style={{ width: '30px', padding: '12px 8px' }}></th>
              {['Driver', 'Vehicle', 'Status', 'Risk', 'Session', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 14px', color: 'var(--text-tertiary)', fontWeight: 500, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(v => (
              <>
                <tr
                  key={v.id}
                  onClick={() => setExpandedDriver(expandedDriver === v.id ? null : v.id)}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1a1d27')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    {expandedDriver === v.id ? <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, color: '#93c5fd' }}>
                        {v.driverName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{v.driverName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}>{v.id}</td>
                  <td style={{ padding: '12px 14px' }}>{statusPill(v.status)}</td>
                  <td style={{ padding: '12px 14px' }}>{riskBar(v.currentScore)}</td>
                  <td style={{ padding: '12px 14px', color: '#94a3b8', fontFamily: 'monospace' }}>{Math.round(v.sessionDuration / 60)}m</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleAction('alert', v.id, v.driverName)} title="Send Alert" style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--border)', border: '1px solid #2d3748', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Bell size={12} style={{ color: '#f59e0b' }} />
                      </button>
                      <button onClick={() => handleAction('track', v.id, v.driverName)} title="Track Location" style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--border)', border: '1px solid #2d3748', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <MapPin size={12} style={{ color: '#3b82f6' }} />
                      </button>
                      <button onClick={() => handleAction('call', v.id, v.driverName)} title="Call Driver" style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--border)', border: '1px solid #2d3748', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Phone size={12} style={{ color: '#22c55e' }} />
                      </button>
                    </div>
                  </td>
                </tr>
                {/* Expanded Detail */}
                {expandedDriver === v.id && (
                  <tr key={`${v.id}-detail`} style={{ background: 'var(--bg-primary)' }}>
                    <td colSpan={7} style={{ padding: '16px 20px 16px 52px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '12px 16px', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Risk Score</div>
                          <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'monospace', color: riskColor(v.currentScore) }}>{Math.round(v.currentScore)}/100</div>
                        </div>
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '12px 16px', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Alerts</div>
                          <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'monospace', color: '#fff' }}>{v.alerts.length}</div>
                        </div>
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '12px 16px', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Drive Time</div>
                          <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'monospace', color: '#fff' }}>{(v.sessionDuration / 3600).toFixed(1)}h</div>
                        </div>
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '12px 16px', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Safety Rating</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Shield size={16} style={{ color: v.currentScore < 30 ? '#22c55e' : '#f59e0b' }} />
                            <span style={{ fontSize: '14px', fontWeight: 600, color: v.currentScore < 30 ? '#22c55e' : '#f59e0b' }}>
                              {v.currentScore < 20 ? 'Excellent' : v.currentScore < 40 ? 'Good' : v.currentScore < 60 ? 'Fair' : 'Poor'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
