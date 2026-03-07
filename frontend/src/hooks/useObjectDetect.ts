import { useEffect, useRef } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export function useObjectDetect(videoRef: React.RefObject<HTMLVideoElement>, onDetect: (predictions: cocoSsd.DetectedObject[]) => void) {
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const requestRef = useRef<number>();
  const frameCount = useRef(0);
  const onDetectRef = useRef(onDetect);

  useEffect(() => {
    onDetectRef.current = onDetect;
  }, [onDetect]);

  useEffect(() => {
    let active = true;

    const loadModel = async () => {
      modelRef.current = await cocoSsd.load();
      if (active) detectObjects();
    };

    const detectObjects = async () => {
      if (videoRef.current && modelRef.current && videoRef.current.readyState === 4) {
        // Run every 10 frames to save CPU load
        if (frameCount.current % 10 === 0) {
          const predictions = await modelRef.current.detect(videoRef.current);
          onDetectRef.current(predictions);
        }
        frameCount.current++;
      }
      requestRef.current = requestAnimationFrame(detectObjects);
    };

    loadModel();

    return () => {
      active = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [videoRef]);
}
