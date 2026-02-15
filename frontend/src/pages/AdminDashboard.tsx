import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  FaCar, FaCalendar, FaMoneyBill, FaClock,
  FaUsers, FaEdit, FaTrash, FaPlus, FaTimes, FaEye,
  FaBan, FaCheck, FaUserShield, FaUser,
  FaCheckCircle, FaTimesCircle, FaHourglass, FaFlag,
  FaReceipt, FaFilter, FaSearch,
} from 'react-icons/fa';
import { bookingAPI, vehicleAPI, userAPI, paymentAPI } from '../services/api';
import {
  Booking, DashboardStats, Vehicle, User,
  VehicleFormData, VehicleCategory, VehicleStatus,
  TransmissionType, FuelTypeEnum,
} from '../types';
import { Loader } from '../components/Loader';
import { useTranslation } from '../i18n';
import { logger } from '../utils/logger';

const CTX = 'AdminDashboard';

// ─── Valeur par défaut formulaire véhicule ────────────────────────────────────
const EMPTY_VEHICLE: VehicleFormData = {
  brand: '', model: '', year: new Date().getFullYear(),
  licensePlate: '', category: 'ECONOMY', pricePerDay: 0,
  seats: 5, transmission: 'MANUAL', fuelType: 'PETROL',
  imageUrl: '', description: '', status: 'AVAILABLE',
  features: '', mileage: 0, location: '',
};

// ─── Modal Véhicule (Create / Update) ────────────────────────────────────────
interface VehicleModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onSaved: () => void;
}

const VehicleModal = ({ vehicle, onClose, onSaved }: VehicleModalProps) => {
  const { lang } = useTranslation();
  const fr = lang === 'fr';
  const isEdit = !!vehicle;

  const [form, setForm] = useState<VehicleFormData>(() =>
    vehicle ? {
      brand:        vehicle.brand,
      model:        vehicle.model,
      year:         vehicle.year,
      licensePlate: vehicle.licensePlate ?? '',
      category:     vehicle.category,
      pricePerDay:  vehicle.pricePerDay,
      seats:        vehicle.seats,
      transmission: vehicle.transmission,
      fuelType:     vehicle.fuelType,
      imageUrl:     vehicle.imageUrl ?? '',
      description:  vehicle.description ?? '',
      status:       vehicle.status,
      features:     (vehicle.features ?? []).join(', '),
      mileage:      vehicle.mileage ?? 0,
      location:     typeof vehicle.location === 'object' && vehicle.location !== null
        ? vehicle.location.address || ''
        : vehicle.location ?? '',
    } : EMPTY_VEHICLE
  );
  const [saving, setSaving] = useState(false);

  const set = (field: keyof VehicleFormData, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.brand || !form.model || !form.pricePerDay) {
      toast.error(fr ? 'Remplissez les champs obligatoires' : 'Fill in required fields');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        year:        Number(form.year),
        pricePerDay: Number(form.pricePerDay),
        seats:       Number(form.seats),
        mileage:     Number(form.mileage),
        features:    form.features
          ? form.features.split(',').map((f: string) => f.trim()).filter(Boolean)
          : [],
      };
      if (isEdit) {
        await vehicleAPI.update(vehicle!.id, payload);
        toast.success(fr ? 'Véhicule mis à jour' : 'Vehicle updated');
      } else {
        await vehicleAPI.create(payload);
        toast.success(fr ? 'Véhicule ajouté' : 'Vehicle added');
      }
      logger.info(CTX, isEdit ? 'Vehicle updated' : 'Vehicle created');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || (fr ? 'Erreur de sauvegarde' : 'Save error'));
      logger.error(CTX, 'Vehicle save failed');
    } finally {
      setSaving(false);
    }
  };

  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-light focus:border-transparent';
  const lbl = 'block text-xs font-semibold text-gray-600 mb-1';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-primary-dark flex items-center gap-2">
            <FaCar className="text-primary-light" />
            {isEdit ? (fr ? 'Modifier le véhicule' : 'Edit vehicle') : (fr ? 'Ajouter un véhicule' : 'Add vehicle')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
        </div>
        <div className="overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>{fr ? 'Marque *' : 'Brand *'}</label>
              <input className={inp} value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Toyota" /></div>
            <div><label className={lbl}>{fr ? 'Modèle *' : 'Model *'}</label>
              <input className={inp} value={form.model} onChange={e => set('model', e.target.value)} placeholder="Corolla" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lbl}>{fr ? 'Année' : 'Year'}</label>
              <input type="number" className={inp} value={form.year} onChange={e => set('year', e.target.value)} min={2000} max={2030} /></div>
            <div><label className={lbl}>{fr ? 'Immatriculation' : 'Plate'}</label>
              <input className={inp} value={form.licensePlate} onChange={e => set('licensePlate', e.target.value)} placeholder="LT-1234-A" /></div>
            <div><label className={lbl}>{fr ? 'Places' : 'Seats'}</label>
              <input type="number" className={inp} value={form.seats} onChange={e => set('seats', e.target.value)} min={1} max={20} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lbl}>{fr ? 'Catégorie' : 'Category'}</label>
              <select className={inp} value={form.category} onChange={e => set('category', e.target.value as VehicleCategory)}>
                {(['ECONOMY','COMFORT','LUXURY','SUV','VAN'] as VehicleCategory[]).map(c =>
                  <option key={c} value={c}>{c}</option>)}
              </select></div>
            <div><label className={lbl}>{fr ? 'Boîte' : 'Gearbox'}</label>
              <select className={inp} value={form.transmission} onChange={e => set('transmission', e.target.value as TransmissionType)}>
                <option value="MANUAL">{fr ? 'Manuelle' : 'Manual'}</option>
                <option value="AUTOMATIC">{fr ? 'Automatique' : 'Automatic'}</option>
              </select></div>
            <div><label className={lbl}>{fr ? 'Carburant' : 'Fuel'}</label>
              <select className={inp} value={form.fuelType} onChange={e => set('fuelType', e.target.value as FuelTypeEnum)}>
                {(['PETROL','DIESEL','ELECTRIC','HYBRID'] as FuelTypeEnum[]).map(f =>
                  <option key={f} value={f}>{f}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lbl}>{fr ? 'Prix/Jour (FCFA) *' : 'Price/Day (FCFA) *'}</label>
              <input type="number" className={inp} value={form.pricePerDay} onChange={e => set('pricePerDay', e.target.value)} min={0} /></div>
            <div><label className={lbl}>{fr ? 'Statut' : 'Status'}</label>
              <select className={inp} value={form.status} onChange={e => set('status', e.target.value as VehicleStatus)}>
                <option value="AVAILABLE">{fr ? 'Disponible' : 'Available'}</option>
                <option value="UNAVAILABLE">{fr ? 'Indisponible' : 'Unavailable'}</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="RENTED">{fr ? 'Loué' : 'Rented'}</option>
              </select></div>
            <div><label className={lbl}>{fr ? 'Kilométrage' : 'Mileage'}</label>
              <input type="number" className={inp} value={form.mileage} onChange={e => set('mileage', e.target.value)} min={0} /></div>
          </div>
          <div><label className={lbl}>{fr ? "URL de l'image" : 'Image URL'}</label>
            <input className={inp} value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} placeholder="https://..." /></div>
          <div><label className={lbl}>{fr ? 'Localisation' : 'Location'}</label>
            <input className={inp} value={form.location} onChange={e => set('location', e.target.value)} placeholder="Douala, Akwa" /></div>
          <div><label className={lbl}>{fr ? 'Équipements (virgules)' : 'Features (comma-separated)'}</label>
            <input className={inp} value={form.features} onChange={e => set('features', e.target.value)} placeholder="Climatisation, GPS, Bluetooth" /></div>
          <div><label className={lbl}>{fr ? 'Description' : 'Description'}</label>
            <textarea className={`${inp} resize-none`} rows={3} value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder={fr ? 'Description du véhicule...' : 'Vehicle description...'} /></div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <button onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition">
            {fr ? 'Annuler' : 'Cancel'}
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-4 py-2 bg-primary-dark text-white rounded-lg text-sm font-bold hover:bg-primary-light transition disabled:opacity-50">
            {saving ? (fr ? 'Sauvegarde...' : 'Saving...') : isEdit ? (fr ? 'Mettre à jour' : 'Update') : (fr ? 'Ajouter' : 'Add')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Modal Détails Véhicule (Read only) ──────────────────────────────────────
const VehicleDetailModal = ({ vehicle, onClose, onEdit }: {
  vehicle: Vehicle; onClose: () => void; onEdit: () => void;
}) => {
  const { lang } = useTranslation();
  const fr = lang === 'fr';
  const rows = [
    [fr ? 'Catégorie' : 'Category',   vehicle.category],
    [fr ? 'Boîte' : 'Gearbox',        vehicle.transmission],
    [fr ? 'Carburant' : 'Fuel',        vehicle.fuelType],
    [fr ? 'Places' : 'Seats',          vehicle.seats],
    [fr ? 'Prix/Jour' : 'Price/Day',   `${Number(vehicle.pricePerDay).toLocaleString()} FCFA`],
    [fr ? 'Statut' : 'Status',         vehicle.status],
    [fr ? 'Kilométrage' : 'Mileage',   vehicle.mileage ? `${vehicle.mileage} km` : '—'],
    [fr ? 'Immat.' : 'Plate',          vehicle.licensePlate ?? '—'],
    [fr ? 'Lieu' : 'Location',         vehicle.location ?? '—'],
  ];
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-primary-dark">{vehicle.brand} {vehicle.model} {vehicle.year}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto max-h-[70vh]">
          {vehicle.imageUrl && (
            <img src={vehicle.imageUrl} alt="" className="w-full h-44 object-cover rounded-xl mb-3" />
          )}
          <div className="grid grid-cols-2 gap-2">
            {rows.map(([label, value]) => (
              <div key={String(label)} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">{String(label)}</p>
                <p className="font-semibold text-sm text-primary-dark">{String(value)}</p>
              </div>
            ))}
          </div>
          {vehicle.description && <p className="text-sm text-gray-600">{vehicle.description}</p>}
          {(vehicle.features ?? []).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(vehicle.features ?? []).map((f, i) => (
                <span key={i} className="bg-primary-light/10 text-primary-dark text-xs px-2 py-1 rounded-full">{f}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <button onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            {fr ? 'Fermer' : 'Close'}
          </button>
          <button onClick={onEdit}
            className="px-4 py-2 bg-primary-dark text-white rounded-lg text-sm font-bold hover:bg-primary-light flex items-center gap-2">
            <FaEdit /> {fr ? 'Modifier' : 'Edit'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── AdminDashboard ───────────────────────────────────────────────────────────
type TabType = 'bookings' | 'vehicles' | 'users' | 'payments';

export const AdminDashboard = () => {
  const { t, lang } = useTranslation();
  const fr = lang === 'fr';

  const [stats,    setStats]    = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users,    setUsers]    = useState<User[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('bookings');

  // ── Payments state ──────────────────────────────────────────────────────────
  const [payments,   setPayments]   = useState<any[]>([]);
  const [pmtLoading, setPmtLoading] = useState(false);
  const [pmtFilters, setPmtFilters] = useState({ dateFrom: '', dateTo: '', status: '', paymentMethod: '' });

  const [vehicleModal,    setVehicleModal]    = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
// Dans AdminDashboard.tsx, remplacez le fetchData existant :

const fetchData = async (silent = false) => {
  try {
    if (!silent) setLoading(true);
    
    // Lancer toutes les requêtes en parallèle, y compris les paiements
    const [statsRes, bookingsRes, vehiclesRes, usersRes, paymentsRes] = await Promise.all([
      bookingAPI.getStats(),
      bookingAPI.getAll(),
      vehicleAPI.getAll(),
      userAPI.getAll(),
      paymentAPI.getAll(), // ← Ajout des paiements
    ]);
    
    setStats(statsRes.data.data);
    setBookings(bookingsRes.data.data.bookings);
    setVehicles(vehiclesRes.data.data.vehicles);
    
    const usersData = usersRes.data.data;
    setUsers(Array.isArray(usersData) ? usersData : (usersData.users ?? []));
    
    // Initialiser les paiements même si l'onglet n'est pas actif
    if (paymentsRes.data.data?.payments) {
      setPayments(paymentsRes.data.data.payments);
    }
    
    logger.info(CTX, 'Dashboard data loaded');
  } catch {
    if (!silent) toast.error(fr ? 'Erreur lors du chargement' : 'Error loading data');
    logger.error(CTX, 'Failed to load dashboard data');
  } finally {
    if (!silent) setLoading(false);
  }
};
  useEffect(() => { fetchData(); }, []);

  // ── Payments fetch ──────────────────────────────────────────────────────────
  const fetchPayments = async () => {
    setPmtLoading(true);
    try {
      const res = await paymentAPI.getAll({
        dateFrom:      pmtFilters.dateFrom      || undefined,
        dateTo:        pmtFilters.dateTo        || undefined,
        status:        pmtFilters.status        || undefined,
        paymentMethod: pmtFilters.paymentMethod || undefined,
      });
      setPayments(res.data.data.payments);
    } catch {
      toast.error(fr ? 'Erreur chargement paiements' : 'Error loading payments');
    } finally {
      setPmtLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'payments') fetchPayments();
  }, [activeTab]);

  // ── Booking actions ────────────────────────────────────────────────────────
  // Optimistic update : état local immédiat + sync silencieux en arrière-plan
  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    setBookings(prev => prev.map(b =>
      b.id === bookingId ? { ...b, status: newStatus as any } : b
    ));
    try {
      await bookingAPI.updateStatus(bookingId, newStatus);
      toast.success(t('toast.status_updated'));
      fetchData(true); // sync silencieux
    } catch {
      toast.error(t('toast.error_generic'));
      fetchData(true); // rollback implicite
    }
  };

  // ── Vehicle actions ────────────────────────────────────────────────────────
  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!window.confirm(t('admin.confirm.delete_vehicle'))) return;
    setVehicles(prev => prev.filter(v => v.id !== vehicleId)); // optimistic
    try {
      await vehicleAPI.delete(vehicleId);
      toast.success(t('toast.vehicle_deleted'));
      logger.warn(CTX, 'Vehicle deleted', { vehicleId });
      fetchData(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('toast.error_generic'));
      fetchData(true); // rollback
    }
  };

  // ── User actions ───────────────────────────────────────────────────────────
  const handleToggleStatus = async (userId: string, current: 'ACTIVE' | 'BLOCKED') => {
    const next = current === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    if (!window.confirm(next === 'BLOCKED'
      ? (fr ? 'Bloquer cet utilisateur ?' : 'Block this user?')
      : (fr ? 'Débloquer ?' : 'Unblock?'))) return;
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, status: next } : u
    )); // optimistic
    try {
      await userAPI.updateStatus(userId, next);
      toast.success(next === 'BLOCKED' ? (fr ? 'Bloqué' : 'Blocked') : (fr ? 'Débloqué' : 'Unblocked'));
      fetchData(true);
    } catch {
      toast.error(t('toast.error_generic'));
      fetchData(true);
    }
  };

  const handleToggleRole = async (userId: string, current: 'USER' | 'ADMIN') => {
    const next = current === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!window.confirm(next === 'ADMIN'
      ? (fr ? 'Promouvoir en admin ?' : 'Promote to admin?')
      : (fr ? 'Rétrograder ?' : 'Demote to user?'))) return;
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, role: next } : u
    )); // optimistic
    try {
      await userAPI.updateRole(userId, next);
      toast.success(next === 'ADMIN' ? (fr ? 'Promu admin' : 'Promoted') : (fr ? 'Rétrogradé' : 'Demoted'));
      fetchData(true);
    } catch {
      toast.error(t('toast.error_generic'));
      fetchData(true);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm(fr ? 'Supprimer cet utilisateur ?' : 'Delete this user?')) return;
    setUsers(prev => prev.filter(u => u.id !== userId)); // optimistic
    try {
      await userAPI.delete(userId);
      toast.success(fr ? 'Utilisateur supprimé' : 'User deleted');
      fetchData(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('toast.error_generic'));
      fetchData(true);
    }
  };

  // ── Badges ─────────────────────────────────────────────────────────────────
  const bookingBadge = (status: string) => {
    const cls: Record<string, string> = {
      PENDING:   'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cls[status] ?? cls.PENDING}`}>
        {t(`booking.status.${status}` as any)}
      </span>
    );
  };

  const vehicleBadge = (status: string) => {
    const cls: Record<string, string> = {
      AVAILABLE:   'bg-green-100 text-green-800',
      RENTED:      'bg-blue-100 text-blue-800',
      MAINTENANCE: 'bg-orange-100 text-orange-800',
      UNAVAILABLE: 'bg-red-100 text-red-800',
    };
    const lbl: Record<string, string> = {
      AVAILABLE:   fr ? 'Disponible' : 'Available',
      RENTED:      fr ? 'Loué' : 'Rented',
      MAINTENANCE: 'Maintenance',
      UNAVAILABLE: fr ? 'Indisponible' : 'Unavailable',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cls[status] ?? cls.UNAVAILABLE}`}>
        {lbl[status] ?? status}
      </span>
    );
  };

  const th = 'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider';
  const td = 'px-4 py-3';

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-dark">{t('admin.title')}</h1>
          <p className="text-gray-500 mt-1">{t('admin.subtitle')}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: t('admin.stats.fleet'),   val: stats?.totalVehicles || 0,
              sub: `${stats?.availableVehicles || 0} ${t('admin.stats.available')}`,
              icon: <FaCar className="text-4xl text-primary-light opacity-60" />,   color: 'text-primary-dark' },
            { label: t('admin.stats.total'),   val: stats?.totalBookings || 0,   sub: '',
              icon: <FaCalendar className="text-4xl text-blue-400 opacity-60" />,   color: 'text-primary-dark' },
            { label: t('admin.stats.pending'), val: stats?.pendingBookings || 0, sub: '',
              icon: <FaClock className="text-4xl text-yellow-400 opacity-60" />,    color: 'text-yellow-600' },
            { label: t('admin.stats.revenue'),
              val: `${Number(stats?.totalRevenue || 0).toLocaleString()} FCFA`, sub: '',
              icon: <FaMoneyBill className="text-4xl text-green-400 opacity-60" />, color: 'text-green-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs mb-1">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                  {s.sub && <p className="text-xs text-green-600 mt-1">{s.sub}</p>}
                </div>
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs container */}
        <div className="bg-white rounded-xl shadow-sm">

          {/* Tab bar */}
          <div className="border-b flex items-center justify-between pr-4">
            <div className="flex">
              {([
                { key: 'bookings', label: `${t('admin.bookings')} (${bookings.length})`, icon: <FaCalendar /> },
                { key: 'vehicles', label: `${t('admin.vehicles')} (${vehicles.length})`, icon: <FaCar /> },
                { key: 'users',    label: `${t('admin.users')} (${users.length})`,        icon: <FaUsers /> },
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
            {activeTab === 'vehicles' && (
              <button onClick={() => { setSelectedVehicle(null); setVehicleModal('create'); }}
                className="flex items-center gap-2 bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-light transition">
                <FaPlus /> {fr ? 'Ajouter' : 'Add'}
              </button>
            )}
          </div>

          {/* ── Bookings ── */}
          {activeTab === 'bookings' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>{[t('admin.table.client'), t('admin.table.vehicle'), t('admin.table.dates'),
                        t('admin.table.price'), t('admin.table.status'), t('admin.table.actions')]
                    .map(h => <th key={h} className={th}>{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.length === 0
                    ? <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                        {fr ? 'Aucune réservation' : 'No bookings yet'}
                      </td></tr>
                    : bookings.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className={td}>
                        <p className="font-medium text-sm">{b.user?.firstName} {b.user?.lastName}</p>
                        <p className="text-xs text-gray-400">{b.user?.email}</p>
                      </td>
                      <td className={td}>
                        <div className="flex items-center gap-3">
                          {b.vehicle?.imageUrl
                            ? <img src={b.vehicle.imageUrl} alt="" className="w-12 h-9 object-cover rounded-lg flex-shrink-0" />
                            : <div className="w-12 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FaCar className="text-gray-400" />
                              </div>}
                          <div>
                            <p className="font-medium text-sm">{b.vehicle?.brand} {b.vehicle?.model}</p>
                            <p className="text-xs text-gray-400">{b.vehicle?.year}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`${td} text-sm`}>
                        <p>{new Date(b.startDate).toLocaleDateString('fr-FR')}</p>
                        <p className="text-xs text-gray-400">→ {new Date(b.endDate).toLocaleDateString('fr-FR')}</p>
                      </td>
                      <td className={`${td} text-sm font-bold text-primary-dark`}>
                        {Number(b.totalPrice).toLocaleString()} FCFA
                      </td>
                      <td className={td}>{bookingBadge(b.status)}</td>
                      {/* Actions bookings — icônes contextuelles selon statut */}
                      <td className={td}>
                        <div className="flex items-center gap-1">
                          {/* Confirmer : disponible si PENDING */}
                          {b.status === 'PENDING' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'CONFIRMED')}
                              title={fr ? 'Confirmer' : 'Confirm'}
                              className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition">
                              <FaCheckCircle size={15} />
                            </button>
                          )}
                          {/* Terminer : disponible si CONFIRMED */}
                          {b.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'COMPLETED')}
                              title={fr ? 'Terminer' : 'Complete'}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition">
                              <FaFlag size={15} />
                            </button>
                          )}
                          {/* Annuler : disponible si PENDING ou CONFIRMED */}
                          {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'CANCELLED')}
                              title={fr ? 'Annuler' : 'Cancel booking'}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition">
                              <FaTimesCircle size={15} />
                            </button>
                          )}
                          {/* Remettre en attente : disponible si CANCELLED */}
                          {b.status === 'CANCELLED' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'PENDING')}
                              title={fr ? 'Remettre en attente' : 'Reset to pending'}
                              className="p-1.5 text-yellow-500 hover:bg-yellow-50 rounded-lg transition">
                              <FaHourglass size={15} />
                            </button>
                          )}
                          {/* COMPLETED : aucune action possible */}
                          {b.status === 'COMPLETED' && (
                            <span className="text-xs text-gray-400 italic px-1">
                              {fr ? 'Terminé' : 'Done'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Vehicles ── */}
          {activeTab === 'vehicles' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>{[fr ? 'Véhicule' : 'Vehicle', fr ? 'Catégorie' : 'Category',
                        fr ? 'Prix/Jour' : 'Price/Day', fr ? 'Statut' : 'Status', 'Actions']
                    .map(h => <th key={h} className={th}>{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vehicles.length === 0
                    ? <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                        {fr ? 'Aucun véhicule' : 'No vehicles'}
                      </td></tr>
                    : vehicles.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className={td}>
                        <div className="flex items-center gap-3">
                          {v.imageUrl
                            ? <img src={v.imageUrl} alt="" className="w-12 h-9 object-cover rounded-lg flex-shrink-0" />
                            : <div className="w-12 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FaCar className="text-gray-400" />
                              </div>}
                          <div>
                            <p className="font-medium text-sm">{v.brand} {v.model}</p>
                            <p className="text-xs text-gray-400">{v.year} · {v.licensePlate ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`${td} text-sm text-gray-600`}>{v.category}</td>
                      <td className={`${td} text-sm font-bold text-primary-dark`}>
                        {Number(v.pricePerDay).toLocaleString()} FCFA
                      </td>
                      <td className={td}>{vehicleBadge(v.status)}</td>
                      <td className={td}>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => { setSelectedVehicle(v); setVehicleModal('view'); }}
                            title={fr ? 'Voir' : 'View'}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition">
                            <FaEye size={14} />
                          </button>
                          <button onClick={() => { setSelectedVehicle(v); setVehicleModal('edit'); }}
                            title={fr ? 'Modifier' : 'Edit'}
                            className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition">
                            <FaEdit size={14} />
                          </button>
                          <button onClick={() => handleDeleteVehicle(v.id)}
                            title={fr ? 'Supprimer' : 'Delete'}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition">
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Users ── */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>{[fr ? 'Utilisateur' : 'User', fr ? 'Rôle' : 'Role',
                        fr ? 'Statut' : 'Status', fr ? 'Inscrit le' : 'Joined', 'Actions']
                    .map(h => <th key={h} className={th}>{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.length === 0
                    ? <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                        {fr ? 'Aucun utilisateur' : 'No users'}
                      </td></tr>
                    : users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className={td}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-light/20 flex items-center justify-center font-bold text-primary-dark text-xs flex-shrink-0">
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                            {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className={td}>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {u.role === 'ADMIN' ? 'Admin' : (fr ? 'Utilisateur' : 'User')}
                        </span>
                      </td>
                      <td className={td}>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {u.status === 'ACTIVE' ? (fr ? 'Actif' : 'Active') : (fr ? 'Bloqué' : 'Blocked')}
                        </span>
                      </td>
                      <td className={`${td} text-xs text-gray-500`}>
                        {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className={td}>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleToggleStatus(u.id, u.status)}
                            title={u.status === 'ACTIVE' ? (fr ? 'Bloquer' : 'Block') : (fr ? 'Débloquer' : 'Unblock')}
                            className={`p-1.5 rounded-lg transition ${
                              u.status === 'ACTIVE'
                                ? 'text-orange-500 hover:bg-orange-50'
                                : 'text-green-500 hover:bg-green-50'
                            }`}>
                            {u.status === 'ACTIVE' ? <FaBan size={14} /> : <FaCheck size={14} />}
                          </button>
                          <button onClick={() => handleToggleRole(u.id, u.role)}
                            title={u.role === 'ADMIN' ? (fr ? 'Rétrograder' : 'Demote') : (fr ? 'Promouvoir admin' : 'Make admin')}
                            className={`p-1.5 rounded-lg transition ${
                              u.role === 'ADMIN'
                                ? 'text-gray-400 hover:bg-gray-100'
                                : 'text-purple-500 hover:bg-purple-50'
                            }`}>
                            {u.role === 'ADMIN' ? <FaUser size={14} /> : <FaUserShield size={14} />}
                          </button>
                          <button onClick={() => handleDeleteUser(u.id)}
                            title={fr ? 'Supprimer' : 'Delete'}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition">
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Payments (onglet ajouté) ── */}
          {activeTab === 'payments' && (
            <div>
              {/* Barre de filtres */}
              <div className="p-4 border-b bg-gray-50 flex flex-wrap gap-3 items-end">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">
                  <FaFilter size={11} /> {fr ? 'Filtres' : 'Filters'}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">{fr ? 'Du' : 'From'}</label>
                  <input type="datetime-local"
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-light"
                    value={pmtFilters.dateFrom}
                    onChange={e => setPmtFilters(p => ({ ...p, dateFrom: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">{fr ? 'Au' : 'To'}</label>
                  <input type="datetime-local"
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-light"
                    value={pmtFilters.dateTo}
                    onChange={e => setPmtFilters(p => ({ ...p, dateTo: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">{fr ? 'Statut' : 'Status'}</label>
                  <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-light"
                    value={pmtFilters.status}
                    onChange={e => setPmtFilters(p => ({ ...p, status: e.target.value }))}>
                    <option value="">{fr ? 'Tous' : 'All'}</option>
                    <option value="PENDING">{fr ? 'En attente' : 'Pending'}</option>
                    <option value="COMPLETED">{fr ? 'Complété' : 'Completed'}</option>
                    <option value="FAILED">{fr ? 'Échoué' : 'Failed'}</option>
                    <option value="REFUNDED">{fr ? 'Remboursé' : 'Refunded'}</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">{fr ? 'Moyen' : 'Method'}</label>
                  <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-light"
                    value={pmtFilters.paymentMethod}
                    onChange={e => setPmtFilters(p => ({ ...p, paymentMethod: e.target.value }))}>
                    <option value="">{fr ? 'Tous' : 'All'}</option>
                    <option value="CARD">{fr ? 'Carte' : 'Card'}</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                    <option value="CASH">{fr ? 'Espèces' : 'Cash'}</option>
                  </select>
                </div>
                <button onClick={fetchPayments} disabled={pmtLoading}
                  className="flex items-center gap-2 bg-primary-dark text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-primary-light transition disabled:opacity-50">
                  <FaSearch size={11} />
                  {pmtLoading ? (fr ? 'Recherche...' : 'Searching...') : (fr ? 'Rechercher' : 'Search')}
                </button>
                {(pmtFilters.dateFrom || pmtFilters.dateTo || pmtFilters.status || pmtFilters.paymentMethod) && (
                  <button
                    onClick={() => { setPmtFilters({ dateFrom: '', dateTo: '', status: '', paymentMethod: '' }); setTimeout(fetchPayments, 50); }}
                    className="text-xs text-gray-400 hover:text-red-500 underline transition">
                    {fr ? 'Réinitialiser' : 'Reset'}
                  </button>
                )}
              </div>

              {/* Résumé */}
              {!pmtLoading && payments.length > 0 && (
                <div className="px-4 py-2 bg-primary-dark/5 border-b flex gap-6 text-xs text-gray-600">
                  <span><strong>{payments.length}</strong> {fr ? 'paiement(s)' : 'payment(s)'}</span>
                  <span>{fr ? 'Total encaissé :' : 'Total:'}{' '}
                    <strong className="text-primary-dark">
                      {payments.filter((p: any) => p.status === 'COMPLETED').reduce((s: number, p: any) => s + p.amount, 0).toLocaleString()} FCFA
                    </strong>
                  </span>
                  <span>{fr ? 'Complétés :' : 'Completed:'}{' '}
                    <strong className="text-green-600">{payments.filter((p: any) => p.status === 'COMPLETED').length}</strong>
                  </span>
                </div>
              )}

              {/* Tableau */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {[fr?'Transaction':'Transaction', fr?'Client':'Customer', fr?'Véhicule':'Vehicle',
                        fr?'Période':'Period', fr?'Montant':'Amount', fr?'Moyen':'Method',
                        fr?'Statut':'Status', fr?'Date':'Date']
                        .map(h => <th key={h} className={th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pmtLoading ? (
                      <tr><td colSpan={8} className="text-center py-12">
                        <div className="inline-block w-6 h-6 border-2 border-primary-dark border-t-transparent rounded-full animate-spin" />
                      </td></tr>
                    ) : payments.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
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
                      const mLbl: Record<string, string> = {
                        CARD:         fr ? 'Carte'   : 'Card',
                        MOBILE_MONEY: 'Mobile Money',
                        CASH:         fr ? 'Espèces' : 'Cash',
                        SIMULATED:    fr ? 'Simulé'  : 'Simulated',
                      };
                      return (
                        <tr key={p.id} className="hover:bg-gray-50 transition">
                          <td className={td}>
                            <p className="font-mono text-xs font-bold text-primary-dark">{p.transactionId ?? '—'}</p>
                            <p className="text-xs text-gray-400">{String(p.id).slice(0, 8)}…</p>
                          </td>
                          <td className={td}>
                            <p className="text-sm font-medium">{p.booking?.customer}</p>
                            <p className="text-xs text-gray-400">{p.booking?.email}</p>
                          </td>
                          <td className={`${td} text-sm text-gray-700`}>{p.booking?.vehicle}</td>
                          <td className={`${td} text-xs text-gray-600`}>
                            <p>{p.booking?.startDate ? new Date(p.booking.startDate).toLocaleDateString('fr-FR') : '—'}</p>
                            <p className="text-gray-400">→ {p.booking?.endDate ? new Date(p.booking.endDate).toLocaleDateString('fr-FR') : '—'}</p>
                          </td>
                          <td className={`${td} font-bold text-primary-dark text-sm`}>
                            {Number(p.amount).toLocaleString()} {p.currency}
                          </td>
                          <td className={`${td} text-xs text-gray-600`}>{mLbl[p.paymentMethod] ?? p.paymentMethod}</td>
                          <td className={td}>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${stCls[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                              {stLbl[p.status] ?? p.status}
                            </span>
                          </td>
                          <td className={`${td} text-xs text-gray-500`}>
                            {new Date(p.createdAt).toLocaleString('fr-FR')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Modals ── */}
      {(vehicleModal === 'create' || vehicleModal === 'edit') && (
        <VehicleModal
          vehicle={vehicleModal === 'edit' ? selectedVehicle : null}
          onClose={() => { setVehicleModal(null); setSelectedVehicle(null); }}
          onSaved={() => fetchData(true)}
        />
      )}
      {vehicleModal === 'view' && selectedVehicle && (
        <VehicleDetailModal
          vehicle={selectedVehicle}
          onClose={() => { setVehicleModal(null); setSelectedVehicle(null); }}
          onEdit={() => setVehicleModal('edit')}
        />
      )}
    </div>
  );
};