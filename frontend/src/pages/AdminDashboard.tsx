import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaCar, FaCalendar, FaMoneyBill, FaClock} from 'react-icons/fa';
import { bookingAPI, vehicleAPI } from '../services/api';
import { Booking, DashboardStats, Vehicle } from '../types';
import { Loader } from '../components/Loader';

/**
 * AdminDashboard Component
 * Provides administrative overview including global statistics, 
 * booking management, and fleet control.
 */
export const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookings' | 'vehicles'>('bookings');

  /**
   * Effect hook to trigger initial data fetching on component mount
   */
  useEffect(() => {
    fetchData();
  }, []);

  /**
   * Fetches all necessary dashboard data concurrently
   * Synchronizes stats, bookings, and vehicle lists
   */
  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, bookingsRes, vehiclesRes] = await Promise.all([
        bookingAPI.getStats(),
        bookingAPI.getAll(),
        vehicleAPI.getAll()
      ]);

      setStats(statsRes.data.data);
      setBookings(bookingsRes.data.data.bookings);
      setVehicles(vehiclesRes.data.data.vehicles);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Updates the lifecycle status of a specific booking
   * @param bookingId Target booking unique identifier
   * @param newStatus New status string (pending, confirmed, cancelled, completed)
   */
  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      await bookingAPI.updateStatus(bookingId, newStatus);
      toast.success('Statut mis à jour');
      fetchData(); // Refresh data to reflect status changes in stats
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  /**
   * Permanently removes a vehicle from the fleet after user confirmation
   * @param vehicleId Target vehicle unique identifier
   */
  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
      return;
    }

    try {
      await vehicleAPI.delete(vehicleId);
      toast.success('Véhicule supprimé');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  /**
   * Maps technical status strings to UI badge components
   * @param status The raw status string from the backend
   * @returns JSX element representing the status badge
   */
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'En attente' },
      confirmed: { color: 'bg-green-100 text-green-800', text: 'Confirmée' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Annulée' },
      completed: { color: 'bg-blue-100 text-blue-800', text: 'Terminée' }
    };

    const badge = badges[status] || badges.pending;

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-dark">Dashboard Admin</h1>
          <p className="text-gray-600 mt-2">Vue d'ensemble de l'activité</p>
        </div>

        {/* Statistics Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Fleet Statistics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Véhicules</p>
                <p className="text-3xl font-bold text-primary-dark">{stats?.totalVehicles || 0}</p>
                <p className="text-sm text-green-600 mt-1">
                  {stats?.availableVehicles || 0} disponibles
                </p>
              </div>
              <FaCar className="text-5xl text-primary-light" />
            </div>
          </div>

          {/* Booking Volume */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Réservations</p>
                <p className="text-3xl font-bold text-primary-dark">{stats?.totalBookings || 0}</p>
              </div>
              <FaCalendar className="text-5xl text-blue-500" />
            </div>
          </div>

          {/* Critical Actions Tracking */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">En attente</p>
                <p className="text-3xl font-bold text-yellow-600">{stats?.pendingBookings || 0}</p>
              </div>
              <FaClock className="text-5xl text-yellow-500" />
            </div>
          </div>

          {/* Financial Overview */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Revenus Total</p>
                <p className="text-2xl font-bold text-green-600">
                  {Number(stats?.totalRevenue || 0).toLocaleString()} FCFA
                </p>
              </div>
              <FaMoneyBill className="text-5xl text-green-500" />
            </div>
          </div>
        </div>

        {/* Tab-based Content Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`px-6 py-4 font-medium ${
                  activeTab === 'bookings'
                    ? 'text-primary-dark border-b-2 border-primary-light'
                    : 'text-gray-600 hover:text-primary-dark'
                }`}
              >
                Réservations ({bookings.length})
              </button>
              <button
                onClick={() => setActiveTab('vehicles')}
                className={`px-6 py-4 font-medium ${
                  activeTab === 'vehicles'
                    ? 'text-primary-dark border-b-2 border-primary-light'
                    : 'text-gray-600 hover:text-primary-dark'
                }`}
              >
                Véhicules ({vehicles.length})
              </button>
            </div>
          </div>

          {/* Bookings Management Table */}
          {activeTab === 'bookings' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Véhicule</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.user?.firstName} {booking.user?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{booking.user?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {booking.vehicle?.brand} {booking.vehicle?.model}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(booking.startDate).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-sm text-gray-500">
                          au {new Date(booking.endDate).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-primary-dark">
                        {Number(booking.totalPrice).toLocaleString()} FCFA
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(booking.status)}</td>
                      <td className="px-6 py-4">
                        <select
                          value={booking.status}
                          onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary-light"
                        >
                          <option value="pending">En attente</option>
                          <option value="confirmed">Confirmer</option>
                          <option value="cancelled">Annuler</option>
                          <option value="completed">Terminer</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Fleet Management Table */}
          {activeTab === 'vehicles' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Véhicule</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix/Jour</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {vehicle.brand} {vehicle.model}
                        </div>
                        <div className="text-sm text-gray-500">{vehicle.year}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{vehicle.category}</td>
                      <td className="px-6 py-4 text-sm font-bold text-primary-dark">
                        {vehicle.pricePerDay.toLocaleString()} FCFA
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            vehicle.isAvailable
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {vehicle.isAvailable ? 'Disponible' : 'Indisponible'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleDeleteVehicle(vehicle.id)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Supprimer
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