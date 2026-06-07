/**
 * Driver Behavior Profiling — Longitudinal ML
 *
 * Stores per-driver fatigue patterns across sessions to provide insights like:
 * - "You tend to get drowsy after 45 minutes"
 * - "Your risk increases 3x between 11pm-2am"
 * - "Wednesdays show higher fatigue (mid-week burnout)"
 *
 * Uses local storage for persistence across sessions.
 */

interface SessionProfile {
  sessionId: number;
  startTime: number;
  duration: number;
  avgDrowsinessScore: number;
  peakScore: number;
  eventCount: number;
  timeOfDay: number; // hour 0-23
  dayOfWeek: number; // 0=Sun, 6=Sat
  minuteToFirstAlert: number | null;
}

interface DriverInsight {
  type: 'fatigue_onset' | 'time_risk' | 'weekly_pattern' | 'improvement' | 'streak';
  message: string;
  severity: 'info' | 'warning' | 'positive';
  data?: Record<string, number>;
}

interface DriverProfile {
  sessions: SessionProfile[];
  avgSessionDuration: number;
  avgTimeToFatigue: number;
  riskyHours: number[];
  riskyDays: number[];
  totalDriveTime: number;
  safeDriveStreak: number;
}

export class DriverProfiler {
  private sessions: SessionProfile[] = [];
  private currentSession: {
    startTime: number;
    scores: number[];
    events: number;
    firstAlertTime: number | null;
  } | null = null;

  constructor() {
    this.loadFromStorage();
  }

  startSession(sessionId: number) {
    this.currentSession = {
      startTime: Date.now(),
      scores: [],
      events: 0,
      firstAlertTime: null,
    };
  }

  recordScore(score: number) {
    if (!this.currentSession) return;
    this.currentSession.scores.push(score);

    if (score > 30 && !this.currentSession.firstAlertTime) {
      this.currentSession.firstAlertTime = Date.now();
    }
  }

  recordEvent() {
    if (!this.currentSession) return;
    this.currentSession.events++;
  }

  endSession(sessionId: number) {
    if (!this.currentSession) return;

    const now = new Date();
    const duration = (Date.now() - this.currentSession.startTime) / 1000;
    const scores = this.currentSession.scores;

    const profile: SessionProfile = {
      sessionId,
      startTime: this.currentSession.startTime,
      duration,
      avgDrowsinessScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      peakScore: scores.length > 0 ? Math.max(...scores) : 0,
      eventCount: this.currentSession.events,
      timeOfDay: now.getHours(),
      dayOfWeek: now.getDay(),
      minuteToFirstAlert: this.currentSession.firstAlertTime
        ? (this.currentSession.firstAlertTime - this.currentSession.startTime) / 60000
        : null,
    };

    this.sessions.push(profile);
    if (this.sessions.length > 100) this.sessions.shift();
    this.saveToStorage();
    this.currentSession = null;
  }

  getProfile(): DriverProfile {
    const avgDuration = this.sessions.length > 0
      ? this.sessions.reduce((s, p) => s + p.duration, 0) / this.sessions.length
      : 0;

    const alertSessions = this.sessions.filter(s => s.minuteToFirstAlert !== null);
    const avgTimeToFatigue = alertSessions.length > 0
      ? alertSessions.reduce((s, p) => s + (p.minuteToFirstAlert || 0), 0) / alertSessions.length
      : 60;

    // Find risky hours (hours with above-average drowsiness)
    const hourScores: Record<number, number[]> = {};
    this.sessions.forEach(s => {
      if (!hourScores[s.timeOfDay]) hourScores[s.timeOfDay] = [];
      hourScores[s.timeOfDay].push(s.avgDrowsinessScore);
    });
    const overallAvg = this.sessions.length > 0
      ? this.sessions.reduce((s, p) => s + p.avgDrowsinessScore, 0) / this.sessions.length
      : 0;
    const riskyHours = Object.entries(hourScores)
      .filter(([_, scores]) => scores.reduce((a, b) => a + b, 0) / scores.length > overallAvg * 1.3)
      .map(([h]) => parseInt(h));

    // Risky days
    const dayScores: Record<number, number[]> = {};
    this.sessions.forEach(s => {
      if (!dayScores[s.dayOfWeek]) dayScores[s.dayOfWeek] = [];
      dayScores[s.dayOfWeek].push(s.avgDrowsinessScore);
    });
    const riskyDays = Object.entries(dayScores)
      .filter(([_, scores]) => scores.reduce((a, b) => a + b, 0) / scores.length > overallAvg * 1.3)
      .map(([d]) => parseInt(d));

    // Safe streak (consecutive sessions with no severe events)
    let streak = 0;
    for (let i = this.sessions.length - 1; i >= 0; i--) {
      if (this.sessions[i].peakScore < 50) streak++;
      else break;
    }

    return {
      sessions: this.sessions,
      avgSessionDuration: avgDuration,
      avgTimeToFatigue: avgTimeToFatigue,
      riskyHours,
      riskyDays,
      totalDriveTime: this.sessions.reduce((s, p) => s + p.duration, 0),
      safeDriveStreak: streak,
    };
  }

  getInsights(): DriverInsight[] {
    const insights: DriverInsight[] = [];
    const profile = this.getProfile();

    if (this.sessions.length < 3) {
      insights.push({
        type: 'streak',
        message: 'Complete more sessions to unlock personalized insights',
        severity: 'info',
      });
      return insights;
    }

    // Fatigue onset pattern
    if (profile.avgTimeToFatigue < 60) {
      insights.push({
        type: 'fatigue_onset',
        message: `You typically show fatigue signs after ${Math.round(profile.avgTimeToFatigue)} minutes. Consider breaks every ${Math.round(profile.avgTimeToFatigue * 0.8)} minutes.`,
        severity: 'warning',
        data: { minutesToFatigue: profile.avgTimeToFatigue },
      });
    }

    // Time-of-day risk
    if (profile.riskyHours.length > 0) {
      const hourLabels = profile.riskyHours.map(h => `${h}:00`).join(', ');
      insights.push({
        type: 'time_risk',
        message: `Higher drowsiness risk detected around ${hourLabels}. Your alertness drops significantly during these hours.`,
        severity: 'warning',
        data: { riskyHours: profile.riskyHours.length },
      });
    }

    // Weekly pattern
    if (profile.riskyDays.length > 0) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const days = profile.riskyDays.map(d => dayNames[d]).join(', ');
      insights.push({
        type: 'weekly_pattern',
        message: `${days} tend to be your most fatigued days. Plan extra rest or avoid long drives.`,
        severity: 'warning',
      });
    }

    // Improvement trend
    if (this.sessions.length >= 5) {
      const recent5 = this.sessions.slice(-5);
      const older5 = this.sessions.slice(-10, -5);
      if (older5.length >= 5) {
        const recentAvg = recent5.reduce((s, p) => s + p.avgDrowsinessScore, 0) / 5;
        const olderAvg = older5.reduce((s, p) => s + p.avgDrowsinessScore, 0) / 5;
        if (recentAvg < olderAvg * 0.8) {
          insights.push({
            type: 'improvement',
            message: `Your alertness has improved ${Math.round((1 - recentAvg / olderAvg) * 100)}% over recent sessions!`,
            severity: 'positive',
          });
        }
      }
    }

    // Safe streak
    if (profile.safeDriveStreak >= 3) {
      insights.push({
        type: 'streak',
        message: `${profile.safeDriveStreak} safe sessions in a row — no severe drowsiness detected!`,
        severity: 'positive',
      });
    }

    return insights;
  }

  private loadFromStorage() {
    const stored = localStorage.getItem('drivesafe_driver_profile');
    if (stored) {
      this.sessions = JSON.parse(stored);
    }
  }

  private saveToStorage() {
    localStorage.setItem('drivesafe_driver_profile', JSON.stringify(this.sessions));
  }
}
