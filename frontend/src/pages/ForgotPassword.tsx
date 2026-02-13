import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { authAPI } from '../services/api';
import { useTranslation } from '../i18n';
import { logger } from '../utils/logger';

const CTX = 'ForgotPassword';

export const ForgotPassword = () => {
  const { t, lang } = useTranslation();
  const [email,     setEmail]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    logger.info(CTX, 'Password reset requested', { email });
    try {
      await authAPI.forgotPassword(email);
      setEmailSent(true);
      toast.success(lang === 'fr' ? 'Email de réinitialisation envoyé !' : 'Reset email sent!');
      logger.info(CTX, 'Reset email sent');
    } catch (error: any) {
      const msg = error.response?.data?.message
        || (lang === 'fr' ? 'Erreur lors de l\'envoi' : 'Error sending email');
      toast.error(msg);
      logger.error(CTX, 'Reset email failed');
    } finally {
      setLoading(false);
    }
  };

  // Vue succès
  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-primary-dark mb-3">
              {lang === 'fr' ? 'Email envoyé !' : 'Email sent!'}
            </h2>
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
              {lang === 'fr'
                ? <>Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>. Vérifiez votre boîte de réception et vos spams.</>
                : <>We sent a reset link to <strong>{email}</strong>. Check your inbox and spam folder.</>}
            </p>
            <Link to="/login"
              className="inline-block bg-primary-dark text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-light transition">
              {t('auth.forgot.back')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Formulaire principal
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">

          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-primary-light/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaEnvelope className="text-2xl text-primary-light" />
            </div>
            <h2 className="text-3xl font-bold text-primary-dark">{t('auth.forgot.title')}</h2>
            <p className="text-gray-500 mt-2 text-sm">{t('auth.forgot.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('auth.forgot.email')}
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

            <button type="submit" disabled={loading}
              className="w-full bg-primary-dark text-white py-3 rounded-lg font-bold hover:bg-primary-light transition disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? t('auth.forgot.loading') : t('auth.forgot.submit')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login"
              className="inline-flex items-center gap-2 text-primary-light hover:underline text-sm font-medium">
              <FaArrowLeft />
              {t('auth.forgot.back')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
