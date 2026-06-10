/**
 * Driving Anomaly Detector — Unsupervised Pattern Detection
 *
 * Uses Welford's online algorithm for numerically stable running statistics,
 * then detects anomalies via multivariate Z-score analysis.
 *
 * Detects unusual patterns like:
 * - Sudden blink rate drop (microsleep onset)
 * - Unusual head position (falling asleep)
 * - Combined multi-signal deviation (compound anomaly)
 */

interface DrivingFeatures {
  ear: number;
  mar: number;
  headYaw: number;
  headPitch: number;
  blinkRate: number;
  gazeStability: number;
  sessionMinute: number;
}

interface FeatureDeviation {
  feature: string;
  zScore: number;
  direction: 'high' | 'low';
}

interface AnomalyResult {
  isAnomaly: boolean;
  anomalyScore: number;
  deviations: FeatureDeviation[];
  explanation: string;
}

interface BaselineStats {
  means: Record<string, number>;
  stds: Record<string, number>;
  observationCount: number;
  isCalibrated: boolean;
}

// Welford's online algorithm for stable running mean and variance
class WelfordAccumulator {
  private count = 0;
  private mean = 0;
  private m2 = 0;

  update(value: number): void {
    this.count++;
    const delta = value - this.mean;
    this.mean += delta / this.count;
    const delta2 = value - this.mean;
    this.m2 += delta * delta2;
  }

  getMean(): number {
    return this.mean;
  }

  getVariance(): number {
    if (this.count < 2) return 0;
    return this.m2 / (this.count - 1);
  }

  getStd(): number {
    return Math.sqrt(this.getVariance());
  }

  getCount(): number {
    return this.count;
  }
}

const FEATURE_NAMES: (keyof DrivingFeatures)[] = ['ear', 'mar', 'headYaw', 'headPitch', 'blinkRate', 'gazeStability'];
const ANOMALY_THRESHOLD = 2.5;
const COMBINED_THRESHOLD = 4.0;
const CALIBRATION_SAMPLES = 100;

export class DrivingAnomalyDetector {
  private accumulators: Map<string, WelfordAccumulator> = new Map();
  private isCalibrated = false;
  private recentAnomalies: { timestamp: number; score: number }[] = [];

  constructor() {
    for (const name of FEATURE_NAMES) {
      this.accumulators.set(name, new WelfordAccumulator());
    }
  }

  addObservation(features: DrivingFeatures): void {
    for (const name of FEATURE_NAMES) {
      const acc = this.accumulators.get(name)!;
      acc.update(features[name] as number);
    }

    if (!this.isCalibrated && this.accumulators.get('ear')!.getCount() >= CALIBRATION_SAMPLES) {
      this.isCalibrated = true;
    }
  }

  detect(features: DrivingFeatures): AnomalyResult {
    if (!this.isCalibrated) {
      this.addObservation(features);
      return { isAnomaly: false, anomalyScore: 0, deviations: [], explanation: 'Calibrating baseline...' };
    }

    // Also update running stats (but detect against current baseline)
    this.addObservation(features);

    const deviations: FeatureDeviation[] = [];
    let combinedZSquared = 0;

    for (const name of FEATURE_NAMES) {
      const acc = this.accumulators.get(name)!;
      const mean = acc.getMean();
      const std = acc.getStd();

      if (std < 0.0001) continue;

      const value = features[name] as number;
      const zScore = (value - mean) / std;
      combinedZSquared += zScore * zScore;

      if (Math.abs(zScore) > ANOMALY_THRESHOLD) {
        deviations.push({
          feature: this.getFeatureLabel(name),
          zScore: Math.round(zScore * 10) / 10,
          direction: zScore > 0 ? 'high' : 'low',
        });
      }
    }

    // Mahalanobis-like combined distance
    const combinedDistance = Math.sqrt(combinedZSquared / FEATURE_NAMES.length);
    const anomalyScore = Math.min(100, (combinedDistance / COMBINED_THRESHOLD) * 100);
    const isAnomaly = deviations.length > 0 || combinedDistance > COMBINED_THRESHOLD;

    // Track anomaly history
    if (isAnomaly) {
      this.recentAnomalies.push({ timestamp: Date.now(), score: anomalyScore });
      if (this.recentAnomalies.length > 50) this.recentAnomalies.shift();
    }

    const explanation = this.generateExplanation(deviations, combinedDistance);

    return { isAnomaly, anomalyScore, deviations, explanation };
  }

  getBaseline(): BaselineStats {
    const means: Record<string, number> = {};
    const stds: Record<string, number> = {};

    for (const name of FEATURE_NAMES) {
      const acc = this.accumulators.get(name)!;
      means[name] = Math.round(acc.getMean() * 1000) / 1000;
      stds[name] = Math.round(acc.getStd() * 1000) / 1000;
    }

    return {
      means,
      stds,
      observationCount: this.accumulators.get('ear')!.getCount(),
      isCalibrated: this.isCalibrated,
    };
  }

  getAnomalyRate(): number {
    const recentWindow = Date.now() - 60000;
    const recentCount = this.recentAnomalies.filter(a => a.timestamp > recentWindow).length;
    return recentCount;
  }

  private generateExplanation(deviations: FeatureDeviation[], distance: number): string {
    if (deviations.length === 0 && distance <= COMBINED_THRESHOLD) {
      return 'Normal driving pattern';
    }

    if (deviations.length === 0) {
      return `Mild compound deviation detected (${distance.toFixed(1)}σ combined)`;
    }

    const parts = deviations.map(d =>
      `${d.feature} ${Math.abs(d.zScore).toFixed(1)}σ ${d.direction === 'high' ? 'above' : 'below'} normal`
    );

    const prefix = deviations.length > 2
      ? 'Multiple anomalies: '
      : 'Unusual pattern: ';

    return prefix + parts.join(', ');
  }

  private getFeatureLabel(name: string): string {
    const labels: Record<string, string> = {
      ear: 'Eye openness',
      mar: 'Mouth activity',
      headYaw: 'Head rotation',
      headPitch: 'Head tilt',
      blinkRate: 'Blink rate',
      gazeStability: 'Gaze stability',
    };
    return labels[name] || name;
  }

  reset(): void {
    this.accumulators.clear();
    for (const name of FEATURE_NAMES) {
      this.accumulators.set(name, new WelfordAccumulator());
    }
    this.isCalibrated = false;
    this.recentAnomalies = [];
  }
}
