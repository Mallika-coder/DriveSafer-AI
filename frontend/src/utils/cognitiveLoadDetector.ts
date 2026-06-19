/**
 * Detects cognitive distraction (e.g., from a phone call or deep thought)
 * even when the driver is looking at the road.
 *
 * Based on research indicators:
 * - Reduced blink rate (cognitive tunnel vision)
 * - Increased fixation duration (staring without processing)
 * - Reduced peripheral scanning (gaze stays center-locked)
 * - Delayed reaction patterns (monotone head pose)
 * - Talking patterns (hands-free conversation)
 */

interface CognitiveMetrics {
  cognitiveLoad: number;        // 0-100 scale
  level: 'LOW' | 'MODERATE' | 'HIGH';
  indicators: {
    reducedBlinking: boolean;
    fixatedGaze: boolean;
    noScanning: boolean;
    monotoneHead: boolean;
    activeConversation: boolean;
  };
  distracted: boolean;
}

export class CognitiveLoadDetector {
  private blinkRateHistory: number[] = [];
  private gazeVarianceHistory: number[] = [];
  private headMovementHistory: { yaw: number; pitch: number; t: number }[] = [];
  private baselineBlinkRate = 15;
  private baselineSamples = 0;

  update(
    blinkRate: number,
    gazeX: number,
    gazeY: number,
    headYaw: number,
    headPitch: number,
    isTalking: boolean,
    timestamp: number
  ): CognitiveMetrics {
    // Collect baselines during first 30 seconds
    if (this.baselineSamples < 300) {
      this.baselineBlinkRate = blinkRate > 5 ? blinkRate : this.baselineBlinkRate;
      this.baselineSamples++;
      if (this.baselineSamples === 300) { /* calibrated */ }
    }

    this.blinkRateHistory.push(blinkRate);
    if (this.blinkRateHistory.length > 60) this.blinkRateHistory.shift();

    // Track gaze variance over 3-second windows
    this.headMovementHistory.push({ yaw: headYaw, pitch: headPitch, t: timestamp });
    const cutoff = timestamp - 3000;
    this.headMovementHistory = this.headMovementHistory.filter(h => h.t > cutoff);

    // Compute indicators
    const reducedBlinking = this.detectReducedBlinking(blinkRate);
    const fixatedGaze = this.detectFixatedGaze(gazeX, gazeY);
    const noScanning = this.detectNoScanning();
    const monotoneHead = this.detectMonotoneHead();
    const activeConversation = isTalking;

    // Compute cognitive load score
    // Talking alone is NOT distraction — only becomes distraction when
    // combined with OTHER indicators (reduced blinking + no scanning = phone call trance)
    let score = 0;
    if (reducedBlinking) score += 20;
    if (fixatedGaze) score += 20;
    if (noScanning) score += 20;
    if (monotoneHead) score += 15;
    // Conversation only adds to score if OTHER visual indicators are also present
    if (activeConversation && (reducedBlinking || noScanning)) score += 15;

    const level = score > 65 ? 'HIGH' : score > 40 ? 'MODERATE' : 'LOW';
    const distracted = score > 55;

    return {
      cognitiveLoad: Math.min(100, score),
      level,
      indicators: { reducedBlinking, fixatedGaze, noScanning, monotoneHead, activeConversation },
      distracted,
    };
  }

  private detectReducedBlinking(currentRate: number): boolean {
    // Cognitive load causes blink rate to drop below 50% of baseline
    return currentRate < this.baselineBlinkRate * 0.5 && currentRate < 8;
  }

  private detectFixatedGaze(gazeX: number, gazeY: number): boolean {
    // Track gaze variance — low variance = fixated stare
    this.gazeVarianceHistory.push(Math.abs(gazeX - 0.5) + Math.abs(gazeY - 0.5));
    if (this.gazeVarianceHistory.length > 90) this.gazeVarianceHistory.shift();

    if (this.gazeVarianceHistory.length < 30) return false;

    const recent = this.gazeVarianceHistory.slice(-30);
    const variance = computeVariance(recent);
    return variance < 0.001;
  }

  private detectNoScanning(): boolean {
    // Normal driving involves regular head movements (mirror checks, etc.)
    // No scanning = head stays in same position for extended time
    if (this.headMovementHistory.length < 30) return false;

    const yawValues = this.headMovementHistory.map(h => h.yaw);
    const yawRange = Math.max(...yawValues) - Math.min(...yawValues);
    return yawRange < 3;
  }

  private detectMonotoneHead(): boolean {
    if (this.headMovementHistory.length < 30) return false;

    const pitchValues = this.headMovementHistory.map(h => h.pitch);
    const pitchVariance = computeVariance(pitchValues);
    const yawValues = this.headMovementHistory.map(h => h.yaw);
    const yawVariance = computeVariance(yawValues);

    return pitchVariance < 2 && yawVariance < 2;
  }
}

function computeVariance(arr: number[]): number {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / arr.length;
}
