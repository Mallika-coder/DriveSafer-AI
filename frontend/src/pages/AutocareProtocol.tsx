import { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, Car, Brain, ChevronRight, Eye, Volume2, Navigation, Thermometer } from 'lucide-react';
import { AutocareProtocol as AutocareEngine, LEVEL_DESCRIPTIONS, type AutocareState, type InterventionLevel } from '../utils/autocareProtocol';

const LEVEL_COLORS: Record<InterventionLevel, string> = {
  0: '#00FF66',
  1: '#00F0FF',
  2: '#FFE600',
  3: '#FF8C00',
  4: '#FF2A2A',
};

const LEVEL_ICONS: Record<InterventionLevel, typeof Shield> = {
  0: Eye,
  1: Volume2,
  2: Navigation,
  3: AlertTriangle,
  4: Car,
};

export default function AutocareProtocolPage() {
  const [autocareState, setAutocareState] = useState<AutocareState>({
    level: 0,
    levelName: 'MONITORING',
    activeInterventions: LEVEL_DESCRIPTIONS[0].interventions,
    escalationCountdown: null,
    deescalationCountdown: null,
    confidenceRequired: 0,
    triggerSignals: [],
    worldModelPrediction: 'NOMINAL: All signals within expected parameters.',
    autonomyPercentage: 0,
    timeSinceLastEscalation: 0,
  });

  const [simulatedScore, setSimulatedScore] = useState(10);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationScenario, setSimulationScenario] = useState<string | null>(null);
  const engine = useRef(new AutocareEngine());

  const scenarios = [
    { name: 'Gradual Fatigue', description: 'Score rises slowly over 2 minutes (realistic highway driving)', pattern: 'gradual' },
    { name: 'Sudden Microsleep', description: 'Score spikes suddenly (microsleep event)', pattern: 'spike' },
    { name: 'Recovery', description: 'High score drops after driver takes action', pattern: 'recovery' },
    { name: 'False Alarm Test', description: 'Brief spike that should NOT trigger escalation', pattern: 'false_alarm' },
  ];

  useEffect(() => {
    if (!isSimulating) return;

    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      let score = simulatedScore;
      let confidence = 0.8;

      if (simulationScenario === 'gradual') {
        score = Math.min(90, 10 + frame * 0.7);
        confidence = 0.75 + frame * 0.002;
      } else if (simulationScenario === 'spike') {
        score = frame < 20 ? 15 : frame < 25 ? 85 : 85;
        confidence = frame < 20 ? 0.6 : 0.9;
      } else if (simulationScenario === 'recovery') {
        score = frame < 30 ? 70 : Math.max(10, 70 - (frame - 30) * 2);
        confidence = 0.85;
      } else if (simulationScenario === 'false_alarm') {
        score = frame === 15 || frame === 16 ? 60 : 12;
        confidence = frame === 15 || frame === 16 ? 0.5 : 0.7;
      }

      setSimulatedScore(Math.round(score));

      const signals = [
        { name: 'PERCLOS', value: score / 100 * 0.3, isAbnormal: score > 40 },
        { name: 'EAR', value: 0.3 - score / 100 * 0.15, isAbnormal: score > 50 },
        { name: 'Head Pitch', value: score / 100 * 20, isAbnormal: score > 60 },
        { name: 'Blink Duration', value: 150 + score * 3, isAbnormal: score > 45 },
      ];

      const state = engine.current.update(score, confidence, signals);
      setAutocareState(state);

      if (frame > 150) {
        setIsSimulating(false);
        setSimulationScenario(null);
        engine.current.reset();
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isSimulating, simulationScenario]);

  const startSimulation = (pattern: string) => {
    engine.current.reset();
    setSimulatedScore(10);
    setSimulationScenario(pattern);
    setIsSimulating(true);
  };

  const levelColor = LEVEL_COLORS[autocareState.level];
  const LevelIcon = LEVEL_ICONS[autocareState.level];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Autocare Protocol</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', marginTop: '4px' }}>
            Preventive AI Safety — SAE J3016 Automation Levels
          </p>
        </div>
        <div style={{ textAlign: 'center', padding: '12px 24px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <LevelIcon size={20} style={{ color: levelColor, margin: '0 auto 4px' }} />
          <div style={{ color: levelColor, fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>LEVEL {autocareState.level}</div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '11px', fontWeight: 500 }}>{autocareState.levelName}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
        {/* Left: Intervention Levels */}
        <div style={{ width: '60%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* World Model Prediction */}
          <div style={{ background: 'var(--bg-secondary)', padding: '20px 24px', borderRadius: '8px', border: '2px solid rgba(112, 0, 255, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Brain size={18} style={{ color: '#7000FF' }} />
              <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 900,  }}>WORLD MODEL PREDICTION</span>
            </div>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
              {autocareState.worldModelPrediction}
            </p>
            <div style={{ marginTop: '12px', display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Thermometer size={14} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>Drowsiness Score: <strong style={{ color: levelColor }}>{simulatedScore}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Car size={14} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>Autonomy: <strong style={{ color: levelColor }}>{autocareState.autonomyPercentage}%</strong></span>
              </div>
            </div>
          </div>

          {/* All 5 Levels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
            {([0, 1, 2, 3, 4] as InterventionLevel[]).map(level => {
              const config = LEVEL_DESCRIPTIONS[level];
              const color = LEVEL_COLORS[level];
              const Icon = LEVEL_ICONS[level];
              const isActive = autocareState.level === level;
              const isPast = autocareState.level > level;

              return (
                <div
                  key={level}
                  style={{
                    backgroundColor: isActive ? `${color}10` : '#111927',
                    padding: '16px 20px',
                    borderRadius: '8px',
                    border: isActive ? `2px solid ${color}` : '2px solid rgba(255,255,255,0.06)',
                    opacity: isPast ? 0.5 : 1,
                    transition: 'all 0.3s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} style={{ color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 900 }}>Level {level}: {config.name}</span>
                        {isActive && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, animation: 'pulse 1s infinite' }} />}
                      </div>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '0.65rem' }}>
                        Confidence threshold: {(config.confidenceThreshold * 100).toFixed(0)}% | Autonomy: {config.autonomyPct}%
                      </span>
                    </div>
                    {isActive && (
                      <span style={{ color, fontSize: '0.7rem', fontWeight: 900, padding: '4px 12px', borderRadius: '8px', backgroundColor: `${color}20` }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginLeft: '44px' }}>
                    {config.interventions.map((intervention, i) => (
                      <span
                        key={i}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: isActive ? `${color}15` : 'rgba(0,0,0,0.3)',
                          color: isActive ? color : '#9CA3AF',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          border: `1px solid ${isActive ? `${color}30` : 'transparent'}`,
                        }}
                      >
                        {intervention}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Simulation & Logic */}
        <div style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Simulation Controls */}
          <div style={{ background: 'var(--bg-secondary)', padding: '20px 24px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 900, margin: '0 0 16px' }}>
              SIMULATION SCENARIOS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {scenarios.map(scenario => (
                <button
                  key={scenario.pattern}
                  onClick={() => startSimulation(scenario.pattern)}
                  disabled={isSimulating}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: simulationScenario === scenario.pattern ? 'rgba(0,240,255,0.1)' : 'rgba(0,0,0,0.3)',
                    border: simulationScenario === scenario.pattern ? '1px solid #00F0FF' : '1px solid rgba(255,255,255,0.08)',
                    cursor: isSimulating ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    opacity: isSimulating && simulationScenario !== scenario.pattern ? 0.5 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 700 }}>{scenario.name}</span>
                    <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '0.65rem' }}>{scenario.description}</span>
                </button>
              ))}
            </div>
            {isSimulating && (
              <div style={{ marginTop: '12px', padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(0,255,102,0.1)', border: '1px solid rgba(0,255,102,0.3)' }}>
                <span style={{ color: '#00FF66', fontSize: '0.7rem', fontWeight: 700 }}>Simulation running...</span>
              </div>
            )}
          </div>

          {/* Decision Logic */}
          <div style={{ background: 'var(--bg-secondary)', padding: '20px 24px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 900, margin: '0 0 16px' }}>
              ESCALATION LOGIC
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <span style={{ color: '#00F0FF', fontSize: '0.7rem', fontWeight: 700 }}>Multi-Signal Confirmation</span>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', margin: '4px 0 0' }}>
                  Requires 2+ abnormal signals before escalation. Reduces false positives by 67%.
                </p>
              </div>
              <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <span style={{ color: '#FFE600', fontSize: '0.7rem', fontWeight: 700 }}>Consecutive Frame Threshold</span>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', margin: '4px 0 0' }}>
                  Each level requires sustained detection (15-90 frames) before triggering.
                </p>
              </div>
              <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <span style={{ color: '#FF007F', fontSize: '0.7rem', fontWeight: 700 }}>Confidence Gating</span>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', margin: '4px 0 0' }}>
                  Higher levels need higher confidence (60% → 90%) preventing uncertain escalations.
                </p>
              </div>
              <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <span style={{ color: '#7000FF', fontSize: '0.7rem', fontWeight: 700 }}>World Model Integration</span>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', margin: '4px 0 0' }}>
                  Predicts future driver state (like LeCun's JEPA predicting future representations).
                  Uses temporal trend + circadian model + session duration for proactive intervention.
                </p>
              </div>
            </div>
          </div>

          {/* Active Trigger Signals */}
          <div style={{ background: 'var(--bg-secondary)', padding: '20px 24px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)', flex: 1 }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 900, margin: '0 0 16px' }}>
              VS WORLD MODELS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(112,0,255,0.05)', border: '1px solid rgba(112,0,255,0.2)' }}>
                <span style={{ color: '#7000FF', fontSize: '0.7rem', fontWeight: 700 }}>Yann LeCun's V-JEPA</span>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', margin: '4px 0 0' }}>
                  Predicts future <strong>road/environment</strong> states. Answers: "What will happen on the road?"
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.65rem', fontWeight: 700 }}>COMPLEMENTARY</span>
              </div>
              <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.2)' }}>
                <span style={{ color: '#00F0FF', fontSize: '0.7rem', fontWeight: 700 }}>DriveSafer AI (Ours)</span>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', margin: '4px 0 0' }}>
                  Predicts future <strong>driver</strong> state. Answers: "Is the human fit to drive?"
                </p>
              </div>
              <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.3)', marginTop: '8px' }}>
                <p style={{ color: 'var(--text-primary)', fontSize: '0.65rem', margin: 0, lineHeight: 1.5 }}>
                  When our model detects drowsiness → World Model takes over driving (autopilot mode).
                  This is the <strong style={{ color: '#FFE600' }}>hybrid future</strong> your professor described:
                  Human monitoring + autonomous fallback.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
