import { useState, useEffect } from 'react';
import { VehicleCard } from '../components/VehicleCard';
import { Loader } from '../components/Loader';
import { vehicleAPI } from '../services/api';
import { Vehicle } from '../types';
import { toast } from 'react-toastify';

/**
 * Page component displaying the vehicle fleet with dynamic filtering.
 * Logic: Syncs local UI state with API Query Parameters.
 */
export const Vehicles = () => {
  // --- State Management ---
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    transmission: '',
    fuelType: '',
    minPrice: '',
    maxPrice: ''
  });

  // Initial data fetch
  useEffect(() => {
    fetchVehicles();
  }, []);

  /**
   * Constructs query parameters from state and fetches data.
   */
  const fetchVehicles = async (currentFilters = filters) => {
    try {
      setLoading(true);
      const params: any = {};
      
      // Dynamic Parameter Construction
      if (currentFilters.category) params.category = currentFilters.category;
      if (currentFilters.transmission) params.transmission = currentFilters.transmission;
      if (currentFilters.fuelType) params.fuelType = currentFilters.fuelType;
      if (currentFilters.minPrice) params.minPrice = parseInt(currentFilters.minPrice);
      if (currentFilters.maxPrice) params.maxPrice = parseInt(currentFilters.maxPrice);

      const res = await vehicleAPI.getAll(params);
      
      // Ensure we access the correct data path from your API structure
      setVehicles(res.data?.data?.vehicles || []);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des véhicules');
      console.error('Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleApplyFilters = () => {
    fetchVehicles();
  };

  /**
   * Resets all filters and immediately fetches the full fleet.
   */
  const handleResetFilters = () => {
    const emptyFilters = {
      category: '',
      transmission: '',
      fuelType: '',
      minPrice: '',
      maxPrice: ''
    };
    setFilters(emptyFilters);
    fetchVehicles(emptyFilters); // Pass explicit empty state to avoid race conditions
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-black text-primary-dark mb-8 tracking-tighter uppercase">
          Notre Flotte
        </h1>

        {/* --- Filter Sidebar/Header --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Affiner la recherche</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Category */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Catégorie</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full bg-gray-50 border-none rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-primary-light font-semibold text-gray-700"
              >
                <option value="">Toutes</option>
                <option value="economy">Économique</option>
                <option value="comfort">Confort</option>
                <option value="luxury">Luxe</option>
                <option value="suv">SUV</option>
                <option value="van">Van</option>
              </select>
            </div>

            {/* Transmission */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Transmission</label>
              <select
                name="transmission"
                value={filters.transmission}
                onChange={handleFilterChange}
                className="w-full bg-gray-50 border-none rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-primary-light font-semibold text-gray-700"
              >
                <option value="">Toutes</option>
                <option value="automatic">Automatique</option>
                <option value="manual">Manuelle</option>
              </select>
            </div>

            {/* Fuel */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Carburant</label>
              <select
                name="fuelType"
                value={filters.fuelType}
                onChange={handleFilterChange}
                className="w-full bg-gray-50 border-none rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-primary-light font-semibold text-gray-700"
              >
                <option value="">Tous</option>
                <option value="petrol">Essence</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Électrique</option>
                <option value="hybrid">Hybride</option>
              </select>
            </div>

            {/* Pricing */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Prix Min (FCFA)</label>
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                className="w-full bg-gray-50 border-none rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-primary-light font-semibold text-gray-700"
                placeholder="Ex: 25000"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Prix Max (FCFA)</label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                className="w-full bg-gray-50 border-none rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-primary-light font-semibold text-gray-700"
                placeholder="Ex: 100000"
              />
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleApplyFilters}
              className="bg-primary-dark text-white px-8 py-3 rounded-xl hover:bg-primary-light transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-primary-dark/10"
            >
              Appliquer
            </button>
            <button
              onClick={handleResetFilters}
              className="bg-gray-100 text-gray-500 px-8 py-3 rounded-xl hover:bg-gray-200 transition-all font-black text-xs uppercase tracking-widest"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        {/* --- Results Section --- */}
        {vehicles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <p className="text-lg font-bold text-gray-400">Aucun véhicule ne correspond à ces critères.</p>
            <button onClick={handleResetFilters} className="text-primary-light font-black text-xs uppercase mt-2 hover:underline">
              Voir tout le catalogue
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-xs font-black text-gray-400 mb-6 uppercase tracking-widest">
              {vehicles.length} résultat{vehicles.length > 1 ? 's' : ''} trouvé{vehicles.length > 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {vehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};