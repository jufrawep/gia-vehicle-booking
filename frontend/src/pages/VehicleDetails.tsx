import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { toast } from 'react-toastify';
import { FaCar, FaUsers, FaCog, FaGasPump, FaCheckCircle, FaCalendarAlt } from 'react-icons/fa';
import { vehicleAPI, bookingAPI } from '../services/api';
import { Vehicle } from '../types';
import { Loader } from '../components/Loader';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../i18n';
import { logger } from '../utils/logger';
import 'react-datepicker/dist/react-datepicker.css';

const CTX = 'VehicleDetails';

export const VehicleDetails = () => {
  const { id }            = useParams<{ id: string }>();
  const navigate          = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t, lang }       = useTranslation();

  const [vehicle,    setVehicle]    = useState<Vehicle | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [startDate,  setStartDate]  = useState<Date | null>(null);
  const [endDate,    setEndDate]    = useState<Date | null>(null);
  const [notes,      setNotes]      = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [totalDays,  setTotalDays]  = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => { if (id) fetchVehicle(); }, [id]);

  // Recalcul du prix en temps réel
  useEffect(() => {
    if (startDate && endDate && vehicle) {
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000);
      const d = days > 0 ? days : 0;
      setTotalDays(d);
      setTotalPrice(d * (Number(vehicle.pricePerDay) || 0));
    } else {
      setTotalDays(0);
      setTotalPrice(0);
    }
  }, [startDate, endDate, vehicle]);

  const fetchVehicle = async () => {
    try {
      setLoading(true);
      const res = await vehicleAPI.getById(id!);
      if (res.data.success && res.data.data.vehicle) {
        setVehicle(res.data.data.vehicle);
        logger.info(CTX, 'Vehicle loaded', { id, status: res.data.data.vehicle.status });
      } else throw new Error('Invalid data structure');
    } catch (error) {
      logger.error(CTX, 'Failed to load vehicle', { id });
      toast.error(lang === 'fr' ? 'Véhicule introuvable' : 'Vehicle not found');
      navigate('/vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info(lang === 'fr'
        ? 'Connectez-vous pour continuer votre réservation'
        : 'Please log in to continue your booking');
      // Sauvegarder les données de réservation dans localStorage
    if (startDate && endDate && vehicle) {
      localStorage.setItem('pendingBooking', JSON.stringify({
        vehicleId: id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        notes,
        vehicleInfo: {
          brand: vehicle.brand,
          model: vehicle.model,
          imageUrl: vehicle.imageUrl
        }
      }));
    }

navigate('/login', { state: { from: `/vehicles/${id}`, returnTo: 'booking' } });
      return;
    }
    if (!startDate || !endDate) {
      toast.error(lang === 'fr' ? 'Sélectionnez des dates valides' : 'Please select valid dates');
      return;
    }
    setSubmitting(true);
    try {
      await bookingAPI.create({ vehicleId: id!, startDate, endDate, notes });
      logger.info(CTX, 'Booking created', { vehicleId: id });
      toast.success(t('toast.booking_success'));
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('toast.error_generic'));
      logger.error(CTX, 'Booking failed', { vehicleId: id });
    } finally {
      setSubmitting(false);
    }
  };

  // Helpers traduits
  const getTransmissionText = (v: string) => {
    if (v?.toUpperCase() === 'AUTOMATIC') return lang === 'fr' ? 'Automatique' : 'Automatic';
    return lang === 'fr' ? 'Manuelle' : 'Manual';
  };

  const getFuelTypeText = (v: string) => {
    const map: Record<string, { fr: string; en: string }> = {
      PETROL:   { fr: 'Essence',    en: 'Petrol' },
      DIESEL:   { fr: 'Diesel',     en: 'Diesel' },
      ELECTRIC: { fr: 'Électrique', en: 'Electric' },
      HYBRID:   { fr: 'Hybride',    en: 'Hybrid' },
    };
    return map[v?.toUpperCase()]?.[lang] ?? v;
  };

  if (loading) return <Loader />;
  if (!vehicle) return null;

  // FIXED: comparaison UPPERCASE — 'available' (lowercase) causait le bug "toujours indisponible"
  const isAvailable = vehicle.status === 'AVAILABLE';

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Colonne gauche : image + specs ── */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
              <div className="relative">
                <img
                  src={vehicle.imageUrl || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200'}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className={`w-full h-[400px] object-cover ${!isAvailable ? 'grayscale' : ''}`}
                />
                {!isAvailable && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-red-600 text-white px-6 py-2 rounded-full font-black uppercase tracking-widest text-sm shadow-xl">
                      {t('vehicles.unavailable')}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="text-4xl font-black text-primary-dark tracking-tighter uppercase">
                      {vehicle.brand} {vehicle.model}
                    </h1>
                    <div className="flex items-center text-gray-400 font-bold mt-1 uppercase text-xs tracking-widest">
                      <FaCalendarAlt className="mr-2 text-primary-light" />
                      {lang === 'fr' ? 'Année' : 'Year'} {vehicle.year} • {vehicle.category}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-primary-light">
                      {Number(vehicle.pricePerDay).toLocaleString()}
                    </span>
                    <span className="block text-[10px] font-black text-gray-400 uppercase">
                      FCFA / {lang === 'fr' ? 'Jour' : 'Day'}
                    </span>
                  </div>
                </div>

                {/* Description traduite */}
                {vehicle.description && (
                  <p className="text-gray-600 text-sm leading-relaxed mb-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
                    {vehicle.description}
                  </p>
                )}

                {/* Specs grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    {
                      icon: FaUsers,
                      label: lang === 'fr' ? 'Places' : 'Seats',
                      value: `${vehicle.seats} ${lang === 'fr' ? 'Sièges' : 'Seats'}`,
                    },
                    {
                      icon: FaCog,
                      label: lang === 'fr' ? 'Boîte' : 'Gearbox',
                      value: getTransmissionText(vehicle.transmission),
                    },
                    {
                      icon: FaGasPump,
                      label: lang === 'fr' ? 'Énergie' : 'Fuel',
                      value: getFuelTypeText(vehicle.fuelType),
                    },
                    {
                      icon: FaCar,
                      label: lang === 'fr' ? 'Immat.' : 'Plate',
                      value: vehicle.licensePlate || 'N/A',
                    },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center justify-center border border-gray-100">
                      <Icon className="text-primary-light text-2xl mb-2" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
                      <span className="font-bold text-primary-dark text-sm text-center">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Features */}
                {vehicle.features && vehicle.features.length > 0 && (
                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-lg font-bold text-primary-dark mb-4 tracking-tight">
                      {lang === 'fr' ? 'Caractéristiques' : 'Features'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {vehicle.features.map((feature: string, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                          <FaCheckCircle className="text-green-500 shrink-0" />
                          <span className="text-sm font-semibold text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Colonne droite : widget réservation ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl p-8 sticky top-24 border border-gray-100">
              <h2 className="text-2xl font-bold text-primary-dark mb-6 tracking-tight">
                {t('booking.title')}
              </h2>

              <form onSubmit={handleBooking} className="space-y-5">

                {/* Date de départ */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    {t('booking.start')}
                  </label>
                  <DatePicker
                    selected={startDate}
                    onChange={(d) => setStartDate(d)}
                    minDate={new Date()}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-light font-bold text-gray-700 text-sm"
                    placeholderText={lang === 'fr' ? 'Choisir une date' : 'Pick a date'}
                    required
                  />
                </div>

                {/* Date de retour */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    {t('booking.end')}
                  </label>
                  <DatePicker
                    selected={endDate}
                    onChange={(d) => setEndDate(d)}
                    minDate={startDate || new Date()}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-light font-bold text-gray-700 text-sm"
                    placeholderText={lang === 'fr' ? 'Choisir une date' : 'Pick a date'}
                    required
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    {t('booking.notes')}
                  </label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-light font-semibold text-sm resize-none"
                    placeholder={lang === 'fr'
                      ? 'Besoin d\'un chauffeur ? Un siège bébé ?'
                      : 'Need a driver? A baby seat?'} />
                </div>

                {/* Récapitulatif prix */}
                {totalDays > 0 && (
                  <div className="bg-primary-dark/5 rounded-2xl p-5 border border-primary-dark/10 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-bold">
                        {lang === 'fr' ? 'Durée' : 'Duration'}
                      </span>
                      <span className="font-black text-primary-dark">
                        {totalDays} {lang === 'fr' ? 'jours' : 'days'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-bold">
                        {lang === 'fr' ? 'Tarif / Jour' : 'Rate / Day'}
                      </span>
                      <span className="font-black text-primary-dark">
                        {Number(vehicle.pricePerDay).toLocaleString()} FCFA
                      </span>
                    </div>
                    <div className="pt-3 border-t border-primary-dark/10 flex justify-between items-end">
                      <span className="font-black text-primary-dark text-lg italic">
                        {t('booking.total')}
                      </span>
                      <div className="text-right">
                        <span className="text-2xl font-black text-primary-light leading-none">
                          {totalPrice.toLocaleString()}
                        </span>
                        <span className="block text-[10px] font-black text-primary-dark opacity-50 uppercase tracking-widest">FCFA</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* FIXED: vehicle.status === 'AVAILABLE' (UPPERCASE) */}
                <button type="submit"
                  disabled={submitting || !isAvailable}
                  className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg ${
                    isAvailable
                      ? 'bg-primary-dark text-white hover:bg-primary-light hover:-translate-y-1 shadow-primary-dark/20'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {submitting
                    ? (lang === 'fr' ? 'Traitement...' : 'Processing...')
                    : isAvailable
                      ? t('booking.submit')
                      : t('vehicles.unavailable')}
                </button>
              </form>

              <div className="mt-5 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                <p className="text-[10px] text-yellow-800 font-bold leading-tight">
                  {lang === 'fr'
                    ? 'Un permis de conduire valide et un dépôt de garantie sont requis lors du retrait.'
                    : 'A valid driving licence and security deposit are required at pick-up.'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
