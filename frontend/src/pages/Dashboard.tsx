import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaCalendar, FaCar, FaCheckCircle, FaClock, FaTimes, FaMoneyBillWave, FaTicketAlt, FaReceipt } from 'react-icons/fa';
import { bookingAPI, paymentAPI } from '../services/api';
import { Booking } from '../types';
import { Loader } from '../components/Loader';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../i18n';
import { logger } from '../utils/logger';

const CTX = 'Dashboard';

type TabType = 'bookings' | 'payments';

export const Dashboard = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const { t, lang }      = useTranslation();
  const fr = lang === 'fr';

  const [activeTab, setActiveTab] = useState<TabType>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [pmtLoading, setPmtLoading] = useState(false);
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);

useEffect(() => { fetchBookings(); }, []);

    useEffect(() => {
      if (activeTab === 'payments' && !paymentsLoaded) {
        fetchPayments();
        setPaymentsLoaded(true); 
      }
    }, [activeTab, paymentsLoaded]);

  const fetchBookings = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await bookingAPI.getMyBookings();
      setBookings(res.data.data.bookings);
      logger.info(CTX, 'Bookings loaded', { count: res.data.data.bookings.length });
    } catch (error: any) {
      if (!silent && error?.code !== 'P1001') {
        toast.error(fr ? 'Erreur lors du chargement des réservations' : 'Error loading bookings');
      }
      logger.error(CTX, 'Failed to load bookings', { error: error?.code });
    } finally {
      if (!silent) setLoading(false);
    }
  };

 const fetchPayments = async () => {
    setPmtLoading(true);
    try {
      const res = await paymentAPI.getAll();
      setPayments(res.data.data.payments || []);
      logger.info(CTX, 'Payments loaded', { count: res.data.data.payments?.length || 0 });
    } catch (error: any) {
      // Ne pas afficher d'erreur si c'est un timeout de connexion
      if (error?.code !== 'P1001') {
        toast.error(fr ? 'Erreur lors du chargement des paiements' : 'Error loading payments');
      }
      logger.error(CTX, 'Failed to load payments', { error: error?.code });
    } finally {
      setPmtLoading(false);
    }
  };
  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm(t('booking.confirm_cancel'))) return;
    
    // Optimistic update
    setBookings(prev => prev.map(b => 
      b.id === bookingId ? { ...b, status: 'CANCELLED' as any } : b
    ));

    try {
      await bookingAPI.updateStatus(bookingId, 'CANCELLED');
      toast.success(t('toast.booking_cancelled'));
      logger.info(CTX, 'Booking cancelled', { bookingId });
      fetchBookings(true); // Silent refresh
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('toast.error_generic'));
      logger.error(CTX, 'Cancel failed', { bookingId });
      fetchBookings(true); // Rollback
    }
  };

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

  const th = 'px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider';
  const td = 'px-6 py-4';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-dark">
            {t('dashboard.welcome')}, {user?.firstName} !
          </h1>
          <p className="text-gray-500 mt-1">{fr ? 'Gérez vos réservations et consultez votre historique' : 'Manage your bookings and view history'}</p>
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

        {/* Tabs container */}
        <div className="bg-white rounded-xl shadow-sm">

          {/* Tab bar */}
          <div className="border-b flex items-center justify-between pr-4">
            <div className="flex">
              {([
                { key: 'bookings', label: `${fr ? 'Réservations' : 'Bookings'} (${bookings.length})`, icon: <FaCalendar /> },
                { key: 'payments', label: `${fr ? 'Paiements' : 'Payments'} (${payments.length})`, icon: <FaReceipt /> },
              ] as { key: TabType; label: string; icon: any }[]).map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-medium transition ${
                    activeTab === tab.key
                      ? 'text-primary-dark border-b-2 border-primary-light'
                      : 'text-gray-400 hover:text-primary-dark'
                  }`}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
            {activeTab === 'bookings' && (
              <a href="/vehicles"
                className="flex items-center gap-2 bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-light transition">
                <FaCar size={13} /> {fr ? 'Nouvelle réservation' : 'New booking'}
              </a>
            )}
          </div>

          {/* ── Bookings Tab ── */}
          {activeTab === 'bookings' && (
            <>
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
                        {[fr ? 'Véhicule' : 'Vehicle', fr ? 'Dates' : 'Dates', fr ? 'Prix Total' : 'Total Price', fr ? 'Statut' : 'Status', 'Actions'].map(h => (
                          <th key={h} className={th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bookings.map((booking) => {
                        const status = normalizeStatus(booking.status);
                        return (
                          <tr key={booking.id} className="hover:bg-gray-50 transition">
                            <td className={td}>
                              <div className="flex items-center gap-3">
                                {booking.vehicle?.imageUrl ? (
                                  <img src={booking.vehicle.imageUrl} alt="" className="w-12 h-9 object-cover rounded-lg flex-shrink-0" />
                                ) : (
                                  <div className="w-12 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FaCar className="text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">
                                    {booking.vehicle?.brand} {booking.vehicle?.model}
                                  </p>
                                  <p className="text-xs text-gray-400">{booking.vehicle?.year}</p>
                                </div>
                              </div>
                            </td>
                            <td className={`${td} text-sm text-gray-700`}>
                              <p>{booking.startDate ? new Date(booking.startDate).toLocaleDateString('fr-FR') : '—'}</p>
                              <p className="text-gray-400 text-xs">
                                → {booking.endDate ? new Date(booking.endDate).toLocaleDateString('fr-FR') : '—'}
                              </p>
                            </td>
                            <td className={`${td} font-bold text-sm text-primary-dark`}>
                              {booking.totalPrice ? Number(booking.totalPrice).toLocaleString() + ' FCFA' : '—'}
                            </td>
                            <td className={td}>{getStatusBadge(booking.status)}</td>
                            <td className={td}>
                              <div className="flex items-center gap-2">
                                {/* Payer — visible UNIQUEMENT si CONFIRMED et payment_status !== COMPLETED */}
                                {status === 'CONFIRMED' && 
                                (!booking.paymentStatus || booking.paymentStatus !== 'COMPLETED') && (
                                  <button
                                    onClick={() => navigate(`/payment/${booking.id}`)}
                                    className="flex items-center gap-1.5 bg-primary-dark text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary-light transition">
                                    <FaMoneyBillWave size={11} />
                                    {t('booking.pay') || 'Payer'}
                                  </button>
                                )}
                                
                                {/* Ticket — visible UNIQUEMENT si paymentStatus === COMPLETED */}
                                {booking.paymentStatus === 'COMPLETED' && (
                                  <button
                                    onClick={() => navigate(`/payment/${booking.id}`)}
                                    className="flex items-center gap-1.5 border border-primary-dark text-primary-dark px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary-dark/5 transition">
                                    <FaTicketAlt size={11} />
                                    {t('booking.ticket') || 'Ticket'}
                                  </button>
                                )}
                                
                                {/* Annuler — si PENDING ou CONFIRMED non payé */}
                                {(status === 'PENDING' || 
                                  (status === 'CONFIRMED' && (!booking.paymentStatus || booking.paymentStatus !== 'COMPLETED'))) && (
                                  <button
                                    onClick={() => handleCancelBooking(booking.id)}
                                    className="text-red-500 hover:text-red-700 text-xs font-medium hover:underline transition">
                                    {t('booking.cancel')}
                                  </button>
                                )}
                                
                                {status === 'CANCELLED' && (
                                  <span className="text-gray-300 italic text-xs">—</span>
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
            </>
          )}

          {/* ── Payments Tab ── */}
          {activeTab === 'payments' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {[fr?'Transaction':'Transaction', fr?'Véhicule':'Vehicle', fr?'Montant':'Amount', 
                      fr?'Statut':'Status', fr?'Date':'Date', 'Actions']
                      .map(h => <th key={h} className={th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pmtLoading ? (
                    <tr><td colSpan={6} className="text-center py-12">
                      <div className="inline-block w-6 h-6 border-2 border-primary-dark border-t-transparent rounded-full animate-spin" />
                    </td></tr>
                  ) : payments.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                      <FaReceipt className="text-4xl mx-auto mb-2 opacity-30" />
                      <p>{fr ? 'Aucun paiement trouvé' : 'No payments found'}</p>
                    </td></tr>
                  ) : payments.map((p: any) => {
                    const stCls: Record<string, string> = {
                      COMPLETED: 'bg-green-100 text-green-800',
                      PENDING:   'bg-yellow-100 text-yellow-800',
                      FAILED:    'bg-red-100 text-red-800',
                      REFUNDED:  'bg-purple-100 text-purple-800',
                    };
                    const stLbl: Record<string, string> = {
                      COMPLETED: fr ? 'Complété'   : 'Completed',
                      PENDING:   fr ? 'En attente' : 'Pending',
                      FAILED:    fr ? 'Échoué'     : 'Failed',
                      REFUNDED:  fr ? 'Remboursé'  : 'Refunded',
                    };
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition">
                        <td className={td}>
                          <p className="font-mono text-xs font-bold text-primary-dark">{p.transactionId ?? '—'}</p>
                          <p className="text-xs text-gray-400">{String(p.id).slice(0, 8)}…</p>
                        </td>
                        <td className={`${td} text-sm text-gray-700`}>{p.booking?.vehicle || '—'}</td>
                        <td className={`${td} font-bold text-primary-dark text-sm`}>
                          {Number(p.amount).toLocaleString()} {p.currency}
                        </td>
                        <td className={td}>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${stCls[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {stLbl[p.status] ?? p.status}
                          </span>
                        </td>
                        <td className={`${td} text-xs text-gray-500`}>
                          {new Date(p.createdAt).toLocaleString('fr-FR')}
                        </td>
                        <td className={td}>
                          {p.status === 'COMPLETED' && p.booking?.id && (
                            <button
                              onClick={() => navigate(`/payment/${p.booking.id}`)}
                              className="flex items-center gap-1.5 border border-primary-dark text-primary-dark px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary-dark/5 transition">
                              <FaTicketAlt size={11} />
                              {fr ? 'Ticket' : 'Ticket'}
                            </button>
                          )}
                          {p.status !== 'COMPLETED' && (
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