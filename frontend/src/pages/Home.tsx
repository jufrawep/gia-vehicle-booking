import { Link } from 'react-router-dom';
import { FaCar, FaShieldAlt, FaHeadset } from 'react-icons/fa';
import { useTranslation } from '../i18n';

export const Home = () => {
  const { lang } = useTranslation();

  const fr = lang === 'fr';

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <div
        className="relative h-[500px] bg-cover bg-center"
        style={{
          backgroundImage: 'linear-gradient(rgba(10,31,68,0.72),rgba(10,31,68,0.72)), url(https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200)',
        }}
      >
        <div className="container mx-auto px-4 h-full flex items-center">
          <div className="text-white max-w-2xl">
            <h1 className="text-5xl font-bold mb-4">
              {fr
                ? 'Louez le véhicule parfait pour votre voyage'
                : 'Rent the perfect vehicle for your journey'}
            </h1>
            <p className="text-xl mb-8">
              {fr
                ? 'Des véhicules de qualité, des prix compétitifs et un service client exceptionnel au Cameroun.'
                : 'Quality vehicles, competitive prices, and exceptional customer service in Cameroon.'}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/vehicles"
                className="bg-primary-light hover:bg-opacity-90 text-white px-8 py-3 rounded-lg font-bold text-lg transition">
                {fr ? 'Voir les véhicules' : 'Browse vehicles'}
              </Link>
              <Link to="/register"
                className="bg-white hover:bg-gray-100 text-primary-dark px-8 py-3 rounded-lg font-bold text-lg transition">
                {fr ? 'Créer un compte' : 'Create account'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-primary-dark mb-12">
            {fr ? 'Pourquoi choisir GIA Vehicle Booking ?' : 'Why choose GIA Vehicle Booking?'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: FaCar,
                title: fr ? 'Large choix de véhicules' : 'Wide vehicle selection',
                desc:  fr
                  ? 'Des véhicules économiques aux modèles de luxe, trouvez celui qui vous convient.'
                  : 'From economy cars to luxury models, find the one that suits you.',
              },
              {
                icon: FaShieldAlt,
                title: fr ? 'Réservation sécurisée' : 'Secure booking',
                desc:  fr
                  ? 'Vos données sont protégées et vos réservations sont garanties.'
                  : 'Your data is protected and your bookings are guaranteed.',
              },
              {
                icon: FaHeadset,
                title: 'Support 24/7',
                desc:  fr
                  ? 'Notre équipe est disponible pour répondre à toutes vos questions.'
                  : 'Our team is available to answer all your questions.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="text-5xl text-primary-light mb-4 flex justify-center">
                  <Icon />
                </div>
                <h3 className="text-xl font-bold text-primary-dark mb-2">{title}</h3>
                <p className="text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="bg-primary-dark text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {fr ? 'Prêt à réserver votre véhicule ?' : 'Ready to book your vehicle?'}
          </h2>
          <p className="text-xl mb-8">
            {fr ? 'Rejoignez des centaines de clients satisfaits' : 'Join hundreds of satisfied customers'}
          </p>
          <Link to="/vehicles"
            className="bg-primary-light hover:bg-opacity-90 text-white px-8 py-3 rounded-lg font-bold text-lg transition inline-block">
            {fr ? 'Commencer maintenant' : 'Get started'}
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '50+',  label: fr ? 'Véhicules disponibles' : 'Available vehicles' },
              { value: '500+', label: fr ? 'Clients satisfaits'    : 'Satisfied customers' },
              { value: '24/7', label: fr ? 'Support client'        : 'Customer support' },
              { value: '5★',   label: fr ? 'Note moyenne'          : 'Average rating' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-4xl font-bold text-primary-light mb-2">{value}</div>
                <div className="text-gray-600">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
