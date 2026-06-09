import { useRef, useEffect } from 'react';

interface DrivingSceneProps {
  speed?: number;
  alertLevel?: number;
  timeOfDay?: 'day' | 'dusk' | 'night';
}

export default function DrivingScene({ speed = 60, alertLevel = 0, timeOfDay = 'night' }: DrivingSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const offsetRef = useRef(0);
  const carsRef = useRef<{ lane: number; z: number; speed: number; color: string; type: 'car' | 'truck' }[]>([]);

  useEffect(() => {
    if (carsRef.current.length === 0) {
      carsRef.current = [
        { lane: -1, z: 300, speed: 0.4, color: '#e53e3e', type: 'car' },
        { lane: 1, z: 600, speed: 0.6, color: '#4299e1', type: 'car' },
        { lane: 0, z: 900, speed: 0.3, color: '#ecc94b', type: 'truck' },
        { lane: -1, z: 1200, speed: 0.5, color: '#48bb78', type: 'car' },
        { lane: 1, z: 1500, speed: 0.7, color: '#9f7aea', type: 'car' },
      ];
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;

      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);

      const cw = canvas.offsetWidth;
      const ch = canvas.offsetHeight;

      offsetRef.current += speed * 0.02;

      // Sky gradient
      const skyColors = {
        night: ['#0a0e1a', '#0f1b2d', '#1a2744'],
        dusk: ['#1a1033', '#2d1b4e', '#4a2060'],
        day: ['#1e3a5f', '#2563eb', '#60a5fa'],
      };
      const colors = skyColors[timeOfDay];
      const skyGrad = ctx.createLinearGradient(0, 0, 0, ch * 0.45);
      skyGrad.addColorStop(0, colors[0]);
      skyGrad.addColorStop(0.5, colors[1]);
      skyGrad.addColorStop(1, colors[2]);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, cw, ch * 0.45);

      // Stars (night only)
      if (timeOfDay === 'night') {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        for (let i = 0; i < 40; i++) {
          const sx = (i * 137.5) % cw;
          const sy = (i * 73.1) % (ch * 0.3);
          ctx.beginPath();
          ctx.arc(sx, sy, 0.5 + (i % 3) * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Moon/sun
      if (timeOfDay === 'night') {
        ctx.beginPath();
        ctx.arc(cw * 0.8, ch * 0.12, 15, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cw * 0.8, ch * 0.12, 18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fill();
      }

      const horizon = ch * 0.45;
      const vanishX = cw * 0.5;
      const vanishY = horizon;

      // Ground
      const groundGrad = ctx.createLinearGradient(0, horizon, 0, ch);
      groundGrad.addColorStop(0, '#1a1f2e');
      groundGrad.addColorStop(0.3, '#151a25');
      groundGrad.addColorStop(1, '#0d1117');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, horizon, cw, ch - horizon);

      // Road
      const roadTopWidth = cw * 0.12;
      const roadBottomWidth = cw * 0.85;

      ctx.beginPath();
      ctx.moveTo(vanishX - roadTopWidth / 2, vanishY);
      ctx.lineTo(vanishX + roadTopWidth / 2, vanishY);
      ctx.lineTo(cw * 0.5 + roadBottomWidth / 2, ch);
      ctx.lineTo(cw * 0.5 - roadBottomWidth / 2, ch);
      ctx.closePath();
      const roadGrad = ctx.createLinearGradient(0, vanishY, 0, ch);
      roadGrad.addColorStop(0, '#2d3748');
      roadGrad.addColorStop(1, '#1a202c');
      ctx.fillStyle = roadGrad;
      ctx.fill();

      // Road edge lines
      ctx.strokeStyle = '#4a5568';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(vanishX - roadTopWidth / 2, vanishY);
      ctx.lineTo(cw * 0.5 - roadBottomWidth / 2, ch);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(vanishX + roadTopWidth / 2, vanishY);
      ctx.lineTo(cw * 0.5 + roadBottomWidth / 2, ch);
      ctx.stroke();

      // Dashed center line
      const segments = 20;
      for (let i = 0; i < segments; i++) {
        const t = (i + (offsetRef.current * 0.01) % 1) / segments;
        const nextT = t + 0.3 / segments;
        if (t > 1) continue;

        const perspective = Math.pow(t, 1.8);
        const nextPerspective = Math.pow(Math.min(1, nextT), 1.8);

        const y1 = vanishY + (ch - vanishY) * perspective;
        const y2 = vanishY + (ch - vanishY) * nextPerspective;

        const lineWidth = 1 + perspective * 3;

        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + perspective * 0.4})`;
        ctx.lineWidth = lineWidth;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(vanishX, y1);
        ctx.lineTo(vanishX, y2);
        ctx.stroke();
      }

      // Lane dividers (dashed)
      for (const side of [-1, 1]) {
        for (let i = 0; i < segments; i++) {
          const t = (i + (offsetRef.current * 0.01) % 1) / segments;
          if (t > 1 || t < 0) continue;
          const perspective = Math.pow(t, 1.8);

          const roadWidthAtT = roadTopWidth + (roadBottomWidth - roadTopWidth) * perspective;
          const y = vanishY + (ch - vanishY) * perspective;
          const x = vanishX + side * roadWidthAtT * 0.25;

          const dashLen = 3 + perspective * 8;
          if (i % 2 === 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + perspective * 0.2})`;
            ctx.fillRect(x - 1, y, 2, dashLen);
          }
        }
      }

      // Roadside elements (lamp posts, trees)
      for (let i = 0; i < 8; i++) {
        const t = ((i * 0.125 + offsetRef.current * 0.003) % 1);
        const perspective = Math.pow(t, 1.8);
        const y = vanishY + (ch - vanishY) * perspective;
        const roadWidthAtT = roadTopWidth + (roadBottomWidth - roadTopWidth) * perspective;
        const scale = 0.3 + perspective * 2;

        // Left side lamp
        const lx = vanishX - roadWidthAtT * 0.55;
        if (perspective > 0.05) {
          ctx.strokeStyle = '#4a5568';
          ctx.lineWidth = scale * 0.8;
          ctx.beginPath();
          ctx.moveTo(lx, y);
          ctx.lineTo(lx, y - scale * 12);
          ctx.stroke();
          // Lamp light
          ctx.beginPath();
          ctx.arc(lx, y - scale * 12, scale * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 200, 50, 0.3)';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(lx, y - scale * 12, scale * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 220, 100, 0.8)';
          ctx.fill();
        }

        // Right side trees
        const rx = vanishX + roadWidthAtT * 0.58;
        if (perspective > 0.08 && i % 2 === 0) {
          ctx.fillStyle = '#1a3a2a';
          ctx.beginPath();
          ctx.moveTo(rx, y - scale * 15);
          ctx.lineTo(rx - scale * 4, y);
          ctx.lineTo(rx + scale * 4, y);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#2d4a3a';
          ctx.beginPath();
          ctx.moveTo(rx, y - scale * 20);
          ctx.lineTo(rx - scale * 3, y - scale * 8);
          ctx.lineTo(rx + scale * 3, y - scale * 8);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Other vehicles
      carsRef.current.forEach(car => {
        car.z -= speed * 0.05 * (1 - car.speed);
        if (car.z < 50) car.z = 800 + Math.random() * 600;

        const t = 1 - car.z / 1800;
        if (t < 0.05 || t > 0.95) return;

        const perspective = Math.pow(t, 1.8);
        const y = vanishY + (ch - vanishY) * perspective;
        const roadWidthAtT = roadTopWidth + (roadBottomWidth - roadTopWidth) * perspective;
        const x = vanishX + car.lane * roadWidthAtT * 0.22;
        const scale = 0.3 + perspective * 1.5;

        // Car body
        const carW = scale * 18;
        const carH = scale * 8;

        ctx.fillStyle = car.color;
        ctx.beginPath();
        ctx.roundRect(x - carW / 2, y - carH, carW, carH, scale * 2);
        ctx.fill();

        // Windshield
        ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
        ctx.fillRect(x - carW * 0.3, y - carH * 0.9, carW * 0.6, carH * 0.4);

        // Tail lights (red glow)
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(x - carW * 0.35, y - carH * 0.3, scale * 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + carW * 0.35, y - carH * 0.3, scale * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Light glow
        ctx.beginPath();
        ctx.arc(x - carW * 0.35, y - carH * 0.3, scale * 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 50, 50, 0.1)';
        ctx.fill();
      });

      // Dashboard reflection glow at bottom
      const reflGrad = ctx.createLinearGradient(0, ch - 30, 0, ch);
      reflGrad.addColorStop(0, 'transparent');
      reflGrad.addColorStop(1, 'rgba(99, 179, 237, 0.03)');
      ctx.fillStyle = reflGrad;
      ctx.fillRect(0, ch - 30, cw, 30);

      // Alert overlay
      if (alertLevel >= 3) {
        ctx.fillStyle = `rgba(229, 62, 62, ${0.05 + Math.sin(Date.now() * 0.005) * 0.03})`;
        ctx.fillRect(0, 0, cw, ch);
      } else if (alertLevel >= 2) {
        ctx.fillStyle = 'rgba(237, 137, 54, 0.03)';
        ctx.fillRect(0, 0, cw, ch);
      }

      // Speed indicator
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${speed} km/h`, 10, ch - 10);

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [speed, alertLevel, timeOfDay]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '16px',
        display: 'block',
      }}
    />
  );
}
