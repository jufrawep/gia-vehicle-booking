import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { authAPI } from '../services/api';
import { PasswordStrength } from '../components/PasswordStrength';
import { useTranslation } from '../i18n';
import { logger } from '../utils/logger';

const CTX = 'ResetPassword';

export const ResetPassword = () => {
  const { t, lang }        = useTranslation();
  const [searchParams]     = useSearchParams();
  const navigate           = useNavigate();
  const token              = searchParams.get('token');

  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations traduites
    if (password.length < 8)                                                     { toast.error(t('validation.password_min'));  return; }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password))                     { toast.error(t('validation.password_case')); return; }
    if (!/\d/.test(password))                                                    { toast.error(t('validation.password_num'));  return; }
    if (!/[^a-zA-Z0-9]/.test(password))                                         { toast.error(t('validation.password_spec')); return; }
    if (password !== confirmPassword)                                            { toast.error(t('validation.password_match')); return; }

    setLoading(true);
    logger.info(CTX, 'Password reset submit');
    try {
      await authAPI.resetPassword(token!, password);
      toast.success(lang === 'fr'
        ? 'Mot de passe réinitialisé avec succès !'
        : 'Password reset successfully!');
      logger.info(CTX, 'Password reset successful');
      navigate('/login');
    } catch (error: any) {
      const msg = error.response?.data?.message
        || (lang === 'fr' ? 'Erreur lors de la réinitialisation' : 'Reset error');
      toast.error(msg);
      logger.error(CTX, 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  // Token absent ou invalide
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠</span>
            </div>
            <h2 className="text-2xl font-bold text-primary-dark mb-3">
              {lang === 'fr' ? 'Lien invalide' : 'Invalid link'}
            </h2>
            <p className="text-gray-500 mb-6 text-sm">
              {lang === 'fr'
                ? 'Ce lien de réinitialisation est invalide ou a expiré (validité : 1 heure).'
                : 'This reset link is invalid or has expired (valid for 1 hour).'}
            </p>
            <Link to="/forgot-password"
              className="inline-block bg-primary-dark text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-light transition">
              {lang === 'fr' ? 'Demander un nouveau lien' : 'Request a new link'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">

          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-primary-light/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaLock className="text-2xl text-primary-light" />
            </div>
            <h2 className="text-3xl font-bold text-primary-dark">{t('auth.reset.title')}</h2>
            <p className="text-gray-500 mt-2 text-sm">
              {lang === 'fr' ? 'Choisissez un nouveau mot de passe sécurisé' : 'Choose a new secure password'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Nouveau mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('auth.reset.new')}
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
              <PasswordStrength password={password} />
            </div>

            {/* Confirmer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('auth.reset.confirm')}
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary-dark text-white py-3 rounded-lg font-bold hover:bg-primary-light transition disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? t('auth.reset.loading') : t('auth.reset.submit')}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link to="/login" className="text-primary-light hover:underline text-sm">
              {lang === 'fr' ? 'Retour à la connexion' : 'Back to login'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
