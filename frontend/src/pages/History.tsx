import { useEffect, useState } from 'react';
import { Clock, Search, Download, Database, Trash2, AlertTriangle } from 'lucide-react';
import axios from 'axios';

interface SessionEvent {
  id: number;
  event_type: string;
  severity: number;
  ear_value: number | null;
  timestamp: string;
}

interface Session {
  id: number;
  start_time: string;
  end_time: string | null;
  duration: number;
  total_distance: number;
  events: SessionEvent[];
}

export default function History() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSession, setExpandedSession] = useState<number | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = () => {
    setLoading(true);
    axios.get(`${apiUrl}/api/sessions`)
      .then(res => setSessions(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const deleteSession = (id: number) => {
    axios.delete(`${apiUrl}/api/sessions/${id}`)
      .then(() => setSessions(prev => prev.filter(s => s.id !== id)))
      .catch(() => {});
  };

  const exportData = () => {
    const csv = [
      'Session ID,Start Time,Duration (s),Events,Max Severity',
      ...sessions.map(s => `${s.id},${s.start_time},${s.duration},${s.events?.length || 0},${Math.max(0, ...(s.events || []).map(e => e.severity))}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'drivesafe_sessions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  const filteredSessions = sessions.filter(s =>
    searchQuery === '' || s.id.toString().includes(searchQuery) || s.start_time.includes(searchQuery)
  );

  return (
    <div className="h-full flex flex-col animate-fade-in w-full pb-10 gap-6">
      {/* Header */}
      <div style={{ background: 'var(--bg-secondary)', padding: '32px 48px', borderRadius: '8px', border: '2px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffffff', margin: 0, textTransform: 'uppercase' }}>
            Session <span style={{ background: 'linear-gradient(to right, #00F0FF, #7000FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>History</span>
          </h1>
          <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <Database size={18} style={{ color: '#00F0FF' }} /> {sessions.length} sessions recorded
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '12px 16px 12px 40px', fontSize: '0.875rem', color: 'var(--text-primary)', width: '200px', outline: 'none' }}
            />
          </div>
          <button
            onClick={exportData}
            style={{ backgroundColor: '#FF007F', color: 'var(--text-primary)', border: 'none', borderRadius: '12px', padding: '12px 20px', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Sessions List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '1rem' }}>Loading sessions...</span>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', background: 'var(--bg-secondary)', borderRadius: '24px', border: '2px solid rgba(255,255,255,0.1)', padding: '80px' }}>
            <Clock size={64} style={{ color: '#00F0FF', opacity: 0.5 }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 900, margin: '0 0 8px' }}>No Sessions Yet</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', margin: 0 }}>Start monitoring to record driving sessions</p>
            </div>
          </div>
        ) : (
          filteredSessions.map(session => (
            <div
              key={session.id}
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden',
                transition: 'all 0.2s',
              }}
            >
              {/* Session Row */}
              <div
                onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                style={{
                  padding: '20px 24px',
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 100px 100px 80px 40px',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                }}
              >
                <span style={{ color: '#00F0FF', fontWeight: 900, fontFamily: 'monospace', fontSize: '0.875rem' }}>#{session.id}</span>
                <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>{formatDate(session.start_time)}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontFamily: 'monospace' }}>{formatDuration(session.duration)}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} style={{ color: (session.events?.length || 0) > 0 ? '#FFE600' : '#6B7280' }} />
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 700 }}>{session.events?.length || 0}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3].map(sev => {
                    const count = (session.events || []).filter(e => e.severity === sev).length;
                    return count > 0 ? (
                      <span key={sev} style={{
                        padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 700,
                        backgroundColor: sev === 3 ? 'rgba(255,42,42,0.2)' : sev === 2 ? 'rgba(255,230,0,0.2)' : 'rgba(0,240,255,0.2)',
                        color: sev === 3 ? '#FF2A2A' : sev === 2 ? '#FFE600' : '#00F0FF',
                      }}>{count}</span>
                    ) : null;
                  })}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteSession(session.id); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                >
                  <Trash2 size={16} style={{ color: 'var(--text-tertiary)' }} />
                </button>
              </div>

              {/* Expanded Events */}
              {expandedSession === session.id && session.events && session.events.length > 0 && (
                <div style={{ padding: '0 24px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                    {session.events.map(event => (
                      <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px', borderLeft: `3px solid ${event.severity === 3 ? '#FF2A2A' : event.severity === 2 ? '#FFE600' : '#00F0FF'}` }}>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem', fontFamily: 'monospace', width: '80px' }}>
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600 }}>{event.event_type}</span>
                        <span style={{ marginLeft: 'auto', color: 'var(--text-tertiary)', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                          {event.ear_value ? `EAR: ${event.ear_value.toFixed(3)}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
