import { Brain } from 'lucide-react';

interface XAIPanelProps {
  factors: { name: string; contribution: number; value: number }[];
  mlPrediction: { class: string; probabilities: number[]; confidence: number; inferenceTimeMs: number } | null;
  totalScore: number;
}

export default function XAIPanel({ factors, mlPrediction, totalScore }: XAIPanelProps) {
  const sortedFactors = [...factors].sort((a, b) => b.value * b.contribution - a.value * a.contribution);
  const topContributor = sortedFactors[0];

  return (
    <div style={{ backgroundColor: '#111927', padding: '20px', borderRadius: '20px', border: '2px solid rgba(112, 0, 255, 0.2)' }}>
      <h3 style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 900, fontFamily: 'Orbitron', textTransform: 'uppercase', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Brain size={14} style={{ color: '#7000FF' }} /> Explainable AI — Why this score?
      </h3>

      {/* Top explanation */}
      {topContributor && totalScore > 10 && (
        <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: 'rgba(112, 0, 255, 0.1)', border: '1px solid rgba(112, 0, 255, 0.3)', marginBottom: '12px' }}>
          <p style={{ color: '#fff', fontSize: '0.75rem', margin: 0, lineHeight: 1.4 }}>
            Primary factor: <span style={{ color: '#7000FF', fontWeight: 900 }}>{topContributor.name}</span> contributing{' '}
            <span style={{ color: '#FFE600', fontWeight: 900 }}>{Math.round(topContributor.value * topContributor.contribution)}%</span> to the risk score.
          </p>
        </div>
      )}

      {/* SHAP-like attribution bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
        {sortedFactors.map((f, i) => {
          const attribution = f.value * f.contribution;
          const barWidth = Math.min(100, attribution);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#6B7280', fontSize: '0.6rem', width: '80px', flexShrink: 0 }}>{f.name}</span>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', height: '12px' }}>
                {/* Positive attribution (pushes score up) */}
                <div style={{ width: '50%', display: 'flex', justifyContent: 'flex-end' }}>
                  {attribution > 0 && (
                    <div style={{
                      width: `${barWidth}%`,
                      height: '8px',
                      backgroundColor: '#FF2A2A',
                      borderRadius: '2px',
                      opacity: 0.4 + (attribution / 100) * 0.6,
                    }} />
                  )}
                </div>
                <div style={{ width: '2px', height: '12px', backgroundColor: '#6B7280', margin: '0 2px' }} />
                <div style={{ width: '50%' }} />
              </div>
              <span style={{ color: attribution > 15 ? '#FF2A2A' : '#6B7280', fontSize: '0.55rem', fontFamily: 'monospace', width: '28px', textAlign: 'right' }}>
                +{attribution.toFixed(0)}
              </span>
            </div>
          );
        })}
      </div>

      {/* ML Model Info */}
      {mlPrediction && (
        <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#6B7280', fontSize: '0.6rem', textTransform: 'uppercase' }}>TinyML Prediction</span>
            <span style={{ color: '#00F0FF', fontSize: '0.55rem', fontFamily: 'monospace' }}>{mlPrediction.inferenceTimeMs.toFixed(2)}ms</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            {['ALERT', 'MILD', 'MODERATE', 'SEVERE'].map((cls, i) => (
              <div key={cls} style={{
                flex: 1,
                textAlign: 'center',
                padding: '4px',
                borderRadius: '4px',
                backgroundColor: mlPrediction.class === cls ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                border: mlPrediction.class === cls ? '1px solid #00F0FF' : '1px solid transparent',
              }}>
                <span style={{ color: mlPrediction.class === cls ? '#00F0FF' : '#6B7280', fontSize: '0.5rem', fontWeight: 700, display: 'block' }}>{cls}</span>
                <span style={{ color: '#fff', fontSize: '0.6rem', fontFamily: 'monospace' }}>{(mlPrediction.probabilities[i] * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
