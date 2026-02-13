import { Link } from 'react-router-dom';
import { FaUsers, FaCog, FaGasPump } from 'react-icons/fa';
import { Vehicle } from '../types';
import { useTranslation } from '../i18n';

interface VehicleCardProps {
  vehicle: Vehicle;
}

export const VehicleCard = ({ vehicle }: VehicleCardProps) => {
  const { t } = useTranslation();

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      ECONOMY: 'bg-green-100 text-green-800',
      COMFORT: 'bg-blue-100 text-blue-800',
      LUXURY:  'bg-purple-100 text-purple-800',
      SUV:     'bg-orange-100 text-orange-800',
      VAN:     'bg-gray-100 text-gray-800',
    };
    return colors[category?.toUpperCase()] || 'bg-gray-100 text-gray-800';
  };

  const getTransmissionText = (v: string) =>
    v?.toUpperCase() === 'AUTOMATIC' ? 'Auto' : 'Manual';

  const getFuelTypeText = (v: string) => {
    const map: Record<string, string> = {
      PETROL: 'Petrol', DIESEL: 'Diesel', ELECTRIC: 'Électrique', HYBRID: 'Hybride',
    };
    return map[v?.toUpperCase()] || v;
  };

  const displayPrice = typeof vehicle.pricePerDay === 'string'
    ? parseInt(vehicle.pricePerDay)
    : vehicle.pricePerDay;

  // FIXED: comparison against UPPERCASE enum value
  const isAvailable = vehicle.status === 'AVAILABLE';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border-t-4 border-primary-light flex flex-col h-full">

      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={vehicle.imageUrl || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800'}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className={`w-full h-full object-cover transition-transform duration-300 hover:scale-110 ${!isAvailable ? 'grayscale' : ''}`}
        />
        {!isAvailable && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <span className="bg-red-600 text-white px-3 py-1 rounded-md font-bold uppercase tracking-wider text-sm shadow-lg">
              {t('vehicles.unavailable')}
            </span>
          </div>
        )}
        <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter shadow-sm ${getCategoryBadge(vehicle.category)}`}>
          {vehicle.category}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-2">
          <h3 className="text-xl font-bold text-primary-dark">{vehicle.brand} {vehicle.model}</h3>
          <p className="text-gray-500 text-xs font-semibold">
            {vehicle.year} • {vehicle.locationAddress?.split(',')[0] || 'Cameroon'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1 mb-4 text-[13px] text-gray-600">
          <div className="flex items-center space-x-1">
            <FaUsers className="text-primary-light" />
            <span>{vehicle.seats} places</span>
          </div>
          <div className="flex items-center space-x-1">
            <FaCog className="text-primary-light" />
            <span className="truncate">{getTransmissionText(vehicle.transmission)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <FaGasPump className="text-primary-light" />
            <span className="truncate">{getFuelTypeText(vehicle.fuelType)}</span>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t flex justify-between items-center">
          <div>
            <span className="text-xl font-extrabold text-primary-light">
              {displayPrice.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-tight">
              FCFA {t('vehicles.per_day')}
            </span>
          </div>
          <Link
            to={`/vehicles/${vehicle.id}`}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${
              isAvailable
                ? 'bg-primary-dark text-white hover:bg-primary-light shadow-md hover:shadow-lg active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none'
            }`}
          >
            {isAvailable ? t('vehicles.book') : t('vehicles.unavailable')}
          </Link>
        </div>
      </div>
    </div>
  );
};
