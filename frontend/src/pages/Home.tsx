import { Link } from 'react-router-dom';
import { FaCar, FaShieldAlt, FaHeadset } from 'react-icons/fa';

/**
 * Home Component
 * The landing page of the application. It serves as the primary entry point,
 * featuring a hero call-to-action, service highlights, and social proof statistics.
 */
export const Home = () => {
  return (
    <div className="min-h-screen">
      
      {/* --- Hero Section --- */}
      {/* Background overlay and primary Call to Action (CTA) */}
      <div 
        className="relative h-[500px] bg-cover bg-center"
        style={{
          backgroundImage: 'linear-gradient(rgba(10, 31, 68, 0.7), rgba(10, 31, 68, 0.7)), url(https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200)'
        }}
      >
        <div className="container mx-auto px-4 h-full flex items-center">
          <div className="text-white max-w-2xl">
            <h1 className="text-5xl font-bold mb-4">
              Louez le véhicule parfait pour votre voyage
            </h1>
            <p className="text-xl mb-8">
              Des véhicules de qualité, des prix compétitifs et un service client exceptionnel au Cameroun.
            </p>
            <div className="flex space-x-4">
              <Link
                to="/vehicles"
                className="bg-primary-light hover:bg-opacity-90 text-white px-8 py-3 rounded-lg font-bold text-lg transition"
              >
                Voir les véhicules
              </Link>
              <Link
                to="/register"
                className="bg-white hover:bg-gray-100 text-primary-dark px-8 py-3 rounded-lg font-bold text-lg transition"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* --- Features Section --- */}
      {/* Grid displaying the unique selling propositions (USPs) */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-primary-dark mb-12">
            Pourquoi choisir GIA Vehicle Booking ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature: Choice */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-5xl text-primary-light mb-4 flex justify-center">
                <FaCar />
              </div>
              <h3 className="text-xl font-bold text-primary-dark mb-2">
                Large choix de véhicules
              </h3>
              <p className="text-gray-600">
                Des véhicules économiques aux modèles de luxe, trouvez celui qui vous convient.
              </p>
            </div>

            {/* Feature: Security */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-5xl text-primary-light mb-4 flex justify-center">
                <FaShieldAlt />
              </div>
              <h3 className="text-xl font-bold text-primary-dark mb-2">
                Réservation sécurisée
              </h3>
              <p className="text-gray-600">
                Vos données sont protégées et vos réservations sont garanties.
              </p>
            </div>

            {/* Feature: Support */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-5xl text-primary-light mb-4 flex justify-center">
                <FaHeadset />
              </div>
              <h3 className="text-xl font-bold text-primary-dark mb-2">
                Support 24/7
              </h3>
              <p className="text-gray-600">
                Notre équipe est disponible pour répondre à toutes vos questions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- Middle CTA Section --- */}
      {/* High-contrast conversion block */}
      <div className="bg-primary-dark text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à réserver votre véhicule ?
          </h2>
          <p className="text-xl mb-8">
            Rejoignez des centaines de clients satisfaits
          </p>
          <Link
            to="/vehicles"
            className="bg-primary-light hover:bg-opacity-90 text-white px-8 py-3 rounded-lg font-bold text-lg transition inline-block"
          >
            Commencer maintenant
          </Link>
        </div>
      </div>

      {/* --- Stats Section --- */}
      {/* Social proof and trust building metrics */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-light mb-2">50+</div>
              <div className="text-gray-600">Véhicules disponibles</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-light mb-2">500+</div>
              <div className="text-gray-600">Clients satisfaits</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-light mb-2">24/7</div>
              <div className="text-gray-600">Support client</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-light mb-2">5★</div>
              <div className="text-gray-600">Note moyenne</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};