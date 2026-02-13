import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaCar, FaCalendar, FaMoneyBill, FaClock } from 'react-icons/fa';
import { bookingAPI, vehicleAPI } from '../services/api';
import { Booking, DashboardStats, Vehicle } from '../types';
import { Loader } from '../components/Loader';
import { useTranslation } from '../i18n';
import { logger } from '../utils/logger';

const CTX = 'AdminDashboard';

export const AdminDashboard = () => {
  const { t } = useTranslation();
  const [stats,     setStats]     = useState<DashboardStats | null>(null);
  const [bookings,  setBookings]  = useState<Booking[]>([]);
  const [vehicles,  setVehicles]  = useState<Vehicle[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<'bookings' | 'vehicles'>('bookings');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, bookingsRes, vehiclesRes] = await Promise.all([
        bookingAPI.getStats(),
        bookingAPI.getAll(),
        vehicleAPI.getAll(),
      ]);
      setStats(statsRes.data.data);
      setBookings(bookingsRes.data.data.bookings);
      setVehicles(vehiclesRes.data.data.vehicles);
      logger.info(CTX, 'Dashboard data loaded');
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
      logger.error(CTX, 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      // newStatus comes from the <select> which already uses UPPERCASE values
      await bookingAPI.updateStatus(bookingId, newStatus);
      toast.success('Statut mis à jour');
      logger.info(CTX, 'Booking status updated', { bookingId, newStatus });
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      logger.error(CTX, 'Status update failed', { bookingId });
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) return;
    try {
      await vehicleAPI.delete(vehicleId);
      toast.success('Véhicule supprimé');
      logger.warn(CTX, 'Vehicle deleted', { vehicleId });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      logger.error(CTX, 'Delete vehicle failed', { vehicleId });
    }
  };

  // FIXED: badges keyed by UPPERCASE status values
  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase();
    const badges: Record<string, { color: string; text: string }> = {
      PENDING:   { color: 'bg-yellow-100 text-yellow-800', text: t('booking.status.PENDING') },
      CONFIRMED: { color: 'bg-green-100 text-green-800',   text: t('booking.status.CONFIRMED') },
      CANCELLED: { color: 'bg-red-100 text-red-800',       text: t('booking.status.CANCELLED') },
      COMPLETED: { color: 'bg-blue-100 text-blue-800',     text: t('booking.status.COMPLETED') },
    };
    const badge = badges[s] || badges.PENDING;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  // FIXED: vehicle status badge uses VehicleStatus enum
  const getVehicleStatusBadge = (status: string) => {
    const s = status?.toUpperCase();
    const map: Record<string, { color: string; text: string }> = {
      AVAILABLE:   { color: 'bg-green-100 text-green-800',  text: 'Disponible' },
      RENTED:      { color: 'bg-blue-100 text-blue-800',    text: 'Loué' },
      MAINTENANCE: { color: 'bg-orange-100 text-orange-800',text: 'Maintenance' },
      UNAVAILABLE: { color: 'bg-red-100 text-red-800',      text: 'Indisponible' },
    };
    const badge = map[s] || map.UNAVAILABLE;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-dark">{t('admin.title')}</h1>
          <p className="text-gray-500 mt-1">Vue d'ensemble de l'activité</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">{t('admin.stats.fleet')}</p>
                <p className="text-3xl font-bold text-primary-dark">{stats?.totalVehicles || 0}</p>
                <p className="text-sm text-green-600 mt-1">{stats?.availableVehicles || 0} disponibles</p>
              </div>
              <FaCar className="text-5xl text-primary-light opacity-70" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">{t('admin.stats.total')}</p>
                <p className="text-3xl font-bold text-primary-dark">{stats?.totalBookings || 0}</p>
              </div>
              <FaCalendar className="text-5xl text-blue-400 opacity-70" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">{t('admin.stats.pending')}</p>
                <p className="text-3xl font-bold text-yellow-600">{stats?.pendingBookings || 0}</p>
              </div>
              <FaClock className="text-5xl text-yellow-400 opacity-70" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">{t('admin.stats.revenue')}</p>
                <p className="text-2xl font-bold text-green-600">
                  {Number(stats?.totalRevenue || 0).toLocaleString()} FCFA
                </p>
              </div>
              <FaMoneyBill className="text-5xl text-green-400 opacity-70" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b flex">
            {(['bookings', 'vehicles'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-medium transition ${
                  activeTab === tab
                    ? 'text-primary-dark border-b-2 border-primary-light'
                    : 'text-gray-500 hover:text-primary-dark'
                }`}
              >
                {tab === 'bookings'
                  ? `${t('admin.bookings')} (${bookings.length})`
                  : `${t('admin.vehicles')} (${vehicles.length})`}
              </button>
            ))}
          </div>

          {/* Bookings tab */}
          {activeTab === 'bookings' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Client', 'Véhicule', 'Dates', 'Prix', 'Statut', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-sm">{booking.user?.firstName} {booking.user?.lastName}</p>
                        <p className="text-xs text-gray-400">{booking.user?.email}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {booking.vehicle?.brand} {booking.vehicle?.model}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <p>{new Date(booking.startDate).toLocaleDateString('fr-FR')}</p>
                        <p className="text-xs text-gray-400">→ {new Date(booking.endDate).toLocaleDateString('fr-FR')}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-primary-dark">
                        {Number(booking.totalPrice).toLocaleString()} FCFA
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(booking.status)}</td>
                      <td className="px-6 py-4">
                        {/* FIXED: option values are UPPERCASE */}
                        <select
                          value={booking.status}
                          onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary-light"
                        >
                          <option value="PENDING">{t('booking.status.PENDING')}</option>
                          <option value="CONFIRMED">{t('booking.status.CONFIRMED')}</option>
                          <option value="CANCELLED">{t('booking.status.CANCELLED')}</option>
                          <option value="COMPLETED">{t('booking.status.COMPLETED')}</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Vehicles tab */}
          {activeTab === 'vehicles' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Véhicule', 'Catégorie', 'Prix/Jour', 'Statut', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-sm">{vehicle.brand} {vehicle.model}</p>
                        <p className="text-xs text-gray-400">{vehicle.year}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{vehicle.category}</td>
                      <td className="px-6 py-4 text-sm font-bold text-primary-dark">
                        {Number(vehicle.pricePerDay).toLocaleString()} FCFA
                      </td>
                      {/* FIXED: use vehicle.status (UPPERCASE enum) not isAvailable boolean */}
                      <td className="px-6 py-4">{getVehicleStatusBadge(vehicle.status)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteVehicle(vehicle.id)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm hover:underline"
                        >
                          {t('common.delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
