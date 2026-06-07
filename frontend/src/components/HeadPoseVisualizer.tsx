import { useRef, useEffect } from 'react';

interface HeadPoseVisualizerProps {
  pitch: number;
  yaw: number;
  roll: number;
  gazeDirection: string;
  gazeX: number;
  gazeY: number;
  size?: number;
}

export default function HeadPoseVisualizer({ pitch, yaw, roll, gazeDirection, gazeX, gazeY, size = 160 }: HeadPoseVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const headRadius = size * 0.3;

    // Background circle
    ctx.beginPath();
    ctx.arc(cx, cy, headRadius + 10, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Safe zone indicator
    const isDistracted = Math.abs(yaw) > 25 || Math.abs(pitch) > 20;
    ctx.beginPath();
    ctx.arc(cx, cy, headRadius + 10, 0, Math.PI * 2);
    ctx.strokeStyle = isDistracted ? 'rgba(255, 42, 42, 0.5)' : 'rgba(0, 255, 102, 0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw head oval with rotation
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((roll * Math.PI) / 180);

    // Head shape
    const scaleX = 1 - Math.abs(yaw) / 200;
    const scaleY = 1 - Math.abs(pitch) / 200;
    ctx.scale(scaleX, scaleY);

    ctx.beginPath();
    ctx.ellipse(0, 0, headRadius * 0.7, headRadius, 0, 0, Math.PI * 2);
    ctx.strokeStyle = isDistracted ? '#FF2A2A' : '#00F0FF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Nose direction indicator
    const noseX = (yaw / 90) * headRadius * 0.6;
    const noseY = (pitch / 90) * headRadius * 0.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(noseX, noseY);
    ctx.strokeStyle = '#FFE600';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Nose tip dot
    ctx.beginPath();
    ctx.arc(noseX, noseY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#FFE600';
    ctx.fill();

    // Eyes (simplified)
    const eyeY = -headRadius * 0.2;
    const eyeSpacing = headRadius * 0.3;
    ctx.beginPath();
    ctx.arc(-eyeSpacing + noseX * 0.3, eyeY + noseY * 0.3, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#00F0FF';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeSpacing + noseX * 0.3, eyeY + noseY * 0.3, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Gaze direction indicator
    ctx.fillStyle = '#6B7280';
    ctx.font = `bold ${size * 0.06}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`GAZE: ${gazeDirection}`, cx, size - 8);
  }, [pitch, yaw, roll, gazeDirection, gazeX, gazeY, size]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <canvas ref={canvasRef} style={{ width: `${size}px`, height: `${size}px` }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '8px', width: '100%' }}>
        {[
          { label: 'Pitch', value: pitch, color: '#FF007F' },
          { label: 'Yaw', value: yaw, color: '#00F0FF' },
          { label: 'Roll', value: roll, color: '#FFE600' },
        ].map(axis => (
          <div key={axis.label} style={{ textAlign: 'center' }}>
            <span style={{ color: '#6B7280', fontSize: '0.6rem', textTransform: 'uppercase', display: 'block' }}>{axis.label}</span>
            <span style={{ color: axis.color, fontSize: '0.85rem', fontWeight: 900, fontFamily: 'monospace' }}>
              {axis.value.toFixed(1)}°
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
