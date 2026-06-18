interface DrowsinessInput {
  ear: number;
  mar: number;
  headPitch: number;
  headYaw: number;
  blinkRate: number;
  blinkDuration: number;
  perclos: number;
  gazeStability: number;
}

interface DrowsinessOutput {
  score: number;
  level: 'ALERT' | 'MILD' | 'MODERATE' | 'SEVERE';
  confidence: number;
  factors: { name: string; contribution: number; value: number }[];
}

const WEIGHTS = {
  perclos: 0.30,
  ear: 0.20,
  blinkDuration: 0.15,
  mar: 0.10,
  headPitch: 0.10,
  blinkRate: 0.08,
  gazeStability: 0.07,
};

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function computeDrowsinessScore(input: DrowsinessInput): DrowsinessOutput {
  // PERCLOS: percentage of eye closure over time (most researched metric)
  const perclosScore = sigmoid((input.perclos - 0.15) * 20) * 100;

  // EAR: lower values = more closed eyes
  const earScore = sigmoid((0.25 - input.ear) * 30) * 100;

  // Blink duration: longer blinks = drowsier
  const blinkDurationScore = sigmoid((input.blinkDuration - 200) / 100) * 100;

  // MAR: yawning indicator
  const marScore = input.mar > 0.6 ? Math.min((input.mar - 0.6) * 250, 100) : 0;

  // Head pitch: only counts as drowsiness if severely nodding (>20°), not normal movement
  const headPitchScore = Math.abs(input.headPitch) > 20 ? Math.min((Math.abs(input.headPitch) - 20) * 4, 100) : 0;

  // Blink rate: both too high and too low are indicators
  const normalBlinkRate = 15;
  const blinkDeviation = Math.abs(input.blinkRate - normalBlinkRate);
  const blinkRateScore = blinkDeviation > 5 ? Math.min(blinkDeviation * 8, 100) : 0;

  // Gaze stability: erratic gaze = fatigue
  const gazeScore = (1 - input.gazeStability) * 100;

  const factors = [
    { name: 'PERCLOS', contribution: WEIGHTS.perclos, value: perclosScore },
    { name: 'Eye Closure', contribution: WEIGHTS.ear, value: earScore },
    { name: 'Blink Duration', contribution: WEIGHTS.blinkDuration, value: blinkDurationScore },
    { name: 'Yawning', contribution: WEIGHTS.mar, value: marScore },
    { name: 'Head Nodding', contribution: WEIGHTS.headPitch, value: headPitchScore },
    { name: 'Blink Rate', contribution: WEIGHTS.blinkRate, value: blinkRateScore },
    { name: 'Gaze Stability', contribution: WEIGHTS.gazeStability, value: gazeScore },
  ];

  const weightedScore =
    WEIGHTS.perclos * perclosScore +
    WEIGHTS.ear * earScore +
    WEIGHTS.blinkDuration * blinkDurationScore +
    WEIGHTS.mar * marScore +
    WEIGHTS.headPitch * headPitchScore +
    WEIGHTS.blinkRate * blinkRateScore +
    WEIGHTS.gazeStability * gazeScore;

  const score = Math.min(100, Math.max(0, weightedScore));

  // Confidence based on face detection quality and signal consistency
  const signalVariance = factors.map(f => f.value).reduce((sum, v) => sum + Math.pow(v - score, 2), 0) / factors.length;
  const confidence = Math.max(0.4, 1 - signalVariance / 5000);

  let level: DrowsinessOutput['level'] = 'ALERT';
  if (score > 70) level = 'SEVERE';
  else if (score > 45) level = 'MODERATE';
  else if (score > 20) level = 'MILD';

  return { score, level, confidence, factors };
}

export class BlinkDetector {
  private earHistory: number[] = [];
  private blinkTimestamps: number[] = [];
  private blinkDurations: number[] = [];
  private isBlinking = false;
  private blinkStartTime = 0;
  private closedFrames = 0;
  private totalFrames = 0;
  private earThreshold = 0.22;

  update(ear: number, timestamp: number) {
    this.earHistory.push(ear);
    this.totalFrames++;

    if (this.earHistory.length > 300) this.earHistory.shift();

    const isClosed = ear < this.earThreshold;

    if (isClosed) {
      this.closedFrames++;
      if (!this.isBlinking) {
        this.isBlinking = true;
        this.blinkStartTime = timestamp;
      }
    } else {
      if (this.isBlinking) {
        const duration = timestamp - this.blinkStartTime;
        if (duration > 50 && duration < 800) {
          this.blinkTimestamps.push(timestamp);
          this.blinkDurations.push(duration);
          if (this.blinkDurations.length > 30) this.blinkDurations.shift();
        }
        this.isBlinking = false;
      }
    }

    // Clean old timestamps (keep last 60 seconds)
    const cutoff = timestamp - 60000;
    this.blinkTimestamps = this.blinkTimestamps.filter(t => t > cutoff);
  }

  getBlinkRate(): number {
    if (this.blinkTimestamps.length < 2) return 15;
    const timeWindow = (this.blinkTimestamps[this.blinkTimestamps.length - 1] - this.blinkTimestamps[0]) / 1000;
    return timeWindow > 0 ? (this.blinkTimestamps.length / timeWindow) * 60 : 15;
  }

  getAvgBlinkDuration(): number {
    if (this.blinkDurations.length === 0) return 150;
    return this.blinkDurations.reduce((a, b) => a + b, 0) / this.blinkDurations.length;
  }

  getPERCLOS(): number {
    if (this.totalFrames < 30) return 0;
    const recentFrames = this.earHistory.slice(-150);
    const closedCount = recentFrames.filter(e => e < this.earThreshold).length;
    return closedCount / recentFrames.length;
  }

  setThreshold(threshold: number) {
    this.earThreshold = threshold;
  }
}

export class GazeStabilityTracker {
  private gazeHistory: { x: number; y: number; t: number }[] = [];

  update(gazeX: number, gazeY: number, timestamp: number) {
    this.gazeHistory.push({ x: gazeX, y: gazeY, t: timestamp });
    // Keep last 3 seconds
    const cutoff = timestamp - 3000;
    this.gazeHistory = this.gazeHistory.filter(g => g.t > cutoff);
  }

  getStability(): number {
    if (this.gazeHistory.length < 10) return 1;
    const xValues = this.gazeHistory.map(g => g.x);
    const yValues = this.gazeHistory.map(g => g.y);
    const xVariance = variance(xValues);
    const yVariance = variance(yValues);
    const totalVariance = xVariance + yVariance;
    return Math.max(0, 1 - totalVariance * 50);
  }
}

function variance(arr: number[]): number {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / arr.length;
}
