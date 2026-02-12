import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';

/**
 * Environment-based API endpoint configuration
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * ForgotPassword Component
 * Manages the password recovery flow by allowing users to request
 * a reset link via their registered email address.
 */
export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  /**
   * Handles the password reset request submission
   * @param e Form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Trigger the backend password reset workflow
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setEmailSent(true);
      toast.success('Email de réinitialisation envoyé !');
    } catch (error: any) {
      // Display specific server error message or a generic fallback
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Success View: Rendered once the server confirms the reset email has been dispatched
   */
  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="text-6xl text-green-500 mb-4">✓</div>
            <h2 className="text-2xl font-bold text-primary-dark mb-4">
              Email envoyé !
            </h2>
            <p className="text-gray-600 mb-6">
              Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>.
              Vérifiez votre boîte de réception.
            </p>
            <Link
              to="/login"
              className="inline-block bg-primary-dark text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-light transition"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Primary View: Password reset request form
   */
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-primary-dark">Mot de passe oublié ?</h2>
            <p className="text-gray-600 mt-2">
              Entrez votre email pour recevoir un lien de réinitialisation
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-dark text-white py-3 rounded-lg font-bold hover:bg-primary-light transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 text-primary-light hover:underline"
            >
              <FaArrowLeft />
              <span>Retour à la connexion</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};