import { useCallback, useRef } from 'react';

export function useAlertSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBeep = useCallback((frequency: number, type: OscillatorType, duration: number, volume: number = 1.0) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const oscillator = audioCtxRef.current.createOscillator();
    const gainNode = audioCtxRef.current.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtxRef.current.currentTime);
    
    gainNode.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtxRef.current.destination);

    oscillator.start();
    oscillator.stop(audioCtxRef.current.currentTime + duration);
  }, []);

  const triggerAlert = useCallback((level: number) => {
    switch (level) {
      case 1:
        playBeep(440, 'sine', 0.5, 0.5); // Soft Beep
        break;
      case 2:
        playBeep(600, 'square', 0.5, 0.8); // Louder Beep
        // Add vibration if supported
        if ("vibrate" in navigator) navigator.vibrate(200);
        break;
      case 3:
        playBeep(800, 'sawtooth', 1.0, 1.0); // Loud Alarm
        if ("vibrate" in navigator) navigator.vibrate([300, 100, 300, 100, 300]);
        // TTS
        const utterance = new SpeechSynthesisUtterance("Wake up! Pull over safely.");
        utterance.rate = 1.2;
        utterance.pitch = 1.2;
        speechSynthesis.speak(utterance);
        break;
      default:
        break;
    }
  }, [playBeep]);

  return { triggerAlert };
}
