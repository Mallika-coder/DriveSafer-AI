/**
 * XAI Narrator — Natural Language Explanations for AI Decisions
 *
 * Generates human-readable explanations of WHY the system triggered an alert.
 * Instead of just showing numbers, tells the driver/fleet manager exactly what
 * signals contributed and what action to take.
 *
 * Inspired by NVIDIA's in-vehicle AI agents (2026) that provide contextual
 * explanations of ADAS behavior.
 *
 * Example outputs:
 *   "Drowsiness detected: your PERCLOS exceeded 35% for 8 seconds while
 *    blink rate dropped to 6/min. Combined risk score: 67. Recommend a break."
 *
 *   "False alarm avoided: MAR was elevated but frequency analysis confirmed
 *    you were talking (3.1 Hz), not yawning. No alert issued."
 */

interface NarratorContext {
  drowsinessScore: number;
  level: 'ALERT' | 'MILD' | 'MODERATE' | 'SEVERE';
  factors: { name: string; contribution: number; value: number }[];
  ear: number;
  mar: number;
  perclos: number;
  headPitch: number;
  blinkRate: number;
  isTalking: boolean;
  isYawning: boolean;
  phoneDetected: boolean;
  cognitiveLoad: number;
  heartRate?: number;
  emotion?: string;
  sessionMinutes: number;
}

export function generateExplanation(ctx: NarratorContext): string {
  if (ctx.drowsinessScore < 20) {
    return generateNormalExplanation(ctx);
  } else if (ctx.drowsinessScore < 55) {
    return generateMildExplanation(ctx);
  } else {
    return generateAlertExplanation(ctx);
  }
}

function generateNormalExplanation(ctx: NarratorContext): string {
  const parts: string[] = [];

  if (ctx.isTalking) {
    parts.push(`Talking detected (MAR frequency >2.5Hz) — correctly classified as speech, not yawning. No false alarm.`);
  }

  if (ctx.heartRate && ctx.heartRate > 0) {
    parts.push(`Heart rate: ${ctx.heartRate} BPM (normal range).`);
  }

  if (parts.length === 0) {
    parts.push(`All ${ctx.factors.length} signals within normal range. EAR: ${ctx.ear.toFixed(2)}, PERCLOS: ${(ctx.perclos * 100).toFixed(0)}%.`);
  }

  parts.push(`Session: ${Math.round(ctx.sessionMinutes)} min. Status: safe.`);
  return parts.join(' ');
}

function generateMildExplanation(ctx: NarratorContext): string {
  const topFactors = ctx.factors
    .filter(f => f.value > 30)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);

  const parts: string[] = [];
  parts.push(`Mild drowsiness indicators:`);

  for (const f of topFactors) {
    parts.push(`${f.name} contributing ${Math.round(f.value)}% risk.`);
  }

  if (ctx.blinkRate < 10) {
    parts.push(`Blink rate low (${Math.round(ctx.blinkRate)}/min vs normal 15-20).`);
  }

  if (ctx.perclos > 0.12) {
    parts.push(`PERCLOS at ${(ctx.perclos * 100).toFixed(0)}% (threshold: 15%).`);
  }

  if (ctx.sessionMinutes > 45) {
    parts.push(`Extended session (${Math.round(ctx.sessionMinutes)} min) increases fatigue risk.`);
  }

  parts.push(`Recommend: stay alert, consider a break soon.`);
  return parts.join(' ');
}

function generateAlertExplanation(ctx: NarratorContext): string {
  const parts: string[] = [];
  const topFactors = ctx.factors
    .filter(f => f.value > 40)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  if (ctx.drowsinessScore > 75) {
    parts.push(`CRITICAL:`);
  } else {
    parts.push(`WARNING:`);
  }

  if (ctx.perclos > 0.25) {
    parts.push(`Eyes closed ${(ctx.perclos * 100).toFixed(0)}% of last 5 seconds.`);
  }

  if (ctx.ear < 0.18) {
    parts.push(`EAR dropped to ${ctx.ear.toFixed(2)} (severely closed).`);
  }

  if (ctx.isYawning) {
    parts.push(`Yawning confirmed (MAR frequency <1.5Hz, amplitude >${ctx.mar.toFixed(2)}).`);
  }

  if (Math.abs(ctx.headPitch) > 15) {
    parts.push(`Head tilted ${Math.abs(Math.round(ctx.headPitch))}° (nodding off).`);
  }

  if (ctx.phoneDetected) {
    parts.push(`Phone detected in cabin — visual distraction.`);
  }

  if (ctx.heartRate && ctx.heartRate < 60) {
    parts.push(`Heart rate low (${ctx.heartRate} BPM) — physiological fatigue confirmed.`);
  }

  if (ctx.emotion === 'SAD') {
    parts.push(`Low mood detected — risk of mind-wandering.`);
  }

  parts.push(`Combined score: ${Math.round(ctx.drowsinessScore)}/100.`);

  if (topFactors.length > 0) {
    const factorNames = topFactors.map(f => f.name).join(', ');
    parts.push(`Top contributors: ${factorNames}.`);
  }

  if (ctx.drowsinessScore > 75) {
    parts.push(`Immediate action required: pull over safely.`);
  } else {
    parts.push(`Recommend: take a break within 10 minutes.`);
  }

  return parts.join(' ');
}

export function generateFalseAlarmExplanation(ctx: NarratorContext): string | null {
  if (ctx.isTalking && ctx.mar > 0.4) {
    return `False alarm prevented: MAR elevated (${ctx.mar.toFixed(2)}) but frequency analysis confirmed talking at >2.5Hz. Yawn alert suppressed.`;
  }

  if (ctx.cognitiveLoad > 50 && ctx.drowsinessScore < 20) {
    return `Cognitive load elevated (${Math.round(ctx.cognitiveLoad)}%) due to conversation, but drowsiness signals normal. Monitoring only.`;
  }

  return null;
}
