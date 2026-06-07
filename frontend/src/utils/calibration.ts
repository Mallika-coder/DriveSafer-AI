interface CalibrationData {
  baselineEAR: number;
  baselineMAR: number;
  earStdDev: number;
  marStdDev: number;
  earThreshold: number;
  marThreshold: number;
  calibratedAt: number;
  samplesCollected: number;
}

export class AdaptiveCalibrator {
  private earSamples: number[] = [];
  private marSamples: number[] = [];
  private isCalibrating = false;
  private calibrationDuration = 10000; // 10 seconds
  private startTime = 0;
  private onProgress?: (progress: number) => void;
  private onComplete?: (data: CalibrationData) => void;

  startCalibration(
    onProgress: (progress: number) => void,
    onComplete: (data: CalibrationData) => void
  ) {
    this.earSamples = [];
    this.marSamples = [];
    this.isCalibrating = true;
    this.startTime = Date.now();
    this.onProgress = onProgress;
    this.onComplete = onComplete;
  }

  addSample(ear: number, mar: number) {
    if (!this.isCalibrating) return;

    this.earSamples.push(ear);
    this.marSamples.push(mar);

    const elapsed = Date.now() - this.startTime;
    const progress = Math.min(1, elapsed / this.calibrationDuration);
    this.onProgress?.(progress);

    if (elapsed >= this.calibrationDuration) {
      this.finishCalibration();
    }
  }

  private finishCalibration() {
    this.isCalibrating = false;

    const baselineEAR = mean(this.earSamples);
    const baselineMAR = mean(this.marSamples);
    const earStdDev = stdDev(this.earSamples);
    const marStdDev = stdDev(this.marSamples);

    // Threshold = baseline - 1.5 standard deviations (personalized)
    const earThreshold = baselineEAR - 1.5 * earStdDev;
    const marThreshold = baselineMAR + 2.0 * marStdDev;

    const data: CalibrationData = {
      baselineEAR,
      baselineMAR,
      earStdDev,
      marStdDev,
      earThreshold: Math.max(0.15, earThreshold),
      marThreshold: Math.min(0.9, marThreshold),
      calibratedAt: Date.now(),
      samplesCollected: this.earSamples.length,
    };

    // Persist calibration
    localStorage.setItem('drivesafe_calibration', JSON.stringify(data));
    this.onComplete?.(data);
  }

  getCalibrating(): boolean {
    return this.isCalibrating;
  }

  static loadCalibration(): CalibrationData | null {
    const stored = localStorage.getItem('drivesafe_calibration');
    if (!stored) return null;
    const data = JSON.parse(stored) as CalibrationData;
    // Invalidate calibrations older than 24 hours
    if (Date.now() - data.calibratedAt > 86400000) return null;
    return data;
  }
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / arr.length);
}

export type { CalibrationData };
