/**
 * Emotion Detection from Facial Landmarks
 *
 * Classifies driver emotional state (calm, stressed, angry, sad) using
 * geometric relationships between facial landmarks. No additional ML model
 * needed — pure geometry from MediaPipe FaceMesh.
 *
 * Detected states:
 *   - CALM: neutral expression, relaxed muscles
 *   - STRESSED: raised eyebrows, tense jaw, wide eyes
 *   - ANGRY: furrowed brows, compressed lips, narrowed eyes
 *   - SAD: drooping corners, lowered brows
 *   - SURPRISED: raised brows + wide eyes + open mouth
 *
 * Safety relevance:
 *   - Anger → aggressive driving risk (2.3x accident rate, AAA Foundation 2016)
 *   - Stress → impaired reaction time
 *   - Sadness → inattention, mind-wandering
 *
 * References:
 *   - Ekman (1971): Facial Action Coding System (FACS)
 *   - AAA Foundation (2016): "Prevalence of Self-Reported Aggressive Driving"
 */

export type EmotionState = 'CALM' | 'STRESSED' | 'ANGRY' | 'SAD' | 'SURPRISED';

export interface EmotionResult {
  emotion: EmotionState;
  confidence: number;
  scores: Record<EmotionState, number>;
  safetyRisk: number;
  description: string;
}

// MediaPipe FaceMesh landmark indices for emotion detection
const LANDMARKS = {
  leftEyebrowInner: 107,
  rightEyebrowInner: 336,
  leftEyebrowOuter: 70,
  rightEyebrowOuter: 300,
  leftEyeTop: 159,
  rightEyeTop: 386,
  leftEyeBottom: 145,
  rightEyeBottom: 374,
  noseTip: 1,
  lipTop: 13,
  lipBottom: 14,
  lipLeft: 61,
  lipRight: 291,
  jawLeft: 172,
  jawRight: 397,
  foreheadCenter: 10,
  chinBottom: 152,
};

export class EmotionDetector {
  private emotionHistory: EmotionState[] = [];
  private smoothedScores: Record<EmotionState, number> = {
    CALM: 0.5, STRESSED: 0, ANGRY: 0, SAD: 0, SURPRISED: 0
  };

  detect(landmarks: { x: number; y: number; z: number }[]): EmotionResult {
    if (!landmarks || landmarks.length < 468) {
      return { emotion: 'CALM', confidence: 0, scores: this.smoothedScores, safetyRisk: 0, description: 'Insufficient data' };
    }

    const features = this.extractFeatures(landmarks);
    const scores = this.classifyEmotion(features);

    // Temporal smoothing (prevents rapid flickering)
    const alpha = 0.3;
    for (const key of Object.keys(scores) as EmotionState[]) {
      this.smoothedScores[key] = this.smoothedScores[key] * (1 - alpha) + scores[key] * alpha;
    }

    const entries = Object.entries(this.smoothedScores) as [EmotionState, number][];
    entries.sort((a, b) => b[1] - a[1]);
    const emotion = entries[0][0];
    const confidence = entries[0][1];

    this.emotionHistory.push(emotion);
    if (this.emotionHistory.length > 60) this.emotionHistory.shift();

    const safetyRisk = this.computeSafetyRisk(emotion, confidence);
    const description = this.getDescription(emotion);

    return { emotion, confidence, scores: { ...this.smoothedScores }, safetyRisk, description };
  }

  private extractFeatures(lm: { x: number; y: number; z: number }[]) {
    const dist = (a: number, b: number) => {
      const p1 = lm[a], p2 = lm[b];
      return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    };

    // Eyebrow raise (distance from eye to brow)
    const leftBrowRaise = dist(LANDMARKS.leftEyebrowInner, LANDMARKS.leftEyeTop);
    const rightBrowRaise = dist(LANDMARKS.rightEyebrowInner, LANDMARKS.rightEyeTop);
    const browRaise = (leftBrowRaise + rightBrowRaise) / 2;

    // Eyebrow furrow (distance between inner brows)
    const browFurrow = dist(LANDMARKS.leftEyebrowInner, LANDMARKS.rightEyebrowInner);

    // Eye openness
    const leftEyeOpen = dist(LANDMARKS.leftEyeTop, LANDMARKS.leftEyeBottom);
    const rightEyeOpen = dist(LANDMARKS.rightEyeTop, LANDMARKS.rightEyeBottom);
    const eyeOpenness = (leftEyeOpen + rightEyeOpen) / 2;

    // Lip compression (distance between top and bottom lip)
    const lipOpen = dist(LANDMARKS.lipTop, LANDMARKS.lipBottom);

    // Mouth width
    const mouthWidth = dist(LANDMARKS.lipLeft, LANDMARKS.lipRight);

    // Lip corner position relative to center (smile vs frown)
    const lipCenter = (lm[LANDMARKS.lipLeft].y + lm[LANDMARKS.lipRight].y) / 2;
    const lipMid = lm[LANDMARKS.lipTop].y;
    const mouthCurve = lipCenter - lipMid; // positive = smile, negative = frown

    // Jaw tension (width)
    const jawWidth = dist(LANDMARKS.jawLeft, LANDMARKS.jawRight);

    // Face height for normalization
    const faceHeight = dist(LANDMARKS.foreheadCenter, LANDMARKS.chinBottom);

    return {
      browRaise: browRaise / faceHeight,
      browFurrow: browFurrow / faceHeight,
      eyeOpenness: eyeOpenness / faceHeight,
      lipOpen: lipOpen / faceHeight,
      mouthWidth: mouthWidth / faceHeight,
      mouthCurve: mouthCurve / faceHeight,
      jawWidth: jawWidth / faceHeight,
    };
  }

  private classifyEmotion(f: ReturnType<typeof this.extractFeatures>): Record<EmotionState, number> {
    // Rule-based classification from FACS (Facial Action Coding System)
    const calm = 0.3 +
      (f.mouthCurve > -0.01 && f.mouthCurve < 0.02 ? 0.3 : 0) +
      (f.browRaise > 0.03 && f.browRaise < 0.06 ? 0.2 : 0) +
      (f.eyeOpenness > 0.02 && f.eyeOpenness < 0.04 ? 0.2 : 0);

    const stressed =
      (f.browRaise > 0.055 ? 0.3 : 0) +
      (f.eyeOpenness > 0.038 ? 0.25 : 0) +
      (f.jawWidth > 0.35 ? 0.2 : 0) +
      (f.lipOpen < 0.01 ? 0.25 : 0);

    const angry =
      (f.browFurrow < 0.12 ? 0.3 : 0) +
      (f.eyeOpenness < 0.025 ? 0.25 : 0) +
      (f.lipOpen < 0.008 ? 0.25 : 0) +
      (f.mouthCurve < -0.01 ? 0.2 : 0);

    const sad =
      (f.mouthCurve < -0.015 ? 0.35 : 0) +
      (f.browRaise < 0.035 ? 0.25 : 0) +
      (f.eyeOpenness < 0.028 ? 0.2 : 0) +
      (f.lipOpen > 0.005 && f.lipOpen < 0.015 ? 0.2 : 0);

    const surprised =
      (f.browRaise > 0.065 ? 0.3 : 0) +
      (f.eyeOpenness > 0.042 ? 0.3 : 0) +
      (f.lipOpen > 0.025 ? 0.25 : 0) +
      (f.mouthWidth > 0.3 ? 0.15 : 0);

    // Normalize
    const total = calm + stressed + angry + sad + surprised + 0.01;
    return {
      CALM: calm / total,
      STRESSED: stressed / total,
      ANGRY: angry / total,
      SAD: sad / total,
      SURPRISED: surprised / total,
    };
  }

  private computeSafetyRisk(emotion: EmotionState, confidence: number): number {
    const riskMap: Record<EmotionState, number> = {
      CALM: 0,
      STRESSED: 25,
      ANGRY: 60,
      SAD: 35,
      SURPRISED: 15,
    };
    return Math.round(riskMap[emotion] * confidence);
  }

  private getDescription(emotion: EmotionState): string {
    const descriptions: Record<EmotionState, string> = {
      CALM: 'Driver appears calm and focused',
      STRESSED: 'Elevated stress detected — may impair reaction time',
      ANGRY: 'Anger detected — 2.3x accident risk (AAA Foundation)',
      SAD: 'Low mood detected — risk of inattention',
      SURPRISED: 'Surprise reaction detected',
    };
    return descriptions[emotion];
  }

  getDominantEmotion(): EmotionState {
    if (this.emotionHistory.length === 0) return 'CALM';
    const counts: Record<string, number> = {};
    for (const e of this.emotionHistory.slice(-20)) {
      counts[e] = (counts[e] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as EmotionState;
  }

  reset(): void {
    this.emotionHistory = [];
    this.smoothedScores = { CALM: 0.5, STRESSED: 0, ANGRY: 0, SAD: 0, SURPRISED: 0 };
  }
}
