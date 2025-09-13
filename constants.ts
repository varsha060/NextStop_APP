import { LatLng, BusStop, NearbyStop, Bus } from './types';

export const MYSORE_CENTER: LatLng = { lat: 12.3118, lng: 76.6529 };

export const ROUTE_95_STOPS: BusStop[] = [
    { name: "City Bus Stand (CBS)", position: { lat: 12.3138, lng: 76.6483 } },
    { name: "Ramaswamy Circle", position: { lat: 12.3050, lng: 76.6450 } },
    { name: "Ballal Circle", position: { lat: 12.2982, lng: 76.6380 } },
    { name: "Srirampura Water Tank", position: { lat: 12.2965, lng: 76.6233 } },
    { name: "Srirampura Last Stop", position: { lat: 12.2965, lng: 76.6033 } },
    { name: "City Bus Stand (CBS)", position: { lat: 12.3138, lng: 76.6483 } },
];

export const ROUTE_201_STOPS: BusStop[] = [
    { name: "Railway Station", position: { lat: 12.3155, lng: 76.6424 } },
    { name: "CFTRI", position: { lat: 12.320, lng: 76.630 } },
    { name: "Kuvempunagar", position: { lat: 12.2882, lng: 76.6219 } },
    { name: "Infosys Campus", position: { lat: 12.348, lng: 76.598 } },
];

export const ROUTE_313A_STOPS: BusStop[] = [
    { name: "City Bus Stand (CBS)", position: { lat: 12.3138, lng: 76.6483 } },
    { name: "Metagalli", position: { lat: 12.33, lng: 76.62 } },
    { name: "Hebbal Industrial Area", position: { lat: 12.36, lng: 76.61 } },
];

export const ROUTE_301_STOPS: BusStop[] = [
    { name: "City Bus Stand (CBS)", position: { lat: 12.3138, lng: 76.6483 } },
    { name: "Mysore Palace", position: { lat: 12.3051, lng: 76.6552 } },
    { name: "Mysore Zoo", position: { lat: 12.300, lng: 76.660 } },
    { name: "Chamundi Hills", position: { lat: 12.275, lng: 76.670 } },
];

// Fix: Corrected typo in constant name `ROUTE_150_STops` to `ROUTE_150_STOPS` to match convention.
export const ROUTE_150_STOPS: BusStop[] = [
    { name: "University of Mysore", position: { lat: 12.307, lng: 76.625 } },
    { name: "Gangotri Glades", position: { lat: 12.310, lng: 76.615 } },
    { name: "Ramakrishna Nagar Circle", position: { lat: 12.285, lng: 76.618 } },
    { name: "Kuvempunagar Complex", position: { lat: 12.2882, lng: 76.6219 } },
];

export const ROUTE_62_STOPS: BusStop[] = [
    { name: "Suburban Bus Stand", position: { lat: 12.320, lng: 76.655 } },
    { name: "Columbia Asia Hospital", position: { lat: 12.335, lng: 76.660 } },
    { name: "Ring Road Circle", position: { lat: 12.345, lng: 76.650 } },
    { name: "Naganahalli Gate", position: { lat: 12.365, lng: 76.645 } },
];


export const ALL_ROUTES: { [key: number]: BusStop[] } = {
    1: ROUTE_95_STOPS,
    2: ROUTE_201_STOPS,
    3: ROUTE_313A_STOPS,
    4: ROUTE_301_STOPS,
    5: ROUTE_150_STOPS,
    6: ROUTE_62_STOPS,
};

export const ALL_BUS_DETAILS: Omit<Bus, 'position' | 'routeIndex' | 'progress' | 'dwellTimeRemaining'>[] = [
    { id: 1, name: 'Bus 95', description: 'Mainline route connecting the central bus stand to the residential hub of Srirampura.', isGpsActive: true, manualDelay: 0 },
    { id: 2, name: 'Bus 201', description: 'A high-frequency route serving the IT corridor and Infosys Campus.', isGpsActive: true, manualDelay: 2 },
    { id: 3, name: 'Bus 313A', description: 'Limited stop service to the Hebbal Industrial Area.', isGpsActive: true, manualDelay: 5 },
    { id: 4, name: 'Bus 301', description: 'Tourist-focused route running from the city to Chamundi Hills.', isGpsActive: true, manualDelay: 10 },
    { id: 5, name: 'Bus 150', description: 'Connects the university campus to the Kuvempunagar residential area.', isGpsActive: true, manualDelay: 1 },
    { id: 6, name: 'Bus 62', description: 'Feeder service for the northern industrial suburbs and Columbia Asia Hospital.', isGpsActive: true, manualDelay: 8 },
];

export const initialBuses: Bus[] = ALL_BUS_DETAILS.map(bus => ({
    ...bus,
    position: ALL_ROUTES[bus.id][0].position,
    routeIndex: 0,
    progress: 0,
    dwellTimeRemaining: 0,
}));


export const ROUTE_NUMBER_TO_BUS_ID: { [key: string]: number } = {
    '95': 1,
    '201': 2,
    '313A': 3,
    '301': 4,
    '150': 5,
    '62': 6,
};


export const DEMO_NEARBY_STOPS: BusStop[] = [
    { name: "City Bus Stand (CBS)", position: { lat: 12.3138, lng: 76.6483 } },
    { name: "Railway Station", position: { lat: 12.3155, lng: 76.6424 } },
    { name: "Mysore Palace", position: { lat: 12.3051, lng: 76.6552 } },
    { name: "Kuvempunagar", position: { lat: 12.2882, lng: 76.6219 } },
];

// Demo path for user's live location simulation
export const DEMO_USER_PATH: LatLng[] = [
  { lat: 12.3115, lng: 76.6480 },
  { lat: 12.3118, lng: 76.6485 },
  { lat: 12.3122, lng: 76.6490 },
  { lat: 12.3125, lng: 76.6485 },
  { lat: 12.3122, lng: 76.6480 },
  { lat: 12.3118, lng: 76.6475 },
];

export const MOCK_NEARBY_STOPS: NearbyStop[] = [
  {
    name: 'City Bus Stand (CBS)',
    distanceAway: '300m away',
    arrivals: [
      { routeNumber: '150', destination: 'to Kuvempunagar Complex', etaMinutes: 4 },
      { routeNumber: '95', destination: 'to Srirampura Last Stop', etaMinutes: 8 },
      { routeNumber: '313A', destination: 'to Hebbal Industrial Area', etaMinutes: 3 },
      { routeNumber: '62', destination: 'to Naganahalli Gate', etaMinutes: 11 },
    ],
  },
  {
    name: 'Railway Station',
    distanceAway: '750m away',
    arrivals: [
      { routeNumber: '150', destination: 'to Kuvempunagar Complex', etaMinutes: 8 },
      { routeNumber: '201', destination: 'to Infosys Campus', etaMinutes: 20 },
      { routeNumber: '11', destination: 'to City Bus Stand', etaMinutes: 22 },
    ],
  },
    {
    name: 'Mysore Palace',
    distanceAway: '1.2km away',
    arrivals: [
      { routeNumber: '301', destination: 'to Chamundi Hills', etaMinutes: 12 },
      { routeNumber: '201', destination: 'to City Bus Stand', etaMinutes: 15 },
    ],
  },
  {
    name: 'Kuvempunagar',
    distanceAway: '900m away',
     arrivals: [
      { routeNumber: '201', destination: 'to Infosys Campus', etaMinutes: 5 },
    ],
  }
];


export const AVG_BUS_SPEED_KPH = 25; // Average speed in km/h
export const SIMULATION_INTERVAL_MS = 1000; // Update every second for smoother animation
export const SIMULATION_SPEED_MULTIPLIER = 10; // How much faster than real-time the simulation runs