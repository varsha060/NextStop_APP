import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LiveFeedPage from './pages/LiveFeedPage';
import FavoritesPage from './pages/FavoritesPage';
import ProfilePage from './pages/ProfilePage';
import { HomeIcon, LiveIcon, FavoritesIcon, ProfileIcon, BusIcon, BellIcon, GpsFixedIcon } from './components/icons';
import { BusSimulationProvider, InAppNotificationProvider, useInAppNotifications } from './hooks';
import { AppNotification } from './types';

// --- START: In-App Notification Components ---

// Icon mapping for notifications
const NOTIFICATION_ICONS: { [key in AppNotification['type']]: React.ReactNode } = {
  info: <BellIcon className="w-6 h-6 text-cyan-400" />,
  success: <GpsFixedIcon className="w-6 h-6 text-green-400" />,
  alert: <BusIcon className="w-6 h-6 text-yellow-400" />,
};

// Single Notification component
const InAppNotificationItem: React.FC<{ notification: AppNotification; onDismiss: (id: string) => void }> = ({ notification, onDismiss }) => {
  useEffect(() => {
    if (notification.duration) {
      const timer = setTimeout(() => {
        onDismiss(notification.id);
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification, onDismiss]);

  return (
    <div className="bg-[#1F2128] border border-gray-700/80 rounded-lg shadow-2xl p-4 w-full max-w-sm animate-slide-in-top">
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5">
          {NOTIFICATION_ICONS[notification.type]}
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-md font-bold text-white">{notification.title}</p>
          <p className="mt-1 text-sm text-gray-300">{notification.message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={() => onDismiss(notification.id)}
            className="inline-flex text-gray-400 hover:text-white"
            aria-label="Dismiss notification"
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Notification Center component to render all active notifications
const InAppNotificationCenter: React.FC = () => {
    const { notifications, removeNotification } = useInAppNotifications();
    return (
        <div className="fixed top-4 right-4 z-[9999] w-full max-w-sm space-y-3">
        {notifications.map(notification => (
            <InAppNotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={removeNotification}
            />
        ))}
        </div>
    );
};
// --- END: In-App Notification Components ---


const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string; mobile?: boolean }> = ({ to, icon, label, mobile }) => {
    const baseClasses = "flex flex-col items-center justify-center space-y-1 w-full transition-colors";
    
    const mobileClasses = "py-2";
    const desktopClasses = "py-4 rounded-lg";
    
    const activeMobileClasses = "text-cyan-400";
    const inactiveMobileClasses = "text-gray-400 hover:bg-gray-800";
    
    const activeDesktopClasses = "bg-[#294B4E] text-white";
    const inactiveDesktopClasses = "text-gray-400 hover:bg-gray-700";

    return (
        <NavLink
            to={to}
            end
            className={({ isActive }) => 
                `${baseClasses} ${mobile ? mobileClasses : desktopClasses} ${
                    isActive 
                        ? (mobile ? activeMobileClasses : activeDesktopClasses) 
                        : (mobile ? inactiveMobileClasses : inactiveDesktopClasses)
                }`
            }
        >
            {icon}
            <span className={`font-medium ${mobile ? 'text-xs' : 'text-sm'}`}>{label}</span>
        </NavLink>
    );
};

const Sidebar: React.FC = () => (
    <aside className="hidden md:flex w-28 bg-[#1F2128] flex-shrink-0 flex-col items-center p-4 space-y-8">
        <div className="text-cyan-400 pt-2">
            <BusIcon className="w-10 h-10" />
        </div>
        <nav className="flex flex-col space-y-4 w-full">
            <NavItem to="/" icon={<HomeIcon className="w-7 h-7" />} label="Home" />
            <NavItem to="/live" icon={<LiveIcon className="w-7 h-7" />} label="Live" />
            <NavItem to="/favorites" icon={<FavoritesIcon className="w-7 h-7" />} label="Favorites" />
            <NavItem to="/profile" icon={<ProfileIcon className="w-7 h-7" />} label="Profile" />
        </nav>
    </aside>
);

const BottomNavBar: React.FC = () => (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1F2128] border-t border-gray-700 flex justify-around z-50">
        <NavItem to="/" icon={<HomeIcon className="w-6 h-6" />} label="Home" mobile />
        <NavItem to="/live" icon={<LiveIcon className="w-6 h-6" />} label="Live" mobile />
        <NavItem to="/favorites" icon={<FavoritesIcon className="w-6 h-6" />} label="Favorites" mobile />
        <NavItem to="/profile" icon={<ProfileIcon className="w-6 h-6" />} label="Profile" mobile />
    </nav>
);


const App: React.FC = () => {
    return (
        <HashRouter>
            <InAppNotificationProvider>
                <div className="relative min-h-screen bg-[#0E0F11] text-gray-200 font-sans md:flex">
                    <Sidebar />
                    <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
                        <BusSimulationProvider>
                            <Routes>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/live" element={<LiveFeedPage />} />
                                <Route path="/favorites" element={<FavoritesPage />} />
                                <Route path="/profile" element={<ProfilePage />} />
                            </Routes>
                        </BusSimulationProvider>
                    </main>
                    <BottomNavBar />
                    <InAppNotificationCenter />
                </div>
            </InAppNotificationProvider>
        </HashRouter>
    );
};

export default App;