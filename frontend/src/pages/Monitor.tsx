import { useState, useRef, useCallback, useEffect } from 'react';
import WebcamFeed from '../components/WebcamFeed';
import AlertBanner from '../components/AlertBanner';
import SettingsModal from '../components/SettingsModal';
import CalibrationModal from '../components/CalibrationModal';
import RealTimeChart from '../components/RealTimeChart';
import HeadPoseVisualizer from '../components/HeadPoseVisualizer';
import XAIPanel from '../components/XAIPanel';
import ABComparisonPanel from '../components/ABComparisonPanel';
import { useAlertSound } from '../hooks/useAlertSound';
import { estimateHeadPose, getGazeDirection } from '../utils/headPoseEstimator';
import { computeDrowsinessScore, BlinkDetector, GazeStabilityTracker } from '../utils/drowsinessModel';
import { AdaptiveCalibrator, type CalibrationData } from '../utils/calibration';
import { TalkingDetector } from '../utils/talkingDetector';
import { CognitiveLoadDetector } from '../utils/cognitiveLoadDetector';
import { predictDrowsiness } from '../utils/tinyMLModel';
import { DriverProfiler } from '../utils/driverProfiling';
import { fleetManager } from '../utils/fleetManager';
import axios from 'axios';
import { Settings, ShieldAlert, Crosshair, Timer, Headphones } from 'lucide-react';

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

  // TinyML prediction state
  const [mlPrediction, setMlPrediction] = useState<{ class: string; probabilities: number[]; confidence: number; inferenceTimeMs: number } | null>(null);

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
  const { triggerAlert, stopAlarm } = useAlertSound();
  const cooldownActive = useRef(false);
  const blinkDetector = useRef(new BlinkDetector());
  const gazeTracker = useRef(new GazeStabilityTracker());
  const calibrator = useRef(new AdaptiveCalibrator());
  const talkingDetector = useRef(new TalkingDetector());
  const cognitiveDetector = useRef(new CognitiveLoadDetector());
  const driverProfiler = useRef(new DriverProfiler());
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

    // TinyML inference
    const mlResult = predictDrowsiness(
      newEar, newMar,
      blinkDetector.current.getPERCLOS(),
      headPose.pitch,
      blinkDetector.current.getBlinkRate(),
      blinkDetector.current.getAvgBlinkDuration(),
      gazeTracker.current.getStability()
    );
    setMlPrediction(mlResult);

    // Driver profiling
    driverProfiler.current.recordScore(drowsinessResult.score);

    // Fleet manager update
    fleetManager.updateSelfScore(drowsinessResult.score, sessionDuration);

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

    // Use composite score for alerting (thresholds tuned to avoid false alarms)
    if (drowsinessResult.score > 75) {
      currentLevel = 3;
      msg = "Critical: Multi-signal drowsiness detected!";
    } else if (drowsinessResult.score > 55) {
      currentLevel = 2;
      msg = "Warning: Moderate fatigue indicators.";
    } else if (drowsinessResult.score > 35) {
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

    // Head pose — only trigger if SIGNIFICANTLY off (not just glancing down)
    if (headPose.isDistracted && Math.abs(headPose.pitch) > 20 && currentLevel < 2) {
      currentLevel = 2;
      msg = "Attention: Eyes off road — head position unsafe.";
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

          // Send to fleet manager
          const alertType = isPhone ? 'phone_distraction' as const
            : cogResult.distracted ? 'cognitive_overload' as const
            : headPose.isDistracted ? 'eyes_off_road' as const
            : 'drowsiness_critical' as const;
          fleetManager.sendAlert(drowsinessResult.score, alertType, currentLevel);

          // Record event for profiling
          driverProfiler.current.recordEvent();
        } catch (e) { }
      }

      cooldownActive.current = true;
      setTimeout(() => {
        setAlertLevel(0);
        stopAlarm();
        cooldownActive.current = false;
      }, 5000);
    }
  }, [headPose.pitch, headPose.yaw, headPose.isDistracted, marThresh, sessionId, triggerAlert, stopAlarm]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Live Monitor</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
            <span style={{ color: 'var(--success)', fontSize: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} />
              {fps} FPS
            </span>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Timer size={12} /> {formatDuration(sessionDuration)}
            </span>
            {calibrationData && (
              <span style={{ color: 'var(--accent)', fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '4px', background: 'var(--accent-subtle)' }}>
                CALIBRATED
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setIsCalibrationOpen(true)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: '6px', padding: '6px 12px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Crosshair size={14} /> Calibrate
          </button>
          <button onClick={() => setIsSettingsOpen(true)} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Settings size={14} /> Settings
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
        {/* Left: Camera + Chart */}
        <div style={{ width: '58%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Camera */}
          <div style={{ flex: 1, borderRadius: '8px', border: '1px solid var(--border)', borderLeft: alertLevel === 3 ? '3px solid var(--danger)' : alertLevel === 2 ? '3px solid var(--warning)' : '3px solid var(--accent)', backgroundColor: '#000', overflow: 'hidden', position: 'relative', minHeight: 0 }}>
            {alertLevel > 0 && (
              <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 20, display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', borderRadius: '4px', background: alertLevel === 3 ? 'var(--danger)' : 'var(--warning)', color: '#fff' }}>
                <ShieldAlert size={14} />
                <span style={{ fontSize: '11px', fontWeight: 600 }}>LEVEL {alertLevel}</span>
              </div>
            )}
            <div style={{ width: '100%', height: '100%' }}>
              <WebcamFeed onStatsUpdate={handleStats} />
            </div>
          </div>

          {/* Real-time chart */}
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)', padding: '12px 16px' }}>
            <h3 style={{ color: 'var(--text-tertiary)', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', margin: '0 0 8px', letterSpacing: '0.05em' }}>Signal Time Series</h3>
            <RealTimeChart data={chartData} earThreshold={earThresh} height={100} />
          </div>
        </div>

        {/* Right: Metrics Panel */}
        <div style={{ width: '42%', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0, overflowY: 'auto' }}>
          {/* Drowsiness Score + Head Pose */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Risk Score</span>
              <span style={{ fontSize: '36px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: drowsiness.score > 55 ? 'var(--danger)' : drowsiness.score > 35 ? 'var(--warning)' : 'var(--text-primary)' }}>{Math.round(drowsiness.score)}</span>
              <span style={{ fontSize: '11px', color: drowsiness.level === 'SEVERE' ? 'var(--danger)' : drowsiness.level === 'MODERATE' ? 'var(--warning)' : 'var(--success)', fontWeight: 500, marginTop: '4px' }}>{drowsiness.level}</span>
              <div style={{ width: '100%', height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', marginTop: '8px' }}>
                <div style={{ width: `${Math.min(drowsiness.score, 100)}%`, height: '100%', background: drowsiness.score > 55 ? 'var(--danger)' : drowsiness.score > 35 ? 'var(--warning)' : 'var(--success)', borderRadius: '2px', transition: 'width 0.2s' }} />
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Head Pose</span>
              <HeadPoseVisualizer pitch={headPose.pitch} yaw={headPose.yaw} roll={headPose.roll} gazeDirection={gazeInfo.direction} gazeX={gazeInfo.x} gazeY={gazeInfo.y} size={120} />
            </div>
          </div>

          {/* Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'EAR', value: ear.toFixed(3), pct: Math.min(ear / 0.4 * 100, 100), alert: ear < earThresh, color: 'var(--accent)' },
              { label: 'MAR', value: mar.toFixed(3), pct: Math.min(mar / 1.0 * 100, 100), alert: mar > marThresh, color: 'var(--warning)' },
              { label: 'PERCLOS', value: `${(blinkDetector.current.getPERCLOS() * 100).toFixed(1)}%`, pct: blinkDetector.current.getPERCLOS() * 100 / 0.5, alert: blinkDetector.current.getPERCLOS() > 0.15, color: 'var(--danger)' },
              { label: 'CABIN', value: phoneDetected ? 'PHONE' : talkingState.isOnCall ? 'CALL' : talkingState.isTalking ? 'TALK' : 'CLEAR', pct: 0, alert: phoneDetected || talkingState.isOnCall, color: 'var(--success)' },
            ].map((m, i) => (
              <div key={i} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px' }}>
                <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</span>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: m.alert ? 'var(--danger)' : 'var(--text-primary)', marginTop: '4px' }}>{m.value}</div>
                {m.pct > 0 && (
                  <div style={{ width: '100%', height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', marginTop: '8px' }}>
                    <div style={{ width: `${Math.min(m.pct, 100)}%`, height: '100%', background: m.alert ? 'var(--danger)' : m.color, borderRadius: '2px', transition: 'width 0.2s' }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Cognitive Load */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cognitive Load</span>
              <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: cognitiveLoad.level === 'HIGH' ? 'var(--danger)' : cognitiveLoad.level === 'MODERATE' ? 'var(--warning)' : 'var(--success)' }}>{cognitiveLoad.cognitiveLoad}%</span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { label: 'Talk', active: talkingState.isTalking },
                { label: 'Call', active: talkingState.isOnCall },
                { label: 'Fixated', active: cognitiveLoad.indicators.fixatedGaze },
              ].map(ind => (
                <span key={ind.label} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: ind.active ? 'rgba(245,158,11,0.1)' : 'var(--bg-tertiary)', color: ind.active ? 'var(--warning)' : 'var(--text-tertiary)', fontWeight: 500 }}>{ind.label}</span>
              ))}
            </div>
          </div>

          {/* Risk Factors */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px' }}>
            <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>Risk Factors</span>
            {drowsiness.factors.slice(0, 5).map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '11px', width: '80px', flexShrink: 0 }}>{f.name}</span>
                <div style={{ flex: 1, height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px' }}>
                  <div style={{ width: `${Math.min(f.value, 100)}%`, height: '100%', background: f.value > 60 ? 'var(--danger)' : f.value > 30 ? 'var(--warning)' : 'var(--success)', borderRadius: '2px', transition: 'width 0.3s' }} />
                </div>
                <span style={{ color: 'var(--text-primary)', fontSize: '11px', fontFamily: 'var(--font-mono)', width: '24px', textAlign: 'right' }}>{Math.round(f.value)}</span>
              </div>
            ))}
          </div>

          {/* XAI Panel */}
          <XAIPanel factors={drowsiness.factors} mlPrediction={mlPrediction} totalScore={drowsiness.score} />

          {/* A/B Comparison */}
          <ABComparisonPanel ear={ear} earThreshold={earThresh} fusionScore={drowsiness.score} fusionLevel={drowsiness.level} isTalking={talkingState.isTalking} mar={mar} marThreshold={marThresh} />

          {/* Event Log */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px', flex: 1, minHeight: '120px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event Log</span>
              <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 500 }}>LIVE</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {events.length === 0 ? (
                <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Monitoring active...</span>
              ) : (
                events.map((evt, idx) => (
                  <div key={idx} style={{ padding: '6px 10px', borderRadius: '4px', background: 'var(--bg-primary)', borderLeft: `2px solid ${evt.level === 3 ? 'var(--danger)' : evt.level === 2 ? 'var(--warning)' : 'var(--accent)'}` }}>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{evt.time}</span>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '2px 0 0' }}>{evt.msg}</p>
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
