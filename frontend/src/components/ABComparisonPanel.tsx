interface ABComparisonProps {
  ear: number;
  earThreshold: number;
  fusionScore: number;
  fusionLevel: string;
  isTalking: boolean;
  mar: number;
  marThreshold: number;
}

export default function ABComparisonPanel({ ear, earThreshold, fusionScore, fusionLevel, isTalking, mar, marThreshold }: ABComparisonProps) {
  // Basic model: just EAR threshold
  const basicAlert = ear < earThreshold;
  const basicYawnAlert = mar > marThreshold;
  const basicLevel = basicAlert ? (ear < earThreshold * 0.7 ? 'SEVERE' : 'MILD') : basicYawnAlert ? 'MILD' : 'ALERT';

  // Fusion model: composite score with talking discrimination
  const fusionWouldAlert = fusionScore > 20;

  // False positive detection
  const isFalsePositive = basicYawnAlert && isTalking && !fusionWouldAlert;

  return (
    <div style={{ backgroundColor: '#111927', padding: '16px 20px', borderRadius: '20px', border: '2px solid rgba(255,255,255,0.1)' }}>
      <h3 style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 900, fontFamily: 'Orbitron', textTransform: 'uppercase', margin: '0 0 12px' }}>
        A/B Model Comparison
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Basic Model */}
        <div style={{
          padding: '14px',
          borderRadius: '12px',
          backgroundColor: 'rgba(0,0,0,0.3)',
          border: `1px solid ${basicAlert || basicYawnAlert ? '#FF2A2A40' : '#00FF6640'}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: '#9CA3AF', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>Basic (EAR-only)</span>
            <span style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.55rem',
              fontWeight: 900,
              backgroundColor: basicLevel !== 'ALERT' ? 'rgba(255,42,42,0.2)' : 'rgba(0,255,102,0.2)',
              color: basicLevel !== 'ALERT' ? '#FF2A2A' : '#00FF66',
            }}>{basicLevel}</span>
          </div>
          <p style={{ color: '#6B7280', fontSize: '0.6rem', margin: '0 0 4px' }}>Method: Single threshold</p>
          <p style={{ color: '#6B7280', fontSize: '0.6rem', margin: 0 }}>EAR {'<'} {earThreshold} → Alert</p>
          {isFalsePositive && (
            <div style={{ marginTop: '8px', padding: '6px 8px', borderRadius: '6px', backgroundColor: 'rgba(255,42,42,0.1)', border: '1px solid rgba(255,42,42,0.3)' }}>
              <span style={{ color: '#FF2A2A', fontSize: '0.55rem', fontWeight: 700 }}>FALSE POSITIVE — Talking, not yawning</span>
            </div>
          )}
        </div>

        {/* Fusion Model */}
        <div style={{
          padding: '14px',
          borderRadius: '12px',
          backgroundColor: 'rgba(0,0,0,0.3)',
          border: `1px solid ${fusionWouldAlert ? '#FFE60040' : '#00FF6640'}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: '#00F0FF', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>Fusion (7-signal)</span>
            <span style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.55rem',
              fontWeight: 900,
              backgroundColor: fusionLevel !== 'ALERT' ? 'rgba(255,230,0,0.2)' : 'rgba(0,255,102,0.2)',
              color: fusionLevel !== 'ALERT' ? '#FFE600' : '#00FF66',
            }}>{fusionLevel}</span>
          </div>
          <p style={{ color: '#6B7280', fontSize: '0.6rem', margin: '0 0 4px' }}>Method: Weighted ensemble + discrimination</p>
          <p style={{ color: '#6B7280', fontSize: '0.6rem', margin: 0 }}>Score: {Math.round(fusionScore)}/100</p>
          {isFalsePositive && (
            <div style={{ marginTop: '8px', padding: '6px 8px', borderRadius: '6px', backgroundColor: 'rgba(0,255,102,0.1)', border: '1px solid rgba(0,255,102,0.3)' }}>
              <span style={{ color: '#00FF66', fontSize: '0.55rem', fontWeight: 700 }}>CORRECT — Detected talking, suppressed alert</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0,240,255,0.15)' }}>
        <p style={{ color: '#9CA3AF', fontSize: '0.6rem', margin: 0, lineHeight: 1.4 }}>
          Fusion model uses PERCLOS, blink dynamics, head pose, gaze, and talking detection to reduce false positives while maintaining sensitivity to real drowsiness.
        </p>
      </div>
    </div>
  );
}
