import { useEffect, useState } from 'react';
import { Clock, Search, Download } from 'lucide-react';
// import axios from 'axios';

// interface Session { id: number, start_time: string, end_time: string, duration: number, ... }

export default function History() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    // In actual implementation, we'll fetch from FastAPI
    // axios.get('http://localhost:8000/api/sessions').then(res => setSessions(res.data));
  }, []);

  return (
    <div className="h-full flex flex-col animate-fade-in max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-orbitron font-bold">Session <span className="text-gradient">History</span></h1>
          <p className="text-gray-400 mt-1 flex items-center gap-2">
            <Clock size={16} /> Past telemetry logs and AI incident reports
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              className="bg-surface/50 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-accent/50 focus:shadow-glow-accent transition-all text-white w-64"
            />
          </div>
          <button className="glass-button flex items-center gap-2 px-4 py-2 rounded-xl text-sm">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>
      
      <div className="glass-panel overflow-hidden flex-grow flex flex-col border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface_light/50 text-gray-400 text-xs uppercase tracking-wider font-semibold border-b border-white/5">
              <tr>
                <th className="p-5 font-medium">Session ID</th>
                <th className="p-5 font-medium">Start Time</th>
                <th className="p-5 font-medium">Duration</th>
                <th className="p-5 font-medium">Recorded Events</th>
                <th className="p-5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-gray-500 bg-surface/20">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Clock size={40} className="text-white/10" />
                      <p>No telemetry sessions recorded yet.</p>
                      <span className="text-xs text-gray-600">Start monitoring to generate data logs.</span>
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
