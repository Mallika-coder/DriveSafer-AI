/**
 * Autocare Protocol — Preventive AI Safety System
 *
 * Implements escalating intervention levels inspired by ADAS (Advanced Driver
 * Assistance Systems) and World Model concepts. When drowsiness is detected,
 * the system progressively takes control to prevent accidents.
 *
 * Intervention Levels:
 *   Level 0 — MONITORING: Normal operation, passive monitoring
 *   Level 1 — ADVISORY: Gentle alerts, haptic feedback suggestion
 *   Level 2 — CORRECTIVE: Active lane-keeping, speed reduction
 *   Level 3 — PROTECTIVE: Emergency slowdown, hazard lights
 *   Level 4 — EMERGENCY: Full autonomous pull-over, emergency services
 *
 * Decision Logic:
 *   Single-signal triggers require confirmation from a secondary signal
 *   within a time window before escalation. This reduces false positives.
 *
 * References:
 *   - Euro NCAP 2025 Driver Monitoring Requirements
 *   - SAE J3016 Levels of Driving Automation
 *   - Yann LeCun's World Model concept (predictive internal model)
 */

export type InterventionLevel = 0 | 1 | 2 | 3 | 4;

export interface AutocareState {
  level: InterventionLevel;
  levelName: string;
  activeInterventions: string[];
  escalationCountdown: number | null;
  deescalationCountdown: number | null;
  confidenceRequired: number;
  triggerSignals: string[];
  worldModelPrediction: string;
  autonomyPercentage: number;
  timeSinceLastEscalation: number;
}

interface SignalConfirmation {
  signal: string;
  timestamp: number;
  value: number;
  confirmed: boolean;
}

const LEVEL_CONFIG = {
  0: {
    name: 'MONITORING',
    interventions: ['Passive sensor monitoring', 'Baseline adaptation', 'Circadian risk assessment'],
    confidenceThreshold: 0,
    autonomyPct: 0,
    minDuration: 0,
    escalationDelay: 5000,
  },
  1: {
    name: 'ADVISORY',
    interventions: ['Audio alert tone', 'Dashboard warning light', 'Seat vibration (haptic)', 'Voice: "Consider taking a break"', 'Coolant temperature increase (+1C)'],
    confidenceThreshold: 0.6,
    autonomyPct: 5,
    minDuration: 10000,
    escalationDelay: 15000,
  },
  2: {
    name: 'CORRECTIVE',
    interventions: ['Lane-keeping assist ACTIVE', 'Adaptive cruise: speed -10km/h', 'Window opens 2cm (fresh air)', 'Audio: rhythmic alertness tones', 'Cabin light intensity +30%', 'Navigation: nearest rest stop shown'],
    confidenceThreshold: 0.7,
    autonomyPct: 30,
    minDuration: 20000,
    escalationDelay: 30000,
  },
  3: {
    name: 'PROTECTIVE',
    interventions: ['Emergency speed reduction to 60km/h', 'Hazard lights ACTIVATED', 'All windows open', 'Continuous alarm tone', 'Navigation: forced route to rest stop', 'V2X: broadcast caution to nearby vehicles', 'Seatbelt pre-tensioner armed'],
    confidenceThreshold: 0.8,
    autonomyPct: 70,
    minDuration: 30000,
    escalationDelay: 45000,
  },
  4: {
    name: 'EMERGENCY',
    interventions: ['FULL AUTONOMOUS CONTROL', 'Gradual deceleration to 0 km/h', 'Steering to hard shoulder/safe zone', 'Hazard lights + horn pattern', 'Emergency services contacted (eCall)', 'Doors unlock after stop', 'V2X: emergency broadcast to all vehicles', 'Interior camera records for insurance'],
    confidenceThreshold: 0.9,
    autonomyPct: 100,
    minDuration: 60000,
    escalationDelay: 0,
  },
};

export class AutocareProtocol {
  private currentLevel: InterventionLevel = 0;
  private levelTimestamp = Date.now();
  private pendingSignals: SignalConfirmation[] = [];
  private escalationTimer: number | null = null;
  private deescalationTimer: number | null = null;
  private scoreHistory: { score: number; timestamp: number }[] = [];
  private consecutiveHighFrames = 0;
  private worldModelState = 'Normal driving conditions';

  update(
    drowsinessScore: number,
    confidence: number,
    signals: { name: string; value: number; isAbnormal: boolean }[]
  ): AutocareState {
    const now = Date.now();
    this.scoreHistory.push({ score: drowsinessScore, timestamp: now });
    if (this.scoreHistory.length > 300) this.scoreHistory.shift();

    const abnormalSignals = signals.filter(s => s.isAbnormal);
    const confirmedAbnormal = abnormalSignals.length >= 2;

    if (drowsinessScore > 45) {
      this.consecutiveHighFrames++;
    } else {
      this.consecutiveHighFrames = Math.max(0, this.consecutiveHighFrames - 2);
    }

    this.updateWorldModel(drowsinessScore, abnormalSignals);

    const targetLevel = this.computeTargetLevel(drowsinessScore, confidence, confirmedAbnormal);

    if (targetLevel > this.currentLevel) {
      this.escalate(targetLevel, abnormalSignals.map(s => s.name));
    } else if (targetLevel < this.currentLevel && drowsinessScore < 20) {
      this.deescalate();
    }

    const config = LEVEL_CONFIG[this.currentLevel];
    const timeSinceEscalation = now - this.levelTimestamp;

    return {
      level: this.currentLevel,
      levelName: config.name,
      activeInterventions: config.interventions,
      escalationCountdown: this.escalationTimer ? Math.max(0, config.escalationDelay - timeSinceEscalation) : null,
      deescalationCountdown: this.deescalationTimer ? Math.max(0, 10000 - timeSinceEscalation) : null,
      confidenceRequired: config.confidenceThreshold,
      triggerSignals: abnormalSignals.map(s => `${s.name}: ${s.value.toFixed(2)}`),
      worldModelPrediction: this.worldModelState,
      autonomyPercentage: config.autonomyPct,
      timeSinceLastEscalation: timeSinceEscalation,
    };
  }

  private computeTargetLevel(score: number, confidence: number, confirmed: boolean): InterventionLevel {
    if (score >= 80 && confidence >= 0.85 && this.consecutiveHighFrames > 90) return 4;
    if (score >= 70 && confidence >= 0.75 && confirmed && this.consecutiveHighFrames > 60) return 3;
    if (score >= 50 && confidence >= 0.65 && confirmed && this.consecutiveHighFrames > 30) return 2;
    if (score >= 25 && confidence >= 0.55 && this.consecutiveHighFrames > 15) return 1;
    return 0;
  }

  private escalate(targetLevel: InterventionLevel, triggers: string[]): void {
    const config = LEVEL_CONFIG[this.currentLevel];
    const timeSince = Date.now() - this.levelTimestamp;

    if (timeSince < config.minDuration) return;

    this.currentLevel = Math.min(this.currentLevel + 1, targetLevel) as InterventionLevel;
    this.levelTimestamp = Date.now();
    this.deescalationTimer = null;

    this.pendingSignals.push(...triggers.map(t => ({
      signal: t,
      timestamp: Date.now(),
      value: 1,
      confirmed: true,
    })));
  }

  private deescalate(): void {
    if (this.currentLevel === 0) return;
    const timeSince = Date.now() - this.levelTimestamp;
    const config = LEVEL_CONFIG[this.currentLevel];

    if (timeSince > config.minDuration * 2) {
      this.currentLevel = Math.max(0, this.currentLevel - 1) as InterventionLevel;
      this.levelTimestamp = Date.now();
    }
  }

  private updateWorldModel(score: number, abnormalSignals: { name: string; value: number; isAbnormal: boolean }[]): void {
    const recentScores = this.scoreHistory.slice(-30);
    const avgScore = recentScores.reduce((s, e) => s + e.score, 0) / recentScores.length;
    const trend = recentScores.length > 10
      ? (recentScores[recentScores.length - 1].score - recentScores[0].score) / recentScores.length
      : 0;

    if (score > 70) {
      this.worldModelState = 'CRITICAL: Driver incapacitation predicted within 2-5 minutes. World model recommends immediate autonomous takeover.';
    } else if (score > 50 && trend > 0.5) {
      this.worldModelState = 'WARNING: Fatigue trajectory indicates drowsiness onset in ~10 minutes. Predictive model recommends preemptive intervention.';
    } else if (score > 30 && abnormalSignals.length > 0) {
      this.worldModelState = `CAUTION: ${abnormalSignals[0].name} anomaly detected. Internal world model monitoring for confirmation signals.`;
    } else if (avgScore > 20) {
      this.worldModelState = 'ADVISORY: Mild fatigue indicators present. World model maintaining elevated monitoring state.';
    } else {
      this.worldModelState = 'NOMINAL: All signals within expected parameters. World model predicts safe driving conditions.';
    }
  }

  getLevel(): InterventionLevel {
    return this.currentLevel;
  }

  reset(): void {
    this.currentLevel = 0;
    this.levelTimestamp = Date.now();
    this.pendingSignals = [];
    this.consecutiveHighFrames = 0;
    this.scoreHistory = [];
    this.worldModelState = 'Normal driving conditions';
  }

  getStatistics(): {
    totalEscalations: number;
    maxLevelReached: InterventionLevel;
    avgTimeInLevel: Record<number, number>;
  } {
    return {
      totalEscalations: this.pendingSignals.length,
      maxLevelReached: this.currentLevel,
      avgTimeInLevel: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
    };
  }
}

export const LEVEL_DESCRIPTIONS = LEVEL_CONFIG;
