import { useRef, useState } from 'react';
import { useFaceMesh } from '../hooks/useFaceMesh';
import { useObjectDetect } from '../hooks/useObjectDetect';
import { calculateEAR } from '../utils/earCalculator';
import { calculateMAR } from '../utils/marCalculator';
import type { Results } from '@mediapipe/face_mesh';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

interface WebcamFeedProps {
  onStatsUpdate: (ear: number, mar: number, phoneDetected: boolean, landmarks?: any[]) => void;
}

type OverlayMode = 'mesh' | 'contour' | 'minimal' | 'off';

export default function WebcamFeed({ onStatsUpdate }: WebcamFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPhoneDetected = useRef(false);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('contour');

  const onFaceResults = (results: Results) => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];

      const ear = calculateEAR(landmarks);
      const mar = calculateMAR(landmarks);

      onStatsUpdate(ear, mar, lastPhoneDetected.current, landmarks);

      if (overlayMode !== 'off') {
        drawOverlay(ctx, landmarks, canvas.width, canvas.height, overlayMode);
      }
    }
    ctx.restore();
  };

  const onObjectResults = (predictions: cocoSsd.DetectedObject[]) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phoneFound = false;
    // COCO-SSD classes that indicate hand-held distraction
    // 'cell phone' + 'remote' (often misclassifies phone edges as remote)
    // Lower threshold because sideways/angled phones are harder to detect
    const phoneClasses = ['cell phone', 'remote'];
    for (const p of predictions) {
      const isPhone = p.class === 'cell phone' && p.score > 0.3;
      const isRemote = p.class === 'remote' && p.score > 0.35;
      const isHandHeld = phoneClasses.includes(p.class) && p.score > 0.25 && p.bbox[2] < 300 && p.bbox[3] < 400;
      if (isPhone || isRemote || isHandHeld) {
        phoneFound = true;

        ctx.save();
        ctx.strokeStyle = '#ff3d3d';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.strokeRect(p.bbox[0], p.bbox[1], p.bbox[2], p.bbox[3]);
        ctx.setLineDash([]);

        // Label with background
        const label = `PHONE ${Math.round(p.score * 100)}%`;
        ctx.font = 'bold 14px monospace';
        const textWidth = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(255, 61, 61, 0.8)';
        ctx.fillRect(p.bbox[0], p.bbox[1] - 22, textWidth + 12, 20);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, p.bbox[0] + 6, p.bbox[1] - 6);
        ctx.restore();
      }
    }
    lastPhoneDetected.current = phoneFound;
  };

  useFaceMesh(videoRef, onFaceResults);
  useObjectDetect(videoRef, onObjectResults);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black rounded overflow-hidden">
      <video
        ref={videoRef}
        className="absolute w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />
      <canvas
        ref={canvasRef}
        className="absolute w-full h-full object-cover pointer-events-none"
        style={{ transform: 'scaleX(-1)' }}
        width={640}
        height={480}
      />
      {/* Overlay mode toggle */}
      <div style={{ position: 'absolute', bottom: '12px', right: '12px', display: 'flex', gap: '4px', zIndex: 10 }}>
        {(['mesh', 'contour', 'minimal', 'off'] as OverlayMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setOverlayMode(mode)}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: overlayMode === mode ? '#00F0FF' : 'rgba(0,0,0,0.6)',
              color: overlayMode === mode ? '#000' : '#fff',
              fontSize: '0.6rem',
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
}

function drawOverlay(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number, mode: OverlayMode) {
  if (mode === 'mesh') {
    // Full mesh
    ctx.fillStyle = 'rgba(0, 212, 255, 0.4)';
    for (const lm of landmarks) {
      ctx.beginPath();
      ctx.arc(lm.x * w, lm.y * h, 1, 0, 2 * Math.PI);
      ctx.fill();
    }
  } else if (mode === 'contour') {
    // Face contour + key features
    const faceOval = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10];
    drawConnectedLandmarks(ctx, landmarks, faceOval, w, h, '#00F0FF', 1.5);

    // Left eye
    const leftEye = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 362];
    drawConnectedLandmarks(ctx, landmarks, leftEye, w, h, '#00FF66', 1.5);

    // Right eye
    const rightEye = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33];
    drawConnectedLandmarks(ctx, landmarks, rightEye, w, h, '#00FF66', 1.5);

    // Lips
    const lips = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 61];
    drawConnectedLandmarks(ctx, landmarks, lips, w, h, '#FF007F', 1.5);

    // Iris centers
    if (landmarks.length > 473) {
      ctx.fillStyle = '#FFE600';
      ctx.beginPath();
      ctx.arc(landmarks[468].x * w, landmarks[468].y * h, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(landmarks[473].x * w, landmarks[473].y * h, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (mode === 'minimal') {
    // Just iris + bounding indicators
    if (landmarks.length > 473) {
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 1;

      // Crosshair on irises
      [468, 473].forEach(idx => {
        const x = landmarks[idx].x * w;
        const y = landmarks[idx].y * h;
        ctx.beginPath();
        ctx.moveTo(x - 6, y);
        ctx.lineTo(x + 6, y);
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x, y + 6);
        ctx.stroke();
      });

      // Nose tip indicator
      const nose = landmarks[1];
      ctx.beginPath();
      ctx.arc(nose.x * w, nose.y * h, 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFE600';
      ctx.stroke();
    }
  }
}

function drawConnectedLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  indices: number[],
  w: number,
  h: number,
  color: string,
  lineWidth: number
) {
  if (indices.length < 2) return;
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.moveTo(landmarks[indices[0]].x * w, landmarks[indices[0]].y * h);
  for (let i = 1; i < indices.length; i++) {
    ctx.lineTo(landmarks[indices[i]].x * w, landmarks[indices[i]].y * h);
  }
  ctx.stroke();
}
