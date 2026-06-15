import { useCallback, useRef, useEffect } from 'react';

/**
 * Alert sound system using both Web Audio API AND HTML5 Audio fallback.
 * Browsers block AudioContext until user interaction — so we also use
 * a pre-created Audio element as backup that works more reliably.
 */
export function useAlertSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<number | null>(null);
  const isAlarmActive = useRef(false);
  const lastAlertTime = useRef(0);
  const lastAlertLevel = useRef(0);
  const ttsSpoken = useRef(false);
  const audioUnlocked = useRef(false);

  // Unlock audio on ANY user interaction
  useEffect(() => {
    const unlock = () => {
      if (audioUnlocked.current) return;
      audioUnlocked.current = true;
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;
        if (ctx.state === 'suspended') ctx.resume();
        // Play silent buffer to fully unlock
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      } catch (_) {}
    };

    document.addEventListener('click', unlock, { once: false });
    document.addEventListener('touchstart', unlock, { once: false });
    document.addEventListener('keydown', unlock, { once: false });

    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('keydown', unlock);
    };
  }, []);

  const getAudioCtx = useCallback((): AudioContext | null => {
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (_) {
        return null;
      }
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, volume: number) => {
    const ctx = getAudioCtx();
    if (!ctx) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.03);
      gainNode.gain.setValueAtTime(volume, ctx.currentTime + duration - 0.05);
      gainNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (_) {}
  }, [getAudioCtx]);

  const playBeepPattern = useCallback((freqs: number[], durations: number[], volume: number) => {
    let offset = 0;
    freqs.forEach((freq, i) => {
      setTimeout(() => playTone(freq, durations[i], volume), offset * 1000);
      offset += durations[i] + 0.1;
    });
  }, [playTone]);

  const stopContinuousAlarm = useCallback(() => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    isAlarmActive.current = false;
    ttsSpoken.current = false;
    try { speechSynthesis.cancel(); } catch (_) {}
  }, []);

  const startContinuousAlarm = useCallback(() => {
    if (isAlarmActive.current) return;
    isAlarmActive.current = true;
    ttsSpoken.current = false;

    // Immediate loud alert
    playBeepPattern([700, 900, 700], [0.3, 0.3, 0.3], 0.8);

    // Repeat every 2.5 seconds
    alarmIntervalRef.current = window.setInterval(() => {
      playBeepPattern([600, 800], [0.4, 0.4], 0.7);

      // TTS once
      if (!ttsSpoken.current) {
        ttsSpoken.current = true;
        setTimeout(() => {
          try {
            const utterance = new SpeechSynthesisUtterance("Warning! Drowsiness detected. Please pull over safely.");
            utterance.rate = 1.1;
            utterance.volume = 1.0;
            speechSynthesis.speak(utterance);
          } catch (_) {}
        }, 900);
      }
    }, 2500);
  }, [playBeepPattern]);

  const triggerAlert = useCallback((level: number) => {
    const now = Date.now();

    // Don't re-trigger same or lower level within 4 seconds
    if (level <= lastAlertLevel.current && now - lastAlertTime.current < 4000) {
      return;
    }

    // Minimum 2 second gap between any alerts
    if (level < 3 && now - lastAlertTime.current < 2000) {
      return;
    }

    lastAlertTime.current = now;
    lastAlertLevel.current = level;

    switch (level) {
      case 0:
        stopContinuousAlarm();
        break;
      case 1:
        // Single clear beep
        stopContinuousAlarm();
        playTone(520, 0.6, 0.5);
        break;
      case 2:
        // Double beep — unmistakable warning
        stopContinuousAlarm();
        playBeepPattern([600, 750], [0.4, 0.4], 0.65);
        if ("vibrate" in navigator) navigator.vibrate(300);
        break;
      case 3:
        // Continuous alarm — urgent
        startContinuousAlarm();
        if ("vibrate" in navigator) navigator.vibrate([400, 200, 400, 200, 400]);
        break;
      default:
        break;
    }
  }, [playTone, playBeepPattern, startContinuousAlarm, stopContinuousAlarm]);

  return { triggerAlert, stopAlarm: stopContinuousAlarm };
}
