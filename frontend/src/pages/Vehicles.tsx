import { useState, useEffect } from 'react';
import { VehicleCard } from '../components/VehicleCard';
import { Loader } from '../components/Loader';
import { vehicleAPI } from '../services/api';
import { Vehicle } from '../types';
import { toast } from 'react-toastify';
import { useTranslation } from '../i18n';

export const Vehicles = () => {
  const { t, lang } = useTranslation();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filters,  setFilters]  = useState({
    category: '', transmission: '', fuelType: '', minPrice: '', maxPrice: '',
  });

  useEffect(() => { fetchVehicles(); }, []);

  const fetchVehicles = async (f = filters) => {
    try {
      setLoading(true);
      const p: any = {};
      if (f.category)     p.category     = f.category;
      if (f.transmission) p.transmission = f.transmission;
      if (f.fuelType)     p.fuelType     = f.fuelType;
      if (f.minPrice)     p.minPrice     = parseInt(f.minPrice);
      if (f.maxPrice)     p.maxPrice     = parseInt(f.maxPrice);
      const res = await vehicleAPI.getAll(p);
      setVehicles(res.data?.data?.vehicles || []);
    } catch {
      toast.error(t('toast.error_generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    setFilters({ ...filters, [e.target.name]: e.target.value });

  const handleReset = () => {
    const empty = { category: '', transmission: '', fuelType: '', minPrice: '', maxPrice: '' };
    setFilters(empty);
    fetchVehicles(empty);
  };

  // Nombre de résultats traduit
  const resultsLabel = lang === 'fr'
    ? `${vehicles.length} résultat${vehicles.length > 1 ? 's' : ''} trouvé${vehicles.length > 1 ? 's' : ''}`
    : `${vehicles.length} vehicle${vehicles.length > 1 ? 's' : ''} found`;

  if (loading) return <Loader />;

  const sel = 'w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 focus:ring-2 focus:ring-primary-light';
  const lbl = 'block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1';

  return (
    <div className="min-h-screen bg-gray-50 py-5">
      <div className="container mx-auto px-4">

        <h1 className="text-3xl font-black text-primary-dark mb-3 tracking-tighter uppercase">
          {t('vehicles.title')}
        </h1>

        {/* ── Barre de filtres compacte ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-3 py-2.5 mb-4">
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-2">
            {lang === 'fr' ? 'Affiner' : 'Filters'}
          </p>

          {/* Tous sur une ligne — s'emballe en 2 lignes sur petit écran */}
          <div className="flex flex-wrap items-end gap-2">

            {/* Catégorie */}
            <div className="w-[118px]">
              <label className={lbl}>{lang === 'fr' ? 'Catégorie' : 'Category'}</label>
              <select name="category" value={filters.category} onChange={handleFilterChange} className={sel}>
                <option value="">{lang === 'fr' ? 'Toutes' : 'All'}</option>
                <option value="ECONOMY">{lang === 'fr' ? 'Économique' : 'Economy'}</option>
                <option value="COMFORT">{lang === 'fr' ? 'Confort' : 'Comfort'}</option>
                <option value="LUXURY">{lang === 'fr' ? 'Luxe' : 'Luxury'}</option>
                <option value="SUV">SUV</option>
                <option value="VAN">Van</option>
              </select>
            </div>

            {/* Boîte */}
            <div className="w-[118px]">
              <label className={lbl}>{lang === 'fr' ? 'Boîte' : 'Gearbox'}</label>
              <select name="transmission" value={filters.transmission} onChange={handleFilterChange} className={sel}>
                <option value="">{lang === 'fr' ? 'Toutes' : 'All'}</option>
                <option value="AUTOMATIC">{lang === 'fr' ? 'Automatique' : 'Automatic'}</option>
                <option value="MANUAL">{lang === 'fr' ? 'Manuelle' : 'Manual'}</option>
              </select>
            </div>

            {/* Carburant */}
            <div className="w-[110px]">
              <label className={lbl}>{lang === 'fr' ? 'Carburant' : 'Fuel'}</label>
              <select name="fuelType" value={filters.fuelType} onChange={handleFilterChange} className={sel}>
                <option value="">{lang === 'fr' ? 'Tous' : 'All'}</option>
                <option value="PETROL">{lang === 'fr' ? 'Essence' : 'Petrol'}</option>
                <option value="DIESEL">Diesel</option>
                <option value="ELECTRIC">{lang === 'fr' ? 'Électrique' : 'Electric'}</option>
                <option value="HYBRID">{lang === 'fr' ? 'Hybride' : 'Hybrid'}</option>
              </select>
            </div>

            {/* Prix min */}
            <div className="w-[90px]">
              <label className={lbl}>{lang === 'fr' ? 'Min FCFA' : 'Min Price'}</label>
              <input type="number" name="minPrice" value={filters.minPrice}
                onChange={handleFilterChange} placeholder="25000" className={sel} />
            </div>

            {/* Prix max */}
            <div className="w-[90px]">
              <label className={lbl}>{lang === 'fr' ? 'Max FCFA' : 'Max Price'}</label>
              <input type="number" name="maxPrice" value={filters.maxPrice}
                onChange={handleFilterChange} placeholder="100000" className={sel} />
            </div>

            {/* Boutons */}
            <div className="flex gap-1.5">
              <button onClick={() => fetchVehicles()}
                className="bg-primary-dark text-white px-4 py-1.5 rounded-lg hover:bg-primary-light transition font-black text-[10px] uppercase tracking-wide shadow-sm whitespace-nowrap">
                {t('vehicles.filter.apply')}
              </button>
              <button onClick={handleReset}
                className="bg-gray-100 text-gray-400 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition font-black text-[10px] uppercase tracking-wide whitespace-nowrap">
                {t('vehicles.filter.reset')}
              </button>
            </div>

          </div>
        </div>

        {/* ── Résultats ── */}
        {vehicles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
            <p className="text-lg font-bold text-gray-400">{t('vehicles.no_results')}</p>
            <button onClick={handleReset}
              className="text-primary-light font-black text-xs uppercase mt-2 hover:underline">
              {lang === 'fr' ? 'Voir tout le catalogue' : 'View all vehicles'}
            </button>
          </div>
        ) : (
          <>
            <p className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">
              {resultsLabel}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {vehicles.map(v => <VehicleCard key={v.id} vehicle={v} />)}
            </div>
          </>
        )}

      </div>
    </div>
  );
};
