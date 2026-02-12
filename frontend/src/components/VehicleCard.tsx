import { Link } from 'react-router-dom';
import { FaUsers, FaCog, FaGasPump } from 'react-icons/fa';
import { Vehicle } from '../types';

interface VehicleCardProps {
  vehicle: Vehicle;
}

/**
 * VehicleCard Component
 * Displays a summary of vehicle information with dynamic status handling.
 */
export const VehicleCard = ({ vehicle }: VehicleCardProps) => {
  
  /**
   * Returns Tailwind classes for category badges based on vehicle category.
   * Standardizes input to uppercase to match API enums.
   */
  const getCategoryBadge = (category: string) => {
    const cat = category.toUpperCase();
    const colors: Record<string, string> = {
      ECONOMY: 'bg-green-100 text-green-800',
      COMFORT: 'bg-blue-100 text-blue-800',
      LUXURY: 'bg-purple-100 text-purple-800',
      PREMIUM: 'bg-indigo-100 text-indigo-800',
      SUV: 'bg-orange-100 text-orange-800',
      VAN: 'bg-gray-100 text-gray-800'
    };
    return colors[cat] || 'bg-gray-100 text-gray-800';
  };

  /**
   * Formats transmission type for user display.
   */
  const getTransmissionText = (transmission: string) => {
    return transmission.toLowerCase() === 'automatic' ? 'Auto' : 'Manual';
  };

  /**
   * Formats fuel type for user display.
   */
  const getFuelTypeText = (fuelType: string) => {
    const types: Record<string, string> = {
      petrol: 'Petrol',
      diesel: 'Diesel',
      electric: 'Electric',
      hybrid: 'Hybrid'
    };
    return types[fuelType.toLowerCase()] || fuelType;
  };

  // Safe price conversion: handles both string and number formats from API
  const displayPrice = typeof vehicle.pricePerDay === 'string' 
    ? parseInt(vehicle.pricePerDay) 
    : vehicle.pricePerDay;

  // Availability logic: strictly based on API 'status' field
  const isAvailable = vehicle.status === 'available';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border-t-4 border-primary-light flex flex-col h-full">
      {/* Vehicle Image Section */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={vehicle.imageUrl || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800'}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className={`w-full h-full object-cover transition-transform duration-300 hover:scale-110 ${!isAvailable ? 'grayscale' : ''}`}
        />
        
        {/* Availability Overlay */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <span className="bg-red-600 text-white px-3 py-1 rounded-md font-bold uppercase tracking-wider text-sm shadow-lg">
              Not Available
            </span>
          </div>
        )}

        {/* Dynamic Category Badge */}
        <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter shadow-sm ${getCategoryBadge(vehicle.category)}`}>
          {vehicle.category}
        </div>
      </div>

      {/* Vehicle Information Body */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-2">
          <h3 className="text-xl font-bold text-primary-dark">
            {vehicle.brand} {vehicle.model}
          </h3>
          <p className="text-gray-500 text-xs font-semibold">
            {vehicle.year} • {vehicle.locationAddress?.split(',')[0] || 'Cameroon'}
          </p>
        </div>

        {/* Technical Specs Grid */}
        <div className="grid grid-cols-3 gap-1 mb-4 text-[13px] text-gray-600">
          <div className="flex items-center space-x-1">
            <FaUsers className="text-primary-light" />
            <span>{vehicle.seats} seats</span>
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

        {/* Footer: Price & Navigation */}
        <div className="mt-auto pt-4 border-t flex justify-between items-center">
          <div>
            <span className="text-xl font-extrabold text-primary-light">
              {displayPrice.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-tight">FCFA / DAY</span>
          </div>
          
          <Link
            to={`/vehicles/${vehicle.id}`}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${
              isAvailable
                ? 'bg-primary-dark text-white hover:bg-primary-light shadow-md hover:shadow-lg active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none'
            }`}
          >
            {isAvailable ? 'Book Now' : 'Booked'}
          </Link>
        </div>
      </div>
    </div>
  );
};