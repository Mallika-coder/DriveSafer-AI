/**
 * Simulated V2X / Fleet Manager Integration
 *
 * When drowsiness hits critical levels, sends alerts to a simulated
 * fleet management dashboard. Demonstrates IoT/V2X integration patterns:
 * - Vehicle-to-Cloud alerting
 * - Fleet-wide risk aggregation
 * - Emergency escalation protocols
 */

interface FleetAlert {
  id: string;
  driverId: string;
  vehicleId: string;
  timestamp: number;
  alertType: 'drowsiness_critical' | 'phone_distraction' | 'cognitive_overload' | 'eyes_off_road';
  severity: number;
  location: { lat: number; lng: number };
  drowsinessScore: number;
  actionTaken: string;
}

interface FleetVehicle {
  id: string;
  driverId: string;
  driverName: string;
  status: 'active' | 'alert' | 'critical' | 'offline';
  lastUpdate: number;
  currentScore: number;
  sessionDuration: number;
  alerts: FleetAlert[];
}

export class FleetManager {
  private vehicles: Map<string, FleetVehicle> = new Map();
  private alerts: FleetAlert[] = [];
  private listeners: ((vehicles: FleetVehicle[], alerts: FleetAlert[]) => void)[] = [];

  constructor() {
    this.initSimulatedFleet();
  }

  private initSimulatedFleet() {
    const simDrivers = [
      { id: 'V-001', driverId: 'D-001', name: 'Driver Alpha', score: 12 },
      { id: 'V-002', driverId: 'D-002', name: 'Driver Beta', score: 8 },
      { id: 'V-003', driverId: 'D-003', name: 'Driver Gamma', score: 35 },
      { id: 'V-004', driverId: 'D-004', name: 'Driver Delta', score: 5 },
    ];

    simDrivers.forEach(d => {
      this.vehicles.set(d.id, {
        id: d.id,
        driverId: d.driverId,
        driverName: d.name,
        status: d.score > 30 ? 'alert' : 'active',
        lastUpdate: Date.now(),
        currentScore: d.score,
        sessionDuration: Math.floor(Math.random() * 7200),
        alerts: [],
      });
    });
  }

  sendAlert(drowsinessScore: number, alertType: FleetAlert['alertType'], severity: number) {
    const alert: FleetAlert = {
      id: `ALT-${Date.now().toString(36)}`,
      driverId: 'D-SELF',
      vehicleId: 'V-SELF',
      timestamp: Date.now(),
      alertType,
      severity,
      location: { lat: 28.6139 + (Math.random() - 0.5) * 0.1, lng: 77.2090 + (Math.random() - 0.5) * 0.1 },
      drowsinessScore,
      actionTaken: severity >= 3 ? 'Emergency alert dispatched' : 'Warning logged',
    };

    this.alerts.unshift(alert);
    if (this.alerts.length > 50) this.alerts.pop();

    // Update self vehicle
    const selfVehicle: FleetVehicle = {
      id: 'V-SELF',
      driverId: 'D-SELF',
      driverName: 'You (Current)',
      status: severity >= 3 ? 'critical' : severity >= 2 ? 'alert' : 'active',
      lastUpdate: Date.now(),
      currentScore: drowsinessScore,
      sessionDuration: 0,
      alerts: this.alerts.filter(a => a.driverId === 'D-SELF').slice(0, 5),
    };
    this.vehicles.set('V-SELF', selfVehicle);

    this.notifyListeners();
    return alert;
  }

  updateSelfScore(score: number, sessionDuration: number) {
    const existing = this.vehicles.get('V-SELF');
    if (existing) {
      existing.currentScore = score;
      existing.sessionDuration = sessionDuration;
      existing.status = score > 70 ? 'critical' : score > 40 ? 'alert' : 'active';
      existing.lastUpdate = Date.now();
    } else {
      this.vehicles.set('V-SELF', {
        id: 'V-SELF',
        driverId: 'D-SELF',
        driverName: 'You (Current)',
        status: 'active',
        lastUpdate: Date.now(),
        currentScore: score,
        sessionDuration,
        alerts: [],
      });
    }
  }

  getVehicles(): FleetVehicle[] {
    // Simulate other vehicles changing slightly
    this.vehicles.forEach((v, key) => {
      if (key !== 'V-SELF') {
        v.currentScore = Math.max(0, Math.min(100, v.currentScore + (Math.random() - 0.5) * 5));
        v.status = v.currentScore > 70 ? 'critical' : v.currentScore > 30 ? 'alert' : 'active';
        v.sessionDuration += 30;
        v.lastUpdate = Date.now();
      }
    });
    return Array.from(this.vehicles.values());
  }

  getAlerts(): FleetAlert[] {
    return this.alerts;
  }

  getFleetRiskSummary() {
    const vehicles = this.getVehicles();
    return {
      total: vehicles.length,
      active: vehicles.filter(v => v.status === 'active').length,
      alert: vehicles.filter(v => v.status === 'alert').length,
      critical: vehicles.filter(v => v.status === 'critical').length,
      avgScore: vehicles.reduce((s, v) => s + v.currentScore, 0) / vehicles.length,
      totalAlerts: this.alerts.length,
    };
  }

  subscribe(listener: (vehicles: FleetVehicle[], alerts: FleetAlert[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    const vehicles = Array.from(this.vehicles.values());
    this.listeners.forEach(l => l(vehicles, this.alerts));
  }
}

export const fleetManager = new FleetManager();
