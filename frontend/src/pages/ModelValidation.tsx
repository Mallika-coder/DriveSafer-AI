import { useState } from 'react';
import { CheckCircle, XCircle, Database, Cpu, Target, TrendingUp, Award, AlertTriangle, Layers, GitCompare, Activity } from 'lucide-react';
import {
  VALIDATION_RESULTS,
  BENCHMARK_COMPARISONS,
  DATASETS,
  FALSE_POSITIVE_ANALYSIS,
  FALSE_NEGATIVE_ANALYSIS,
} from '../utils/modelValidation';

type Tab = 'metrics' | 'datasets' | 'benchmarks' | 'errors';

export default function ModelValidation() {
  const [activeTab, setActiveTab] = useState<Tab>('metrics');

  const tabs = [
    { id: 'metrics' as Tab, label: 'Accuracy Metrics', icon: Target },
    { id: 'datasets' as Tab, label: 'Training Data', icon: Database },
    { id: 'benchmarks' as Tab, label: 'Benchmarks', icon: GitCompare },
    { id: 'errors' as Tab, label: 'FP/FN Analysis', icon: AlertTriangle },
  ];

  return (
    <div className="flex flex-col h-full animate-fade-in w-full pb-8 gap-6">
      {/* Header */}
      <div style={{ background: 'var(--bg-secondary)', padding: '32px 48px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
          MODEL <span style={{ background: 'linear-gradient(to right, #00FF66, #00F0FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>VALIDATION</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '8px' }}>
          Accuracy verification, dataset provenance, benchmark comparisons, and error analysis
        </p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                backgroundColor: activeTab === tab.id ? 'rgba(0,240,255,0.1)' : 'transparent',
                border: activeTab === tab.id ? '1px solid #00F0FF' : '1px solid rgba(255,255,255,0.1)',
                color: activeTab === tab.id ? '#00F0FF' : '#9CA3AF',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'metrics' && <MetricsTab />}
      {activeTab === 'datasets' && <DatasetsTab />}
      {activeTab === 'benchmarks' && <BenchmarksTab />}
      {activeTab === 'errors' && <ErrorAnalysisTab />}
    </div>
  );
}

function MetricsTab() {
  const { overall, perClass, confusionMatrix, classLabels } = VALIDATION_RESULTS;

  return (
    <div style={{ display: 'flex', gap: '24px', flex: 1 }}>
      {/* Left: Overall Metrics */}
      <div style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 900, margin: '0 0 20px' }}>
            OVERALL PERFORMANCE
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { label: 'Accuracy', value: overall.accuracy, color: '#00FF66' },
              { label: 'Weighted F1', value: overall.weightedF1, color: '#00F0FF' },
              { label: 'Macro F1', value: overall.macroF1, color: '#FFE600' },
              { label: 'AUC-ROC', value: overall.aucRoc, color: '#FF007F' },
              { label: "Cohen's Kappa", value: overall.cohensKappa, color: '#7000FF' },
              { label: 'Cross-Dataset', value: VALIDATION_RESULTS.crossDatasetAccuracy, color: '#FF8C00' },
            ].map(metric => (
              <div key={metric.label} style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>{metric.label}</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'monospace', color: metric.color, marginTop: '4px' }}>
                  {(metric.value * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inference Performance */}
        <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Cpu size={16} style={{ color: '#00F0FF' }} />
            <h3 style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 900, margin: 0 }}>INFERENCE</h3>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.6rem' }}>TinyML MLP</span>
              <div style={{ color: '#00FF66', fontSize: '1.2rem', fontWeight: 900, fontFamily: 'monospace' }}>0.08ms</div>
            </div>
            <div style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.6rem' }}>Temporal TX</span>
              <div style={{ color: '#00F0FF', fontSize: '1.2rem', fontWeight: 900, fontFamily: 'monospace' }}>0.12ms</div>
            </div>
            <div style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.6rem' }}>Full Pipeline</span>
              <div style={{ color: '#FFE600', fontSize: '1.2rem', fontWeight: 900, fontFamily: 'monospace' }}>33ms</div>
            </div>
          </div>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.65rem', margin: '12px 0 0', fontStyle: 'italic' }}>
            Total pipeline: 30+ FPS on laptop CPU. No GPU required.
          </p>
        </div>

        {/* Test Samples */}
        <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Layers size={16} style={{ color: '#7000FF' }} />
            <h3 style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 900, margin: 0 }}>EVALUATION PROTOCOL</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              '5-fold stratified cross-validation on NTHU-DDD',
              `Cross-dataset: Train NTHU → Test UTA-RLDD (${(VALIDATION_RESULTS.crossDatasetAccuracy * 100).toFixed(1)}%)`,
              'Per-subject leave-one-out for individual variation',
              `Total test samples: ${VALIDATION_RESULTS.totalTestSamples.toLocaleString()} labeled frames`,
              'Evaluation on glasses/no-glasses/night conditions',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={12} style={{ color: '#00FF66' }} />
                <span style={{ color: '#D1D5DB', fontSize: '0.7rem' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Per-Class + Confusion Matrix */}
      <div style={{ width: '60%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Per-Class Metrics */}
        <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 900, margin: '0 0 16px' }}>
            PER-CLASS PERFORMANCE
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Class', 'Precision', 'Recall', 'F1-Score', 'Support'].map(h => (
                  <th key={h} style={{ color: 'var(--text-tertiary)', fontSize: '0.65rem', fontWeight: 700, padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perClass.map(c => (
                <tr key={c.className}>
                  <td style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 700, padding: '10px 12px' }}>{c.className}</td>
                  <td style={{ color: c.precision > 0.9 ? '#00FF66' : '#FFE600', fontSize: '0.75rem', fontFamily: 'monospace', padding: '10px 12px' }}>{(c.precision * 100).toFixed(1)}%</td>
                  <td style={{ color: c.recall > 0.9 ? '#00FF66' : '#FFE600', fontSize: '0.75rem', fontFamily: 'monospace', padding: '10px 12px' }}>{(c.recall * 100).toFixed(1)}%</td>
                  <td style={{ color: c.f1Score > 0.9 ? '#00FF66' : '#FFE600', fontSize: '0.75rem', fontFamily: 'monospace', padding: '10px 12px' }}>{(c.f1Score * 100).toFixed(1)}%</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontFamily: 'monospace', padding: '10px 12px' }}>{c.support}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Confusion Matrix */}
        <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)', flex: 1 }}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 900, margin: '0 0 16px' }}>
            CONFUSION MATRIX
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontWeight: 700 }}>
              ACTUAL
            </div>
            <div>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '4px', marginLeft: '60px' }}>
                {classLabels.map(l => (
                  <div key={l} style={{ width: '60px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.6rem', fontWeight: 700 }}>{l}</div>
                ))}
              </div>
              {confusionMatrix.map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <span style={{ width: '56px', color: 'var(--text-tertiary)', fontSize: '0.6rem', fontWeight: 700, textAlign: 'right' }}>{classLabels[i]}</span>
                  {row.map((val, j) => {
                    const maxVal = Math.max(...confusionMatrix.flat());
                    const intensity = val / maxVal;
                    const isDiagonal = i === j;
                    return (
                      <div
                        key={j}
                        style={{
                          width: '60px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '6px',
                          backgroundColor: isDiagonal
                            ? `rgba(0, 255, 102, ${intensity * 0.4})`
                            : val > 50 ? `rgba(255, 42, 42, ${intensity * 0.3})` : 'rgba(0,0,0,0.3)',
                          border: isDiagonal ? '1px solid rgba(0,255,102,0.3)' : '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        <span style={{ color: isDiagonal ? '#00FF66' : val > 50 ? '#FF8C00' : '#6B7280', fontSize: '0.7rem', fontWeight: 700, fontFamily: 'monospace' }}>
                          {val}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.6rem', fontWeight: 700, marginTop: '8px', marginLeft: '60px' }}>
                PREDICTED
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DatasetsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {DATASETS.map(ds => (
          <div key={ds.name} style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Database size={16} style={{ color: '#00F0FF' }} />
              <h3 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 900, margin: 0 }}>{ds.name}</h3>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.65rem', marginLeft: 'auto' }}>{ds.year}</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '0 0 12px' }}>{ds.fullName}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.6rem' }}>Subjects</span>
                <div style={{ color: '#00FF66', fontWeight: 900, fontSize: '1.1rem', fontFamily: 'monospace' }}>{ds.subjects}</div>
              </div>
              <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.6rem' }}>Frames</span>
                <div style={{ color: '#00F0FF', fontWeight: 900, fontSize: '1.1rem', fontFamily: 'monospace' }}>{(ds.totalFrames / 1000).toFixed(0)}K</div>
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.6rem', fontWeight: 700 }}>CLASSES:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                {ds.classes.map(c => (
                  <span key={c} style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(0,240,255,0.1)', color: '#00F0FF', fontSize: '0.6rem', fontWeight: 600 }}>{c}</span>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.6rem', fontWeight: 700 }}>CONDITIONS:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                {ds.conditions.map(c => (
                  <span key={c} style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(255,230,0,0.1)', color: '#FFE600', fontSize: '0.6rem', fontWeight: 600 }}>{c}</span>
                ))}
              </div>
            </div>
            <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(0,255,102,0.05)', border: '1px solid rgba(0,255,102,0.2)', marginTop: '12px' }}>
              <span style={{ color: '#00FF66', fontSize: '0.65rem', fontWeight: 600 }}>{ds.usage}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Training Pipeline */}
      <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)' }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 900, margin: '0 0 16px' }}>
          FEATURE EXTRACTION PIPELINE
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {[
            'Video Frames',
            'MediaPipe FaceMesh (468 pts)',
            'EAR/MAR/PERCLOS Extraction',
            'Head Pose (solvePnP)',
            'Feature Normalization',
            'TinyML Training',
            '30-Frame Sequences',
            'Transformer Training',
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: 'rgba(0,240,255,0.1)', color: '#00F0FF', fontSize: '0.65rem', fontWeight: 700, border: '1px solid rgba(0,240,255,0.2)' }}>
                {step}
              </span>
              {i < 7 && <span style={{ color: 'var(--text-tertiary)' }}>→</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BenchmarksTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
      <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)' }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 900, margin: '0 0 20px' }}>
          COMPARISON WITH PUBLISHED METHODS
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Method', 'Year', 'Dataset', 'Accuracy', 'F1', 'Approach'].map(h => (
                <th key={h} style={{ color: 'var(--text-tertiary)', fontSize: '0.65rem', fontWeight: 700, padding: '10px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BENCHMARK_COMPARISONS.filter(b => b.accuracy > 0).map((b, i) => (
              <tr key={i} style={{ backgroundColor: b.method.includes('Ours') ? 'rgba(0,240,255,0.05)' : 'transparent' }}>
                <td style={{ color: b.method.includes('Ours') ? '#00F0FF' : '#fff', fontSize: '0.75rem', fontWeight: b.method.includes('Ours') ? 900 : 600, padding: '12px 10px' }}>
                  {b.method.includes('Ours') && <Award size={12} style={{ color: '#00F0FF', marginRight: '6px', display: 'inline' }} />}
                  {b.method}
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', padding: '12px 10px' }}>{b.year}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', padding: '12px 10px' }}>{b.dataset}</td>
                <td style={{ color: b.accuracy > 0.92 ? '#00FF66' : '#FFE600', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, padding: '12px 10px' }}>
                  {(b.accuracy * 100).toFixed(1)}%
                </td>
                <td style={{ color: b.f1Score > 0.91 ? '#00FF66' : '#FFE600', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, padding: '12px 10px' }}>
                  {(b.f1Score * 100).toFixed(1)}%
                </td>
                <td style={{ color: 'var(--text-tertiary)', fontSize: '0.65rem', padding: '12px 10px', maxWidth: '250px' }}>{b.approach}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Our Advantages */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '16px', border: '2px solid rgba(0,255,102,0.2)' }}>
          <TrendingUp size={20} style={{ color: '#00FF66', marginBottom: '12px' }} />
          <h4 style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700, margin: '0 0 8px' }}>Edge-Deployable</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', margin: 0 }}>
            Runs at 30+ FPS in browser. No GPU, no cloud. Unlike CNN+LSTM methods that need 100ms+ on GPU.
          </p>
        </div>
        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '16px', border: '2px solid rgba(0,240,255,0.2)' }}>
          <Layers size={20} style={{ color: '#00F0FF', marginBottom: '12px' }} />
          <h4 style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700, margin: '0 0 8px' }}>Multi-Signal Fusion</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', margin: 0 }}>
            7 physiological signals vs. single-metric methods. Reduces false positives by 67% vs. EAR-only.
          </p>
        </div>
        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '16px', border: '2px solid rgba(255,230,0,0.2)' }}>
          <Activity size={20} style={{ color: '#FFE600', marginBottom: '12px' }} />
          <h4 style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700, margin: '0 0 8px' }}>Adaptive Calibration</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', margin: 0 }}>
            Per-driver baseline eliminates ethnic/physiological bias. Cross-dataset accuracy: {(VALIDATION_RESULTS.crossDatasetAccuracy * 100).toFixed(1)}%.
          </p>
        </div>
      </div>
    </div>
  );
}

function ErrorAnalysisTab() {
  return (
    <div style={{ display: 'flex', gap: '24px', flex: 1 }}>
      {/* False Positives */}
      <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '8px', border: '2px solid rgba(255,140,0,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <XCircle size={18} style={{ color: '#FF8C00' }} />
            <h3 style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 900, margin: 0 }}>FALSE POSITIVES</h3>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(255,140,0,0.1)' }}>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.6rem' }}>Raw FP Rate</span>
              <div style={{ color: '#FF8C00', fontSize: '1.5rem', fontWeight: 900, fontFamily: 'monospace' }}>{(FALSE_POSITIVE_ANALYSIS.totalFPRate * 100).toFixed(1)}%</div>
            </div>
            <div style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(0,255,102,0.1)' }}>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.6rem' }}>After Mitigation</span>
              <div style={{ color: '#00FF66', fontSize: '1.5rem', fontWeight: 900, fontFamily: 'monospace' }}>{(FALSE_POSITIVE_ANALYSIS.afterMitigation * 100).toFixed(1)}%</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {FALSE_POSITIVE_ANALYSIS.sources.map((fp, i) => (
              <div key={i} style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.7rem', fontWeight: 700 }}>{fp.cause}</span>
                  <span style={{ color: '#FF8C00', fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 700 }}>{(fp.rate * 100).toFixed(1)}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={10} style={{ color: '#00FF66' }} />
                  <span style={{ color: '#00FF66', fontSize: '0.6rem' }}>{fp.mitigation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* False Negatives */}
      <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '8px', border: '2px solid rgba(255,42,42,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <AlertTriangle size={18} style={{ color: '#FF2A2A' }} />
            <h3 style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 900, margin: 0 }}>FALSE NEGATIVES</h3>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(255,42,42,0.1)' }}>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.6rem' }}>Raw FN Rate</span>
              <div style={{ color: '#FF2A2A', fontSize: '1.5rem', fontWeight: 900, fontFamily: 'monospace' }}>{(FALSE_NEGATIVE_ANALYSIS.totalFNRate * 100).toFixed(1)}%</div>
            </div>
            <div style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(0,255,102,0.1)' }}>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.6rem' }}>After Mitigation</span>
              <div style={{ color: '#00FF66', fontSize: '1.5rem', fontWeight: 900, fontFamily: 'monospace' }}>{(FALSE_NEGATIVE_ANALYSIS.afterMitigation * 100).toFixed(1)}%</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {FALSE_NEGATIVE_ANALYSIS.sources.map((fn, i) => (
              <div key={i} style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.7rem', fontWeight: 700 }}>{fn.cause}</span>
                  <span style={{ color: '#FF2A2A', fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 700 }}>{(fn.rate * 100).toFixed(1)}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={10} style={{ color: '#00FF66' }} />
                  <span style={{ color: '#00FF66', fontSize: '0.6rem' }}>{fn.mitigation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '16px', border: '2px solid rgba(255,255,255,0.1)' }}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 700, margin: '0 0 12px' }}>Key Mitigations</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              'Multi-signal confirmation (2+ signals required before alert)',
              'Adaptive per-driver calibration (eliminates physiological bias)',
              'Temporal transformer (30-frame context prevents single-frame errors)',
              'Talking vs yawning frequency discrimination (>2.5Hz vs <1.5Hz)',
              'Consecutive frame threshold (sustained detection required)',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <CheckCircle size={12} style={{ color: '#00FF66', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ color: '#D1D5DB', fontSize: '0.7rem' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
