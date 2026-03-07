import { useState, useRef } from 'react';
import WebcamFeed from '../components/WebcamFeed';
import AlertBanner from '../components/AlertBanner';
import SettingsModal from '../components/SettingsModal';
import { useAlertSound } from '../hooks/useAlertSound';
import axios from 'axios';
import { Settings, ShieldAlert, Activity, Eye, Smartphone, Zap } from 'lucide-react';

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
    <div className="flex flex-col h-full animate-fade-in relative w-full pb-8">
      <AlertBanner level={alertLevel} message={alertMsg} />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        earThresh={earThresh} setEarThresh={setEarThresh}
        marThresh={marThresh} setMarThresh={setMarThresh}
      />
      
      <div 
        className="flex justify-between items-center mb-10 bg-[#111927] p-12 rounded-[2.5rem] border-2 border-white/10 shadow-3xl"
        style={{ backgroundColor: '#111927', padding: '48px', borderRadius: '40px', border: '2px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}
      >
        <div>
          <h1 
            className="text-6xl font-orbitron font-black tracking-tighter uppercase text-white"
            style={{ fontSize: '3.75rem', fontWeight: 900, color: '#ffffff', fontFamily: 'Orbitron', margin: 0, textTransform: 'uppercase' }}
          >
            Live <span className="text-gradient" style={{ background: 'linear-gradient(to right, #00F0FF, #7000FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Telemetry</span>
          </h1>
          <p 
            className="mt-3 flex items-center gap-4 font-black text-2xl uppercase tracking-widest leading-none"
            style={{ fontSize: '1.5rem', fontWeight: 900, color: '#E5E7EB', display: 'flex', alignItems: 'center', gap: '16px', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '12px' }}
          >
            <Activity size={32} style={{ color: '#FF007F' }} /> Neural Bridge Active
          </p>
        </div>
        
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="hover:bg-white flex items-center gap-4 px-10 py-5 rounded-3xl text-xl font-black transition-all hover:scale-110"
          style={{ backgroundColor: '#00F0FF', color: '#050B14', border: 'none', borderRadius: '24px', padding: '20px 40px', fontSize: '1.25rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
        >
          <Settings size={28} /> SYSTEM_CFG
        </button>
      </div>
      
      <div 
        className="flex flex-col xl:flex-row gap-10 flex-grow min-h-0"
        style={{ display: 'flex', flexDirection: 'row', gap: '40px', flexGrow: 1, minHeight: 0 }}
      >
        
        {/* Left panel: Camera */}
        <div 
          className={`xl:w-[60%] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-700 ease-in-out p-2 rounded-[3rem] border-4
            ${alertLevel === 3 ? 'bg-critical/20' : 
            alertLevel === 2 ? 'bg-warning/20' : 
            'bg-black'}
          `}
          style={{ 
            width: '60%', 
            borderRadius: '48px', 
            border: alertLevel === 3 ? '4px solid #FF2A2A' : alertLevel === 2 ? '4px solid #FFE600' : '4px solid rgba(0, 240, 255, 0.4)',
            backgroundColor: alertLevel === 3 ? 'rgba(255, 42, 42, 0.2)' : alertLevel === 2 ? 'rgba(255, 230, 0, 0.2)' : '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {alertLevel > 0 && (
            <div 
              className={`absolute top-12 left-12 z-20 flex items-center gap-5 px-10 py-6 rounded-[2rem] border-4 backdrop-blur-2xl shadow-3xl animate-pulse
                ${alertLevel === 3 ? 'bg-critical border-white text-white' : 'bg-warning border-black text-black'}`}
              style={{ 
                position: 'absolute', top: '48px', left: '48px', zIndex: 20, display: 'flex', alignItems: 'center', gap: '20px', padding: '24px 40px', borderRadius: '32px', border: alertLevel === 3 ? '4px solid #ffffff' : '4px solid #000000', 
                backgroundColor: alertLevel === 3 ? '#FF2A2A' : '#FFE600', color: alertLevel === 3 ? '#ffffff' : '#000000'
              }}
            >
              <ShieldAlert size={40} />
              <span style={{ fontSize: '1.875rem', fontWeight: 900, fontFamily: 'Orbitron', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                CRITICAL THREAT {alertLevel}
              </span>
            </div>
          )}
          
          <div 
            className="w-full h-full relative rounded-[2.8rem] overflow-hidden bg-black"
            style={{ width: '100%', height: '100%', borderRadius: '44px', overflow: 'hidden', backgroundColor: '#000000' }}
          >
            <WebcamFeed onStatsUpdate={handleStats} />
          </div>
        </div>

        {/* Right panel: Metrics */}
        <div className="xl:w-[40%] flex flex-col gap-10" style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          <div 
            className="bg-[#111927] p-12 flex-grow flex flex-col relative overflow-hidden rounded-[3rem] border-2 border-white/10"
            style={{ backgroundColor: '#111927', padding: '48px', borderRadius: '48px', border: '2px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', flexGrow: 1 }}
          >
            <h2 
              className="text-3xl font-orbitron font-black text-white mb-12 border-b-2 border-white/10 pb-8 flex items-center gap-4 relative z-10 uppercase tracking-widest"
              style={{ fontSize: '1.875rem', fontWeight: 900, color: '#ffffff', fontFamily: 'Orbitron', borderBottom: '2px solid rgba(255, 255, 255, 0.1)', paddingBottom: '32px', marginBottom: '48px', display: 'flex', alignItems: 'center', gap: '16px', textTransform: 'uppercase' }}
            >
              <Zap size={36} style={{ color: '#00F0FF' }} /> Sensor Analytics
            </h2>
            
            <div className="space-y-10 flex-grow relative z-10" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <div 
                className="bg-black/40 p-10 rounded-[2.5rem] border-2 border-white/10 shadow-2xl"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', padding: '40px', borderRadius: '40px', border: '2px solid rgba(255, 255, 255, 0.1)' }}
              >
                <div className="flex justify-between items-center mb-6">
                  <span style={{ color: '#D1D5DB', fontSize: '1.125rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Eye size={28} style={{ color: '#00F0FF' }} /> Eye Ratio (EAR)
                  </span>
                </div>
                <div className="flex items-center gap-10" style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                  <span 
                    style={{ fontSize: '6rem', fontWeight: 900, fontFamily: 'monospace', color: ear < earThresh ? '#FF2A2A' : '#ffffff', letterSpacing: '-0.05em' }}
                  >
                    {ear.toFixed(2)}
                  </span>
                  <div className="flex flex-col gap-2">
                    <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 900, textTransform: 'uppercase' }}>LIMIT</span>
                    <span style={{ fontSize: '1.5rem', color: '#00F0FF', fontWeight: 900, fontFamily: 'monospace' }}>{earThresh}</span>
                  </div>
                </div>
                <div 
                  className="w-full bg-black/60 h-6 mt-10 rounded-full overflow-hidden border-2 border-white/10"
                  style={{ width: '100%', backgroundColor: 'rgba(0, 0, 0, 0.6)', height: '24px', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(255, 255, 255, 0.1)', marginTop: '40px' }}
                >
                   <div 
                      style={{ height: '100%', width: `${Math.min(ear / 0.4 * 100, 100)}%`, backgroundColor: ear < earThresh ? '#FF2A2A' : '#00F0FF', borderRadius: '12px', transition: 'all 0.3s' }} 
                   />
                </div>
              </div>

              <div 
                className="bg-black/40 p-10 rounded-[2.5rem] border-2 border-white/10 shadow-2xl"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', padding: '40px', borderRadius: '40px', border: '2px solid rgba(255, 255, 255, 0.1)' }}
              >
                <div className="flex justify-between items-center mb-6">
                  <span style={{ color: '#D1D5DB', fontSize: '1.125rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Activity size={28} style={{ color: '#FF007F' }} /> Yawn Index (MAR)
                  </span>
                </div>
                <div className="flex items-center gap-10" style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                  <span 
                    style={{ fontSize: '6rem', fontWeight: 900, fontFamily: 'monospace', color: mar > marThresh ? '#FFE600' : '#ffffff', letterSpacing: '-0.05em' }}
                  >
                    {mar.toFixed(2)}
                  </span>
                  <div className="flex flex-col gap-2">
                    <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 900, textTransform: 'uppercase' }}>LIMIT</span>
                    <span style={{ fontSize: '1.5rem', color: '#FF007F', fontWeight: 900, fontFamily: 'monospace' }}>{marThresh}</span>
                  </div>
                </div>
                <div 
                  className="w-full bg-black/60 h-6 mt-10 rounded-full overflow-hidden border-2 border-white/10"
                  style={{ width: '100%', backgroundColor: 'rgba(0, 0, 0, 0.6)', height: '24px', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(255, 255, 255, 0.1)', marginTop: '40px' }}
                >
                   <div 
                      style={{ height: '100%', width: `${Math.min(mar / 1.0 * 100, 100)}%`, backgroundColor: mar > marThresh ? '#FFE600' : '#FF007F', borderRadius: '12px', transition: 'all 0.3s' }} 
                   />
                </div>
              </div>

              <div 
                className="p-10 rounded-[2.5rem] border-2 transition-all duration-500 shadow-3xl"
                style={{ backgroundColor: phoneDetected ? 'rgba(255, 42, 42, 0.2)' : 'rgba(0, 0, 0, 0.4)', padding: '40px', borderRadius: '40px', border: phoneDetected ? '2px solid #FF2A2A' : '2px solid rgba(255, 255, 255, 0.1)' }}
              >
                <span style={{ color: '#D1D5DB', fontSize: '1.125rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <Smartphone size={28} style={{ color: phoneDetected ? '#FF2A2A' : '#00FF66' }} /> Cab Environment
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px', backgroundColor: 'rgba(0, 0, 0, 0.6)', padding: '32px', borderRadius: '24px', border: '2px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: phoneDetected ? '#FF2A2A' : '#00FF66', boxShadow: phoneDetected ? '0 0 30px #FF2A2A' : '0 0 30px #00FF66' }} />
                  <span style={{ fontSize: '2.25rem', fontWeight: 900, fontFamily: 'Orbitron', color: phoneDetected ? '#FF2A2A' : '#00FF66', letterSpacing: '-0.05em' }}>
                    {phoneDetected ? 'DISTRACTION DETECTED' : 'SECURE & FOCUSED'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div 
            className="bg-[#111927] p-10 h-[30%] flex flex-col relative overflow-hidden rounded-[3rem] border-2 border-white/10"
            style={{ backgroundColor: '#111927', padding: '40px', borderRadius: '48px', border: '2px solid rgba(255, 255, 255, 0.1)', height: '30%', display: 'flex', flexDirection: 'column' }}
          >
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '2px solid rgba(255, 255, 255, 0.1)', paddingBottom: '24px' }}>
               <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', fontFamily: 'Orbitron', textTransform: 'uppercase', margin: 0 }}>System_Logs</h2>
               <div style={{ backgroundColor: 'rgba(255, 42, 42, 0.2)', padding: '8px 24px', borderRadius: '9999px', border: '2px solid #FF2A2A', display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <div style={{ width: '12px', height: '12px', backgroundColor: '#FF2A2A', borderRadius: '50%' }} className="animate-ping" />
                 <span style={{ fontSize: '0.75rem', color: '#FF2A2A', fontWeight: 900, textTransform: 'uppercase' }}>RECORDING</span>
               </div>
             </div>
             
             <div className="flex-grow overflow-y-auto space-y-4 pr-4 custom-scrollbar" style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
               {events.length === 0 ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                    <span style={{ color: '#9CA3AF', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>Initializing Telemetry...</span>
                  </div>
               ) : (
                 events.map((evt, idx) => (
                   <div key={idx} style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '24px', borderRadius: '24px', border: '2px solid rgba(255, 255, 255, 0.05)', borderLeft: '8px solid #FF007F' }}>
                     <span style={{ color: '#FF007F', fontSize: '0.875rem', fontWeight: 900, fontFamily: 'monospace', marginBottom: '4px', display: 'block' }}>{evt.time}</span>
                     <span style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 700, textTransform: 'uppercase' }}>{evt.msg}</span>
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
