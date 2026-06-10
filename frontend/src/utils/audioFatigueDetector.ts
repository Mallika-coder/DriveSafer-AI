/**
 * Audio Fatigue Detector — Multimodal Voice Analysis
 *
 * Uses Web Audio API microphone input to detect voice-based fatigue indicators:
 * - Slower speech rate (reduced syllables per second)
 * - Lower pitch variation (monotone = fatigue)
 * - Reduced voice energy
 * - Long pauses between words (slow response)
 *
 * Combined with visual signals for multimodal fusion.
 */

interface AudioFatigueMetrics {
  speechRate: number;
  voicePitch: number;
  voiceEnergy: number;
  isSpeaking: boolean;
  fatigueIndicators: {
    slurredSpeech: boolean;
    slowResponse: boolean;
    monotone: boolean;
  };
  audioFatigueScore: number;
  isActive: boolean;
}

export class AudioFatigueDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private isRunning = false;

  // Baseline learning
  private baselineSpeechRate = 4.0;
  private baselinePitch = 150;
  private baselinePitchVariance = 30;
  private baselineEnergy = 0.3;
  private baselineSamples = 0;
  private isBaselineSet = false;

  // Tracking
  private energyHistory: number[] = [];
  private pitchHistory: number[] = [];
  private speechOnsets: number[] = [];
  private lastSpeechEnd = 0;
  private pauseDurations: number[] = [];

  async start(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);

      this.isRunning = true;
      return true;
    } catch {
      return false;
    }
  }

  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
    this.isRunning = false;
  }

  getMetrics(): AudioFatigueMetrics {
    if (!this.isRunning || !this.analyser) {
      return this.getDefaultMetrics();
    }

    const bufferLength = this.analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);
    this.analyser.getFloatTimeDomainData(dataArray);

    // RMS Energy
    const energy = Math.sqrt(dataArray.reduce((sum, v) => sum + v * v, 0) / bufferLength);
    this.energyHistory.push(energy);
    if (this.energyHistory.length > 100) this.energyHistory.shift();

    // Voice Activity Detection
    const isSpeaking = energy > 0.02;

    // Track speech onsets for rate estimation
    const now = Date.now();
    if (isSpeaking && this.energyHistory.length > 2 && this.energyHistory[this.energyHistory.length - 2] < 0.02) {
      this.speechOnsets.push(now);
      if (this.speechOnsets.length > 50) this.speechOnsets.shift();

      // Track pause duration
      if (this.lastSpeechEnd > 0) {
        this.pauseDurations.push(now - this.lastSpeechEnd);
        if (this.pauseDurations.length > 30) this.pauseDurations.shift();
      }
    }
    if (!isSpeaking && this.energyHistory.length > 2 && this.energyHistory[this.energyHistory.length - 2] >= 0.02) {
      this.lastSpeechEnd = now;
    }

    // Pitch estimation via autocorrelation
    const pitch = isSpeaking ? this.estimatePitch(dataArray) : 0;
    if (pitch > 50 && pitch < 500) {
      this.pitchHistory.push(pitch);
      if (this.pitchHistory.length > 60) this.pitchHistory.shift();
    }

    // Speech rate (onsets per second over last 10 seconds)
    const recentOnsets = this.speechOnsets.filter(t => now - t < 10000);
    const speechRate = recentOnsets.length > 1
      ? recentOnsets.length / ((now - recentOnsets[0]) / 1000)
      : 0;

    // Baseline learning (first 30 seconds of speech)
    if (!this.isBaselineSet && isSpeaking) {
      this.baselineSamples++;
      if (this.baselineSamples > 100) {
        this.baselineSpeechRate = speechRate > 0 ? speechRate : 4.0;
        this.baselinePitch = this.pitchHistory.length > 10
          ? this.pitchHistory.reduce((a, b) => a + b, 0) / this.pitchHistory.length
          : 150;
        this.baselinePitchVariance = this.computeVariance(this.pitchHistory);
        this.baselineEnergy = energy;
        this.isBaselineSet = true;
      }
    }

    // Compute fatigue indicators
    const avgPause = this.pauseDurations.length > 3
      ? this.pauseDurations.reduce((a, b) => a + b, 0) / this.pauseDurations.length
      : 0;
    const currentPitchVariance = this.computeVariance(this.pitchHistory.slice(-20));

    const slurredSpeech = speechRate > 0 && speechRate < this.baselineSpeechRate * 0.6;
    const slowResponse = avgPause > 2000;
    const monotone = currentPitchVariance < this.baselinePitchVariance * 0.4;

    // Composite audio fatigue score
    let audioFatigueScore = 0;
    if (slurredSpeech) audioFatigueScore += 35;
    if (slowResponse) audioFatigueScore += 30;
    if (monotone) audioFatigueScore += 25;
    if (energy < this.baselineEnergy * 0.5 && isSpeaking) audioFatigueScore += 10;

    return {
      speechRate,
      voicePitch: this.pitchHistory.length > 0 ? this.pitchHistory[this.pitchHistory.length - 1] : 0,
      voiceEnergy: energy,
      isSpeaking,
      fatigueIndicators: { slurredSpeech, slowResponse, monotone },
      audioFatigueScore: Math.min(100, audioFatigueScore),
      isActive: this.isRunning,
    };
  }

  private estimatePitch(buffer: Float32Array): number {
    // Autocorrelation-based pitch detection
    const sampleRate = this.audioContext?.sampleRate || 44100;
    const minPeriod = Math.floor(sampleRate / 500); // 500 Hz max
    const maxPeriod = Math.floor(sampleRate / 50);  // 50 Hz min
    const bufLen = buffer.length;

    let bestCorrelation = 0;
    let bestPeriod = 0;

    for (let period = minPeriod; period < Math.min(maxPeriod, bufLen / 2); period++) {
      let correlation = 0;
      let norm1 = 0;
      let norm2 = 0;

      for (let i = 0; i < bufLen - period; i++) {
        correlation += buffer[i] * buffer[i + period];
        norm1 += buffer[i] * buffer[i];
        norm2 += buffer[i + period] * buffer[i + period];
      }

      const normFactor = Math.sqrt(norm1 * norm2);
      if (normFactor > 0) {
        correlation /= normFactor;
      }

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }

    if (bestCorrelation > 0.3 && bestPeriod > 0) {
      return sampleRate / bestPeriod;
    }
    return 0;
  }

  private computeVariance(arr: number[]): number {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / arr.length;
  }

  private getDefaultMetrics(): AudioFatigueMetrics {
    return {
      speechRate: 0,
      voicePitch: 0,
      voiceEnergy: 0,
      isSpeaking: false,
      fatigueIndicators: { slurredSpeech: false, slowResponse: false, monotone: false },
      audioFatigueScore: 0,
      isActive: false,
    };
  }

  isListening(): boolean {
    return this.isRunning;
  }
}
