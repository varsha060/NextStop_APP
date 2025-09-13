import React, { useState, useCallback, createContext, useContext, useEffect, useMemo } from 'react';
import { Bus, ProfileSettings, LatLng, AppNotification } from './types';
// Fix: Imported AVG_BUS_SPEED_KPH to resolve 'Cannot find name' error.
import { ALL_ROUTES, SIMULATION_INTERVAL_MS, SIMULATION_SPEED_MULTIPLIER, initialBuses, AVG_BUS_SPEED_KPH } from './constants';
import { haversineDistance } from './utils';

const HISTORY_KEY = 'bus_tracker_search_history';
const MAX_HISTORY_ITEMS = 3;
const FAVORITES_KEY = 'bus_tracker_favorites';
const PROFILE_SETTINGS_KEY = 'bus_tracker_profile_settings';


// Search History Hook
const getHistory = (): string[] => {
    try {
        const historyJson = localStorage.getItem(HISTORY_KEY);
        if (historyJson) {
            const history = JSON.parse(historyJson);
            if (Array.isArray(history) && history.every(item => typeof item === 'string')) {
                return history;
            }
        }
    } catch (error) {
        console.error("Failed to parse search history from localStorage", error);
    }
    return [];
};

const saveHistory = (history: string[]) => {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
        console.error("Failed to save search history to localStorage", error);
    }
};

export const useSearchHistory = () => {
    const [history, setHistory] = useState<string[]>(getHistory());

    const addTerm = useCallback((term: string) => {
        const cleanedTerm = term.trim();
        if (!cleanedTerm) return;

        setHistory(prevHistory => {
            const lowerCaseTerm = cleanedTerm.toLowerCase();
            const newHistory = [
                cleanedTerm,
                ...prevHistory.filter(item => item.toLowerCase() !== lowerCaseTerm)
            ];

            const trimmedHistory = newHistory.slice(0, MAX_HISTORY_ITEMS);
            saveHistory(trimmedHistory);
            return trimmedHistory;
        });
    }, []);

    return { history, addTerm };
};


// Favorites Hook
const getFavorites = (): number[] => {
    try {
        const favsJson = localStorage.getItem(FAVORITES_KEY);
        // If the key exists in localStorage, try to parse it.
        // This allows an empty array `[]` to be a valid, saved state (no favorites).
        if (favsJson !== null) {
            const favs = JSON.parse(favsJson);
            if (Array.isArray(favs) && favs.every(item => typeof item === 'number')) {
                return favs;
            }
        }
    } catch (error) {
        console.error("Failed to parse favorites from localStorage", error);
    }
    // If the key does not exist or the data is corrupt, populate with default favorites.
    return [1, 4]; // Default favorites: Bus 95 (mainline) and Bus 301 (tourist)
};

const saveFavorites = (favorites: number[]) => {
    try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (error) {
        console.error("Failed to save favorites to localStorage", error);
    }
};

export const useFavorites = () => {
    const [favorites, setFavorites] = useState<number[]>(getFavorites());

    const toggleFavorite = useCallback((busId: number) => {
        setFavorites(prevFavorites => {
            const newFavorites = prevFavorites.includes(busId)
                ? prevFavorites.filter(id => id !== busId)
                : [...prevFavorites, busId];
            saveFavorites(newFavorites);
            return newFavorites;
        });
    }, []);
    
    const isFavorited = (busId: number) => favorites.includes(busId);

    return { favorites, toggleFavorite, isFavorited };
};


// Profile Settings Hook
const defaultSettings: ProfileSettings = {
    lowDataMode: false,
};

const getProfileSettings = (): ProfileSettings => {
     try {
        const settingsJson = localStorage.getItem(PROFILE_SETTINGS_KEY);
        if (settingsJson) {
            const settings = JSON.parse(settingsJson);
            return { ...defaultSettings, ...settings };
        }
    } catch (error) {
        console.error("Failed to parse profile settings from localStorage", error);
    }
    return defaultSettings;
}

const saveProfileSettings = (settings: ProfileSettings) => {
     try {
        localStorage.setItem(PROFILE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error("Failed to save profile settings to localStorage", error);
    }
}


export const useProfileSettings = () => {
    const [settings, setSettings] = useState<ProfileSettings>(getProfileSettings());

    const updateSettings = useCallback((newSettings: Partial<ProfileSettings>) => {
        setSettings(prevSettings => {
            const updated = { ...prevSettings, ...newSettings };
            saveProfileSettings(updated);
            return updated;
        })
    }, []);

    return { settings, updateSettings };
};

// --- In-App Notification Context ---
interface InAppNotificationContextType {
    notifications: AppNotification[];
    addNotification: (notification: Omit<AppNotification, 'id'>) => void;
    removeNotification: (id: string) => void;
}

const InAppNotificationContext = createContext<InAppNotificationContextType | undefined>(undefined);

export const InAppNotificationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    const addNotification = useCallback((notification: Omit<AppNotification, 'id'>) => {
        const id = new Date().getTime().toString() + Math.random().toString();
        setNotifications(prev => [...prev, { ...notification, id }]);
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const value = useMemo(() => ({ notifications, addNotification, removeNotification }), [notifications, addNotification, removeNotification]);

    return (
        <InAppNotificationContext.Provider value={value}>
            {children}
        </InAppNotificationContext.Provider>
    );
};

export const useInAppNotifications = () => {
    const context = useContext(InAppNotificationContext);
    if (context === undefined) {
        throw new Error('useInAppNotifications must be used within an InAppNotificationProvider');
    }
    return context;
};


// --- Bus Simulation Context ---
interface BusSimulationContextType {
    buses: Bus[];
    userPosition: LatLng | null;
    isUserTracking: boolean;
    addDelay: (busId: number) => void;
    toggleGps: (busId: number) => void;
    toggleUserTracking: () => void;
}

const BusSimulationContext = createContext<BusSimulationContextType | undefined>(undefined);

export const BusSimulationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [buses, setBuses] = useState<Bus[]>(initialBuses);
    const [userPosition, setUserPosition] = useState<LatLng | null>(null);
    const [isUserTracking, setIsUserTracking] = useState<boolean>(false);

    // Main simulation loop for bus movement
    useEffect(() => {
        const simulation = setInterval(() => {
            setBuses(prevBuses =>
                prevBuses.map(bus => {
                    const busRouteStops = ALL_ROUTES[bus.id];
                    if (!busRouteStops || busRouteStops.length < 2) return bus;

                    if (bus.dwellTimeRemaining > 0) {
                        const newDwellTime = bus.dwellTimeRemaining - SIMULATION_INTERVAL_MS;
                        if (newDwellTime <= 0) {
                            let newRouteIndex = bus.routeIndex + 1;
                            if (newRouteIndex >= busRouteStops.length - 1) {
                                newRouteIndex = 0; 
                            }
                            return { ...bus, routeIndex: newRouteIndex, progress: 0, dwellTimeRemaining: 0, };
                        } else {
                            return { ...bus, dwellTimeRemaining: newDwellTime };
                        }
                    }

                    const startPoint = busRouteStops[bus.routeIndex].position;
                    const endPoint = busRouteStops[bus.routeIndex + 1]?.position;
                    if (!endPoint) { 
                        return { ...bus, routeIndex: 0, progress: 0, position: startPoint };
                    }

                    const segmentDistance = haversineDistance(startPoint, endPoint);
                    const distanceToTravel = (AVG_BUS_SPEED_KPH / 3600) * (SIMULATION_INTERVAL_MS / 1000) * SIMULATION_SPEED_MULTIPLIER;
                    const progressIncrement = segmentDistance > 0 ? distanceToTravel / segmentDistance : 1;
                    const newProgress = bus.progress + progressIncrement;

                    if (newProgress >= 1) {
                        return { ...bus, progress: 1, position: endPoint, dwellTimeRemaining: 5000, };
                    } else {
                         const lat = startPoint.lat + (endPoint.lat - startPoint.lat) * newProgress;
                         const lng = startPoint.lng + (endPoint.lng - startPoint.lng) * newProgress;
                         return { ...bus, progress: newProgress, position: { lat, lng } };
                    }
                })
            );
        }, SIMULATION_INTERVAL_MS);
        return () => clearInterval(simulation);
    }, []);
    
    // Automatic GPS failure/recovery simulation
    useEffect(() => {
        const GPS_TOGGLE_INTERVAL = 10000; // 10 seconds
        const MANUAL_OVERRIDE_WINDOW = 30000; // 30 seconds
        const TOGGLE_CHANCE = 0.15; // 15% chance per bus per interval

        const gpsSimulator = setInterval(() => {
            setBuses(prevBuses =>
                prevBuses.map(bus => {
                    const wasManuallyToggled = bus.lastManualToggle && (Date.now() - bus.lastManualToggle < MANUAL_OVERRIDE_WINDOW);
                    if (wasManuallyToggled) {
                        return bus;
                    }
                    if (Math.random() < TOGGLE_CHANCE) {
                        return { ...bus, isGpsActive: !bus.isGpsActive };
                    }
                    return bus;
                })
            );
        }, GPS_TOGGLE_INTERVAL);

        return () => clearInterval(gpsSimulator);
    }, []);
    
    const addDelay = useCallback((busId: number) => {
        setBuses(prev => prev.map(b => b.id === busId ? { ...b, manualDelay: b.manualDelay + 5 } : b));
    }, []);

    const toggleGps = useCallback((busId: number) => {
        setBuses(prev => prev.map(b => 
            b.id === busId 
                ? { ...b, isGpsActive: !bus.isGpsActive, lastManualToggle: Date.now() } 
                : b
        ));
    }, []);
    
    const toggleUserTracking = useCallback(() => {
        setIsUserTracking(prevIsTracking => {
            const newIsTracking = !prevIsTracking;
            if (newIsTracking) {
                // Set user's static location to the City Bus Stand.
                const cbsStop = ALL_ROUTES[1]?.[0];
                if (!cbsStop) {
                    console.error("Could not find City Bus Stand stop to set user location.");
                    return prevIsTracking;
                }
                setUserPosition(cbsStop.position);

                // For demonstration, manipulate bus positions to trigger notifications.
                setBuses(prevBuses => prevBuses.map(bus => {
                    // 1. Position Bus 95 to be ~5 minutes away for the 'approaching' demo.
                    if (bus.id === 1) { // Bus 95
                        const route = ALL_ROUTES[1];
                        if (!route || route.length < 2) return bus;
                        
                        const approachRouteIndex = route.length - 2; // Last segment before CBS
                        const progress = 0.65; // Positioned to be ~4 minutes away from the stop.
                        const startPoint = route[approachRouteIndex].position;
                        const endPoint = route[approachRouteIndex + 1].position;
                        const lat = startPoint.lat + (endPoint.lat - startPoint.lat) * progress;
                        const lng = startPoint.lng + (endPoint.lng - startPoint.lng) * progress;
                        return { ...bus, routeIndex: approachRouteIndex, progress, position: { lat, lng }, dwellTimeRemaining: 0 };
                    }

                    // 2. Position Bus 301 at the stop for the 'arrived' demo.
                    if (bus.id === 4) { // Bus 301
                        // Place it almost exactly at the CBS location to trigger the < 20m distance check.
                        const arrivedPosition = { lat: cbsStop.position.lat + 0.00001, lng: cbsStop.position.lng + 0.00001 };
                        return { ...bus, position: arrivedPosition, dwellTimeRemaining: 5000 };
                    }
                    
                    // 3. Position Bus 62 at the stop for the custom 'arrived' demo.
                    if (bus.id === 6) { // Bus 62
                        const arrivedPosition = { lat: cbsStop.position.lat + 0.00002, lng: cbsStop.position.lng + 0.00002 };
                        return { ...bus, position: arrivedPosition, dwellTimeRemaining: 5000 };
                    }

                    return bus;
                }));

            } else {
                // When stopping tracking, reset buses to their initial state for a clean next demo.
                setUserPosition(null);
                setBuses(initialBuses);
            }
            return newIsTracking;
        });
    }, []);

    return (
        <BusSimulationContext.Provider value={{ buses, userPosition, isUserTracking, addDelay, toggleGps, toggleUserTracking }}>
            {children}
        </BusSimulationContext.Provider>
    );
};

export const useBusSimulation = () => {
    const context = useContext(BusSimulationContext);
    if (context === undefined) {
        throw new Error('useBusSimulation must be used within a BusSimulationProvider');
    }
    return context;
};