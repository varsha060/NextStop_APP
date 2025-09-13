// LiveFeedPage.tsx
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import MapComponent from '../components/MapComponent';
import {
  BusIcon,
  GpsFixedIcon,
  GpsOffIcon,
  TimeIcon,
  SearchIcon,
  ArrowLeftIcon,
  StarIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  BellIcon,
  // MapViewIcon, TimelineViewIcon // optional if you use icons for view toggle
} from '../components/icons';

import { useFavorites, useProfileSettings, useBusSimulation, useInAppNotifications } from '../hooks';
// Fix: Corrected typo in import from MOCK_NEAR_STOPS to MOCK_NEARBY_STOPS.
import { ALL_ROUTES, AVG_BUS_SPEED_KPH, MOCK_NEARBY_STOPS, ALL_BUS_DETAILS } from '../constants';
import { haversineDistance, findNearestStop, calculateEtaForStop } from '../utils';
import { Bus, BusStop } from '../types';

/* --------------------------
   Shared types used inside file
   -------------------------- */

interface StopSchedule {
  stop: BusStop;
  status: 'arrived' | 'current' | 'upcoming';
  arrivalTime: Date | null;
  departureTime: Date | null;
  scheduledArrival?: Date;
}

/* --------------------------
   Helpers (unified)
   -------------------------- */

const formatTime = (date: Date | null, part: 'time' | 'ampm' = 'time'): string => {
  if (!date) return part === 'time' ? 'N/A' : '';
  const timeString = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const [time, ampm] = timeString.split(' ');
  if (part === 'time') return time;
  return ampm;
};

/* Calculates ETA in minutes for a bus using average speeds and dwell times */
const calculateEta = (bus: Bus | null): number => {
  if (!bus) return 0;
  const route = ALL_ROUTES[bus.id];
  if (!route || bus.routeIndex >= route.length - 1) {
    return bus?.manualDelay ?? 0;
  }
  const DWELL_TIME_MINUTES = 1;
  const nextStop = route[bus.routeIndex + 1];
  const distanceToNextStop = haversineDistance(bus.position, nextStop.position);
  let totalMinutes = (distanceToNextStop / AVG_BUS_SPEED_KPH) * 60;
  for (let i = bus.routeIndex + 1; i < route.length - 1; i++) {
    totalMinutes += DWELL_TIME_MINUTES;
    const currentSegmentStart = route[i];
    const currentSegmentEnd = route[i + 1];
    const segmentDistance = haversineDistance(currentSegmentStart.position, currentSegmentEnd.position);
    totalMinutes += (segmentDistance / AVG_BUS_SPEED_KPH) * 60;
  }
  return Math.round(totalMinutes + bus.manualDelay);
};

/* Build schedule for a bus (list of stops with times) */
const calculateScheduleForBus = (bus: Bus | null): StopSchedule[] => {
  if (!bus) return [];
  const routeStops = ALL_ROUTES[bus.id];
  if (!routeStops) return [];
  const now = new Date();
  const DWELL_TIME_MINUTES = 1;
  const nextStopIdx = bus.routeIndex + 1;

  if (nextStopIdx >= routeStops.length) {
    return routeStops.map(stop => ({ stop, status: 'arrived', arrivalTime: null, departureTime: null }));
  }

  const futureSchedule: { stopName: string; arrivalTime: Date; departureTime: Date }[] = [];
  let cumulativeTime = now;

  const nextStop = routeStops[nextStopIdx];
  const distanceToNextStopKm = haversineDistance(bus.position, nextStop.position);
  const timeToNextStopMins = (distanceToNextStopKm / AVG_BUS_SPEED_KPH) * 60;
  cumulativeTime = new Date(cumulativeTime.getTime() + timeToNextStopMins * 60 * 1000);

  futureSchedule.push({
    stopName: nextStop.name,
    arrivalTime: cumulativeTime,
    departureTime: new Date(cumulativeTime.getTime() + DWELL_TIME_MINUTES * 60 * 1000),
  });

  for (let i = nextStopIdx + 1; i < routeStops.length; i++) {
    const currentStop = routeStops[i];
    const prevStop = routeStops[i - 1];
    const distanceKm = haversineDistance(prevStop.position, currentStop.position);
    const timeMins = (distanceKm / AVG_BUS_SPEED_KPH) * 60;
    const lastDepartureTime = futureSchedule[futureSchedule.length - 1].departureTime;
    cumulativeTime = new Date(lastDepartureTime.getTime() + timeMins * 60 * 1000);
    futureSchedule.push({
      stopName: currentStop.name,
      arrivalTime: cumulativeTime,
      departureTime: new Date(cumulativeTime.getTime() + DWELL_TIME_MINUTES * 60 * 1000),
    });
  }

  return routeStops.map((stop, i) => {
    if (i <= bus.routeIndex)
      return { stop, status: 'arrived', arrivalTime: null, departureTime: null, scheduledArrival: new Date(0) };

    const scheduledStop = futureSchedule.find(s => s.stopName === stop.name);
    if (!scheduledStop)
      return { stop, status: 'upcoming', arrivalTime: null, departureTime: null, scheduledArrival: new Date(0) };

    const finalArrivalTime = new Date(scheduledStop.arrivalTime.getTime() + bus.manualDelay * 60 * 1000);
    const finalDepartureTime = new Date(scheduledStop.departureTime.getTime() + bus.manualDelay * 60 * 1000);
    return {
      stop,
      status: i === nextStopIdx ? 'current' : 'upcoming',
      arrivalTime: finalArrivalTime,
      departureTime: finalDepartureTime,
      scheduledArrival: new Date(0),
    };
  });
};

/* --------------------------
   Reusable UI components (in-file for single-file drop-in)
   -------------------------- */

/* BusList used in sidebar */
const BusList: React.FC<{
  busResults: { bus: Bus; matchReason?: string }[];
  selectedBusIds: number[];
  onSelectBus: (id: number) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  noResultsFound: boolean;
}> = ({ busResults, selectedBusIds, onSelectBus, searchQuery, onSearchChange, noResultsFound }) => {
  return (
    <div className="bg-transparent p-4 rounded-lg flex flex-col h-full text-white">
      <h2 className="text-xl font-bold mb-3 text-cyan-400 flex-shrink-0">Bus Fleet</h2>

      <div className="relative mb-3 flex-shrink-0">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
          <SearchIcon className="w-5 h-5 text-gray-400" />
        </span>
        <input
          type="text"
          placeholder="Search by name or stop..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-[#1A1C20] text-white placeholder-gray-500 border border-gray-700 rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
          aria-label="Search for a bus by name or destination"
        />
      </div>

      <div className="flex-grow min-h-0 relative">
        <ul className="absolute inset-0 overflow-y-auto pr-2 space-y-2" role="listbox">
          {noResultsFound && (
            <li className="text-gray-400 text-center py-2 italic bg-gray-800/50 rounded-lg">No results. Showing all buses.</li>
          )}

          {busResults.length > 0 ? (
            busResults.map(({ bus, matchReason }) => {
              const route = ALL_ROUTES[bus.id];
              let statusText = 'Status unavailable';
              if (route) {
                if (bus.dwellTimeRemaining > 0) {
                  const currentStop = route[bus.routeIndex + 1];
                  statusText = currentStop ? `At ${currentStop.name}` : 'At terminal';
                } else {
                  const nextStop = route[bus.routeIndex + 1];
                  statusText = nextStop ? `En route to ${nextStop.name}` : 'Approaching terminal';
                }
              }

              return (
                <li
                  key={bus.id}
                  onClick={() => onSelectBus(bus.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-between ${
                    selectedBusIds.includes(bus.id) ? 'bg-cyan-500/20 ring-2 ring-cyan-400' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                  aria-selected={selectedBusIds.includes(bus.id)}
                  role="option"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onSelectBus(bus.id)}
                >
                  <div>
                    <p className="font-bold text-white">{bus.name}</p>
                    <p className="text-sm text-gray-400">{statusText}</p>
                    {matchReason && <p className="text-xs text-cyan-300 italic mt-1">{matchReason}</p>}
                    <div className="flex items-center mt-1">
                      <span className={`w-2 h-2 mr-2 rounded-full ${bus.isGpsActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                      <p className={`text-xs ${bus.isGpsActive ? 'text-green-400' : 'text-yellow-400'}`}>{bus.isGpsActive ? 'GPS Active' : 'Predictive Mode'}</p>
                    </div>
                  </div>
                  <BusIcon className="w-8 h-8 text-gray-400" />
                </li>
              );
            })
          ) : (
            <li className="text-gray-400 text-center py-4">No buses found.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

/* ControlPanel (ETA + controls) */
const ControlPanel: React.FC<{ selectedBus: Bus | null; onToggleGps: () => void; onAddDelay: () => void; eta: number }> = ({
  selectedBus,
  onToggleGps,
  onAddDelay,
  eta,
}) => {
  return (
    <div className="bg-transparent p-4 rounded-lg space-y-4 text-white">
      <div className="text-center">
        <p className="text-gray-400 text-sm">ETA FOR {selectedBus?.name || '...'}</p>
        <p className="text-4xl font-bold text-cyan-400">{selectedBus ? eta : '--'} <span className="text-2xl">min</span></p>
      </div>

      {selectedBus && (
        <div className="border-t border-gray-700 pt-3">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Description</h3>
          <p className="text-gray-300 text-sm">{selectedBus.description}</p>
        </div>
      )}

      {selectedBus && !selectedBus.isGpsActive && (
        <div className="bg-yellow-500/20 border border-yellow-400 text-yellow-300 text-sm rounded-lg p-3 text-center">
          <GpsOffIcon className="w-6 h-6 mx-auto mb-1" />
          <strong>Prediction Mode Active</strong>
          <p>GPS signal lost. ETA is based on average speed.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button onClick={onToggleGps} disabled={!selectedBus} className="disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center p-3 rounded-lg font-semibold transition-colors bg-gray-700 hover:bg-gray-600 text-white">
          {selectedBus?.isGpsActive ? <GpsOffIcon className="w-5 h-5 mr-2" /> : <GpsFixedIcon className="w-5 h-5 mr-2" />}
          {selectedBus?.isGpsActive ? 'Kill GPS' : 'Resume'}
        </button>
        <button onClick={onAddDelay} disabled={!selectedBus} className="disabled:opacity-50 disabled:cursor-not-allowed p-3 rounded-lg font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors flex items-center justify-center">
          <TimeIcon className="w-5 h-5 mr-2" />
          Delay +5min
        </button>
      </div>
    </div>
  );
};

/* LowDataView (old version) */
const LowDataView: React.FC<{ buses: Bus[]; calculateEta: (b: Bus | null) => number; calculateSchedule: (b: Bus | null) => StopSchedule[] }> = ({ buses, calculateEta, calculateSchedule }) => {
  const [expandedBusId, setExpandedBusId] = useState<number | null>(null);
  const handleToggleExpand = (busId: number) => setExpandedBusId(current => (current === busId ? null : busId));

  const getRouteName = (bus: Bus) => {
    const route = ALL_ROUTES[bus.id];
    if (!route || route.length < 2) return bus.name;
    return `${route[0].name} to ${route[route.length - 1].name}`;
  };

  const formatTimeText = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto text-gray-300 bg-[#0E0F11] h-full overflow-y-auto">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-white">Live Bus Updates</h1>
        <p className="text-md text-gray-500">Low-Data Mode</p>
      </header>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-400">Active Routes</h2>
        <div className="bg-[#1F2128] rounded-lg">
          {buses.map(bus => {
            const isExpanded = expandedBusId === bus.id;
            const schedule = isExpanded ? calculateSchedule(bus) : [];
            const upcomingStops = schedule.filter(s => s.status === 'current' || s.status === 'upcoming').slice(0, 4);
            return (
              <div key={bus.id} className="border-b border-gray-700/50 last:border-b-0">
                <button className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-700/30 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50" onClick={() => handleToggleExpand(bus.id)} aria-expanded={isExpanded}>
                  <div>
                    <p className="font-bold text-white text-lg">{bus.name}</p>
                    <p className="text-sm text-gray-500">{getRouteName(bus)}</p>
                  </div>
                  <div className="text-right flex-shrink-0 pl-4">
                    <p className="text-xl font-mono text-white">~{calculateEta(bus)} min</p>
                    <p className="text-xs text-gray-500 uppercase">Predicted ETA</p>
                  </div>
                </button>

                {isExpanded && (
                  <div className="bg-black/20 px-4 pb-4 pt-2">
                    <p className="text-sm font-bold text-gray-400 mb-2">Predicted Stop Timeline:</p>
                    {upcomingStops.length > 0 ? (
                      <ul className="space-y-1 text-sm">
                        {upcomingStops.map((item, index) => (
                          <li key={item.stop.name} className="flex justify-between items-center font-mono">
                            <span className="text-gray-300 pr-2">
                              {index === 0 && <span className="font-bold text-cyan-400">Next: </span>}
                              {item.stop.name}
                            </span>
                            <span className="flex-grow border-b border-dotted border-gray-600" />
                            <span className="text-gray-300 font-semibold pl-2">~{formatTimeText(item.arrivalTime)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No upcoming stops information available.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {buses.length === 0 && <p className="text-gray-500 text-center py-4">No active buses to display.</p>}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-400">Nearby Stops Summary</h2>
        <div className="space-y-4">
          {MOCK_NEARBY_STOPS.map((stop) => (
            <div key={stop.name} className="bg-[#1F2128] p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-white">{stop.name}</h3>
                <p className="text-sm text-gray-500">{stop.distanceAway}</p>
              </div>
              <div className="text-sm text-gray-400">
                <span className="font-semibold text-gray-300">Arrivals: </span>
                {stop.arrivals.map(a => `${a.routeNumber} (~${a.etaMinutes}m)`).join(', ')}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// --- Start: New TimelineDetailView Components ---

const DetailedRouteNameHeader: React.FC<{ routeNumber: string; routeName: string }> = ({ routeNumber, routeName }) => {
  const { part1, part2, part3 } = useMemo(() => {
    const [start, end] = routeName.split(' - ');
    const acronymMatch = start.match(/\(([^)]+)\)/);
    const mainStart = start.replace(/\s*\(([^)]+)\)/, '').trim();

    const endHasLastStop = end?.toLowerCase().includes('last stop');
    const mainEnd = end?.replace(/last stop/i, '').trim();

    return {
      part1: mainStart,
      part2: `${acronymMatch ? `(${acronymMatch[1]}) ` : ''}- ${mainEnd}`,
      part3: endHasLastStop ? 'Last Stop' : '',
    };
  }, [routeName]);

  return (
    <div className="flex items-start space-x-3">
      <span className="bg-cyan-500 text-black font-bold text-lg px-2 rounded mt-1">{routeNumber}</span>
      <div>
        <h1 className="text-2xl font-bold text-white leading-tight">{part1}</h1>
        <h2 className="text-lg font-medium text-gray-300 leading-tight">{part2}</h2>
        {part3 && <h2 className="text-lg font-medium text-gray-300 leading-tight">{part3}</h2>}
      </div>
    </div>
  );
};

const NextStopDisplay: React.FC<{ scheduleItem: StopSchedule | undefined }> = ({ scheduleItem }) => {
  if (!scheduleItem) return null;
  return (
    <div className="bg-[#1F2128] border border-gray-700 p-4 rounded-lg flex justify-between items-center">
      <div className="flex-grow">
        <p className="text-xs text-gray-400 uppercase tracking-wider">Next Stop</p>
        <p className="text-3xl font-bold text-white leading-tight">{scheduleItem.stop.name}</p>
      </div>
      <div className="text-right flex-shrink-0 pl-4">
        <p className="text-xs text-gray-400 uppercase tracking-wider">Expected</p>
        <div className="flex items-baseline space-x-1">
          <p className="text-3xl font-bold text-yellow-400">{formatTime(scheduleItem.arrivalTime, 'time')}</p>
          <p className="text-xl font-semibold text-yellow-400/80">{formatTime(scheduleItem.arrivalTime, 'ampm')}</p>
        </div>
      </div>
    </div>
  );
};

const TimelineDot: React.FC<{ status: 'arrived' | 'current' | 'upcoming' }> = ({ status }) => {
  if (status === 'arrived') {
    return (
      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
        <div className="w-4 h-4 rounded-full bg-green-500/50 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-green-400" />
        </div>
      </div>
    );
  }
  if (status === 'current') {
    return (
        <div className="w-8 h-8 rounded-full bg-cyan-400/20 flex items-center justify-center flex-shrink-0 ring-2 ring-cyan-500">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
        </div>
    );
  }
  // upcoming
  return (
    <div className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center flex-shrink-0">
      <div className="w-2 h-2 rounded-full bg-gray-500" />
    </div>
  );
};

/* The new, redesigned TimelineDetailView */
const TimelineDetailView: React.FC<{
  bus: Bus;
  schedule: StopSchedule[];
  route: BusStop[];
  onBack: () => void;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}> = ({ bus, schedule, route, onBack, isFavorited, onToggleFavorite }) => {
  const currentStopIndex = schedule.findIndex(s => s.status === 'current');
  const nextStopSchedule = currentStopIndex !== -1 ? schedule[currentStopIndex] : undefined;

  const routeNumber = bus.name.split(' ')[1] || '';
  const routeName = route.length > 1 ? `${route[0].name} - ${route[route.length - 1].name}` : bus.name;

  return (
    <div className="h-full bg-transparent flex flex-col overflow-hidden text-white">
      {/* Header */}
      <div className="flex-shrink-0 p-4 bg-[#1A1C20]/80 backdrop-blur-sm border-b border-gray-700/50 flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="text-gray-400 hover:text-white p-1" aria-label="Go back to bus list">
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <DetailedRouteNameHeader routeNumber={routeNumber} routeName={routeName} />
        </div>
        <div className="flex flex-col items-end">
          <button
            onClick={onToggleFavorite}
            className={`transition-colors ${isFavorited ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-400 hover:text-white'}`}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <StarIcon className="w-8 h-8" isFilled={isFavorited} />
          </button>
          <div className="flex items-center space-x-1.5 text-sm mt-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-red-400">High</span>
            <span className="text-gray-400">passenger load</span>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6">
        <NextStopDisplay scheduleItem={nextStopSchedule} />

        {/* Timeline List */}
        <div className="relative">
          {/* The vertical line connecting dots */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-700" />
          
          <ul className="space-y-4">
            {schedule.map(({ stop, status, arrivalTime }, index) => (
              <li key={`${stop.name}-${index}`} className="relative flex items-start space-x-4">
                <div className="z-10 mt-1">
                    <TimelineDot status={status} />
                </div>
                
                <div className="flex-grow bg-[#1F2128] p-4 rounded-lg border border-gray-700/80 min-h-[80px]">
                  <p className={`text-lg font-bold ${status === 'arrived' ? 'text-gray-400' : 'text-white'}`}>{stop.name}</p>
                  
                  {status === 'arrived' ? (
                     <>
                        <p className="text-sm text-gray-500">Departed</p>
                         <div className="mt-2 flex items-center justify-between text-gray-500 text-sm">
                            <div className="flex items-center space-x-1">
                               <ArrowDownIcon className="w-4 h-4" />
                               <span>Arrival</span>
                            </div>
                             <div className="flex items-center space-x-1">
                               <ArrowUpIcon className="w-4 h-4" />
                               <span>Departure</span>
                            </div>
                        </div>
                     </>
                  ) : status === 'current' ? (
                    <p className="text-sm text-cyan-400 animate-pulse">Arriving now...</p>
                  ) : (
                    <p className="text-sm text-gray-400">Expected at {formatTime(arrivalTime, 'time')} {formatTime(arrivalTime, 'ampm')}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
// --- End: New TimelineDetailView Components ---

/* UserLiveStatusPanel (new version) */
const UserLiveStatusPanel: React.FC<{ userPosition: { lat: number; lng: number } | null; buses: Bus[]; onStopTracking: () => void }> = ({ userPosition, buses, onStopTracking }) => {
  const nearestStop = useMemo(() => (userPosition ? findNearestStop(userPosition) : null), [userPosition]);
  const panelData = useMemo(() => {
    if (!nearestStop || !userPosition) return { type: 'loading' as const, items: [] };

    // arrivals for nearest stop
    const stopArrivals: any[] = [];
    buses.forEach(bus => {
      const route = ALL_ROUTES[bus.id];
      if (!route) return;
      const etaMinutes = calculateEtaForStop(bus, nearestStop.name, route);
      if (etaMinutes !== null) {
        const busDetails = ALL_BUS_DETAILS.find(b => b.id === bus.id);
        const routeNumber = busDetails ? busDetails.name.split(' ')[1] : '';
        const destination = route.length > 0 ? `to ${route[route.length - 1].name}` : 'Unknown Destination';
        const nextStopInRoute = route[bus.routeIndex + 1];
        const nextStop = nextStopInRoute ? nextStopInRoute.name : 'End of line';
        stopArrivals.push({ routeNumber, destination, etaMinutes, nextStop });
      }
    });

    if (stopArrivals.length > 0) return { type: 'arrivals' as const, items: stopArrivals.sort((a, b) => a.etaMinutes - b.etaMinutes) };

    // fallback: closest buses
    const closestBuses = buses
      .map(bus => ({ bus, distance: haversineDistance(userPosition, bus.position) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 4);

    if (closestBuses.length > 0) {
      const nearbyBusItems = closestBuses.map(({ bus, distance }) => {
        const route = ALL_ROUTES[bus.id];
        const busDetails = ALL_BUS_DETAILS.find(b => b.id === bus.id);
        const routeNumber = busDetails ? busDetails.name.split(' ')[1] : '';
        const destination = route && route.length > 0 ? `to ${route[route.length - 1].name}` : 'Unknown Destination';
        let statusText = 'Status unavailable';
        if (route) {
          if (bus.dwellTimeRemaining > 0) {
            const currentStop = route[bus.routeIndex + 1];
            statusText = currentStop ? `At ${currentStop.name}` : 'At terminal';
          } else {
            const nextStop = route[bus.routeIndex + 1];
            statusText = nextStop ? `Next stop: ${nextStop.name}` : 'Approaching terminal';
          }
        }
        return { id: bus.id, routeNumber, destination, distance, statusText };
      });
      return { type: 'nearby' as const, items: nearbyBusItems };
    }

    return { type: 'none' as const, items: [] };
  }, [buses, nearestStop, userPosition]);

  const panelHeader = useMemo(() => {
    if (!nearestStop) return { supertitle: 'STATUS', title: 'Finding nearest bus stop...' };
    switch (panelData.type) {
      case 'arrivals':
        return { supertitle: 'Your Nearest Stop', title: nearestStop.name };
      case 'nearby':
        return { supertitle: 'No buses for your stop', title: 'Other Nearby Buses' };
      default:
        return { supertitle: `Your Nearest Stop: ${nearestStop.name}`, title: 'No buses found nearby' };
    }
  }, [nearestStop, panelData.type]);

  return (
    <div className="bg-transparent p-4 rounded-lg flex flex-col h-full text-white">
      <div className="flex-shrink-0">
        <h2 className="text-xl font-bold text-cyan-400 flex items-center">
          <GpsFixedIcon className="w-6 h-6 mr-2 animate-pulse" />
          Live Tracking Active
        </h2>
        <p className="text-sm text-gray-400 mt-1">Showing upcoming buses for your location.</p>
        <div className="mt-3 flex items-center space-x-2 text-sm bg-gray-800/70 p-2 rounded-lg">
          <BellIcon className="w-5 h-5 text-cyan-300 flex-shrink-0" />
          <p className="text-gray-300">Notifications are active. We'll alert you when a bus is near.</p>
        </div>
      </div>

      <div className="flex-grow min-h-0 mt-4">
        <div className="mb-3">
          <p className="text-xs text-gray-400 uppercase font-semibold">{panelHeader.supertitle}</p>
          <h3 className="text-lg font-bold text-white">{panelHeader.title}</h3>
        </div>

        <div className="relative h-[calc(100%-76px)]">
          <div className="absolute inset-0 overflow-y-auto pr-2 space-y-3">
            {panelData.items.length === 0 && panelData.type !== 'loading' && (
              <div className="text-center py-8 text-gray-500">
                <BusIcon className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                <p className="italic">No upcoming buses predicted for your stop.</p>
              </div>
            )}

            {panelData.type === 'arrivals' &&
              (panelData.items as any[]).map((arrival, index) => {
                const isArrivingNow = arrival.etaMinutes < 1;
                const etaText = isArrivingNow ? 'Arriving' : `${arrival.etaMinutes} min`;
                const etaClass = isArrivingNow ? 'bg-green-500/30 text-green-200 animate-pulse' : 'bg-[#173336] text-green-300';

                return (
                  <div key={index} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:bg-gray-700/80">
                    <div className="flex items-center space-x-4">
                      <span className="bg-[#294B4E] text-cyan-300 font-bold text-sm px-3 py-1 rounded-md w-20 text-center">{arrival.routeNumber}</span>
                      <div className="flex-grow">
                         <p className="text-gray-300 font-semibold">{arrival.destination}</p>
                         <p className="text-xs text-gray-500">Next stop: {arrival.nextStop}</p>
                      </div>
                    </div>
                    <span className={`font-semibold text-sm px-3 py-1.5 rounded-full ${etaClass}`}>{etaText}</span>
                  </div>
                );
              })}
            
            {panelData.type === 'nearby' &&
              (panelData.items as any[]).map(bus => (
                <div key={bus.id} className="bg-gray-800 p-3 rounded-lg">
                   <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <span className="bg-[#294B4E] text-cyan-300 font-bold text-sm px-3 py-1 rounded-md w-20 text-center">{bus.routeNumber}</span>
                            <p className="text-gray-300 font-semibold">{bus.destination}</p>
                        </div>
                        <span className="text-sm text-gray-400">{(bus.distance * 1000).toFixed(0)}m away</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 pl-24">{bus.statusText}</p>
                </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 mt-4 pt-3 border-t border-gray-700">
        <button onClick={onStopTracking} className="w-full p-3 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center justify-center">
          <GpsOffIcon className="w-5 h-5 mr-2" />
          Stop Live Tracking
        </button>
      </div>
    </div>
  );
};


/* Main page component */
const LiveFeedPage: React.FC = () => {
    const { state } = useLocation();
    const { favorites, toggleFavorite, isFavorited } = useFavorites();
    const { settings } = useProfileSettings();
    const { buses, userPosition, isUserTracking, addDelay, toggleGps, toggleUserTracking } = useBusSimulation();
    const { addNotification } = useInAppNotifications();

    const [selectedBusIds, setSelectedBusIds] = useState<number[]>([]);
    const [primarySelectedBusId, setPrimarySelectedBusId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeView, setActiveView] = useState<'map' | 'timeline'>('map');

    // Ref for tracking notifications to avoid spam
    const notifiedBuses = useRef<{ [key: number]: 'approaching' | 'arrived' }>({});
    const trackingActivatedNotified = useRef(false); // Ref to track the "tracking on" notification
    
    // Effect to handle initial bus selection from navigation state
    useEffect(() => {
        const busId = state?.selectedBusId;
        const query = state?.searchQuery;
        if (busId) {
            setSelectedBusIds([busId]);
            setPrimarySelectedBusId(busId);
        }
        if(query) {
            setSearchQuery(query);
        }
    }, [state]);
    
    // Effect for In-App Notifications
    useEffect(() => {
        if (!isUserTracking || !userPosition) {
            notifiedBuses.current = {}; // Clear notification status when tracking stops
            trackingActivatedNotified.current = false; // Reset on stop
            return;
        }

        // Show "Tracking Activated" notification once per session
        if (!trackingActivatedNotified.current) {
            addNotification({
                title: 'Live Tracking On',
                message: 'You will now receive live alerts for nearby buses.',
                type: 'success',
                // Persistent by default (no duration)
            });
            trackingActivatedNotified.current = true;
        }

        const nearestStop = findNearestStop(userPosition);
        if (!nearestStop) return;

        buses.forEach(bus => {
            const route = ALL_ROUTES[bus.id];
            if (!route) return;

            const distance = haversineDistance(userPosition, bus.position);
            const etaMinutes = calculateEtaForStop(bus, nearestStop.name, route);

            // Arrived (< 20 meters)
            if (distance < 0.02) {
                if (notifiedBuses.current[bus.id] !== 'arrived') {
                    const message = bus.id === 6 ? 'Bus 62 is arriving' : `${bus.name} has arrived at your stop!`;
                    addNotification({
                        title: 'Bus Arrived!',
                        message: message,
                        type: 'alert',
                    });
                    notifiedBuses.current[bus.id] = 'arrived';
                }
            } 
            // Approaching (< 5 minutes)
            else if (etaMinutes !== null && etaMinutes < 5 && etaMinutes >= 0) {
                if (notifiedBuses.current[bus.id] !== 'approaching' && notifiedBuses.current[bus.id] !== 'arrived') {
                    const roundedMins = Math.max(1, Math.round(etaMinutes));
                    addNotification({
                        title: 'Bus Approaching',
                        message: `${bus.name} is about ${roundedMins} minute${roundedMins > 1 ? 's' : ''} away.`,
                        type: 'info',
                        duration: 8000,
                    });
                    notifiedBuses.current[bus.id] = 'approaching';
                }
            } 
            // Bus is far away, reset its notification status
            else {
                delete notifiedBuses.current[bus.id];
            }
        });
    }, [buses, userPosition, isUserTracking, addNotification]);

    const handleSelectBus = useCallback((busId: number) => {
        setSelectedBusIds(prev => {
            const isSelected = prev.includes(busId);
            if(isSelected) {
                // If it's the only one selected, deselecting it clears the primary
                if(prev.length === 1) setPrimarySelectedBusId(null);
                return prev.filter(id => id !== busId);
            } else {
                setPrimarySelectedBusId(busId); // Make the newly selected bus the primary one
                return [...prev, busId];
            }
        });
        setActiveView('map');
    }, []);
    
    const handleToggleGps = useCallback(() => {
        if(primarySelectedBusId !== null) {
            const bus = buses.find(b => b.id === primarySelectedBusId);
            if(bus) {
                 addNotification({
                    title: 'GPS Status Updated',
                    message: bus.isGpsActive ? `${bus.name} is now in Prediction Mode` : `${bus.name} GPS signal has been restored`,
                    type: 'info',
                    duration: 5000,
                });
            }
            toggleGps(primarySelectedBusId);
        }
    }, [primarySelectedBusId, toggleGps, buses, addNotification]);
    
    const handleAddDelay = useCallback(() => {
        if(primarySelectedBusId !== null) {
            const bus = buses.find(b => b.id === primarySelectedBusId);
            if(bus) {
                addNotification({
                    title: 'Delay Added',
                    message: `Added a 5-minute delay to ${bus.name}`,
                    type: 'info',
                    duration: 5000,
                });
            }
            addDelay(primarySelectedBusId);
        }
    }, [primarySelectedBusId, addDelay, buses, addNotification]);

    const handleToggleFavorite = useCallback((busId: number) => {
        const bus = ALL_BUS_DETAILS.find(b => b.id === busId);
        if (bus) {
            const message = isFavorited(busId) ? `Removed ${bus.name} from favorites` : `Added ${bus.name} to favorites`;
            addNotification({
                title: 'Favorites Updated',
                message,
                type: 'info',
                duration: 5000,
            });
        }
        toggleFavorite(busId);
    }, [toggleFavorite, isFavorited, addNotification]);

    const busResults = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
            return { list: buses.map(bus => ({ bus })), noResults: false };
        }
        
        const results = new Map<number, { bus: Bus, matchReason?: string }>();
        buses.forEach(bus => {
            if (bus.name.toLowerCase().includes(query)) {
                results.set(bus.id, { bus, matchReason: 'Matches name' });
            }
            const route = ALL_ROUTES[bus.id];
            if (route) {
                const isOnRoute = route.some(stop => stop.name.toLowerCase().includes(query));
                if (isOnRoute && !results.has(bus.id)) {
                    const stop = route.find(s => s.name.toLowerCase().includes(query));
                    results.set(bus.id, { bus, matchReason: `Serves ${stop?.name}` });
                }
            }
        });
        
        const filteredList = Array.from(results.values());
        const noResults = filteredList.length === 0;

        return {
            list: noResults ? buses.map(bus => ({ bus })) : filteredList,
            noResults: noResults
        };
    }, [searchQuery, buses]);
    
    const primarySelectedBus = useMemo(() => buses.find(b => b.id === primarySelectedBusId), [primarySelectedBusId, buses]);
    const selectedBusEta = useMemo(() => calculateEta(primarySelectedBus), [primarySelectedBus]);
    const scheduleForSelectedBus = useMemo(() => calculateScheduleForBus(primarySelectedBus), [primarySelectedBus]);

    const SidebarContent = () => {
        if (isUserTracking) {
            return <UserLiveStatusPanel userPosition={userPosition} buses={buses} onStopTracking={toggleUserTracking} />;
        }
        if (primarySelectedBus && activeView === 'timeline') {
            const route = ALL_ROUTES[primarySelectedBus.id];
            return (
                <TimelineDetailView 
                    bus={primarySelectedBus}
                    schedule={scheduleForSelectedBus}
                    route={route || []}
                    onBack={() => setActiveView('map')}
                    isFavorited={isFavorited(primarySelectedBus.id)}
                    onToggleFavorite={() => handleToggleFavorite(primarySelectedBus.id)}
                />
            );
        }
        return (
            <div className="h-full flex flex-col">
                <div className="flex-grow min-h-0">
                    <BusList
                        busResults={busResults.list}
                        selectedBusIds={selectedBusIds}
                        onSelectBus={handleSelectBus}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        noResultsFound={busResults.noResults}
                    />
                </div>
                <div className="flex-shrink-0">
                    <ControlPanel 
                        selectedBus={primarySelectedBus}
                        onToggleGps={handleToggleGps}
                        onAddDelay={handleAddDelay}
                        eta={selectedBusEta}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="h-screen flex flex-col md:flex-row bg-[#0E0F11]">
            <aside className="w-full md:w-96 flex-shrink-0 bg-[#1F2128] border-r border-gray-800 flex flex-col h-1/2 md:h-full">
               <SidebarContent />
            </aside>
            <main className="flex-1 min-h-0">
                {settings.lowDataMode ? (
                     <LowDataView buses={buses} calculateEta={calculateEta} calculateSchedule={calculateScheduleForBus} />
                ) : (
                    <MapComponent
                        buses={buses}
                        selectedBusIds={selectedBusIds}
                        primarySelectedBusId={primarySelectedBusId}
                        allRoutes={ALL_ROUTES}
                        selectedBusEta={primarySelectedBusId ? selectedBusEta : null}
                        isUserTracking={isUserTracking}
                        onToggleTracking={toggleUserTracking}
                        onSelectBus={handleSelectBus}
                    />
                )}
            </main>
            {primarySelectedBus && activeView === 'map' && (
                <button
                    onClick={() => setActiveView('timeline')}
                    className="absolute bottom-24 right-16 lg:bottom-5 lg:right-20 z-[1000] bg-cyan-500 text-black font-semibold px-4 py-2 rounded-lg hover:bg-cyan-400 transition-colors flex items-center space-x-2 shadow-lg"
                >
                    <BusIcon className="w-5 h-5"/>
                    <span>View Timeline</span>
                </button>
            )}
        </div>
    );
};

export default LiveFeedPage;