
export interface LatLng {
  lat: number;
  lng: number;
}

export interface BusStop {
  name: string;
  position: LatLng;
}

export interface Bus {
  id: number;
  name: string;
  description: string;
  position: LatLng;
  routeIndex: number; // Index of the START point of the current segment
  progress: number; // Progress (0-1) along the current segment
  dwellTimeRemaining: number; // Time in ms to wait at a stop
  isGpsActive: boolean;
  manualDelay: number;
  lastManualToggle?: number;
}

export interface BusArrival {
  routeNumber: string;
  destination: string;
  etaMinutes: number;
  nextStop?: string;
}

export interface NearbyStop {
  name:string;
  distanceAway: string;
  arrivals: BusArrival[];
}

// Fix: Added missing ProfileSettings interface, which was causing an import error.
export interface ProfileSettings {
  lowDataMode: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'alert';
  duration?: number; // in ms, undefined means persistent
}