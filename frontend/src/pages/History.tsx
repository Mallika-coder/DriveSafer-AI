import { useEffect, useState } from 'react';
import { Clock, Search, Download, Database } from 'lucide-react';
// import axios from 'axios';

// interface Session { id: number, start_time: string, end_time: string, duration: number, ... }

export default function History() {
  const [sessions] = useState<any[]>([]);

  useEffect(() => {
    // In actual implementation, we'll fetch from FastAPI
    // axios.get('http://localhost:8000/api/sessions').then(res => setSessions(res.data));
  }, []);

  return (
    <div className="h-full flex flex-col animate-fade-in w-full pb-10">
      <div 
        className="flex justify-between items-center mb-10 bg-[#111927] p-12 rounded-[3rem] border-2 border-white/10 shadow-3xl"
        style={{ backgroundColor: '#111927', padding: '48px', borderRadius: '48px', border: '2px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}
      >
        <div>
          <h1 
            className="text-6xl font-orbitron font-black text-white mb-4 tracking-tighter uppercase"
            style={{ fontSize: '3.75rem', fontWeight: 900, color: '#ffffff', fontFamily: 'Orbitron', margin: 0, textTransform: 'uppercase' }}
          >
            Session <span className="text-gradient" style={{ background: 'linear-gradient(to right, #00F0FF, #7000FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Intelligence</span>
          </h1>
          <p 
            className="text-gray-200 flex items-center gap-4 font-black text-2xl uppercase tracking-widest leading-none"
            style={{ fontSize: '1.5rem', fontWeight: 900, color: '#E5E7EB', display: 'flex', alignItems: 'center', gap: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
          >
            <Database size={32} style={{ color: '#00F0FF' }} /> Historical incident logs
          </p>
        </div>
        
        <div className="flex gap-8" style={{ display: 'flex', gap: '32px' }}>
          <div className="relative group">
            <Search 
              size={32} 
              className="absolute left-8 top-1/2 -translate-y-1/2" 
              style={{ position: 'absolute', left: '32px', top: '50%', transform: 'translateY(-50%)', color: '#00F0FF' }} 
            />
            <input 
              type="text" 
              placeholder="SEARCH LOGS..." 
              className="bg-black border-2 border-white/20 rounded-3xl py-6 pl-20 pr-10 text-xl font-black focus:outline-none focus:border-accent text-white w-[35rem] uppercase tracking-widest"
              style={{ backgroundColor: '#000000', border: '2px solid rgba(255, 255, 255, 0.2)', borderRadius: '24px', padding: '24px 40px 24px 80px', fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', width: '35rem', textTransform: 'uppercase' }}
            />
          </div>
          <button 
            className="bg-secondary text-white flex items-center gap-4 px-12 py-6 rounded-3xl text-2xl font-black shadow-3xl hover:scale-110 active:scale-95 transition-all"
            style={{ backgroundColor: '#FF007F', color: '#ffffff', border: 'none', borderRadius: '24px', padding: '24px 48px', fontSize: '1.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
          >
            <Download size={32} /> EXPORT
          </button>
        </div>
      </div>
      
      <div 
        className="glass-panel overflow-hidden flex-grow flex flex-col border-4 border-white/10 shadow-3xl bg-[#050B14]"
        style={{ backgroundColor: '#050B14', borderRadius: '56px', border: '4px solid rgba(255, 255, 255, 0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', flexGrow: 1 }}
      >
        <div className="overflow-x-auto relative z-10 h-full" style={{ overflowX: 'auto', position: 'relative', height: '100%' }}>
          <table className="w-full text-left border-collapse" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead 
              className="bg-[#111927] text-accent text-lg font-black font-orbitron uppercase tracking-[0.4em] border-b-4 border-white/10"
              style={{ backgroundColor: '#111927', color: '#00F0FF', fontSize: '1.125rem', fontWeight: 900, fontFamily: 'Orbitron', textTransform: 'uppercase', letterSpacing: '0.4em', borderBottom: '4px solid rgba(255, 255, 255, 0.1)' }}
            >
              <tr>
                <th style={{ padding: '48px' }}>ID</th>
                <th style={{ padding: '48px' }}>TIMESTAMP</th>
                <th style={{ padding: '48px' }}>DURATION</th>
                <th style={{ padding: '48px', textAlign: 'center' }}>INCIDENTS</th>
                <th style={{ padding: '48px', textAlign: 'right' }}>METRICS</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-white/5 text-2xl font-black bg-black/40" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '160px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '48px' }}>
                      <div style={{ padding: '64px', borderRadius: '64px', backgroundColor: '#111927', border: '4px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        <Clock size={120} style={{ color: '#00F0FF' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <p style={{ fontSize: '3.75rem', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', margin: 0, letterSpacing: '-0.02em', fontFamily: 'Orbitron' }}>Database Empty</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', margin: 0, letterSpacing: '0.3em' }}>Launch monitor to record data</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                <></>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
