export function calculateMAR(landmarks: any[]) {
  const distance = (p1: any, p2: any) =>
    Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

  // Based on outer and inner mouth landmark distances
  const H1 = distance(landmarks[0], landmarks[17]); // vertical outer
  const H2 = distance(landmarks[13], landmarks[14]); // vertical inner
  const W = distance(landmarks[61], landmarks[291]); // horizontal width

  const mar = (H1 + H2) / (2.0 * W);
  return mar;
}
