import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataSaverIcon, SearchIcon, LocationMarkerIcon, BusIcon } from '../components/icons';
import { ROUTE_NUMBER_TO_BUS_ID, DEMO_NEARBY_STOPS, ALL_BUS_DETAILS, ALL_ROUTES, MOCK_NEARBY_STOPS } from '../constants';
import { useProfileSettings, useSearchHistory, useBusSimulation } from '../hooks';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { calculateEtaForStop, searchRoutesAndStops } from '../utils';
import { BusArrival, Bus } from '../types';

const POPULAR_DESTINATIONS = ['Chamundi Hills', 'Mysore Palace', 'Srirampura'];


const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { history, addTerm } = useSearchHistory();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ routes: Omit<Bus, 'position' | 'routeIndex' | 'progress' | 'dwellTimeRemaining'>[], stops: { name: string, routes: string[] }[] } | null>(null);

    const { settings, updateSettings } = useProfileSettings();
    const { buses } = useBusSimulation();

    const handleLowDataModeChange = (enabled: boolean) => {
        updateSettings({ lowDataMode: enabled });
    };

    const handleRouteClick = (routeNumber: string) => {
        const busId = ROUTE_NUMBER_TO_BUS_ID[routeNumber];
        if (busId) {
            navigate('/live', { state: { selectedBusId: busId } });
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedQuery = searchQuery.trim();
        if (trimmedQuery) {
            addTerm(trimmedQuery);
            navigate('/live', { state: { searchQuery: trimmedQuery } });
            setSearchQuery('');
            setSearchResults(null);
        }
    };
    
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Fix: Corrected typo from `e.targe` to `e.target`.
        const query = e.target.value;
        setSearchQuery(query);

        if (query.trim().length > 1) { // Start searching after 1 character
            const results = searchRoutesAndStops(query);
            setSearchResults(results);
        } else {
            setSearchResults(null);
        }
    };

    const handleRouteResultClick = (busId: number) => {
        const bus = ALL_BUS_DETAILS.find(b => b.id === busId);
        if (bus) {
            addTerm(bus.name);
            navigate('/live', { state: { selectedBusId: busId } });
            setSearchQuery('');
            setSearchResults(null);
        }
    };

    const handleStopResultClick = (stopName: string) => {
        addTerm(stopName);
        navigate('/live', { state: { searchQuery: stopName } });
        setSearchQuery('');
        setSearchResults(null);
    };

    const handleSuggestionClick = (suggestion: string) => {
        addTerm(suggestion);
        navigate('/live', { state: { searchQuery: suggestion } });
    };
    
    const nearbyStopsWithArrivals = useMemo(() => {
        return DEMO_NEARBY_STOPS.map(stop => {
            const arrivals: BusArrival[] = [];
            // Use a set to prevent adding the same bus twice (e.g., once as "Arriving" and once with a 1-min ETA)
            const addedBusIds = new Set<number>();

            buses.forEach(bus => {
                const route = ALL_ROUTES[bus.id];
                if (!route) return;

                // Case 1: Bus is currently at the stop (either dwelling or at the start of its route)
                // We'll show this as a 0-minute arrival ("Arriving")
                let isAtStop = false;
                // A) Is it dwelling at this stop? (It has arrived at the end of a segment)
                const dwellingStop = route[bus.routeIndex + 1];
                if (bus.dwellTimeRemaining > 0 && dwellingStop && dwellingStop.name === stop.name) {
                    isAtStop = true;
                }
                // B) Is it at the beginning of a route segment that is this stop? (e.g., initial state)
                if (!isAtStop && bus.progress === 0 && route[bus.routeIndex].name === stop.name) {
                    isAtStop = true;
                }

                if (isAtStop) {
                    const busDetails = ALL_BUS_DETAILS.find(b => b.id === bus.id);
                    const routeNumber = busDetails ? busDetails.name.split(' ')[1] : '';
                    const destination = route.length > 0 ? `to ${route[route.length - 1].name}` : 'Unknown Destination';
                    
                    arrivals.push({ routeNumber, destination, etaMinutes: 0 });
                    addedBusIds.add(bus.id);
                }

                // Case 2: Bus is en-route to the stop. Calculate its ETA.
                // We check addedBusIds to ensure we don't add a bus that we've already marked as "Arriving"
                if (!addedBusIds.has(bus.id)) {
                    const etaMinutes = calculateEtaForStop(bus, stop.name, route);
                    if (etaMinutes !== null && etaMinutes >= 0) {
                        const busDetails = ALL_BUS_DETAILS.find(b => b.id === bus.id);
                        const routeNumber = busDetails ? busDetails.name.split(' ')[1] : '';
                        const destination = route.length > 0 ? `to ${route[route.length - 1].name}` : 'Unknown Destination';
                        
                        arrivals.push({ routeNumber, destination, etaMinutes });
                        addedBusIds.add(bus.id);
                    }
                }
            });

            // Sort all found arrivals by the soonest
            arrivals.sort((a, b) => a.etaMinutes - b.etaMinutes);
            
            const mockStop = MOCK_NEARBY_STOPS.find(s => s.name === stop.name);

            // If the live simulation yields no arrivals, use the mock data as a fallback
            // to ensure the user always sees some activity.
            const finalArrivals = (arrivals.length > 0 || !mockStop) ? arrivals : mockStop.arrivals;
            
            return {
                name: stop.name,
                distanceAway: mockStop?.distanceAway || '',
                arrivals: finalArrivals,
            };
        });
    }, [buses]);

    const suggestions = history.length > 0 ? history : POPULAR_DESTINATIONS;

    return (
        <div className="p-8 md:p-12 max-w-5xl mx-auto">
            <header className="mb-10">
                <p className="text-2xl text-gray-400">Good Morning, Alex!</p>
                <h1 className="text-5xl font-bold text-white mt-1">Where are you going?</h1>
            </header>

            <div className="mb-8 relative">
                <form onSubmit={handleSearchSubmit}>
                    <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Search by route, stop, or bus number"
                            className="w-full bg-[#1F2128] text-lg text-white placeholder-gray-500 border border-transparent rounded-lg py-4 pl-14 pr-4 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                            autoComplete="off"
                        />
                    </div>
                </form>

                {searchResults && (searchResults.routes.length > 0 || searchResults.stops.length > 0) && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#2a2d35] rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
                        <ul className="p-2">
                            {searchResults.routes.length > 0 && (
                                <>
                                    <li className="px-3 py-1 text-xs font-bold text-gray-400 uppercase">Routes</li>
                                    {searchResults.routes.map(bus => (
                                        <li key={`route-${bus.id}`}>
                                            <button
                                                onClick={() => handleRouteResultClick(bus.id)}
                                                className="w-full text-left flex items-center px-3 py-2 rounded-md hover:bg-gray-700/50 transition-colors"
                                            >
                                                <BusIcon className="w-6 h-6 mr-3 text-cyan-400"/>
                                                <div>
                                                    <p className="font-semibold text-white">{bus.name}</p>
                                                    <p className="text-sm text-gray-400">{bus.description}</p>
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </>
                            )}
                            {searchResults.stops.length > 0 && (
                                <>
                                    <li className="px-3 py-2 text-xs font-bold text-gray-400 uppercase border-t border-gray-600/50 mt-2">Stops</li>
                                    {searchResults.stops.map(stop => (
                                        <li key={`stop-${stop.name}`}>
                                            <button
                                                onClick={() => handleStopResultClick(stop.name)}
                                                className="w-full text-left flex items-center px-3 py-2 rounded-md hover:bg-gray-700/50 transition-colors"
                                            >
                                            <LocationMarkerIcon className="w-6 h-6 mr-3 text-pink-400"/>
                                            <div>
                                                <p className="font-semibold text-white">{stop.name}</p>
                                                <p className="text-sm text-gray-400">Serviced by routes: {stop.routes.join(', ')}</p>
                                            </div>
                                            </button>
                                        </li>
                                    ))}
                                </>
                            )}
                        </ul>
                    </div>
                )}
                
                <div className="flex items-center space-x-3 mt-4">
                     {suggestions.map((term) => (
                        <button
                            key={term}
                            onClick={() => handleSuggestionClick(term)}
                            className="bg-[#1F2128] px-4 py-1.5 rounded-full text-sm text-gray-300 hover:bg-gray-700 transition"
                        >
                            {term}
                        </button>
                    ))}
                </div>
            </div>

            <section className="my-10">
                <h2 className="text-2xl font-semibold mb-4 text-gray-300">Quick Settings</h2>
                <ToggleSwitch
                    icon={<DataSaverIcon className="w-8 h-8 text-gray-400"/>}
                    label="Low-Data Mode"
                    description="Replaces the map view with a text-only list to save data."
                    enabled={settings.lowDataMode}
                    onChange={handleLowDataModeChange}
                />
            </section>

            <section>
                <h2 className="text-2xl font-semibold mb-6 text-gray-300">Nearby Stops</h2>
                <div className="space-y-6">
                    {nearbyStopsWithArrivals.map((stop) => (
                        <div key={stop.name} className="bg-[#1F2128] p-6 rounded-lg">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-white">{stop.name}</h3>
                                <p className="text-sm text-gray-400">{stop.distanceAway}</p>
                            </div>
                            <div className="space-y-2">
                                {stop.arrivals.length > 0 ? stop.arrivals.map((arrival, index) => {
                                    const isClickable = !!ROUTE_NUMBER_TO_BUS_ID[arrival.routeNumber];
                                    const isArriving = arrival.etaMinutes < 1;
                                    return (
                                        <div
                                            key={index}
                                            className={`flex items-center justify-between rounded-lg ${isClickable ? 'cursor-pointer hover:bg-gray-700/60 transition-colors p-2 -m-2' : ''}`}
                                            onClick={() => isClickable && handleRouteClick(arrival.routeNumber)}
                                            role={isClickable ? "button" : undefined}
                                            tabIndex={isClickable ? 0 : -1}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && isClickable) {
                                                    handleRouteClick(arrival.routeNumber);
                                                }
                                            }}
                                            aria-label={isClickable ? `Track bus route ${arrival.routeNumber}` : undefined}
                                        >
                                            <div className="flex items-center space-x-4">
                                                <span className="bg-[#294B4E] text-cyan-300 font-bold text-sm px-3 py-1 rounded-md w-20 text-center">{arrival.routeNumber}</span>
                                                <p className="text-gray-300">{arrival.destination}</p>
                                            </div>
                                            <span className={`font-semibold text-sm px-4 py-1.5 rounded-full ${isArriving ? 'bg-green-500/30 text-green-200 animate-pulse' : 'bg-[#173336] text-green-300'}`}>
                                                {isArriving ? 'Arriving' : `${arrival.etaMinutes} min`}
                                            </span>
                                        </div>
                                    );
                                }) : (
                                     <p className="text-gray-500 italic p-2 -m-2">No upcoming buses predicted.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default HomePage;