import React from 'react';

export const ToggleSwitch: React.FC<{
    label: string;
    description: string;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    icon?: React.ReactNode;
}> = ({ label, description, enabled, onChange, icon }) => (
    <div
        onClick={() => onChange(!enabled)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onChange(!enabled)}
        role="switch"
        aria-checked={enabled}
        tabIndex={0}
        className="flex justify-between items-center p-4 bg-[#1F2128] rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
    >
        <div className="flex items-center">
            {icon && <div className="mr-4 flex-shrink-0">{icon}</div>}
            <div>
                <h3 className="text-lg font-semibold text-white">{label}</h3>
                <p className="text-sm text-gray-400">{description}</p>
            </div>
        </div>
        <div className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors flex-shrink-0 ${enabled ? 'bg-cyan-500' : 'bg-gray-600'}`}>
            <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
            />
        </div>
    </div>
);
