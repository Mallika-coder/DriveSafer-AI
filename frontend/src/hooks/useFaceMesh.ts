import { useEffect, useRef, useCallback } from 'react';
import { FaceMesh, Results } from '@mediapipe/face_mesh';

export function useFaceMesh(videoRef: React.RefObject<HTMLVideoElement>, onResults: (results: Results) => void) {
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const requestRef = useRef<number>();
  const onResultsRef = useRef(onResults);

  // Keep callback fresh without re-running useEffect
  useEffect(() => {
    onResultsRef.current = onResults;
  }, [onResults]);

  const processVideo = useCallback(async () => {
    if (videoRef.current && faceMeshRef.current && videoRef.current.readyState === 4) {
      try {
        await faceMeshRef.current.send({ image: videoRef.current });
      } catch (err) {
        console.error("FaceMesh send error:", err);
      }
    }
    requestRef.current = requestAnimationFrame(processVideo);
  }, [videoRef]);

  useEffect(() => {
    if (!videoRef.current) return;

    const fm = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    fm.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    fm.onResults((res) => onResultsRef.current(res));
    faceMeshRef.current = fm;

    // Start video
    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            requestRef.current = requestAnimationFrame(processVideo);
          };
        }
      })
      .catch((err) => console.error("Error accessing webcam:", err));

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      fm.close();
    };
  }, [videoRef, processVideo]);
}
