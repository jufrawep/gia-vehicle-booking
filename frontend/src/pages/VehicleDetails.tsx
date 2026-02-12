import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { toast } from 'react-toastify';
import { FaCar, FaUsers, FaCog, FaGasPump, FaCheckCircle, FaCalendarAlt } from 'react-icons/fa';
import { vehicleAPI, bookingAPI } from '../services/api';
import { Vehicle } from '../types';
import { Loader } from '../components/Loader';
import { useAuth } from '../hooks/useAuth';
import "react-datepicker/dist/react-datepicker.css";

/**
 * VehicleDetails Page Component
 * * Logic Flow:
 * 1. Extract ID from URL -> Fetch Vehicle Data.
 * 2. Manage Date Selection -> Calculate Total Days & Price.
 * 3. Handle Booking Submission -> Check Auth -> Send to API.
 */
export const VehicleDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // --- UI & Data State ---
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  
  // --- Booking Form State ---
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [totalDays, setTotalDays] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  /**
   * Fetches vehicle details from the backend on load.
   */
  useEffect(() => {
    if (id) fetchVehicle();
  }, [id]);

  /**
   * Dynamic Pricing Logic
   * Calculates the difference in days and updates the total price in real-time.
   */
  useEffect(() => {
    if (startDate && endDate && vehicle) {
      const diffTime = endDate.getTime() - startDate.getTime();
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const finalDays = days > 0 ? days : 0;
      setTotalDays(finalDays);
      
      const dailyPrice = Number(vehicle.pricePerDay) || 0;
      setTotalPrice(finalDays * dailyPrice);
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
      } else {
        throw new Error("Invalid data structure");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error('Détails du véhicule introuvables');
      navigate('/vehicles');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles the booking submission.
   * Redirects to login if user is not authenticated, saving the current URL 
   * in the state to allow "Return after login" functionality.
   */
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.info('Veuillez vous connecter pour continuer votre réservation');
      navigate('/login', { state: { from: `/vehicles/${id}` } });
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Veuillez sélectionner des dates valides');
      return;
    }

    setSubmitting(true);
    try {
      await bookingAPI.create({
        vehicleId: id!,
        startDate,
        endDate,
        notes
      });

      toast.success('Demande de réservation envoyée !');
      navigate('/dashboard');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Échec de la réservation';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Formatting Helpers ---
  const getTransmissionText = (trans: string) => trans?.toLowerCase() === 'automatic' ? 'Automatique' : 'Manuelle';
  
  const getFuelTypeText = (fuel: string) => {
    const types: Record<string, string> = { petrol: 'Essence', diesel: 'Diesel', electric: 'Électrique', hybrid: 'Hybride' };
    return types[fuel?.toLowerCase()] || fuel;
  };

  if (loading) return <Loader />;
  if (!vehicle) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Gallery & Technical Specs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
              <img
                src={vehicle.imageUrl || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200'}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-full h-[450px] object-cover"
              />

              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="text-4xl font-black text-primary-dark tracking-tighter uppercase">
                      {vehicle.brand} {vehicle.model}
                    </h1>
                    <div className="flex items-center text-gray-400 font-bold mt-1 uppercase text-xs tracking-widest">
                      <FaCalendarAlt className="mr-2 text-primary-light" />
                      Année {vehicle.year} • {vehicle.category}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-primary-light">
                      {Number(vehicle.pricePerDay).toLocaleString()}
                    </span>
                    <span className="block text-[10px] font-black text-gray-400 uppercase">FCFA / Jour</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                  <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center justify-center border border-gray-100">
                    <FaUsers className="text-primary-light text-2xl mb-2" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Places</span>
                    <span className="font-bold text-primary-dark">{vehicle.seats} Sièges</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center justify-center border border-gray-100">
                    <FaCog className="text-primary-light text-2xl mb-2" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Boîte</span>
                    <span className="font-bold text-primary-dark">{getTransmissionText(vehicle.transmission)}</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center justify-center border border-gray-100">
                    <FaGasPump className="text-primary-light text-2xl mb-2" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Énergie</span>
                    <span className="font-bold text-primary-dark">{getFuelTypeText(vehicle.fuelType)}</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center justify-center border border-gray-100">
                    <FaCar className="text-primary-light text-2xl mb-2" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Immat.</span>
                    <span className="font-bold text-primary-dark">{vehicle.licensePlate || 'N/A'}</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-8">
                  <h3 className="text-xl font-bold text-primary-dark mb-6 tracking-tight">Caractéristiques</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {vehicle.features?.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                        <FaCheckCircle className="text-green-500 shrink-0" />
                        <span className="text-sm font-semibold text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Reservation Widget */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl p-8 sticky top-24 border border-gray-100">
              <h2 className="text-2xl font-bold text-primary-dark mb-6 tracking-tight">Réserver</h2>

              <form onSubmit={handleBooking} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Date de retrait</label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    minDate={new Date()}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-light font-bold text-gray-700"
                    placeholderText="Choisir une date"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Date de retour</label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    minDate={startDate || new Date()}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-light font-bold text-gray-700"
                    placeholderText="Choisir une date"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Notes (Optionnel)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-light font-semibold text-sm"
                    placeholder="Besoin d'un chauffeur ? Un siège bébé ?"
                  />
                </div>

                {/* Pricing Summary Table */}
                {totalDays > 0 && (
                  <div className="bg-primary-dark/5 rounded-2xl p-5 border border-primary-dark/10 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-bold">Durée totale</span>
                      <span className="font-black text-primary-dark">{totalDays} Jours</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-bold">Tarif / Jour</span>
                      <span className="font-black text-primary-dark">{Number(vehicle.pricePerDay).toLocaleString()} FCFA</span>
                    </div>
                    <div className="pt-3 border-t border-primary-dark/10 flex justify-between items-end">
                      <span className="font-black text-primary-dark text-lg italic">Total</span>
                      <div className="text-right">
                        <span className="text-2xl font-black text-primary-light leading-none">
                          {totalPrice.toLocaleString()}
                        </span>
                        <span className="block text-[10px] font-black text-primary-dark opacity-50 uppercase tracking-widest">FCFA</span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || vehicle.status !== 'available'}
                  className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg ${
                    vehicle.status === 'available' 
                    ? 'bg-primary-dark text-white hover:bg-primary-light hover:-translate-y-1 shadow-primary-dark/20' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {submitting ? 'Traitement...' : vehicle.status === 'available' ? 'Confirmer la réservation' : 'Indisponible'}
                </button>
              </form>
              
              <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                <p className="text-[10px] text-yellow-800 font-bold leading-tight">
                  Note : Un permis de conduire valide et un dépôt de garantie sont requis lors du retrait du véhicule.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};