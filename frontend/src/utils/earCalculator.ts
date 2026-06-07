export function calculateEAR(landmarks: any[]) {
  const distance = (p1: any, p2: any) =>
    Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

  // MediaPipe FaceMesh Left Eye
  const A = distance(landmarks[385], landmarks[380]);
  const B = distance(landmarks[387], landmarks[373]);
  const C = distance(landmarks[362], landmarks[263]);
  const leftEAR = (A + B) / (2.0 * C);

  // MediaPipe FaceMesh Right Eye
  const D = distance(landmarks[160], landmarks[144]);
  const E = distance(landmarks[158], landmarks[153]);
  const F = distance(landmarks[33], landmarks[133]);
  const rightEAR = (D + E) / (2.0 * F);

  return (leftEAR + rightEAR) / 2.0;
}
