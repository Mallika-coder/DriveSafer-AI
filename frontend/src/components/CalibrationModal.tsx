import { Crosshair, CheckCircle } from 'lucide-react';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCalibration: () => void;
  progress: number;
  isCalibrating: boolean;
  calibrationData: {
    baselineEAR: number;
    earThreshold: number;
    marThreshold: number;
    samplesCollected: number;
  } | null;
}

export default function CalibrationModal({
  isOpen,
  onClose,
  onStartCalibration,
  progress,
  isCalibrating,
  calibrationData,
}: CalibrationModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#111927',
          borderRadius: '32px',
          border: '2px solid rgba(0, 240, 255, 0.3)',
          padding: '48px',
          maxWidth: '500px',
          width: '90%',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <Crosshair size={32} style={{ color: '#00F0FF' }} />
          <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 900, fontFamily: 'Orbitron', margin: 0 }}>
            ADAPTIVE CALIBRATION
          </h2>
        </div>

        <p style={{ color: '#9CA3AF', fontSize: '1rem', lineHeight: 1.6, marginBottom: '24px' }}>
          Look straight at the camera with a neutral expression for 10 seconds.
          The system will learn your personal baseline metrics for more accurate drowsiness detection.
        </p>

        {isCalibrating && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#00F0FF', fontSize: '0.875rem', fontWeight: 700 }}>Collecting samples...</span>
              <span style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 900, fontFamily: 'monospace' }}>
                {Math.round(progress * 100)}%
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progress * 100}%`,
                  height: '100%',
                  backgroundColor: '#00F0FF',
                  borderRadius: '4px',
                  transition: 'width 0.3s',
                  boxShadow: '0 0 10px #00F0FF',
                }}
              />
            </div>
          </div>
        )}

        {calibrationData && !isCalibrating && (
          <div style={{ backgroundColor: 'rgba(0, 255, 102, 0.1)', border: '1px solid #00FF66', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <CheckCircle size={20} style={{ color: '#00FF66' }} />
              <span style={{ color: '#00FF66', fontWeight: 700, fontSize: '0.875rem' }}>Calibration Complete</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <span style={{ color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Baseline EAR</span>
                <p style={{ color: '#fff', fontWeight: 900, fontFamily: 'monospace', margin: '4px 0 0' }}>{calibrationData.baselineEAR.toFixed(3)}</p>
              </div>
              <div>
                <span style={{ color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>EAR Threshold</span>
                <p style={{ color: '#FF2A2A', fontWeight: 900, fontFamily: 'monospace', margin: '4px 0 0' }}>{calibrationData.earThreshold.toFixed(3)}</p>
              </div>
              <div>
                <span style={{ color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>MAR Threshold</span>
                <p style={{ color: '#FFE600', fontWeight: 900, fontFamily: 'monospace', margin: '4px 0 0' }}>{calibrationData.marThreshold.toFixed(3)}</p>
              </div>
              <div>
                <span style={{ color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Samples</span>
                <p style={{ color: '#fff', fontWeight: 900, fontFamily: 'monospace', margin: '4px 0 0' }}>{calibrationData.samplesCollected}</p>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={onStartCalibration}
            disabled={isCalibrating}
            style={{
              flex: 1,
              backgroundColor: isCalibrating ? '#374151' : '#00F0FF',
              color: isCalibrating ? '#6B7280' : '#050B14',
              border: 'none',
              borderRadius: '16px',
              padding: '16px 24px',
              fontSize: '1rem',
              fontWeight: 900,
              cursor: isCalibrating ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {isCalibrating ? 'Calibrating...' : 'Start Calibration'}
          </button>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              color: '#9CA3AF',
              border: '2px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '16px 24px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
