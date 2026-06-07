interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface HeadPose {
  pitch: number;
  yaw: number;
  roll: number;
  isDistracted: boolean;
}

const NOSE_TIP = 1;
const CHIN = 152;
const LEFT_EYE_OUTER = 263;
const RIGHT_EYE_OUTER = 33;
const FOREHEAD = 10;

export function estimateHeadPose(landmarks: Point3D[]): HeadPose {
  const nose = landmarks[NOSE_TIP];
  const chin = landmarks[CHIN];
  const leftEye = landmarks[LEFT_EYE_OUTER];
  const rightEye = landmarks[RIGHT_EYE_OUTER];
  const forehead = landmarks[FOREHEAD];

  const eyeCenter = {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2,
    z: (leftEye.z + rightEye.z) / 2,
  };

  // Yaw: horizontal rotation — nose offset from eye center
  const yaw = (nose.x - eyeCenter.x) * 180;

  // Pitch: vertical tilt — nose position relative to face vertical axis
  const noseVerticalRatio = (nose.y - forehead.y) / (chin.y - forehead.y);
  const pitch = (noseVerticalRatio - 0.4) * 120;

  // Roll: head tilt — angle between eyes
  const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);

  const isDistracted = Math.abs(yaw) > 25 || Math.abs(pitch) > 20 || Math.abs(roll) > 20;

  return { pitch, yaw, roll, isDistracted };
}

export function getGazeDirection(landmarks: Point3D[]): { x: number; y: number; direction: string } {
  // Iris landmarks (MediaPipe refineLandmarks=true)
  // Left iris: 468-472, Right iris: 473-477
  const leftIrisCenter = landmarks[468];
  const rightIrisCenter = landmarks[473];

  const leftEyeInner = landmarks[362];
  const leftEyeOuter = landmarks[263];
  const rightEyeInner = landmarks[133];
  const rightEyeOuter = landmarks[33];

  // Compute relative iris position within eye bounds
  const leftGazeX = (leftIrisCenter.x - leftEyeOuter.x) / (leftEyeInner.x - leftEyeOuter.x);
  const rightGazeX = (rightIrisCenter.x - rightEyeOuter.x) / (rightEyeInner.x - rightEyeOuter.x);

  const leftEyeTop = landmarks[386];
  const leftEyeBottom = landmarks[374];
  const rightEyeTop = landmarks[159];
  const rightEyeBottom = landmarks[145];

  const leftGazeY = (leftIrisCenter.y - leftEyeTop.y) / (leftEyeBottom.y - leftEyeTop.y);
  const rightGazeY = (rightIrisCenter.y - rightEyeTop.y) / (rightEyeBottom.y - rightEyeTop.y);

  const gazeX = (leftGazeX + rightGazeX) / 2;
  const gazeY = (leftGazeY + rightGazeY) / 2;

  let direction = 'CENTER';
  if (gazeX < 0.35) direction = 'LEFT';
  else if (gazeX > 0.65) direction = 'RIGHT';
  if (gazeY < 0.3) direction = 'UP';
  else if (gazeY > 0.7) direction = 'DOWN';

  return { x: gazeX, y: gazeY, direction };
}
