import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  FaCalendar,
  FaCar,
  FaCheckCircle,
  FaClock,
  FaTimes,
} from "react-icons/fa";
import { bookingAPI } from "../services/api";
import { Booking } from "../types";
import { Loader } from "../components/Loader";
import { useAuth } from "../hooks/useAuth";

/**
 * Dashboard Component
 * Provides users with an overview of their personal booking history,
 * current status statistics, and management actions.
 */
export const Dashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Initialization hook to fetch user-specific data on component mount
   */
  useEffect(() => {
    fetchBookings();
  }, []);

  /**
   * Retrieves the current user's booking list from the API
   */
  const fetchBookings = async () => {
    try {
      const res = await bookingAPI.getMyBookings();
      setBookings(res.data.data.bookings);
    } catch (error) {
      toast.error("Erreur lors du chargement des réservations");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Updates a specific booking's status (e.g., manual confirmation)
   * @param bookingId Unique identifier of the booking
   * @param newStatus Target status string
   */
  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      await bookingAPI.updateStatus(bookingId, newStatus);
      toast.success("Réservation mise à jour");
      fetchBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la mise à jour");
    }
  };

  /**
   * Processes a booking cancellation after user confirmation
   * @param bookingId Unique identifier of the booking to be cancelled
   */
  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir annuler cette réservation ?")) {
      return;
    }
    try {
      await bookingAPI.updateStatus(bookingId, "cancelled");
      toast.success("Réservation annulée");
      fetchBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de l'annulation");
    }
  };

  /**
   * Normalizes status strings to uppercase for consistent comparison logic
   * @param status Raw status from backend
   */
  const normalizeStatus = (status: string) => status?.toUpperCase();

  /**
   * Maps technical status strings to UI-rich badge components with icons
   * @param status The current status of the booking
   * @returns JSX element for status display
   */
  const getStatusBadge = (status: string) => {
    const s = normalizeStatus(status);
    const badges: Record<string, { color: string; text: string; icon: any }> = {
      PENDING:   { color: "bg-yellow-100 text-yellow-800", text: "En attente", icon: FaClock },
      CONFIRMED: { color: "bg-green-100 text-green-800",  text: "Confirmée",  icon: FaCheckCircle },
      CANCELLED: { color: "bg-red-100 text-red-800",      text: "Annulée",    icon: FaTimes },
      COMPLETED: { color: "bg-blue-100 text-blue-800",    text: "Terminée",   icon: FaCheckCircle },
    };

    const badge = badges[s] || badges.PENDING;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}>
        <Icon />
        <span>{badge.text}</span>
      </span>
    );
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-dark">
            Bienvenue, {user?.firstName} !
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez vos réservations et consultez votre historique
          </p>
        </div>

        {/* Quick Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total</p>
                <p className="text-2xl font-bold text-primary-dark">{bookings.length}</p>
              </div>
              <FaCalendar className="text-4xl text-primary-light" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {bookings.filter((b) => normalizeStatus(b.status) === "PENDING").length}
                </p>
              </div>
              <FaClock className="text-4xl text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Confirmées</p>
                <p className="text-2xl font-bold text-green-600">
                  {bookings.filter((b) => normalizeStatus(b.status) === "CONFIRMED").length}
                </p>
              </div>
              <FaCheckCircle className="text-4xl text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Terminées</p>
                <p className="text-2xl font-bold text-blue-600">
                  {bookings.filter((b) => normalizeStatus(b.status) === "COMPLETED").length}
                </p>
              </div>
              <FaCheckCircle className="text-4xl text-blue-500" />
            </div>
          </div>
        </div>

        {/* Detailed Bookings Table */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-primary-dark">Mes Réservations</h2>
          </div>

          {bookings.length === 0 ? (
            <div className="p-12 text-center">
              <FaCar className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-600 mb-4">
                Vous n'avez pas encore de réservations
              </p>
              <a
                href="/vehicles"
                className="inline-block bg-primary-dark text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-light transition"
              >
                Réserver un véhicule
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Véhicule</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => {
                    const status = normalizeStatus(booking.status);
                    return (
                      <tr key={booking.id} className="hover:bg-gray-50">

                        {/* Vehicle Information */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FaCar className="text-2xl text-primary-light mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {booking.vehicle?.brand} {booking.vehicle?.model}
                              </div>
                              <div className="text-sm text-gray-500">
                                {booking.vehicle?.year}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Rental Dates */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div>
                            {booking.startDate
                              ? new Date(booking.startDate).toLocaleDateString("fr-FR")
                              : "—"}
                          </div>
                          <div className="text-gray-400 text-xs">
                            au{" "}
                            {booking.endDate
                              ? new Date(booking.endDate).toLocaleDateString("fr-FR")
                              : "—"}
                          </div>
                        </td>

                        {/* Total Cost */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-dark">
                          {booking.totalPrice
                            ? Number(booking.totalPrice).toLocaleString() + " FCFA"
                            : "—"}
                        </td>

                        {/* Dynamic Status Badge */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(booking.status)}
                        </td>

                        {/* Available Actions based on lifecycle */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            {status === "PENDING" && (
                              <>
                                <button
                                  onClick={() => {
                                    if (window.confirm("Confirmer cette réservation ?")) {
                                      handleUpdateStatus(booking.id, "CONFIRMED");
                                    }
                                  }}
                                  className="text-green-600 hover:text-green-900 font-medium"
                                >
                                  Confirmer
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                  onClick={() => handleCancelBooking(booking.id)}
                                  className="text-red-600 hover:text-red-900 font-medium"
                                >
                                  Annuler
                                </button>
                              </>
                            )}
                            {status === "CONFIRMED" && (
                              <button
                                onClick={() => handleCancelBooking(booking.id)}
                                className="text-orange-600 hover:text-orange-900 font-medium"
                              >
                                Annuler
                              </button>
                            )}
                            {(status === "CANCELLED" || status === "COMPLETED") && (
                              <span className="text-gray-400 italic text-xs">Aucune action</span>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};