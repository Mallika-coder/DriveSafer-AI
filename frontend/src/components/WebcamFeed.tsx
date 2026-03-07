import { useRef } from 'react';
import { useFaceMesh } from '../hooks/useFaceMesh';
import { useObjectDetect } from '../hooks/useObjectDetect';
import { calculateEAR } from '../utils/earCalculator';
import { calculateMAR } from '../utils/marCalculator';
import type { Results } from '@mediapipe/face_mesh';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

interface WebcamFeedProps {
  onStatsUpdate: (ear: number, mar: number, phoneDetected: boolean) => void;
}

export default function WebcamFeed({ onStatsUpdate }: WebcamFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPhoneDetected = useRef(false);

  const onFaceResults = (results: Results) => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      
      const ear = calculateEAR(landmarks);
      const mar = calculateMAR(landmarks);
      
      onStatsUpdate(ear, mar, lastPhoneDetected.current);

      // Draw mesh points
      ctx.fillStyle = '#00d4ff';
      for (const lm of landmarks) {
        ctx.beginPath();
        ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 1, 0, 2 * Math.PI);
        ctx.fill();
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
    for (const p of predictions) {
      if (p.class === 'cell phone' && p.score > 0.6) {
        phoneFound = true;
        
        ctx.save();
        ctx.strokeStyle = '#ff3d3d';
        ctx.lineWidth = 4;
        ctx.strokeRect(p.bbox[0], p.bbox[1], p.bbox[2], p.bbox[3]);
        ctx.fillStyle = '#ff3d3d';
        ctx.font = 'bold 18px Inter';
        ctx.fillText(`Phone ${Math.round(p.score * 100)}%`, p.bbox[0], p.bbox[1] > 20 ? p.bbox[1] - 8 : 20);
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
    </div>
  );
}
