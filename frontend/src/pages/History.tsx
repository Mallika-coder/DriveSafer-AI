import { useEffect, useState } from 'react';
import { Clock, Search, Download, Database } from 'lucide-react';
// import axios from 'axios';

// interface Session { id: number, start_time: string, end_time: string, duration: number, ... }

export default function History() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    // In actual implementation, we'll fetch from FastAPI
    // axios.get('http://localhost:8000/api/sessions').then(res => setSessions(res.data));
  }, []);

  return (
    <div className="h-full flex flex-col animate-fade-in max-w-6xl mx-auto w-full pb-4">
      <div className="flex justify-between items-center mb-8 bg-surface_light/20 p-6 rounded-2xl border border-white/5 backdrop-blur-md shadow-glass">
        <div>
          <h1 className="text-3xl font-orbitron font-bold text-white mb-2">Session <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary_light">History</span></h1>
          <p className="text-gray-400 flex items-center gap-2 font-medium">
            <Database size={16} className="text-primary_light" /> Past telemetry logs and AI incident reports
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="relative group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-primary_light transition-colors" />
            <input 
              type="text" 
              placeholder="Search data logs..." 
              className="bg-background/80 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-primary_light focus:shadow-glow-purple transition-all text-white w-64 shadow-inner"
            />
          </div>
          <button className="glass-button-pink flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold shadow-lg">
            <Download size={18} /> Export JSON
          </button>
        </div>
      </div>
      
      <div className="glass-panel overflow-hidden flex-grow flex flex-col border-white/10 shadow-xl group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-700" />
        
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#0B132B]/80 text-primary_light text-xs font-bold font-orbitron uppercase tracking-widest border-b border-white/10 shadow-sm backdrop-blur-md">
              <tr>
                <th className="p-6">Session ID</th>
                <th className="p-6">Start Time</th>
                <th className="p-6">Duration</th>
                <th className="p-6">Recorded Events</th>
                <th className="p-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm bg-surface/30">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="p-4 rounded-full bg-surface_light border border-white/5 shadow-inner">
                        <Clock size={48} className="text-white/20" />
                      </div>
                      <p className="text-lg font-medium text-gray-300">No telemetry sessions available.</p>
                      <span className="text-sm text-gray-500 font-mono bg-background/50 px-3 py-1 rounded">Start monitoring to generate data logs.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                // Map sessions here
                <></>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
