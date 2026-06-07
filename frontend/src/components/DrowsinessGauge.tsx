import { useRef, useEffect } from 'react';

interface DrowsinessGaugeProps {
  score: number;
  level: string;
  confidence: number;
  size?: number;
}

export default function DrowsinessGauge({ score, level, confidence, size = 200 }: DrowsinessGaugeProps) {
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
    const radius = size * 0.38;
    const lineWidth = size * 0.08;

    // Background arc
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0.75 * Math.PI, 2.25 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Score arc
    const scoreAngle = 0.75 * Math.PI + (score / 100) * 1.5 * Math.PI;
    const gradient = ctx.createLinearGradient(0, 0, size, 0);
    gradient.addColorStop(0, '#00FF66');
    gradient.addColorStop(0.4, '#FFE600');
    gradient.addColorStop(0.7, '#FF8C00');
    gradient.addColorStop(1, '#FF2A2A');

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0.75 * Math.PI, scoreAngle);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Glow at the endpoint
    const endX = cx + radius * Math.cos(scoreAngle);
    const endY = cy + radius * Math.sin(scoreAngle);
    const glowColor = score > 70 ? '#FF2A2A' : score > 45 ? '#FFE600' : '#00FF66';
    ctx.beginPath();
    ctx.arc(endX, endY, lineWidth * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Center text
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${size * 0.18}px monospace`;
    ctx.fillText(Math.round(score).toString(), cx, cy + size * 0.02);

    ctx.fillStyle = '#6B7280';
    ctx.font = `700 ${size * 0.06}px monospace`;
    ctx.fillText('RISK SCORE', cx, cy + size * 0.14);

    // Confidence indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = `600 ${size * 0.05}px monospace`;
    ctx.fillText(`${Math.round(confidence * 100)}% conf.`, cx, cy + size * 0.24);
  }, [score, level, confidence, size]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <canvas
        ref={canvasRef}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
      <div
        style={{
          padding: '6px 16px',
          borderRadius: '8px',
          backgroundColor:
            level === 'SEVERE' ? 'rgba(255, 42, 42, 0.2)' :
            level === 'MODERATE' ? 'rgba(255, 230, 0, 0.2)' :
            level === 'MILD' ? 'rgba(255, 140, 0, 0.2)' :
            'rgba(0, 255, 102, 0.2)',
          border: `1px solid ${
            level === 'SEVERE' ? '#FF2A2A' :
            level === 'MODERATE' ? '#FFE600' :
            level === 'MILD' ? '#FF8C00' :
            '#00FF66'
          }`,
        }}
      >
        <span
          style={{
            color:
              level === 'SEVERE' ? '#FF2A2A' :
              level === 'MODERATE' ? '#FFE600' :
              level === 'MILD' ? '#FF8C00' :
              '#00FF66',
            fontWeight: 900,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          {level}
        </span>
      </div>
    </div>
  );
}
