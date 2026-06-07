import { useCallback, useRef } from 'react';

export function useAlertSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<number | null>(null);
  const isAlarmActive = useRef(false);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playBeep = useCallback((frequency: number, type: OscillatorType, duration: number, volume: number = 1.0) => {
    const ctx = getAudioCtx();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  }, [getAudioCtx]);

  const startContinuousAlarm = useCallback(() => {
    if (isAlarmActive.current) return;
    isAlarmActive.current = true;

    // Immediately play first burst
    playBeep(800, 'sawtooth', 0.3, 1.0);
    playBeep(1000, 'square', 0.2, 0.8);

    // Repeat every 1.5 seconds until stopped
    alarmIntervalRef.current = window.setInterval(() => {
      playBeep(800, 'sawtooth', 0.3, 1.0);
      setTimeout(() => playBeep(1000, 'square', 0.2, 0.8), 350);

      // TTS every 4th repetition
      if (Math.random() < 0.25) {
        const utterance = new SpeechSynthesisUtterance("Wake up! Pull over now!");
        utterance.rate = 1.3;
        utterance.pitch = 1.4;
        utterance.volume = 1.0;
        speechSynthesis.speak(utterance);
      }
    }, 1500);
  }, [playBeep]);

  const stopContinuousAlarm = useCallback(() => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    isAlarmActive.current = false;
    speechSynthesis.cancel();
  }, []);

  const triggerAlert = useCallback((level: number) => {
    switch (level) {
      case 0:
        stopContinuousAlarm();
        break;
      case 1:
        stopContinuousAlarm();
        playBeep(440, 'sine', 0.5, 0.5);
        break;
      case 2:
        stopContinuousAlarm();
        playBeep(600, 'square', 0.5, 0.8);
        setTimeout(() => playBeep(700, 'square', 0.3, 0.7), 600);
        if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
        break;
      case 3:
        // Critical: continuous repeating alarm to wake driver
        startContinuousAlarm();
        if ("vibrate" in navigator) navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);
        break;
      default:
        break;
    }
  }, [playBeep, startContinuousAlarm, stopContinuousAlarm]);

  return { triggerAlert, stopAlarm: stopContinuousAlarm };
}
