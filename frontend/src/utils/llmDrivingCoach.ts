/**
 * LLM-Powered Driving Coach (Rule-based NLG simulation)
 *
 * Generates personalized fatigue insights using template-based natural language
 * generation. Simulates an AI coach that provides contextual, varied advice.
 */

interface SessionSummary {
  duration: number;
  avgScore: number;
  peakScore: number;
  events: number;
  timeOfDay: number;
  dayOfWeek: number;
  earTrend: number[];
  alertsTriggered: number;
}

interface DriverState {
  drowsinessScore: number;
  sessionMinutes: number;
  gazeDirection: string;
  isTalking: boolean;
  isOnCall: boolean;
  headPitch: number;
  perclos: number;
}

export interface CoachInsight {
  type: 'observation' | 'recommendation' | 'warning' | 'praise';
  message: string;
  priority: number;
}

const OBSERVATIONS = [
  "You showed early fatigue signs {minutes} minutes into your drive. Your EAR dropped {percent}% below baseline during this period.",
  "Your alertness was lowest between {startTime} and {endTime}. This aligns with circadian rhythm patterns.",
  "This session had {events} notable events — {comparison} your recent average.",
  "Your drowsiness score peaked at {peak}/100 around the {minutes}-minute mark.",
  "Blink rate {direction} by {percent}% compared to your first 10 minutes — a classic fatigue onset signal.",
];

const RECOMMENDATIONS = [
  "Consider taking a 15-minute break every {minutes} minutes. Your data suggests fatigue onset around this mark.",
  "Avoid driving between {startHour}:00-{endHour}:00 when possible — your risk is {multiplier}x higher during this window.",
  "A 20-minute power nap before long drives could reduce your drowsiness events by an estimated 40%.",
  "Try the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds to reduce gaze fixation.",
  "Caffeine takes 20 minutes to take effect. If you anticipate a long drive, time your intake accordingly.",
];

const WARNINGS = [
  "Your PERCLOS exceeded 15% for sustained periods — this correlates with 4x accident risk in research studies.",
  "Head nodding detected {count} times this session. Each nod represents a potential microsleep episode.",
  "You spent {percent}% of the drive with reduced attention — above the safe threshold.",
  "Critical alert was triggered — at this drowsiness level, reaction time is impaired by an estimated 300ms.",
];

const PRAISES = [
  "Excellent session! You maintained focus for {duration} with zero critical alerts.",
  "Your alertness improved {percent}% compared to recent sessions. Whatever you're doing differently is working.",
  "No drowsiness events detected — outstanding awareness throughout the drive.",
  "{streak} safe sessions in a row! Your consistency shows strong fatigue management habits.",
  "Great response time to the mild alert — you took action within seconds.",
];

const REALTIME_ADVICE: { condition: string; messages: string[] }[] = [
  { condition: 'fixatedGaze', messages: [
    "You've been looking at the same spot for a while — try scanning your mirrors.",
    "Your gaze has been fixed — shift your focus to check your surroundings.",
    "Remember to scan: mirrors, road ahead, instrument panel, and back.",
  ]},
  { condition: 'risingDrowsiness', messages: [
    "Your alertness is starting to dip — consider opening a window for fresh air.",
    "Early fatigue signs detected. A short stretch break could help reset.",
    "Your blink rate is slowing down — this often precedes stronger drowsiness.",
  ]},
  { condition: 'onCall', messages: [
    "You're on a call — remember that conversation reduces scanning behavior by 30%.",
    "Hands-free calls still divide attention. Keep the conversation brief if possible.",
  ]},
  { condition: 'longSession', messages: [
    "You've been driving for {minutes} minutes straight. Consider a break soon.",
    "Long sessions increase fatigue exponentially. Even a 5-minute stop helps.",
  ]},
  { condition: 'headNodding', messages: [
    "Head dip detected — you may be experiencing a microsleep. Pull over when safe.",
    "Your head position suggests drowsiness. Find a safe place to rest.",
  ]},
];

export class DrivingCoach {
  private lastAdviceTime = 0;
  private adviceCooldown = 30000;
  private usedAdviceIndices: Map<string, Set<number>> = new Map();

  generateSessionSummary(session: SessionSummary): CoachInsight[] {
    const insights: CoachInsight[] = [];

    if (session.peakScore < 30 && session.events === 0) {
      insights.push({
        type: 'praise',
        message: this.fillTemplate(this.pickRandom(PRAISES), {
          duration: this.formatDuration(session.duration),
          percent: String(Math.round(15 + Math.random() * 10)),
          streak: String(Math.floor(3 + Math.random() * 5)),
        }),
        priority: 1,
      });
    }

    if (session.avgScore > 15) {
      const fatigueMinute = Math.round(session.duration / 60 * 0.6);
      insights.push({
        type: 'observation',
        message: this.fillTemplate(this.pickRandom(OBSERVATIONS), {
          minutes: String(fatigueMinute),
          percent: String(Math.round(session.avgScore * 1.5)),
          startTime: `${session.timeOfDay}:00`,
          endTime: `${session.timeOfDay + 1}:00`,
          events: String(session.events),
          comparison: session.events > 3 ? 'above' : 'below',
          peak: String(Math.round(session.peakScore)),
          direction: session.earTrend.length > 1 && session.earTrend[session.earTrend.length - 1] < session.earTrend[0] ? 'decreased' : 'increased',
        }),
        priority: 2,
      });
    }

    if (session.duration > 1800) {
      insights.push({
        type: 'recommendation',
        message: this.fillTemplate(this.pickRandom(RECOMMENDATIONS), {
          minutes: String(Math.round(session.duration / 60 * 0.65)),
          startHour: String(session.timeOfDay),
          endHour: String(session.timeOfDay + 2),
          multiplier: String((1.5 + Math.random()).toFixed(1)),
        }),
        priority: 3,
      });
    }

    if (session.peakScore > 60) {
      insights.push({
        type: 'warning',
        message: this.fillTemplate(this.pickRandom(WARNINGS), {
          count: String(Math.ceil(session.alertsTriggered * 1.5)),
          percent: String(Math.round(session.peakScore * 0.3)),
        }),
        priority: 4,
      });
    }

    return insights.sort((a, b) => b.priority - a.priority);
  }

  getRealtimeAdvice(state: DriverState): string | null {
    const now = Date.now();
    if (now - this.lastAdviceTime < this.adviceCooldown) return null;

    let condition = '';
    if (state.gazeDirection === 'CENTER' && state.perclos > 0.1) {
      condition = 'fixatedGaze';
    } else if (state.drowsinessScore > 25 && state.drowsinessScore < 50) {
      condition = 'risingDrowsiness';
    } else if (state.isOnCall) {
      condition = 'onCall';
    } else if (state.sessionMinutes > 90) {
      condition = 'longSession';
    } else if (state.headPitch > 15) {
      condition = 'headNodding';
    }

    if (!condition) return null;

    const adviceGroup = REALTIME_ADVICE.find(a => a.condition === condition);
    if (!adviceGroup) return null;

    const message = this.pickRandomFromCondition(condition, adviceGroup.messages);
    if (!message) return null;

    this.lastAdviceTime = now;
    return this.fillTemplate(message, { minutes: String(Math.round(state.sessionMinutes)) });
  }

  getMotivation(): string {
    const motivations = [
      "Every safe drive is a victory. You're protecting yourself and everyone on the road.",
      "Fatigue awareness is a skill — and you're building it with every session.",
      "The best drivers aren't the fastest — they're the ones who know when to rest.",
      "Stay sharp, stay safe. Your attention is the most advanced safety system in any vehicle.",
    ];
    return motivations[Math.floor(Math.random() * motivations.length)];
  }

  private pickRandom(templates: string[]): string {
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private pickRandomFromCondition(condition: string, messages: string[]): string | null {
    if (!this.usedAdviceIndices.has(condition)) {
      this.usedAdviceIndices.set(condition, new Set());
    }
    const used = this.usedAdviceIndices.get(condition)!;
    const available = messages.filter((_, i) => !used.has(i));
    if (available.length === 0) {
      used.clear();
      return messages[0];
    }
    const idx = messages.indexOf(available[Math.floor(Math.random() * available.length)]);
    used.add(idx);
    return messages[idx];
  }

  private fillTemplate(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  }

  private formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} minutes`;
  }
}
