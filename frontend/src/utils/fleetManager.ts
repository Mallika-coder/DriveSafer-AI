/**
 * Fleet Manager — Real-time vehicle fleet monitoring
 *
 * Your webcam session feeds live data into "V-SELF" (your vehicle).
 * Other vehicles are simulated with realistic behavior patterns:
 * - Scores drift based on session duration and time of day
 * - Alerts auto-trigger when thresholds are crossed
 * - Status transitions happen naturally
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
  location: string;
  vehiclePlate: string;
  phone: string;
  isLive: boolean;
}

export class FleetManager {
  private vehicles: Map<string, FleetVehicle> = new Map();
  private alerts: FleetAlert[] = [];
  private listeners: ((vehicles: FleetVehicle[], alerts: FleetAlert[]) => void)[] = [];
  private simulationInterval: number | null = null;

  constructor() {
    this.initSimulatedFleet();
    this.startSimulation();
  }

  private initSimulatedFleet() {
    const simDrivers = [
      { id: 'V-001', driverId: 'D-001', name: 'Driver Alpha', score: 12, plate: 'FL-01-A-0001', location: 'Route A, Sector 1', phone: '+91 98765 XXXXX' },
      { id: 'V-002', driverId: 'D-002', name: 'Driver Beta', score: 8, plate: 'FL-02-B-0002', location: 'Route B, Sector 3', phone: '+91 87654 XXXXX' },
      { id: 'V-003', driverId: 'D-003', name: 'Driver Gamma', score: 35, plate: 'FL-03-C-0003', location: 'Route C, Highway', phone: '+91 76543 XXXXX' },
      { id: 'V-004', driverId: 'D-004', name: 'Driver Delta', score: 5, plate: 'FL-04-D-0004', location: 'Route D, Sector 7', phone: '+91 65432 XXXXX' },
    ];

    simDrivers.forEach(d => {
      this.vehicles.set(d.id, {
        id: d.id,
        driverId: d.driverId,
        driverName: d.name,
        status: d.score > 30 ? 'alert' : 'active',
        lastUpdate: Date.now(),
        currentScore: d.score,
        sessionDuration: Math.floor(Math.random() * 5000 + 2000),
        alerts: [],
        location: d.location,
        vehiclePlate: d.plate,
        phone: d.phone,
        isLive: false,
      });
    });
  }

  private startSimulation() {
    this.simulationInterval = window.setInterval(() => {
      this.vehicles.forEach((v, key) => {
        if (key === 'V-SELF') return; // Don't simulate the real driver

        // Realistic score drift based on session duration
        const durationHours = v.sessionDuration / 3600;
        const fatigueBias = durationHours > 1.5 ? 0.8 : durationHours > 0.75 ? 0.3 : -0.2;
        const noise = (Math.random() - 0.45) * 3;
        v.currentScore = Math.max(0, Math.min(100, v.currentScore + fatigueBias + noise));

        // Status transitions
        if (v.currentScore > 60) v.status = 'critical';
        else if (v.currentScore > 30) v.status = 'alert';
        else v.status = 'active';

        // Session time advances
        v.sessionDuration += 3;
        v.lastUpdate = Date.now();

        // Auto-trigger alerts
        if (v.currentScore > 60 && Math.random() < 0.05) {
          const alert: FleetAlert = {
            id: `ALT-${Date.now().toString(36)}-${key}`,
            driverId: v.driverId,
            vehicleId: v.id,
            timestamp: Date.now(),
            alertType: 'drowsiness_critical',
            severity: 3,
            location: { lat: 19.0760 + (Math.random() - 0.5) * 2, lng: 72.8777 + (Math.random() - 0.5) * 2 },
            drowsinessScore: v.currentScore,
            actionTaken: 'Auto-alert dispatched to driver',
          };
          v.alerts.unshift(alert);
          if (v.alerts.length > 5) v.alerts.pop();
          this.alerts.unshift(alert);
          if (this.alerts.length > 50) this.alerts.pop();
          this.notifyListeners();
        }
      });
    }, 3000);
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

    const selfVehicle = this.vehicles.get('V-SELF');
    if (selfVehicle) {
      selfVehicle.alerts.unshift(alert);
      if (selfVehicle.alerts.length > 5) selfVehicle.alerts.pop();
    }

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
        driverName: 'You (Live)',
        status: 'active',
        lastUpdate: Date.now(),
        currentScore: score,
        sessionDuration,
        alerts: [],
        location: 'Current Location',
        vehiclePlate: 'LIVE-CAM',
        phone: '—',
        isLive: true,
      });
    }
  }

  sendAlertToDriver(vehicleId: string): string {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle) return 'Vehicle not found';
    const alert: FleetAlert = {
      id: `ALT-${Date.now().toString(36)}`,
      driverId: vehicle.driverId,
      vehicleId: vehicle.id,
      timestamp: Date.now(),
      alertType: 'drowsiness_critical',
      severity: 2,
      location: { lat: 19.0760, lng: 72.8777 },
      drowsinessScore: vehicle.currentScore,
      actionTaken: 'Manual alert sent by fleet manager',
    };
    vehicle.alerts.unshift(alert);
    this.alerts.unshift(alert);
    this.notifyListeners();
    return `Alert sent to ${vehicle.driverName}`;
  }

  getVehicles(): FleetVehicle[] {
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
      avgScore: vehicles.length > 0 ? vehicles.reduce((s, v) => s + v.currentScore, 0) / vehicles.length : 0,
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

  destroy() {
    if (this.simulationInterval) clearInterval(this.simulationInterval);
  }
}

export const fleetManager = new FleetManager();
