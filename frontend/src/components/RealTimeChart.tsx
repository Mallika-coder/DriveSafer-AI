import { useRef, useEffect } from 'react';

interface DataPoint {
  time: number;
  ear: number;
  mar: number;
  drowsinessScore: number;
}

interface RealTimeChartProps {
  data: DataPoint[];
  earThreshold: number;
  width?: number;
  height?: number;
}

export default function RealTimeChart({ data, earThreshold, width = 600, height = 200 }: RealTimeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 16);
    ctx.fill();

    if (data.length < 2) {
      ctx.fillStyle = '#6B7280';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Collecting data...', width / 2, height / 2);
      return;
    }

    const padding = { top: 20, bottom: 30, left: 50, right: 20 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // EAR threshold line
    const threshY = padding.top + chartHeight * (1 - earThreshold / 0.5);
    ctx.strokeStyle = 'rgba(255, 42, 42, 0.5)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding.left, threshY);
    ctx.lineTo(width - padding.right, threshY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#FF2A2A';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`EAR=${earThreshold}`, padding.left + 4, threshY - 4);

    // Y-axis labels
    ctx.fillStyle = '#6B7280';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const value = (0.5 * (4 - i)) / 4;
      const y = padding.top + (chartHeight * i) / 4;
      ctx.fillText(value.toFixed(2), padding.left - 8, y + 4);
    }

    const visibleData = data.slice(-120);

    // Draw EAR line
    drawLine(ctx, visibleData, 'ear', '#00F0FF', 0.5, padding, chartWidth, chartHeight);

    // Draw MAR line
    drawLine(ctx, visibleData, 'mar', '#FF007F', 1.0, padding, chartWidth, chartHeight);

    // Draw drowsiness score (scaled to 0-1 range)
    drawLine(ctx, visibleData, 'drowsinessScore', '#FFE600', 100, padding, chartWidth, chartHeight, true);

    // Legend
    const legends = [
      { color: '#00F0FF', label: 'EAR' },
      { color: '#FF007F', label: 'MAR' },
      { color: '#FFE600', label: 'Risk' },
    ];
    ctx.font = 'bold 10px monospace';
    let legendX = width - padding.right - 150;
    legends.forEach(l => {
      ctx.fillStyle = l.color;
      ctx.fillRect(legendX, padding.top - 12, 12, 3);
      ctx.fillText(l.label, legendX + 16, padding.top - 8);
      legendX += 50;
    });
  }, [data, earThreshold, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: `${height}px`, borderRadius: '16px' }}
    />
  );
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  data: DataPoint[],
  key: keyof DataPoint,
  color: string,
  maxValue: number,
  padding: { top: number; bottom: number; left: number; right: number },
  chartWidth: number,
  chartHeight: number,
  dashed = false
) {
  if (data.length < 2) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  if (dashed) ctx.setLineDash([4, 4]);
  ctx.beginPath();

  for (let i = 0; i < data.length; i++) {
    const x = padding.left + (i / (data.length - 1)) * chartWidth;
    const normalized = Math.min(1, (data[i][key] as number) / maxValue);
    const y = padding.top + chartHeight * (1 - normalized);

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.stroke();
  if (dashed) ctx.setLineDash([]);

  // Glow effect for the last point
  const lastX = padding.left + chartWidth;
  const lastNorm = Math.min(1, (data[data.length - 1][key] as number) / maxValue);
  const lastY = padding.top + chartHeight * (1 - lastNorm);
  ctx.beginPath();
  ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(lastX, lastY, 8, 0, Math.PI * 2);
  ctx.fillStyle = color.replace(')', ', 0.2)').replace('rgb', 'rgba');
  ctx.fill();
}
