/**
 * Predictive Fatigue Model
 *
 * Estimates WHEN the driver will become drowsy based on:
 * 1. Linear trend of recent scores (last 5 minutes)
 * 2. Circadian rhythm model (drowsiness peaks at 2-4am and 1-3pm)
 * 3. Session duration fatigue curve (exponential after 45 minutes)
 *
 * Enables proactive alerts: "You'll likely feel drowsy in 15 minutes"
 */

interface FatiguePrediction {
  minutesToFatigue: number | null;
  confidence: number;
  riskTrajectory: number[];
  factors: string[];
  currentRiskRate: number;
}

interface ScoreEntry {
  score: number;
  timestamp: number;
  timeOfDay: number;
}

export class PredictiveFatigueModel {
  private history: ScoreEntry[] = [];
  private sessionStart = Date.now();
  private circadianProfile: number[] = [];

  constructor() {
    this.sessionStart = Date.now();
    this.loadCircadianProfile();
  }

  update(currentScore: number, timestamp: number, timeOfDay: number): void {
    this.history.push({ score: currentScore, timestamp, timeOfDay });

    // Keep last 10 minutes of data
    const cutoff = timestamp - 600000;
    this.history = this.history.filter(h => h.timestamp > cutoff);
  }

  predict(): FatiguePrediction {
    if (this.history.length < 10) {
      return { minutesToFatigue: null, confidence: 0, riskTrajectory: [], factors: ['Collecting data...'], currentRiskRate: 0 };
    }

    const factors: string[] = [];
    const now = Date.now();
    const sessionMinutes = (now - this.sessionStart) / 60000;
    const currentHour = new Date().getHours();

    // 1. Linear trend from recent scores
    const recentScores = this.history.slice(-60);
    const trend = this.computeLinearTrend(recentScores);

    if (trend.slope > 0.5) factors.push('Rising drowsiness trend');
    if (trend.slope > 1.0) factors.push('Rapidly increasing fatigue');

    // 2. Circadian rhythm contribution
    const circadianRisk = this.getCircadianRisk(currentHour);
    if (circadianRisk > 0.6) factors.push(`High-risk time of day (${currentHour}:00)`);

    // 3. Session duration fatigue
    const durationRisk = this.getDurationRisk(sessionMinutes);
    if (durationRisk > 0.5) factors.push(`Extended session (${Math.round(sessionMinutes)} min)`);

    // Combine for prediction
    const currentScore = this.history[this.history.length - 1].score;
    const baseRate = trend.slope;
    const circadianBoost = circadianRisk * 0.3;
    const durationBoost = durationRisk * 0.4;
    const effectiveRate = baseRate + circadianBoost + durationBoost;

    // Estimate minutes to score > 50 (fatigue threshold)
    let minutesToFatigue: number | null = null;
    if (currentScore < 50 && effectiveRate > 0) {
      minutesToFatigue = Math.round((50 - currentScore) / effectiveRate);
      if (minutesToFatigue > 120) minutesToFatigue = null;
    } else if (currentScore >= 50) {
      minutesToFatigue = 0;
      factors.push('Already in fatigue zone');
    }

    // Generate 10-minute risk trajectory
    const riskTrajectory: number[] = [];
    for (let m = 1; m <= 10; m++) {
      const futureHour = (currentHour + m / 60) % 24;
      const futureDuration = sessionMinutes + m;
      const predicted = currentScore +
        effectiveRate * m +
        this.getCircadianRisk(futureHour) * 5 +
        this.getDurationRisk(futureDuration) * 3;
      riskTrajectory.push(Math.min(100, Math.max(0, predicted)));
    }

    // Confidence based on data availability and trend consistency
    const trendConsistency = 1 - Math.min(1, trend.residual / 20);
    const dataConfidence = Math.min(1, this.history.length / 60);
    const confidence = trendConsistency * 0.6 + dataConfidence * 0.4;

    if (factors.length === 0) factors.push('Low risk — maintain current habits');

    return {
      minutesToFatigue,
      confidence,
      riskTrajectory,
      factors,
      currentRiskRate: effectiveRate,
    };
  }

  private computeLinearTrend(data: ScoreEntry[]): { slope: number; intercept: number; residual: number } {
    if (data.length < 5) return { slope: 0, intercept: 0, residual: 0 };

    const n = data.length;
    const startTime = data[0].timestamp;
    const xs = data.map(d => (d.timestamp - startTime) / 60000); // minutes
    const ys = data.map(d => d.score);

    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
    const sumX2 = xs.reduce((s, x) => s + x * x, 0);

    const denom = n * sumX2 - sumX * sumX;
    if (Math.abs(denom) < 0.001) return { slope: 0, intercept: sumY / n, residual: 0 };

    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;

    // Residual (how well the line fits)
    const residual = Math.sqrt(
      ys.reduce((sum, y, i) => sum + Math.pow(y - (slope * xs[i] + intercept), 2), 0) / n
    );

    return { slope, intercept, residual };
  }

  private getCircadianRisk(hour: number): number {
    // Circadian drowsiness model: peaks at 2-4am and 1-3pm
    const nightDip = Math.exp(-Math.pow((hour - 3) % 24, 2) / 4);
    const afternoonDip = Math.exp(-Math.pow((hour - 14) % 24, 2) / 6);
    return Math.min(1, nightDip + afternoonDip * 0.6);
  }

  private getDurationRisk(minutes: number): number {
    // Exponential fatigue curve — rises sharply after 45 minutes
    if (minutes < 20) return 0;
    return Math.min(1, Math.pow((minutes - 20) / 90, 1.8));
  }

  private loadCircadianProfile(): void {
    const stored = localStorage.getItem('drivesafe_circadian');
    if (stored) {
      this.circadianProfile = JSON.parse(stored);
    } else {
      // Default circadian profile (24 hours)
      this.circadianProfile = Array.from({length: 24}, (_, h) => this.getCircadianRisk(h));
    }
  }

  getSessionDuration(): number {
    return (Date.now() - this.sessionStart) / 60000;
  }

  reset(): void {
    this.history = [];
    this.sessionStart = Date.now();
  }
}
