import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../hooks';
import { ALL_BUS_DETAILS } from '../constants';
import { BusIcon, LiveIcon, StarIcon, FavoritesIcon } from '../components/icons';

const FavoritesPage: React.FC = () => {
    const { favorites, toggleFavorite } = useFavorites();
    const navigate = useNavigate();

    const favoriteBuses = ALL_BUS_DETAILS.filter(bus => favorites.includes(bus.id));

    const handleTrackLive = (busId: number) => {
        navigate('/live', { state: { selectedBusId: busId } });
    };

    return (
        <div className="p-8 md:p-12 max-w-5xl mx-auto">
            <header className="mb-10 flex items-center space-x-4">
                 <FavoritesIcon className="w-12 h-12 text-cyan-400" />
                 <div>
                    <h1 className="text-5xl font-bold text-white">Favorite Routes</h1>
                    <p className="text-lg text-gray-400 mt-1">Your saved routes for quick tracking.</p>
                </div>
            </header>

            {favoriteBuses.length > 0 ? (
                <div className="space-y-4">
                    {favoriteBuses.map(bus => (
                        <div key={bus.id} className="bg-[#1F2128] p-5 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center space-x-4">
                                <BusIcon className="w-10 h-10 text-cyan-400 flex-shrink-0" />
                                <div>
                                    <h2 className="text-xl font-bold text-white">{bus.name}</h2>
                                    <p className="text-gray-400 text-sm">{bus.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3 flex-shrink-0 w-full sm:w-auto">
                                <button
                                    onClick={() => handleTrackLive(bus.id)}
                                    className="w-1/2 sm:w-auto flex-grow sm:flex-grow-0 flex items-center justify-center bg-cyan-500 text-black font-semibold px-4 py-2 rounded-lg hover:bg-cyan-400 transition-colors"
                                >
                                    <LiveIcon className="w-5 h-5 mr-2" />
                                    Track Live
                                </button>
                                <button
                                    onClick={() => toggleFavorite(bus.id)}
                                    className="w-1/2 sm:w-auto flex-grow sm:flex-grow-0 flex items-center justify-center bg-gray-700 text-yellow-400 font-semibold px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                    aria-label={`Remove ${bus.name} from favorites`}
                                >
                                    <StarIcon className="w-5 h-5 mr-2" isFilled />
                                    Unfavorite
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-[#1F2128] rounded-lg">
                    <StarIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white">No Favorites Yet</h2>
                    <p className="text-gray-400 mt-2">
                        Go to the 'Live' page, select a bus, and tap the star to save it here.
                    </p>
                </div>
            )}
        </div>
    );
};

export default FavoritesPage;