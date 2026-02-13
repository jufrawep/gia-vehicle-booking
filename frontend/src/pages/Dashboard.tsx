import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaCalendar, FaCar, FaCheckCircle, FaClock, FaTimes } from 'react-icons/fa';
import { bookingAPI } from '../services/api';
import { Booking } from '../types';
import { Loader } from '../components/Loader';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../i18n';
import { logger } from '../utils/logger';

const CTX = 'Dashboard';

export const Dashboard = () => {
  const { user }   = useAuth();
  const { t }      = useTranslation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try {
      const res = await bookingAPI.getMyBookings();
      setBookings(res.data.data.bookings);
      logger.info(CTX, 'Bookings loaded', { count: res.data.data.bookings.length });
    } catch (error) {
      toast.error('Erreur lors du chargement des réservations');
      logger.error(CTX, 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm(t('booking.confirm_cancel'))) return;
    try {
      // FIXED: send UPPERCASE status to match backend enum
      await bookingAPI.updateStatus(bookingId, 'CANCELLED');
      toast.success(t('toast.booking_cancelled'));
      logger.info(CTX, 'Booking cancelled', { bookingId });
      fetchBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('toast.error_generic'));
      logger.error(CTX, 'Cancel failed', { bookingId });
    }
  };

  // API now always returns UPPERCASE — normalizeStatus kept for resilience
  const normalizeStatus = (s: string) => s?.toUpperCase();

  const getStatusBadge = (status: string) => {
    const s = normalizeStatus(status);
    const badges: Record<string, { color: string; text: string; icon: any }> = {
      PENDING:   { color: 'bg-yellow-100 text-yellow-800', text: t('booking.status.PENDING'),   icon: FaClock },
      CONFIRMED: { color: 'bg-green-100 text-green-800',   text: t('booking.status.CONFIRMED'), icon: FaCheckCircle },
      CANCELLED: { color: 'bg-red-100 text-red-800',       text: t('booking.status.CANCELLED'), icon: FaTimes },
      COMPLETED: { color: 'bg-blue-100 text-blue-800',     text: t('booking.status.COMPLETED'), icon: FaCheckCircle },
    };
    const badge = badges[s] || badges.PENDING;
    const Icon  = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}>
        <Icon /><span>{badge.text}</span>
      </span>
    );
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-dark">
            {t('dashboard.welcome')}, {user?.firstName} !
          </h1>
          <p className="text-gray-500 mt-1">Gérez vos réservations et consultez votre historique</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total',      value: bookings.length,                                                              icon: FaCalendar,   color: 'text-primary-dark' },
            { label: t('booking.status.PENDING'),   value: bookings.filter(b => normalizeStatus(b.status) === 'PENDING').length,   icon: FaClock,      color: 'text-yellow-600' },
            { label: t('booking.status.CONFIRMED'), value: bookings.filter(b => normalizeStatus(b.status) === 'CONFIRMED').length, icon: FaCheckCircle,color: 'text-green-600' },
            { label: t('booking.status.COMPLETED'), value: bookings.filter(b => normalizeStatus(b.status) === 'COMPLETED').length, icon: FaCheckCircle,color: 'text-blue-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
              <Icon className={`text-3xl opacity-60 ${color}`} />
            </div>
          ))}
        </div>

        {/* Bookings table */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-primary-dark">{t('dashboard.title')}</h2>
          </div>

          {bookings.length === 0 ? (
            <div className="p-12 text-center">
              <FaCar className="text-6xl text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">{t('dashboard.no_bookings')}</p>
              <a href="/vehicles"
                className="inline-block bg-primary-dark text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-light transition">
                {t('dashboard.book_now')}
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Véhicule', 'Dates', 'Prix Total', 'Statut', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map((booking) => {
                    const status = normalizeStatus(booking.status);
                    return (
                      <tr key={booking.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <FaCar className="text-xl text-primary-light shrink-0" />
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {booking.vehicle?.brand} {booking.vehicle?.model}
                              </p>
                              <p className="text-xs text-gray-400">{booking.vehicle?.year}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <p>{booking.startDate ? new Date(booking.startDate).toLocaleDateString('fr-FR') : '—'}</p>
                          <p className="text-gray-400 text-xs">
                            → {booking.endDate ? new Date(booking.endDate).toLocaleDateString('fr-FR') : '—'}
                          </p>
                        </td>
                        <td className="px-6 py-4 font-bold text-sm text-primary-dark">
                          {booking.totalPrice ? Number(booking.totalPrice).toLocaleString() + ' FCFA' : '—'}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(booking.status)}</td>
                        <td className="px-6 py-4 text-sm">
                          {(status === 'PENDING' || status === 'CONFIRMED') && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="text-red-600 hover:text-red-800 font-medium hover:underline">
                              {t('booking.cancel')}
                            </button>
                          )}
                          {(status === 'CANCELLED' || status === 'COMPLETED') && (
                            <span className="text-gray-300 italic text-xs">—</span>
                          )}
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
