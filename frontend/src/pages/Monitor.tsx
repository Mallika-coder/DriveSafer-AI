import { useState, useRef, useCallback, useEffect } from 'react';
import WebcamFeed from '../components/WebcamFeed';
import AlertBanner from '../components/AlertBanner';
import SettingsModal from '../components/SettingsModal';
import CalibrationModal from '../components/CalibrationModal';
import RealTimeChart from '../components/RealTimeChart';
import DrowsinessGauge from '../components/DrowsinessGauge';
import HeadPoseVisualizer from '../components/HeadPoseVisualizer';
import { useAlertSound } from '../hooks/useAlertSound';
import { estimateHeadPose, getGazeDirection } from '../utils/headPoseEstimator';
import { computeDrowsinessScore, BlinkDetector, GazeStabilityTracker } from '../utils/drowsinessModel';
import { AdaptiveCalibrator, type CalibrationData } from '../utils/calibration';
import { TalkingDetector } from '../utils/talkingDetector';
import { CognitiveLoadDetector } from '../utils/cognitiveLoadDetector';
import axios from 'axios';
import { Settings, ShieldAlert, Activity, Eye, Smartphone, Zap, Crosshair, Gauge, Brain, Timer, Headphones, MessageCircle } from 'lucide-react';

interface ChartDataPoint {
  time: number;
  ear: number;
  mar: number;
  drowsinessScore: number;
}

export default function Monitor() {
  const [ear, setEar] = useState(0);
  const [mar, setMar] = useState(0);
  const [phoneDetected, setPhoneDetected] = useState(false);

  const [alertLevel, setAlertLevel] = useState(0);
  const [alertMsg, setAlertMsg] = useState("");
  const [events, setEvents] = useState<{time: string, msg: string, level: number}[]>([]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [earThresh, setEarThresh] = useState(0.25);
  const [marThresh, setMarThresh] = useState(0.60);

  // New ML state
  const [headPose, setHeadPose] = useState({ pitch: 0, yaw: 0, roll: 0, isDistracted: false });
  const [gazeInfo, setGazeInfo] = useState({ x: 0.5, y: 0.5, direction: 'CENTER' });
  const [drowsiness, setDrowsiness] = useState<{ score: number; level: 'ALERT' | 'MILD' | 'MODERATE' | 'SEVERE'; confidence: number; factors: any[] }>({ score: 0, level: 'ALERT', confidence: 0.5, factors: [] });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [fps, setFps] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [sessionId, setSessionId] = useState<number | null>(null);

  // Talking & cognitive load state
  const [talkingState, setTalkingState] = useState({ isTalking: false, isYawning: false, isOnCall: false, talkingDuration: 0, confidence: 0, marFrequency: 0, marAmplitude: 0 });
  const [cognitiveLoad, setCognitiveLoad] = useState<{ cognitiveLoad: number; level: 'LOW' | 'MODERATE' | 'HIGH'; indicators: { reducedBlinking: boolean; fixatedGaze: boolean; noScanning: boolean; monotoneHead: boolean; activeConversation: boolean }; distracted: boolean }>({ cognitiveLoad: 0, level: 'LOW', indicators: { reducedBlinking: false, fixatedGaze: false, noScanning: false, monotoneHead: false, activeConversation: false }, distracted: false });

  // Calibration state
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationData, setCalibrationData] = useState<CalibrationData | null>(null);

  // Refs
  const earHistory = useRef<number[]>([]);
  const yawnCount = useRef(0);
  const { triggerAlert } = useAlertSound();
  const cooldownActive = useRef(false);
  const blinkDetector = useRef(new BlinkDetector());
  const gazeTracker = useRef(new GazeStabilityTracker());
  const calibrator = useRef(new AdaptiveCalibrator());
  const talkingDetector = useRef(new TalkingDetector());
  const cognitiveDetector = useRef(new CognitiveLoadDetector());
  const frameCounter = useRef(0);
  const lastFpsTime = useRef(Date.now());
  const sessionStartTime = useRef(Date.now());

  // Load calibration on mount and start session
  useEffect(() => {
    const saved = AdaptiveCalibrator.loadCalibration();
    if (saved) {
      setCalibrationData(saved);
      setEarThresh(saved.earThreshold);
      setMarThresh(saved.marThreshold);
      blinkDetector.current.setThreshold(saved.earThreshold);
    }

    // Start a session
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    axios.post(`${apiUrl}/api/sessions/start`)
      .then(res => setSessionId(res.data.id))
      .catch(() => {});

    sessionStartTime.current = Date.now();
    const timer = setInterval(() => {
      setSessionDuration(Math.floor((Date.now() - sessionStartTime.current) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCalibrationStart = () => {
    setIsCalibrating(true);
    setCalibrationProgress(0);
    calibrator.current.startCalibration(
      (progress) => setCalibrationProgress(progress),
      (data) => {
        setCalibrationData(data);
        setEarThresh(data.earThreshold);
        setMarThresh(data.marThreshold);
        blinkDetector.current.setThreshold(data.earThreshold);
        setIsCalibrating(false);
      }
    );
  };

  const handleStats = useCallback((newEar: number, newMar: number, isPhone: boolean, landmarks?: any[]) => {
    const now = Date.now();
    setEar(newEar);
    setMar(newMar);
    setPhoneDetected(isPhone);

    // FPS calculation
    frameCounter.current++;
    if (now - lastFpsTime.current >= 1000) {
      setFps(frameCounter.current);
      frameCounter.current = 0;
      lastFpsTime.current = now;
    }

    // Feed calibrator
    if (calibrator.current.getCalibrating()) {
      calibrator.current.addSample(newEar, newMar);
    }

    // Head pose & gaze from landmarks
    if (landmarks && landmarks.length > 468) {
      const pose = estimateHeadPose(landmarks);
      setHeadPose(pose);

      const gaze = getGazeDirection(landmarks);
      setGazeInfo(gaze);
      gazeTracker.current.update(gaze.x, gaze.y, now);
    }

    // Blink detection
    blinkDetector.current.update(newEar, now);

    // Talking vs yawning detection
    const talkResult = talkingDetector.current.update(newMar, headPose.roll, headPose.yaw, isPhone, now);
    setTalkingState(talkResult);

    // Cognitive load detection (hands-free call distraction)
    const cogResult = cognitiveDetector.current.update(
      blinkDetector.current.getBlinkRate(),
      gazeInfo.x,
      gazeInfo.y,
      headPose.yaw,
      headPose.pitch,
      talkResult.isTalking,
      now
    );
    setCognitiveLoad(cogResult);

    // Composite drowsiness score
    const drowsinessResult = computeDrowsinessScore({
      ear: newEar,
      mar: talkResult.isYawning ? newMar : Math.min(newMar, 0.5), // Only count MAR if actually yawning, not talking
      headPitch: headPose.pitch,
      headYaw: headPose.yaw,
      blinkRate: blinkDetector.current.getBlinkRate(),
      blinkDuration: blinkDetector.current.getAvgBlinkDuration(),
      perclos: blinkDetector.current.getPERCLOS(),
      gazeStability: gazeTracker.current.getStability(),
    });
    setDrowsiness(drowsinessResult);

    // Chart data
    setChartData(prev => {
      const next = [...prev, { time: now, ear: newEar, mar: newMar, drowsinessScore: drowsinessResult.score }];
      return next.slice(-150);
    });

    earHistory.current.push(newEar);
    if (earHistory.current.length > 20) earHistory.current.shift();

    if (cooldownActive.current) return;

    let currentLevel = 0;
    let msg = "";

    // Use composite score for alerting
    if (drowsinessResult.score > 70) {
      currentLevel = 3;
      msg = "Critical: Multi-signal drowsiness detected!";
    } else if (drowsinessResult.score > 45) {
      currentLevel = 2;
      msg = "Warning: Moderate fatigue indicators.";
    } else if (drowsinessResult.score > 20) {
      currentLevel = 1;
      msg = "Mild drowsiness detected.";
    }

    // Only trigger yawn alert if actually yawning (not just talking)
    if (talkResult.isYawning && newMar > marThresh) {
      yawnCount.current += 1;
      if (currentLevel < 2) {
        currentLevel = 2;
        msg = "Yawning detected — consider a break.";
      }
    }

    if (isPhone && currentLevel < 2) {
      currentLevel = 2;
      msg = "Distraction: Phone detected in cabin.";
    }

    // Hands-free call detection (earphones/buds)
    if (talkResult.isOnCall && currentLevel < 2) {
      currentLevel = 2;
      msg = "Hands-free call detected — stay focused on road.";
    }

    // Cognitive distraction (conversation-induced inattention)
    if (cogResult.distracted && currentLevel < 1) {
      currentLevel = 1;
      msg = "Cognitive distraction detected — attention divided.";
    }

    if (headPose.isDistracted && currentLevel < 1) {
      currentLevel = 1;
      msg = "Attention: Eyes off road detected.";
    }

    if (currentLevel > 0) {
      setAlertLevel(currentLevel);
      setAlertMsg(msg);
      triggerAlert(currentLevel);

      setEvents(prev => [{ time: new Date().toLocaleTimeString(), msg, level: currentLevel }, ...prev].slice(0, 20));

      if (sessionId) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          let eventType = drowsinessResult.level.toLowerCase();
          if (isPhone) eventType = 'distraction_phone';
          else if (talkResult.isOnCall) eventType = 'distraction_handsfree_call';
          else if (cogResult.distracted) eventType = 'cognitive_distraction';
          else if (talkResult.isYawning) eventType = 'yawn';

          axios.post(`${apiUrl}/api/events`, {
            session_id: sessionId,
            event_type: eventType,
            severity: currentLevel,
            ear_value: newEar
          });
        } catch (e) { }
      }

      cooldownActive.current = true;
      setTimeout(() => {
        setAlertLevel(0);
        cooldownActive.current = false;
      }, 5000);
    }
  }, [headPose.pitch, headPose.yaw, headPose.isDistracted, marThresh, sessionId, triggerAlert]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full animate-fade-in relative w-full pb-8 gap-6">
      <AlertBanner level={alertLevel} message={alertMsg} />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        earThresh={earThresh} setEarThresh={setEarThresh}
        marThresh={marThresh} setMarThresh={setMarThresh}
      />
      <CalibrationModal
        isOpen={isCalibrationOpen}
        onClose={() => setIsCalibrationOpen(false)}
        onStartCalibration={handleCalibrationStart}
        progress={calibrationProgress}
        isCalibrating={isCalibrating}
        calibrationData={calibrationData}
      />

      {/* Header */}
      <div style={{ backgroundColor: '#111927', padding: '32px 48px', borderRadius: '32px', border: '2px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffffff', fontFamily: 'Orbitron', margin: 0, textTransform: 'uppercase' }}>
            Live <span style={{ background: 'linear-gradient(to right, #00F0FF, #7000FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Telemetry</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '8px' }}>
            <span style={{ color: '#00FF66', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00FF66', boxShadow: '0 0 8px #00FF66' }} />
              {fps} FPS
            </span>
            <span style={{ color: '#9CA3AF', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Timer size={14} /> {formatDuration(sessionDuration)}
            </span>
            {calibrationData && (
              <span style={{ color: '#00F0FF', fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: '8px', backgroundColor: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)' }}>
                CALIBRATED
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setIsCalibrationOpen(true)}
            style={{ backgroundColor: 'transparent', border: '2px solid rgba(0,240,255,0.3)', color: '#00F0FF', borderRadius: '16px', padding: '12px 24px', fontSize: '0.875rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Crosshair size={18} /> CALIBRATE
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            style={{ backgroundColor: '#00F0FF', color: '#050B14', border: 'none', borderRadius: '16px', padding: '12px 24px', fontSize: '0.875rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Settings size={18} /> CONFIG
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', gap: '24px', flexGrow: 1, minHeight: 0 }}>
        {/* Left: Camera + Chart */}
        <div style={{ width: '55%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Camera */}
          <div
            style={{
              flex: 1,
              borderRadius: '32px',
              border: alertLevel === 3 ? '3px solid #FF2A2A' : alertLevel === 2 ? '3px solid #FFE600' : '3px solid rgba(0, 240, 255, 0.3)',
              backgroundColor: '#000',
              overflow: 'hidden',
              position: 'relative',
              minHeight: 0,
            }}
          >
            {alertLevel > 0 && (
              <div
                style={{
                  position: 'absolute', top: '16px', left: '16px', zIndex: 20, display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 20px', borderRadius: '12px',
                  backgroundColor: alertLevel === 3 ? '#FF2A2A' : '#FFE600',
                  color: alertLevel === 3 ? '#fff' : '#000',
                }}
              >
                <ShieldAlert size={20} />
                <span style={{ fontSize: '0.875rem', fontWeight: 900, textTransform: 'uppercase' }}>
                  LEVEL {alertLevel}
                </span>
              </div>
            )}
            <div style={{ width: '100%', height: '100%' }}>
              <WebcamFeed onStatsUpdate={handleStats} />
            </div>
          </div>

          {/* Real-time chart */}
          <div style={{ backgroundColor: '#111927', borderRadius: '20px', border: '2px solid rgba(255,255,255,0.1)', padding: '16px' }}>
            <h3 style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 900, fontFamily: 'Orbitron', textTransform: 'uppercase', margin: '0 0 8px', letterSpacing: '0.1em' }}>
              Signal Time Series
            </h3>
            <RealTimeChart data={chartData} earThreshold={earThresh} height={140} />
          </div>
        </div>

        {/* Right: Metrics Panel */}
        <div style={{ width: '45%', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
          {/* Top row: Gauge + Head Pose */}
          <div style={{ display: 'flex', gap: '16px' }}>
            {/* Drowsiness Gauge */}
            <div style={{ flex: 1, backgroundColor: '#111927', borderRadius: '24px', border: '2px solid rgba(255,255,255,0.1)', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Brain size={16} style={{ color: '#FF007F' }} />
                <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', fontFamily: 'Orbitron' }}>ML Risk</span>
              </div>
              <DrowsinessGauge score={drowsiness.score} level={drowsiness.level} confidence={drowsiness.confidence} size={150} />
            </div>

            {/* Head Pose */}
            <div style={{ flex: 1, backgroundColor: '#111927', borderRadius: '24px', border: '2px solid rgba(255,255,255,0.1)', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Gauge size={16} style={{ color: '#00F0FF' }} />
                <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', fontFamily: 'Orbitron' }}>Head Pose</span>
              </div>
              <HeadPoseVisualizer
                pitch={headPose.pitch}
                yaw={headPose.yaw}
                roll={headPose.roll}
                gazeDirection={gazeInfo.direction}
                gazeX={gazeInfo.x}
                gazeY={gazeInfo.y}
                size={150}
              />
            </div>
          </div>

          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* EAR */}
            <div style={{ backgroundColor: '#111927', padding: '20px', borderRadius: '20px', border: '2px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Eye size={16} style={{ color: '#00F0FF' }} />
                <span style={{ color: '#9CA3AF', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>EAR</span>
              </div>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'monospace', color: ear < earThresh ? '#FF2A2A' : '#fff' }}>
                {ear.toFixed(3)}
              </span>
              <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '2px', marginTop: '8px' }}>
                <div style={{ width: `${Math.min(ear / 0.4 * 100, 100)}%`, height: '100%', backgroundColor: ear < earThresh ? '#FF2A2A' : '#00F0FF', borderRadius: '2px', transition: 'width 0.2s' }} />
              </div>
            </div>

            {/* MAR */}
            <div style={{ backgroundColor: '#111927', padding: '20px', borderRadius: '20px', border: '2px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Activity size={16} style={{ color: '#FF007F' }} />
                <span style={{ color: '#9CA3AF', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>MAR</span>
              </div>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'monospace', color: mar > marThresh ? '#FFE600' : '#fff' }}>
                {mar.toFixed(3)}
              </span>
              <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '2px', marginTop: '8px' }}>
                <div style={{ width: `${Math.min(mar / 1.0 * 100, 100)}%`, height: '100%', backgroundColor: mar > marThresh ? '#FFE600' : '#FF007F', borderRadius: '2px', transition: 'width 0.2s' }} />
              </div>
            </div>

            {/* PERCLOS */}
            <div style={{ backgroundColor: '#111927', padding: '20px', borderRadius: '20px', border: '2px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Zap size={16} style={{ color: '#FFE600' }} />
                <span style={{ color: '#9CA3AF', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>PERCLOS</span>
              </div>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'monospace', color: blinkDetector.current.getPERCLOS() > 0.15 ? '#FF2A2A' : '#fff' }}>
                {(blinkDetector.current.getPERCLOS() * 100).toFixed(1)}%
              </span>
            </div>

            {/* Phone / Call Status */}
            <div style={{ backgroundColor: (phoneDetected || talkingState.isOnCall) ? 'rgba(255,42,42,0.1)' : '#111927', padding: '20px', borderRadius: '20px', border: (phoneDetected || talkingState.isOnCall) ? '2px solid #FF2A2A' : '2px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                {talkingState.isOnCall ? <Headphones size={16} style={{ color: '#FF8C00' }} /> : <Smartphone size={16} style={{ color: phoneDetected ? '#FF2A2A' : '#00FF66' }} />}
                <span style={{ color: '#9CA3AF', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>CABIN</span>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 900, color: phoneDetected ? '#FF2A2A' : talkingState.isOnCall ? '#FF8C00' : '#00FF66' }}>
                {phoneDetected ? 'PHONE' : talkingState.isOnCall ? 'HANDS-FREE CALL' : talkingState.isTalking ? 'TALKING' : 'CLEAR'}
              </span>
            </div>
          </div>

          {/* Cognitive & Call Status */}
          <div style={{ backgroundColor: cognitiveLoad.distracted ? 'rgba(255, 140, 0, 0.05)' : '#111927', padding: '16px 20px', borderRadius: '20px', border: cognitiveLoad.distracted ? '2px solid rgba(255,140,0,0.4)' : '2px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 900, fontFamily: 'Orbitron', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageCircle size={14} style={{ color: '#FF8C00' }} /> Cognitive Load
              </h3>
              <span style={{ color: cognitiveLoad.level === 'HIGH' ? '#FF2A2A' : cognitiveLoad.level === 'MODERATE' ? '#FFE600' : '#00FF66', fontSize: '0.7rem', fontWeight: 900 }}>
                {cognitiveLoad.cognitiveLoad}% — {cognitiveLoad.level}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              {[
                { label: 'Talk', active: talkingState.isTalking, color: '#FFE600' },
                { label: 'Call', active: talkingState.isOnCall, color: '#FF8C00' },
                { label: 'Fixated', active: cognitiveLoad.indicators.fixatedGaze, color: '#FF007F' },
              ].map(ind => (
                <div key={ind.label} style={{ textAlign: 'center', padding: '6px', borderRadius: '8px', backgroundColor: ind.active ? `${ind.color}15` : 'rgba(0,0,0,0.2)', border: `1px solid ${ind.active ? ind.color : 'transparent'}` }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: ind.active ? ind.color : '#374151', margin: '0 auto 4px' }} />
                  <span style={{ color: ind.active ? ind.color : '#6B7280', fontSize: '0.6rem', fontWeight: 700 }}>{ind.label}</span>
                </div>
              ))}
            </div>
            {talkingState.isOnCall && (
              <div style={{ marginTop: '8px', padding: '6px 10px', borderRadius: '6px', backgroundColor: 'rgba(255,140,0,0.1)', border: '1px solid rgba(255,140,0,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Headphones size={12} style={{ color: '#FF8C00' }} />
                <span style={{ color: '#FF8C00', fontSize: '0.65rem', fontWeight: 700 }}>
                  Earphone call: {Math.round(talkingState.talkingDuration / 1000)}s
                </span>
              </div>
            )}
          </div>

          {/* Factor Breakdown */}
          <div style={{ backgroundColor: '#111927', padding: '16px 20px', borderRadius: '20px', border: '2px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 900, fontFamily: 'Orbitron', textTransform: 'uppercase', margin: '0 0 12px' }}>
              Risk Factor Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {drowsiness.factors.slice(0, 5).map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#6B7280', fontSize: '0.65rem', width: '90px', flexShrink: 0 }}>{f.name}</span>
                  <div style={{ flex: 1, height: '4px', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '2px' }}>
                    <div style={{ width: `${Math.min(f.value, 100)}%`, height: '100%', backgroundColor: f.value > 60 ? '#FF2A2A' : f.value > 30 ? '#FFE600' : '#00FF66', borderRadius: '2px', transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ color: '#fff', fontSize: '0.65rem', fontFamily: 'monospace', width: '32px', textAlign: 'right' }}>{Math.round(f.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Event Log */}
          <div style={{ backgroundColor: '#111927', padding: '16px 20px', borderRadius: '20px', border: '2px solid rgba(255,255,255,0.1)', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 900, fontFamily: 'Orbitron', textTransform: 'uppercase', margin: 0 }}>Event Log</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', backgroundColor: 'rgba(255,42,42,0.1)', border: '1px solid rgba(255,42,42,0.3)' }}>
                <div style={{ width: '6px', height: '6px', backgroundColor: '#FF2A2A', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                <span style={{ color: '#FF2A2A', fontSize: '0.6rem', fontWeight: 700 }}>LIVE</span>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {events.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#6B7280', fontSize: '0.75rem', fontStyle: 'italic' }}>Monitoring active...</span>
                </div>
              ) : (
                events.map((evt, idx) => (
                  <div key={idx} style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.3)', borderLeft: `3px solid ${evt.level === 3 ? '#FF2A2A' : evt.level === 2 ? '#FFE600' : '#00F0FF'}` }}>
                    <span style={{ color: '#6B7280', fontSize: '0.6rem', fontFamily: 'monospace' }}>{evt.time}</span>
                    <p style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 600, margin: '2px 0 0' }}>{evt.msg}</p>
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
