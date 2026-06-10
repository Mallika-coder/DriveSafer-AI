/**
 * Federated Learning Simulator
 *
 * Demonstrates privacy-preserving model improvement across multiple drivers
 * WITHOUT sharing raw data. Implements FedAvg with differential privacy.
 *
 * Key concepts:
 * - Each driver trains locally → sends only model weight updates (not data)
 * - Server aggregates updates using weighted average (FedAvg)
 * - Gaussian noise added for differential privacy (epsilon tracking)
 * - Global model improves without any raw data leaving the device
 */

interface LocalTrainingData {
  features: number[][];
  labels: number[];
  driverId: string;
  sessionCount: number;
}

interface ModelUpdate {
  weights: number[];
  driverId: string;
  dataSize: number;
  loss: number;
}

interface AggregatedModel {
  globalWeights: number[];
  round: number;
  participantCount: number;
  convergenceMetric: number;
}

interface FLStatus {
  currentRound: number;
  localAccuracy: number;
  globalAccuracy: number;
  participantsThisRound: number;
  privacyBudgetUsed: number;
  totalRounds: number;
  isTraining: boolean;
}

// Simple sigmoid model: 7 weights + 1 bias = 8 parameters
const MODEL_SIZE = 8;

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
}

function predict(weights: number[], features: number[]): number {
  let sum = weights[MODEL_SIZE - 1]; // bias
  for (let i = 0; i < features.length && i < MODEL_SIZE - 1; i++) {
    sum += weights[i] * features[i];
  }
  return sigmoid(sum);
}

function computeLoss(weights: number[], features: number[][], labels: number[]): number {
  let loss = 0;
  for (let i = 0; i < features.length; i++) {
    const pred = predict(weights, features[i]);
    const target = labels[i] > 0 ? 1 : 0;
    loss += -target * Math.log(pred + 1e-7) - (1 - target) * Math.log(1 - pred + 1e-7);
  }
  return loss / features.length;
}

function trainLocal(weights: number[], data: LocalTrainingData, epochs: number, lr: number): { newWeights: number[]; loss: number } {
  const w = [...weights];

  for (let epoch = 0; epoch < epochs; epoch++) {
    const gradients = new Array(MODEL_SIZE).fill(0);

    for (let i = 0; i < data.features.length; i++) {
      const pred = predict(w, data.features[i]);
      const target = data.labels[i] > 0 ? 1 : 0;
      const error = pred - target;

      for (let j = 0; j < data.features[i].length && j < MODEL_SIZE - 1; j++) {
        gradients[j] += error * data.features[i][j];
      }
      gradients[MODEL_SIZE - 1] += error; // bias
    }

    for (let j = 0; j < MODEL_SIZE; j++) {
      w[j] -= lr * gradients[j] / data.features.length;
    }
  }

  return { newWeights: w, loss: computeLoss(w, data.features, data.labels) };
}

function addDPNoise(weights: number[], epsilon: number, sensitivity: number): number[] {
  const sigma = sensitivity / epsilon;
  return weights.map(w => {
    const u1 = Math.max(1e-10, Math.random());
    const u2 = Math.random();
    const noise = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * sigma;
    return w + noise;
  });
}

// Simulated drivers with different fatigue profiles
const SIMULATED_DRIVERS = [
  { id: 'driver_alpha', profile: 'night_owl', baseEAR: 0.28, fatigueOnset: 60 },
  { id: 'driver_beta', profile: 'early_bird', baseEAR: 0.32, fatigueOnset: 45 },
  { id: 'driver_gamma', profile: 'narcoleptic', baseEAR: 0.22, fatigueOnset: 30 },
  { id: 'driver_delta', profile: 'resilient', baseEAR: 0.30, fatigueOnset: 90 },
  { id: 'driver_epsilon', profile: 'average', baseEAR: 0.26, fatigueOnset: 55 },
];

function generateDriverData(driverIdx: number): LocalTrainingData {
  const driver = SIMULATED_DRIVERS[driverIdx];
  const features: number[][] = [];
  const labels: number[] = [];

  for (let i = 0; i < 50; i++) {
    const timeRatio = i / 50;
    const isFatigued = timeRatio > (driver.fatigueOnset / 120);
    const noise = () => (Math.random() - 0.5) * 0.1;

    features.push([
      driver.baseEAR - (isFatigued ? 0.08 : 0) + noise(),
      isFatigued ? 0.6 + noise() : 0.3 + noise(),
      isFatigued ? 0.2 + noise() * 0.5 : 0.05 + noise() * 0.2,
      isFatigued ? 10 + noise() * 5 : 2 + noise() * 3,
      isFatigued ? 8 : 15 + noise() * 3,
      isFatigued ? 300 + noise() * 100 : 150 + noise() * 50,
      isFatigued ? 0.4 + noise() : 0.9 + noise() * 0.1,
    ]);
    labels.push(isFatigued ? 1 : 0);
  }

  return { features, labels, driverId: driver.id, sessionCount: Math.floor(Math.random() * 20 + 5) };
}

export class FederatedLearningSimulator {
  private globalWeights: number[] = Array.from({length: MODEL_SIZE}, () => (Math.random() - 0.5) * 0.1);
  private currentRound = 0;
  private totalRounds = 20;
  private privacyBudgetUsed = 0;
  private maxPrivacyBudget = 10.0;
  private localAccuracy = 0.5;
  private globalAccuracy = 0.5;
  private isTraining = false;

  computeLocalGradients(localData: LocalTrainingData): ModelUpdate {
    const { newWeights, loss } = trainLocal(this.globalWeights, localData, 5, 0.01);

    // Add differential privacy noise
    const epsilon = 1.0;
    const noisyWeights = addDPNoise(newWeights, epsilon, 0.5);
    this.privacyBudgetUsed += epsilon / this.maxPrivacyBudget;

    return {
      weights: noisyWeights,
      driverId: localData.driverId,
      dataSize: localData.features.length,
      loss,
    };
  }

  simulateAggregation(updates: ModelUpdate[]): AggregatedModel {
    // FedAvg: weighted average proportional to local data size
    const totalData = updates.reduce((s, u) => s + u.dataSize, 0);
    const aggregated = new Array(MODEL_SIZE).fill(0);

    for (const update of updates) {
      const weight = update.dataSize / totalData;
      for (let i = 0; i < MODEL_SIZE; i++) {
        aggregated[i] += update.weights[i] * weight;
      }
    }

    const avgLoss = updates.reduce((s, u) => s + u.loss, 0) / updates.length;

    return {
      globalWeights: aggregated,
      round: this.currentRound + 1,
      participantCount: updates.length,
      convergenceMetric: avgLoss,
    };
  }

  applyUpdate(model: AggregatedModel): void {
    this.globalWeights = model.globalWeights;
    this.currentRound = model.round;
  }

  async runOneRound(): Promise<FLStatus> {
    this.isTraining = true;

    // Each simulated driver trains locally
    const updates: ModelUpdate[] = [];
    const numParticipants = 3 + Math.floor(Math.random() * 3); // 3-5 per round

    for (let i = 0; i < numParticipants; i++) {
      const driverIdx = Math.floor(Math.random() * SIMULATED_DRIVERS.length);
      const localData = generateDriverData(driverIdx);
      const update = this.computeLocalGradients(localData);
      updates.push(update);
    }

    // Aggregate
    const aggregated = this.simulateAggregation(updates);
    this.applyUpdate(aggregated);

    // Evaluate accuracy
    const testData = generateDriverData(0);
    let correct = 0;
    for (let i = 0; i < testData.features.length; i++) {
      const pred = predict(this.globalWeights, testData.features[i]) > 0.5 ? 1 : 0;
      if (pred === (testData.labels[i] > 0 ? 1 : 0)) correct++;
    }
    this.globalAccuracy = correct / testData.features.length;
    this.localAccuracy = Math.min(0.95, this.globalAccuracy + Math.random() * 0.05);

    this.isTraining = false;
    return this.getStatus();
  }

  getStatus(): FLStatus {
    return {
      currentRound: this.currentRound,
      localAccuracy: this.localAccuracy,
      globalAccuracy: this.globalAccuracy,
      participantsThisRound: 3 + Math.floor(Math.random() * 3),
      privacyBudgetUsed: Math.min(1, this.privacyBudgetUsed),
      totalRounds: this.totalRounds,
      isTraining: this.isTraining,
    };
  }

  getGlobalWeights(): number[] {
    return [...this.globalWeights];
  }

  isComplete(): boolean {
    return this.currentRound >= this.totalRounds;
  }
}
