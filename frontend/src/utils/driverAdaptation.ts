/**
 * Driver Adaptation Engine
 *
 * Handles biological variation across different drivers:
 * - Different baseline EAR (Asian eyes: ~0.20, Caucasian: ~0.28, etc.)
 * - Glasses/contact lens effects on landmark detection
 * - Natural head tilt bias
 * - Blink pattern variation (some people blink more/less)
 * - Mouth shape variation (small vs large mouth opening)
 *
 * Uses a 30-second onboarding calibration + continuous micro-adjustments.
 */

export interface DriverCharacteristics {
  eyeType: 'narrow' | 'average' | 'wide';
  baselineEAR: number;
  baselineMAR: number;
  earVariance: number;
  marVariance: number;
  naturalBlinkRate: number;
  naturalHeadTilt: number;
  wearsGlasses: boolean;
  adaptedEarThreshold: number;
  adaptedMarThreshold: number;
  confidenceMultiplier: number;
  calibrationQuality: number;
  samplesCollected: number;
}

export class DriverAdaptationEngine {
  private earSamples: number[] = [];
  private marSamples: number[] = [];
  private blinkIntervals: number[] = [];
  private headRollSamples: number[] = [];
  private lastBlinkTime = 0;
  private isOnboarding = false;
  private onboardingStart = 0;
  private characteristics: DriverCharacteristics | null = null;
  private continuousEarBuffer: number[] = [];
  private driftDetectionWindow: number[] = [];

  constructor() {
    const saved = localStorage.getItem('drivesafe_driver_characteristics');
    if (saved) {
      this.characteristics = JSON.parse(saved);
    }
  }

  startOnboarding(): void {
    this.isOnboarding = true;
    this.onboardingStart = Date.now();
    this.earSamples = [];
    this.marSamples = [];
    this.blinkIntervals = [];
    this.headRollSamples = [];
  }

  feedSample(ear: number, mar: number, headRoll: number): number {
    if (!this.isOnboarding) {
      this.continuousMicroAdjust(ear);
      return this.getProgress();
    }

    this.earSamples.push(ear);
    this.marSamples.push(mar);
    this.headRollSamples.push(headRoll);

    // Detect blinks during calibration
    if (ear < 0.18 && this.lastBlinkTime > 0) {
      this.blinkIntervals.push(Date.now() - this.lastBlinkTime);
    }
    if (ear < 0.18) {
      this.lastBlinkTime = Date.now();
    }

    const elapsed = Date.now() - this.onboardingStart;
    if (elapsed >= 15000 && this.earSamples.length >= 200) {
      this.finishOnboarding();
    }

    return elapsed / 15000;
  }

  private finishOnboarding(): void {
    this.isOnboarding = false;

    const earMean = mean(this.earSamples);
    const earStd = stdDev(this.earSamples);
    const marMean = mean(this.marSamples);
    const marStd = stdDev(this.marSamples);
    const headTilt = mean(this.headRollSamples);

    // Classify eye type
    let eyeType: DriverCharacteristics['eyeType'] = 'average';
    if (earMean < 0.22) eyeType = 'narrow';
    else if (earMean > 0.30) eyeType = 'wide';

    // Adapt thresholds based on individual
    // For narrow eyes: threshold must be lower to avoid constant false alerts
    // For wide eyes: threshold can be higher for earlier detection
    const earThreshold = earMean - 2.0 * earStd;
    const marThreshold = marMean + 2.5 * marStd;

    // Detect glasses (higher EAR variance due to refraction)
    const wearsGlasses = earStd > 0.04;

    // Confidence multiplier (better calibration = more trust in the model)
    const calibrationQuality = Math.min(1, this.earSamples.length / 300) *
      (1 - Math.min(1, earStd / 0.06));

    const blinkRate = this.blinkIntervals.length > 2
      ? 60000 / mean(this.blinkIntervals)
      : 15;

    this.characteristics = {
      eyeType,
      baselineEAR: earMean,
      baselineMAR: marMean,
      earVariance: earStd,
      marVariance: marStd,
      naturalBlinkRate: blinkRate,
      naturalHeadTilt: headTilt,
      wearsGlasses,
      adaptedEarThreshold: Math.max(0.12, earThreshold),
      adaptedMarThreshold: Math.min(0.95, marThreshold),
      confidenceMultiplier: 0.7 + calibrationQuality * 0.3,
      calibrationQuality,
      samplesCollected: this.earSamples.length,
    };

    localStorage.setItem('drivesafe_driver_characteristics', JSON.stringify(this.characteristics));
  }

  /**
   * Continuous micro-adjustment: slowly adapts thresholds if driver's baseline
   * drifts (e.g., getting tired over time, or lighting changes)
   */
  private continuousMicroAdjust(ear: number): void {
    if (!this.characteristics) return;

    this.continuousEarBuffer.push(ear);
    if (this.continuousEarBuffer.length > 300) this.continuousEarBuffer.shift();

    // Every 300 frames, check for drift
    if (this.continuousEarBuffer.length === 300) {
      const currentMean = mean(this.continuousEarBuffer);
      const drift = currentMean - this.characteristics.baselineEAR;

      // If drift is significant but not extreme (extreme = actually drowsy)
      if (Math.abs(drift) > 0.02 && Math.abs(drift) < 0.08) {
        this.driftDetectionWindow.push(drift);
        if (this.driftDetectionWindow.length > 5) this.driftDetectionWindow.shift();

        // Only adjust if drift is consistent
        const avgDrift = mean(this.driftDetectionWindow);
        if (Math.abs(avgDrift) > 0.02) {
          this.characteristics.adaptedEarThreshold += avgDrift * 0.1;
          this.characteristics.adaptedEarThreshold = Math.max(0.12, Math.min(0.30, this.characteristics.adaptedEarThreshold));
        }
      }
      this.continuousEarBuffer = [];
    }
  }

  getCharacteristics(): DriverCharacteristics | null {
    return this.characteristics;
  }

  isCalibrated(): boolean {
    return this.characteristics !== null;
  }

  isOnboardingActive(): boolean {
    return this.isOnboarding;
  }

  getProgress(): number {
    if (!this.isOnboarding) return 1;
    return Math.min(1, (Date.now() - this.onboardingStart) / 15000);
  }

  getAdaptedThresholds(): { ear: number; mar: number } {
    if (!this.characteristics) return { ear: 0.22, mar: 0.65 };
    return {
      ear: this.characteristics.adaptedEarThreshold,
      mar: this.characteristics.adaptedMarThreshold,
    };
  }

  reset(): void {
    this.characteristics = null;
    localStorage.removeItem('drivesafe_driver_characteristics');
  }
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / arr.length);
}
