import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useTranslation } from '../i18n';
import { logger } from '../utils/logger';
import { bookingAPI} from '../services/api';

const CTX = 'Login';

export const Login = () => {
  const { t }                                    = useTranslation();
  const { login, isAuthenticated, user, loading } = useAuth();
  const navigate                                  = useNavigate();

  // ── Si déjà connecté au montage → redirection SILENCIEUSE ────────────────────
  // On attend loading=false pour éviter de réagir au flash d'initialisation
  // d'AuthContext (réhydratation du token depuis localStorage).
  // AUCUN toast ici : AuthContext.login() affiche déjà "Bienvenue, X !"
  // après une connexion réussie. Afficher un toast ici crée un doublon.
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      logger.info(CTX, 'Already authenticated — silent redirect', { role: user.role });
      navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [loading, isAuthenticated, user, navigate]);

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  logger.info(CTX, 'Login attempt', { email });
  setSubmitting(true);
  
  try {
    await login(email, password);
    
    // Vérifier s'il y a une réservation en attente
    const pendingBooking = localStorage.getItem('pendingBooking');
    if (pendingBooking) {
      try {
        const bookingData = JSON.parse(pendingBooking);
        await bookingAPI.create(bookingData);
        localStorage.removeItem('pendingBooking');
        toast.success(t('toast.booking_success'));
        logger.info(CTX, 'Pending booking created after login');
      } catch (error: any) {
        toast.error(error.response?.data?.message || t('toast.error_generic'));
        logger.error(CTX, 'Failed to create pending booking', error);
      }
      // IMPORTANT: navigate APRÈS la création
      navigate('/dashboard');
    }
    // Sinon, la navigation est gérée par AuthContext
    
    logger.info(CTX, 'Login successful');
  } catch (error: any) {
    const msg = error?.response?.data?.message || t('toast.error_generic');
    logger.warn(CTX, 'Login failed', { status: error?.response?.status });
    toast.error(msg);
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-primary-dark">{t('auth.login.title')}</h2>
            <p className="text-gray-500 mt-1">{t('auth.login.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('auth.login.email')}
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent transition"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('auth.login.password')}
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="text-right -mt-2">
              <Link to="/forgot-password" className="text-sm text-primary-light hover:underline">
                {t('auth.login.forgot')}
              </Link>
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-primary-dark text-white py-3 rounded-lg font-bold hover:bg-primary-light transition disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? t('auth.login.loading') : t('auth.login.submit')}
            </button>
          </form>

          <p className="mt-5 text-center text-gray-600 text-sm">
            {t('auth.login.no_account')}{' '}
            <Link to="/register" className="text-primary-light font-bold hover:underline">
              {t('auth.login.register_link')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};