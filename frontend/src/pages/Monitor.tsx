import { useState, useRef } from 'react';
import WebcamFeed from '../components/WebcamFeed';
import AlertBanner from '../components/AlertBanner';
import SettingsModal from '../components/SettingsModal';
import { useAlertSound } from '../hooks/useAlertSound';
import axios from 'axios';
import { Settings, ShieldAlert, Activity, Eye, Smartphone } from 'lucide-react';

export default function Monitor() {
  const [ear, setEar] = useState(0);
  const [mar, setMar] = useState(0);
  const [phoneDetected, setPhoneDetected] = useState(false);
  
  const [alertLevel, setAlertLevel] = useState(0);
  const [alertMsg, setAlertMsg] = useState("");
  const [events, setEvents] = useState<{time: string, msg: string}[]>([]);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [earThresh, setEarThresh] = useState(0.25);
  const [marThresh, setMarThresh] = useState(0.60);

  const earHistory = useRef<number[]>([]);
  const yawnCount = useRef(0);
  const { triggerAlert } = useAlertSound();
  
  const cooldownActive = useRef(false);
  
  const handleStats = (newEar: number, newMar: number, isPhone: boolean) => {
    setEar(newEar);
    setMar(newMar);
    setPhoneDetected(isPhone);
    
    earHistory.current.push(newEar);
    if (earHistory.current.length > 20) earHistory.current.shift();
    
    if (cooldownActive.current) return;
    
    let currentLevel = 0;
    let msg = "";
    
    const drowsyFrames = earHistory.current.filter(e => e < earThresh).length;
    if (drowsyFrames >= 15) {
      currentLevel = 3;
      msg = "Critical Drowsiness Detected! Wake up!";
    } else if (drowsyFrames >= 8) {
      currentLevel = 2;
      msg = "Moderate Drowsiness. Please take a break.";
    } else if (drowsyFrames >= 4) {
      currentLevel = 1;
      msg = "Mild Drowsiness Detected.";
    }
    
    if (newMar > marThresh) {
       yawnCount.current += 1;
       if (currentLevel < 2) {
         currentLevel = 2;
         msg = "Yawning Detected! Stay alert.";
       }
    }
    
    if (isPhone && currentLevel < 2) {
      currentLevel = 2;
      msg = "Distraction Detected: Cell Phone In Use";
    }
    
    if (currentLevel > 0) {
      setAlertLevel(currentLevel);
      setAlertMsg(msg);
      triggerAlert(currentLevel);
      
      setEvents(prev => [{ time: new Date().toLocaleTimeString(), msg }, ...prev].slice(0, 10));
      
      try {
        axios.post('http://localhost:8000/api/events', {
          session_id: 1, 
          event_type: isPhone ? 'distraction' : (drowsyFrames >= 15 ? 'drowsiness_critical' : 'yawn'),
          severity: currentLevel,
          ear_value: newEar
        });
      } catch (e) { }
      
      cooldownActive.current = true;
      setTimeout(() => {
        setAlertLevel(0);
        cooldownActive.current = false;
      }, 5000);
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in relative max-w-7xl mx-auto w-full">
      <AlertBanner level={alertLevel} message={alertMsg} />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        earThresh={earThresh} setEarThresh={setEarThresh}
        marThresh={marThresh} setMarThresh={setMarThresh}
      />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-orbitron font-bold">Live <span className="text-gradient">Telemetry</span></h1>
          <p className="text-gray-400 mt-1 flex items-center gap-2">
            <Activity size={16} className="text-accent animate-pulse" /> AI Analysis Active
          </p>
        </div>
        
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="glass-button flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
        >
          <Settings size={18} /> Configure Thresholds
        </button>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 flex-grow min-h-0">
        
        {/* Left panel: Camera */}
        <div className={`lg:w-[65%] glass-panel flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 ease-in-out ${
            alertLevel === 3 ? 'border-critical shadow-glow-critical bg-critical/5' : 
            alertLevel === 2 ? 'border-warning shadow-[0_0_20px_rgba(255,170,0,0.3)] bg-warning/5' : ''
          }`}
        >
          {alertLevel > 0 && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-background/80 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
              <ShieldAlert size={16} className={alertLevel === 3 ? "text-critical animate-pulse" : "text-warning"} />
              <span className={`text-xs font-bold font-orbitron uppercase tracking-wider ${alertLevel === 3 ? "text-critical" : "text-warning"}`}>
                Threat Level {alertLevel}
              </span>
            </div>
          )}
          
          <div className="w-full h-full relative">
            <WebcamFeed onStatsUpdate={handleStats} />
            
            {/* Visual overlay grid for tech feel */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDEwaDQwTTAgMjBoNDBNMCAzMGg0ME0xMCAwdjQwTTIwIDB2NDBNMzAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiAvPjwvc3ZnPg==')] opacity-20 pointer-events-none mix-blend-overlay" />
          </div>
        </div>

        {/* Right panel: Metrics */}
        <div className="lg:w-[35%] flex flex-col gap-6">
          <div className="glass-panel p-6 flex-grow flex flex-col">
            <h2 className="text-xl font-orbitron font-bold text-white mb-6 border-b border-white/5 pb-4 flex items-center gap-2">
              <Activity size={20} className="text-accent" /> Sensor Data
            </h2>
            
            <div className="space-y-6 flex-grow">
              <div className="bg-surface/50 p-4 rounded-xl border border-white/5 relative overflow-hidden group">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-xs font-bold tracking-wider uppercase flex items-center gap-2">
                    <Eye size={14} /> Eye Aspect Ratio
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">THR: {earThresh}</span>
                </div>
                <div className="flex items-end gap-3">
                  <span className={`font-mono text-4xl font-light ${ear < earThresh ? 'text-warning text-shadow-glow' : 'text-accent'}`}>
                    {ear.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-surface_light h-1.5 mt-4 rounded-full overflow-hidden">
                   <div 
                      className={`h-full transition-all duration-200 ${ear < earThresh ? 'bg-warning shadow-[0_0_10px_#ffaa00]' : 'bg-accent shadow-glow-accent'}`} 
                      style={{ width: `${Math.min(ear / 0.4 * 100, 100)}%` }} 
                   />
                </div>
              </div>

              <div className="bg-surface/50 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-xs font-bold tracking-wider uppercase flex items-center gap-2">
                    <Eye size={14} className="opacity-50" /> Yawn Index (MAR)
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">THR: {marThresh}</span>
                </div>
                <span className={`font-mono text-4xl font-light ${mar > marThresh ? 'text-warning text-shadow-glow' : 'text-accent'}`}>
                  {mar.toFixed(2)}
                </span>
                <div className="w-full bg-surface_light h-1.5 mt-4 rounded-full overflow-hidden">
                   <div 
                      className={`h-full transition-all duration-200 ${mar > marThresh ? 'bg-warning shadow-[0_0_10px_#ffaa00]' : 'bg-accent shadow-glow-accent'}`} 
                      style={{ width: `${Math.min(mar / 1.0 * 100, 100)}%` }} 
                   />
                </div>
              </div>

              <div className={`p-4 rounded-xl border transition-all duration-300 ${phoneDetected ? 'bg-critical/10 border-critical/50 shadow-glow-critical' : 'bg-surface/50 border-white/5'}`}>
                <span className="text-gray-400 text-xs font-bold tracking-wider uppercase flex items-center gap-2 mb-3">
                  <Smartphone size={14} /> Device Detection
                </span>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${phoneDetected ? 'bg-critical animate-pulse shadow-[0_0_10px_#ff3d3d]' : 'bg-success shadow-[0_0_10px_#00ff88]'}`} />
                  <span className={`font-orbitron font-bold tracking-wide ${phoneDetected ? 'text-critical' : 'text-success'}`}>
                    {phoneDetected ? 'DISTRACTION IN CABIN' : 'SECURE'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="glass-panel p-5 h-[35%] flex flex-col">
             <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
               <h2 className="text-sm font-orbitron font-bold text-gray-300">System Logs</h2>
               <div className="flex items-center gap-2">
                 <span className="relative flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                 </span>
                 <span className="text-[10px] text-accent font-mono uppercase tracking-widest">Recording</span>
               </div>
             </div>
             
             <div className="flex-grow overflow-y-auto space-y-2 pr-2 custom-scrollbar">
               {events.length === 0 ? (
                 <div className="h-full flex items-center justify-center">
                    <span className="text-gray-500 font-mono text-xs opacity-50">awaiting events...</span>
                 </div>
               ) : (
                 events.map((evt, idx) => (
                   <div key={idx} className="flex flex-col text-sm border-l-2 border-warning pl-3 bg-white/[0.02] py-2 pr-2 rounded hover:bg-white/[0.05] transition-colors">
                     <span className="text-gray-500 text-[10px] mb-0.5 font-mono">{evt.time}</span>
                     <span className="text-gray-300 text-xs">{evt.msg}</span>
                   </div>
                 ))
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
