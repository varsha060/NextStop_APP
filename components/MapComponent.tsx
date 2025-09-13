import React, { useEffect, useRef, useState } from 'react';
import { LatLng, Bus, BusStop } from '../types';
import { MYSORE_CENTER, ALL_ROUTES } from '../constants';
import { GpsFixedIcon } from './icons';
import { useBusSimulation } from '../hooks';

// Satisfy TypeScript since L is loaded from a script tag
declare var L: any;

interface MapComponentProps {
    buses: Bus[];
    selectedBusIds: number[];
    primarySelectedBusId: number | null;
    allRoutes: { [key: number]: BusStop[] };
    selectedBusEta: number | null;
    lowDataMode?: boolean;
    isUserTracking: boolean;
    onToggleTracking: () => void;
    onSelectBus: (busId: number) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ buses, selectedBusIds, primarySelectedBusId, allRoutes, selectedBusEta, lowDataMode = false, isUserTracking, onToggleTracking, onSelectBus }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const busMarkersRef = useRef<{ [key: number]: any }>({});
    const etaMarkerRef = useRef<any>(null);
    const userMarkerRef = useRef<any>(null);
    
    const { userPosition } = useBusSimulation();

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current && allRoutes) {
            mapRef.current = L.map(mapContainerRef.current, { zoomControl: false }).setView([MYSORE_CENTER.lat, MYSORE_CENTER.lng], 13);
            L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

            // Conditional Tile Layer for Low-Data Mode
            if (lowDataMode) {
                // Use a simple, low-data tile layer
                L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                    subdomains: 'abcd',
                    maxZoom: 20
                }).addTo(mapRef.current);
                 if(mapContainerRef.current) {
                    mapContainerRef.current.style.backgroundColor = '#E5E7EB'; // A light gray
                }
            } else {
                // Use the default dark theme tile layer
                L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                    subdomains: 'abcd',
                    maxZoom: 20
                }).addTo(mapRef.current);
            }


            // Draw all routes
            Object.values(allRoutes).forEach(routeStops => {
                 const routeLatLngs = routeStops.map(p => [p.position.lat, p.position.lng]);
                 L.polyline(routeLatLngs, { color: '#2DD4BF', weight: 4, opacity: 0.6 }).addTo(mapRef.current);
            });

            // Draw all unique stops
            const stopIcon = L.divIcon({
                html: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-pink-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 4.25 7 13 7 13s7-8.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>`,
                className: '',
                iconSize: [24, 24],
                iconAnchor: [12, 24]
            });
            
            const uniqueStops = new Map<string, BusStop>();
            Object.values(allRoutes).flat().forEach(stop => {
                if (!uniqueStops.has(stop.name)) {
                    uniqueStops.set(stop.name, stop);
                }
            });

            uniqueStops.forEach(stop => {
                L.marker([stop.position.lat, stop.position.lng], { icon: stopIcon })
                    .addTo(mapRef.current)
                    .bindPopup(`<b>${stop.name}</b>`);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allRoutes, lowDataMode]);

    const handleLocateUser = () => {
        if (!isUserTracking) { // If it's stopped, we're about to start it.
            const userStartPosition = ALL_ROUTES[1]?.[0]?.position;
            if (mapRef.current && userStartPosition) {
                mapRef.current.flyTo([userStartPosition.lat, userStartPosition.lng], 17, { animate: true, duration: 1 });
            }
        }
        onToggleTracking();
    };

    // Effect to create/update/remove the user marker
    useEffect(() => {
        if (!mapRef.current) return;

        if (userPosition) {
            // Create or update marker
            const userIconHtml = `
                <div class="relative flex justify-center items-center w-6 h-6">
                    <div class="absolute w-full h-full bg-cyan-500 rounded-full user-location-pulse"></div>
                    <div class="relative w-4 h-4 bg-cyan-400 rounded-full border-2 border-white shadow-md"></div>
                </div>`;

            const userIcon = L.divIcon({
                html: userIconHtml,
                className: '',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            if (userMarkerRef.current) {
                userMarkerRef.current.setLatLng([userPosition.lat, userPosition.lng]);
            } else {
                userMarkerRef.current = L.marker([userPosition.lat, userPosition.lng], {
                    icon: userIcon,
                    zIndexOffset: 2000,
                    interactive: false,
                }).addTo(mapRef.current);
            }
        } else {
            // Remove marker if position is null
            if (userMarkerRef.current) {
                mapRef.current.removeLayer(userMarkerRef.current);
                userMarkerRef.current = null;
            }
        }
    }, [userPosition]);

    useEffect(() => {
        if (!mapRef.current) return;

        buses.forEach(bus => {
            const isSelected = selectedBusIds.includes(bus.id);
            const isPredicted = !bus.isGpsActive;
            const newPosition = bus.position;
            const busId = bus.id;
            
            const iconHtml = `
                <div class="relative transition-all duration-300 ${isSelected ? 'scale-125' : ''} ${isPredicted ? 'opacity-60' : ''}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 ${isSelected ? 'text-cyan-400' : 'text-yellow-400'}" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.9 7.08H5.1c-.62 0-1.1.49-1.1 1.1v6.52c0 .62.49 1.1 1.1 1.1h.78v1.38c0 .38.31.69.69.69h1.1c.38 0 .69-.31.69-.69v-1.38h6.11v1.38c0 .38.31.69.69.69h1.1c.38 0 .69-.31.69-.69v-1.38h.78c.62 0 1.1-.49 1.1-1.1V8.18c0-.61-.48-1.1-1.1-1.1zm-13.02 5.5c-.75 0-1.36-.6-1.36-1.36s.6-1.36 1.36-1.36 1.36.6 1.36 1.36-.61 1.36-1.36 1.36zm11.25 0c-.75 0-1.36-.6-1.36-1.36s.6-1.36 1.36-1.36 1.36.6 1.36 1.36-.6 1.36-1.36 1.36zM18.9 9.92H5.1V8.18h13.8v1.74z" />
                    </svg>
                     ${isSelected && !isPredicted ? `
                        <div class="absolute top-0 left-0 w-full h-full bg-cyan-400 rounded-full blur-md opacity-75 -z-10 animate-pulse"></div>
                    ` : ''}
                </div>
            `;

            const busIcon = L.divIcon({
                html: iconHtml,
                className: '',
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });

            let marker = busMarkersRef.current[busId];

            if (!marker) {
                marker = L.marker([newPosition.lat, newPosition.lng], { icon: busIcon, zIndexOffset: isSelected ? 1001 : 1000 })
                    .addTo(mapRef.current)
                    .bindPopup(`<b>${bus.name}</b>`);
                
                marker.on('click', () => {
                    onSelectBus(bus.id);
                });

                busMarkersRef.current[busId] = marker;
            } else {
                marker.setIcon(busIcon);
                marker.setZIndexOffset(isSelected ? 1001 : 1000);
                marker.setLatLng([newPosition.lat, newPosition.lng]);
            }
        });
        
        const activeBusIds = new Set(buses.map(b => b.id));
        Object.keys(busMarkersRef.current).forEach(markerIdStr => {
            const markerId = Number(markerIdStr);
            if (!activeBusIds.has(markerId)) {
                mapRef.current.removeLayer(busMarkersRef.current[markerId]);
                delete busMarkersRef.current[markerId];
            }
        });

        const primaryBus = buses.find(b => b.id === primarySelectedBusId);
        
        // Handle ETA marker
        if (primaryBus && selectedBusEta !== null) {
            const etaIconHtml = `
                <div class="bg-cyan-500 text-black text-sm font-bold px-3 py-1 rounded-lg shadow-lg whitespace-nowrap" style="transform: translate(-50%, -55px);">
                    ETA: ${selectedBusEta} min
                </div>
            `;
            const etaIcon = L.divIcon({
                html: etaIconHtml,
                className: '', // No extra class needed, all styling is inline or via tailwind
            });

            const newPosition: [number, number] = [primaryBus.position.lat, primaryBus.position.lng];

            if (etaMarkerRef.current) {
                etaMarkerRef.current.setLatLng(newPosition);
                etaMarkerRef.current.setIcon(etaIcon);
            } else {
                etaMarkerRef.current = L.marker(newPosition, { icon: etaIcon, zIndexOffset: 2000, interactive: false })
                    .addTo(mapRef.current);
            }
        } else {
            // If no primary bus is selected or no ETA, remove the marker
            if (etaMarkerRef.current) {
                mapRef.current.removeLayer(etaMarkerRef.current);
                etaMarkerRef.current = null;
            }
        }

        if (primaryBus) {
            mapRef.current.panTo([primaryBus.position.lat, primaryBus.position.lng], { animate: false });
        }
    }, [buses, selectedBusIds, primarySelectedBusId, selectedBusEta, onSelectBus]);

    return (
        <div className="relative h-full w-full">
            <div ref={mapContainerRef} className="h-full w-full rounded-lg shadow-2xl" />
            <button
                onClick={handleLocateUser}
                className={`absolute bottom-24 right-2 lg:bottom-14 lg:right-4 z-[1000] p-3 rounded-full shadow-lg transition-colors ${isUserTracking ? 'bg-cyan-500 text-black' : 'bg-[#1F2128] text-white hover:bg-cyan-500/80 hover:text-black'}`}
                aria-label="Find my location"
            >
                <GpsFixedIcon className="w-6 h-6" />
            </button>
        </div>
    );
};

export default MapComponent;