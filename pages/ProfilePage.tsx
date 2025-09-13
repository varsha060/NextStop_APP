import React from 'react';
import { useProfileSettings } from '../hooks';
import { ProfileIcon, MapViewIcon } from '../components/icons';
import { ToggleSwitch } from '../components/ToggleSwitch';


const ProfilePage: React.FC = () => {
    const { settings, updateSettings } = useProfileSettings();

    const handleLowDataModeChange = (enabled: boolean) => {
        updateSettings({ lowDataMode: enabled });
    };

    return (
        <div className="p-8 md:p-12 max-w-5xl mx-auto">
            <header className="mb-10 flex items-center space-x-4">
                 <ProfileIcon className="w-12 h-12 text-cyan-400" />
                 <div>
                    <h1 className="text-5xl font-bold text-white">Profile & Settings</h1>
                    <p className="text-lg text-gray-400 mt-1">Manage your application preferences.</p>
                </div>
            </header>

            <div className="space-y-6">
                <section>
                    <h2 className="text-2xl font-semibold text-gray-300 mb-4">Map Settings</h2>
                    <ToggleSwitch
                        icon={<MapViewIcon className="w-8 h-8 text-gray-400"/>}
                        label="Low-Data Mode"
                        description="Replaces the map view with a text-only list to save data."
                        enabled={settings.lowDataMode}
                        onChange={handleLowDataModeChange}
                    />
                </section>
            </div>
        </div>
    );
};

export default ProfilePage;