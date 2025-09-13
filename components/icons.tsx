import React from 'react';

export const BusIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.9 7.08H5.1c-.62 0-1.1.49-1.1 1.1v6.52c0 .62.49 1.1 1.1 1.1h.78v1.38c0 .38.31.69.69.69h1.1c.38 0 .69-.31.69-.69v-1.38h6.11v1.38c0 .38.31.69.69.69h1.1c.38 0 .69-.31.69-.69v-1.38h.78c.62 0 1.1-.49 1.1-1.1V8.18c0-.61-.48-1.1-1.1-1.1zm-13.02 5.5c-.75 0-1.36-.6-1.36-1.36s.6-1.36 1.36-1.36 1.36.6 1.36 1.36-.61 1.36-1.36 1.36zm11.25 0c-.75 0-1.36-.6-1.36-1.36s.6-1.36 1.36-1.36 1.36.6 1.36 1.36-.6 1.36-1.36 1.36zM18.9 9.92H5.1V8.18h13.8v1.74z" />
    </svg>
);

export const BusStopIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 4.25 7 13 7 13s7-8.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
);

export const TimeIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

export const GpsFixedIcon: React.FC<{className?: string}> = ({ className }) => (
     <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 0 1-9-9 9 9 0 0 1 9-9 9 9 0 0 1 9 9 9 9 0 0 1-9 9Zm0-15a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8-9h-1m-16 0H3" />
    </svg>
);

export const GpsOffIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" >
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 2.25 19.5 19.5M8.204 3.232a9 9 0 0 1 11.56 11.56l-9.76-9.76-1.8-1.8ZM12 3v1m0 16v1m8-9h-1M4 12H3m16.768-5.732-1.414-1.414M5.65 18.35l-1.414-1.414m12.7-1.414-1.414 1.414M6.364 5.636 4.95 4.222" />
    </svg>
);

export const SearchIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

export const LocationMarkerIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
);

export const HomeIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
    </svg>
);

export const LiveIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.34 2.34c-.38.38-.38 1.02 0 1.41L12 11.41l7.66-7.66c.38-.38.38-1.02 0-1.41a.996.996 0 0 0-1.41 0L12 10 5.75 3.75a.996.996 0 0 0-1.41 0zM12 13c-1.63 0-3.16.63-4.28 1.76a5.996 5.996 0 0 0 0 8.48c1.13 1.13 2.65 1.76 4.28 1.76s3.16-.63 4.28-1.76a5.996 5.996 0 0 0 0-8.48C15.16 13.63 13.63 13 12 13zm0 10c-1.12 0-2.16-.45-2.92-1.21a4.004 4.004 0 0 1 0-5.66C9.84 15.37 10.88 14.92 12 14.92s2.16.45 2.92 1.21a4.004 4.004 0 0 1 0 5.66c-.76.76-1.8 1.21-2.92 1.21zm0-6.08c-.59 0-1.12.23-1.5.6.38.38.6.89.6 1.48s-.22 1.1-.6 1.48c.38.38.91.6 1.5.6s1.12-.22 1.5-.6c-.38-.38-.6-.89-.6-1.48s.22-1.1.6-1.48c-.38-.38-.91-.6-1.5-.6z" />
    </svg>
);

export const FavoritesIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
);

export const ProfileIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
);

export const MapViewIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.5-11.5-3 3-3-3m12.75 6-3-3-3 3M3 12l3 3 3-3m-3 9h12" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 21v-3.75" />
    </svg>
);

export const TimelineViewIcon: React.FC<{className?: string}> = ({ className }) => (
     <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.125 1.125 0 0 1 0 2.25H5.625a1.125 1.125 0 0 1 0-2.25Z" />
    </svg>
);

export const ArrowLeftIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
);

export const StarIcon: React.FC<{className?: string; isFilled?: boolean}> = ({ className, isFilled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill={isFilled ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
);

export const ArrowDownIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l-6.75-6.75M12 19.5l6.75-6.75" />
    </svg>
);

export const ArrowUpIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0-6.75 6.75M12 4.5l6.75 6.75" />
    </svg>
);

export const DataSaverIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.128 4.872A11.25 11.25 0 0 0 12 3a11.25 11.25 0 0 0-7.128 1.872M12 12v9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657-1.343 3-3 3s-3-1.343-3-3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m7.5 7.5 9 9" />
    </svg>
);

export const BellIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
);