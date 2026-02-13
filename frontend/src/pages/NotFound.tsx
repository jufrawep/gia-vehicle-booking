import { Link } from 'react-router-dom';
import { FaCar, FaArrowLeft } from 'react-icons/fa';
import { useTranslation } from '../i18n';

/**
 * NotFound — page 404
 * Affichée par React Router pour toute route inconnue (`path="*"`).
 */
export const NotFound = () => {
  const { lang } = useTranslation();
  const fr = lang === 'fr';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">

        {/* Icône + code */}
        <div className="flex items-center justify-center mb-4">
          <FaCar className="text-6xl text-primary-light opacity-30 mr-4" />
          <span className="text-8xl font-black text-primary-dark opacity-10 select-none">404</span>
        </div>

        <h1 className="text-5xl font-black text-primary-dark mb-3">404</h1>

        <p className="text-xl font-semibold text-gray-600 mb-2">
          {fr ? 'Page introuvable' : 'Page not found'}
        </p>
        <p className="text-gray-400 text-sm mb-8">
          {fr
            ? 'La page que vous recherchez n\'existe pas ou a été déplacée.'
            : 'The page you are looking for does not exist or has been moved.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-primary-dark text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-light transition shadow-md"
          >
            <FaArrowLeft className="text-sm" />
            {fr ? 'Retour à l\'accueil' : 'Back to home'}
          </Link>

          <Link
            to="/vehicles"
            className="inline-flex items-center justify-center gap-2 bg-white text-primary-dark border border-gray-200 px-6 py-3 rounded-xl font-bold hover:border-primary-light transition"
          >
            <FaCar className="text-sm text-primary-light" />
            {fr ? 'Voir les véhicules' : 'Browse vehicles'}
          </Link>
        </div>
      </div>
    </div>
  );
};
