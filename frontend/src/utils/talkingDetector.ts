/**
 * Distinguishes talking from yawning using temporal MAR patterns.
 *
 * Key differences:
 * - Yawning: slow open (1-2s), holds wide (2-4s), slow close. High MAR sustained.
 * - Talking: rapid small oscillations, low amplitude, high frequency open/close.
 *
 * Also detects hands-free calls (earphones/buds) by combining:
 * - Sustained talking pattern without phone visible
 * - Head tilt bias (common during calls)
 * - Lip movement frequency analysis
 */

interface MARSample {
  value: number;
  timestamp: number;
}

interface TalkingState {
  isTalking: boolean;
  isYawning: boolean;
  isOnCall: boolean;
  talkingDuration: number;
  confidence: number;
  marFrequency: number;
  marAmplitude: number;
}

export class TalkingDetector {
  private marHistory: MARSample[] = [];
  private talkingStartTime: number | null = null;
  private totalTalkingTime = 0;
  private callStartTime: number | null = null;
  private headTiltHistory: number[] = [];
  private userBaselineMAR = 0.35;
  private baselineSamples: number[] = [];
  private isBaselineSet = false;

  // Adaptive thresholds
  private talkingThresholdMultiplier = 1.3;
  private yawnThresholdMultiplier = 2.2;

  update(mar: number, headRoll: number, headYaw: number, phoneDetected: boolean, timestamp: number): TalkingState {
    this.marHistory.push({ value: mar, timestamp });

    // Keep last 5 seconds of history
    const cutoff = timestamp - 5000;
    this.marHistory = this.marHistory.filter(s => s.timestamp > cutoff);

    // Track head tilt for call detection
    this.headTiltHistory.push(Math.abs(headRoll));
    if (this.headTiltHistory.length > 90) this.headTiltHistory.shift();

    // Learn baseline MAR (first 30 seconds of neutral face)
    if (!this.isBaselineSet && this.baselineSamples.length < 300) {
      if (mar < 0.5) {
        this.baselineSamples.push(mar);
      }
      if (this.baselineSamples.length >= 200) {
        this.userBaselineMAR = this.baselineSamples.reduce((a, b) => a + b, 0) / this.baselineSamples.length;
        this.isBaselineSet = true;
      }
    }

    const analysis = this.analyzeMARPattern();
    const isTalking = analysis.isTalking;
    const isYawning = analysis.isYawning;

    // Track talking duration
    if (isTalking) {
      if (!this.talkingStartTime) this.talkingStartTime = timestamp;
      this.totalTalkingTime = timestamp - this.talkingStartTime;
    } else {
      this.talkingStartTime = null;
      this.totalTalkingTime = 0;
    }

    // Detect hands-free call
    const isOnCall = this.detectHandsFreeCall(isTalking, phoneDetected, headRoll, timestamp);

    return {
      isTalking,
      isYawning,
      isOnCall,
      talkingDuration: this.totalTalkingTime,
      confidence: analysis.confidence,
      marFrequency: analysis.frequency,
      marAmplitude: analysis.amplitude,
    };
  }

  private analyzeMARPattern(): { isTalking: boolean; isYawning: boolean; confidence: number; frequency: number; amplitude: number } {
    if (this.marHistory.length < 15) {
      return { isTalking: false, isYawning: false, confidence: 0, frequency: 0, amplitude: 0 };
    }

    const recent = this.marHistory.slice(-60);
    const values = recent.map(s => s.value);

    // Calculate frequency of MAR oscillations (zero-crossings around mean)
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    let crossings = 0;
    for (let i = 1; i < values.length; i++) {
      if ((values[i] > mean && values[i - 1] <= mean) || (values[i] < mean && values[i - 1] >= mean)) {
        crossings++;
      }
    }

    const timeSpan = (recent[recent.length - 1].timestamp - recent[0].timestamp) / 1000;
    const frequency = timeSpan > 0 ? crossings / timeSpan : 0;

    // Calculate amplitude (range of oscillation)
    const maxMAR = Math.max(...values);
    const minMAR = Math.min(...values);
    const amplitude = maxMAR - minMAR;

    // Peak MAR value
    const peakMAR = maxMAR;

    // Duration of current elevated state
    const elevatedFrames = values.filter(v => v > this.userBaselineMAR * this.talkingThresholdMultiplier).length;
    const elevatedRatio = elevatedFrames / values.length;

    // Talking pattern: high frequency (>3 Hz), moderate amplitude, below yawn threshold
    const isTalking =
      frequency > 2.5 &&
      amplitude > 0.03 &&
      amplitude < 0.25 &&
      peakMAR < this.userBaselineMAR * this.yawnThresholdMultiplier;

    // Yawning pattern: low frequency (<1 Hz), high amplitude, sustained wide opening
    const isYawning =
      frequency < 1.5 &&
      peakMAR > this.userBaselineMAR * this.yawnThresholdMultiplier &&
      elevatedRatio > 0.4 &&
      amplitude > 0.15;

    // Confidence based on pattern clarity
    let confidence = 0;
    if (isTalking) {
      confidence = Math.min(1, (frequency - 2.5) / 5 + (0.25 - amplitude) / 0.3);
    } else if (isYawning) {
      confidence = Math.min(1, elevatedRatio + (peakMAR - this.userBaselineMAR * 2) * 3);
    }

    return { isTalking, isYawning, confidence: Math.max(0, confidence), frequency, amplitude };
  }

  private detectHandsFreeCall(isTalking: boolean, phoneDetected: boolean, headRoll: number, timestamp: number): boolean {
    // Hands-free call indicators:
    // 1. Sustained talking (>5 seconds)
    // 2. No phone visible (using earphones/buds)
    // 3. Optional: slight head tilt bias (common during calls)

    const sustainedTalking = this.totalTalkingTime > 5000;
    const noPhone = !phoneDetected;

    // Head tilt during call (people often tilt slightly)
    const avgTilt = this.headTiltHistory.length > 0
      ? this.headTiltHistory.reduce((a, b) => a + b, 0) / this.headTiltHistory.length
      : 0;
    const hasTiltBias = avgTilt > 5;

    if (sustainedTalking && noPhone) {
      if (!this.callStartTime) this.callStartTime = timestamp;
      return true;
    }

    // Also detect if talking pattern + head tilt even if talking is intermittent
    if (isTalking && noPhone && hasTiltBias && this.totalTalkingTime > 3000) {
      if (!this.callStartTime) this.callStartTime = timestamp;
      return true;
    }

    this.callStartTime = null;
    return false;
  }

  getCallDuration(currentTime: number): number {
    return this.callStartTime ? currentTime - this.callStartTime : 0;
  }

  getBaselineMAR(): number {
    return this.userBaselineMAR;
  }

  isBaselineCalibrated(): boolean {
    return this.isBaselineSet;
  }
}
