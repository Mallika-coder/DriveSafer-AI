import { useCallback, useRef } from 'react';

/**
 * Clean alert sound system with proper queuing and non-overlapping audio.
 *
 * Rules:
 * - Only ONE sound plays at a time (no stacking)
 * - Higher priority alert cancels lower one
 * - Minimum 3-second gap between any two alerts
 * - TTS only on level 3, and only once per alert cycle
 * - Smooth fade-in/out (no harsh clicks)
 */
export function useAlertSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const currentOscillator = useRef<OscillatorNode | null>(null);
  const currentGain = useRef<GainNode | null>(null);
  const alarmIntervalRef = useRef<number | null>(null);
  const isAlarmActive = useRef(false);
  const lastAlertTime = useRef(0);
  const lastAlertLevel = useRef(0);
  const ttsSpoken = useRef(false);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const stopCurrentSound = useCallback(() => {
    if (currentOscillator.current) {
      try {
        currentOscillator.current.stop();
      } catch (_) { /* already stopped */ }
      currentOscillator.current = null;
    }
    if (currentGain.current) {
      currentGain.current.disconnect();
      currentGain.current = null;
    }
  }, []);

  const playTone = useCallback((frequency: number, type: OscillatorType, duration: number, volume: number) => {
    stopCurrentSound();
    const ctx = getAudioCtx();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Smooth fade in (avoids click)
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
    // Smooth fade out
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + duration - 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);

    currentOscillator.current = oscillator;
    currentGain.current = gainNode;

    oscillator.onended = () => {
      currentOscillator.current = null;
      currentGain.current = null;
    };
  }, [getAudioCtx, stopCurrentSound]);

  const stopContinuousAlarm = useCallback(() => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    isAlarmActive.current = false;
    ttsSpoken.current = false;
    stopCurrentSound();
    speechSynthesis.cancel();
  }, [stopCurrentSound]);

  const startContinuousAlarm = useCallback(() => {
    if (isAlarmActive.current) return;
    isAlarmActive.current = true;
    ttsSpoken.current = false;

    // Single clean tone first
    playTone(600, 'sine', 0.8, 0.6);

    // Then repeat a gentle but firm alert every 3 seconds
    alarmIntervalRef.current = window.setInterval(() => {
      playTone(500, 'sine', 0.6, 0.5);

      // TTS only once, not repeated
      if (!ttsSpoken.current) {
        ttsSpoken.current = true;
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance("Please wake up. Pull over safely.");
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 0.8;
          speechSynthesis.speak(utterance);
        }, 800);
      }
    }, 3000);
  }, [playTone]);

  const triggerAlert = useCallback((level: number) => {
    const now = Date.now();

    // Don't re-trigger same or lower level within 8 seconds
    if (level <= lastAlertLevel.current && now - lastAlertTime.current < 8000) {
      return;
    }

    // Minimum 3 second gap between ANY alerts (prevents noise)
    if (level < 3 && now - lastAlertTime.current < 3000) {
      return;
    }

    lastAlertTime.current = now;
    lastAlertLevel.current = level;

    switch (level) {
      case 0:
        stopContinuousAlarm();
        break;
      case 1:
        // Gentle alert — audible but not alarming
        stopContinuousAlarm();
        playTone(480, 'sine', 0.5, 0.4);
        break;
      case 2:
        // Moderate — clear warning tone
        stopContinuousAlarm();
        playTone(580, 'sine', 0.7, 0.55);
        if ("vibrate" in navigator) navigator.vibrate(200);
        break;
      case 3:
        // Critical — continuous but CLEAN (not chaotic)
        startContinuousAlarm();
        if ("vibrate" in navigator) navigator.vibrate([300, 200, 300]);
        break;
      default:
        break;
    }
  }, [playTone, startContinuousAlarm, stopContinuousAlarm]);

  return { triggerAlert, stopAlarm: stopContinuousAlarm };
}
