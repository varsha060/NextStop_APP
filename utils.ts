import { LatLng, Bus, BusStop } from './types';
import { AVG_BUS_SPEED_KPH, ALL_BUS_DETAILS, ALL_ROUTES } from './constants';

export const haversineDistance = (coords1: LatLng, coords2: LatLng): number => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(coords2.lat - coords1.lat);
    const dLon = toRad(coords2.lng - coords1.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(coords1.lat)) * Math.cos(toRad(coords2.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};


export const calculateEtaForStop = (
    bus: Bus,
    targetStopName: string,
    route: BusStop[]
): number | null => {
    const targetStopIndex = route.findIndex(s => s.name === targetStopName);
    
    // Stop not on route or already passed
    if (targetStopIndex === -1 || targetStopIndex <= bus.routeIndex) {
        return null;
    }
    
    let totalDistanceKm = 0;
    
    // The next stop in the bus's current path
    const nextStopInRoute = route[bus.routeIndex + 1];
    if (!nextStopInRoute) return null; // Bus is at the end of its route segment list
    
    // Calculate remaining distance in the current segment the bus is traveling
    const remainingDistanceInSegment = haversineDistance(bus.position, nextStopInRoute.position);
    totalDistanceKm += remainingDistanceInSegment;

    // Add distances for all full segments between the bus's *next* stop and the target stop
    for (let i = bus.routeIndex + 1; i < targetStopIndex; i++) {
        const segmentStart = route[i].position;
        const segmentEnd = route[i + 1].position;
        totalDistanceKm += haversineDistance(segmentStart, segmentEnd);
    }
    
    const DWELL_TIME_MINUTES = 1; // Average time spent at each stop
    // Number of stops the bus will halt at *before* reaching the target stop.
    // This includes the next stop and all intermediate ones, but not the target itself.
    const numStopsToDwellAt = targetStopIndex - (bus.routeIndex + 1);
    const dwellTime = numStopsToDwellAt > 0 ? numStopsToDwellAt * DWELL_TIME_MINUTES : 0;
    
    const travelTimeMinutes = (totalDistanceKm / AVG_BUS_SPEED_KPH) * 60;
    
    const totalEtaMinutes = travelTimeMinutes + dwellTime + bus.manualDelay;
    
    return Math.round(totalEtaMinutes);
};

interface SearchResult {
    // Fix: Corrected a typo in the Omit utility type by adding a missing '|' separator.
    routes: Omit<Bus, 'position' | 'routeIndex' | 'progress' | 'dwellTimeRemaining'>[];
    stops: { name: string, routes: string[] }[];
}

export const searchRoutesAndStops = (query: string): SearchResult => {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) {
        return { routes: [], stops: [] };
    }

    // Find matching routes
    const matchingRoutes = ALL_BUS_DETAILS.filter(bus => 
        bus.name.toLowerCase().includes(trimmedQuery)
    );

    // Find matching stops and the routes that serve them
    const matchingStopsMap = new Map<string, string[]>();
    
    Object.entries(ALL_ROUTES).forEach(([busIdStr, routeStops]) => {
        const busId = parseInt(busIdStr, 10);
        const busDetails = ALL_BUS_DETAILS.find(b => b.id === busId);
        const busName = busDetails ? busDetails.name.split(' ')[1] : ''; // e.g., '95'

        routeStops.forEach(stop => {
            if (stop.name.toLowerCase().includes(trimmedQuery)) {
                if (!matchingStopsMap.has(stop.name)) {
                    matchingStopsMap.set(stop.name, []);
                }
                matchingStopsMap.get(stop.name)?.push(busName);
            }
        });
    });

    const matchingStops = Array.from(matchingStopsMap.entries()).map(([name, routes]) => ({
        name,
        routes: [...new Set(routes)].sort() // Get unique, sorted route numbers
    }));

    return { routes: matchingRoutes, stops: matchingStops };
};

// Create a memoized list of all unique stops for efficient lookup
const allStopsList: BusStop[] = Array.from(
    Object.values(ALL_ROUTES)
        .flat()
        .reduce((map, stop) => map.set(stop.name, stop), new Map<string, BusStop>())
        .values()
);

export const findNearestStop = (userPosition: LatLng): BusStop | null => {
    if (allStopsList.length === 0) return null;

    let nearestStop: BusStop | null = null;
    let minDistance = Infinity;

    for (const stop of allStopsList) {
        const distance = haversineDistance(userPosition, stop.position);
        if (distance < minDistance) {
            minDistance = distance;
            nearestStop = stop;
        }
    }

    // Only consider a stop "nearby" if it's within a reasonable distance (e.g., 2km)
    if (minDistance > 2) {
        return null;
    }

    return nearestStop;
};