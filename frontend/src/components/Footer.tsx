import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { newsletterAPI } from '../services/api';
import { useTranslation } from '../i18n';

export const Footer = () => {
  const { lang } = useTranslation();
  const fr = lang === 'fr';

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [submitting,      setSubmitting]      = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await newsletterAPI.subscribe(newsletterEmail);
      toast.success(fr
        ? 'Inscription réussie ! Vérifiez votre email.'
        : 'Subscription successful! Check your email.');
      setNewsletterEmail('');
    } catch (error: any) {
      toast.error(error.response?.data?.message
        || (fr ? 'Erreur lors de l\'inscription' : 'Subscription error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-primary-dark text-white mt-auto border-t border-white/10">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

          {/* À propos */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-primary-light">GIA Vehicle Booking</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {fr
                ? 'Votre partenaire de confiance pour la location de véhicules premium au Cameroun. Nous proposons des solutions de mobilité professionnelles et personnelles adaptées à vos besoins.'
                : 'Your trusted partner for premium vehicle rentals in Cameroon. We provide high-quality fleet solutions tailored to your professional and personal mobility needs.'}
            </p>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-primary-light">
              {fr ? 'Nous contacter' : 'Contact Us'}
            </h3>
            <div className="space-y-3 text-sm text-gray-400">
              {[
                { icon: FaMapMarkerAlt, text: 'Douala, Cameroun' },
                { icon: FaPhone,        text: '+237 672 96 97 99' },
                { icon: FaEnvelope,     text: 'gia@giagroup.net' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 group cursor-pointer">
                  <Icon className="text-primary-light group-hover:scale-110 transition-transform shrink-0" />
                  <span className="group-hover:text-white transition-colors">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Newsletter + Réseaux */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-4 text-primary-light">
                {fr ? 'Suivez-nous' : 'Follow Us'}
              </h3>
              <div className="flex gap-4">
                {[FaFacebook, FaTwitter, FaInstagram, FaLinkedin].map((Icon, i) => (
                  <a key={i} href="#"
                    className="text-xl text-gray-400 hover:text-primary-light hover:-translate-y-1 transition-all duration-200">
                    <Icon />
                  </a>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
                Newsletter
              </h4>
              <form onSubmit={handleNewsletterSubmit} className="flex">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={fr ? 'Votre email' : 'Your email'}
                  required
                  className="flex-1 px-4 py-2 rounded-l-lg text-gray-900 text-sm focus:ring-2 focus:ring-primary-light outline-none"
                />
                <button type="submit" disabled={submitting}
                  className="bg-primary-light hover:bg-opacity-90 px-5 py-2 rounded-r-lg transition-all flex items-center justify-center disabled:opacity-50"
                  title={fr ? 'S\'abonner' : 'Subscribe'}>
                  {submitting
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <FaEnvelope />}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bas de page légal */}
        <div className="border-t border-gray-800 mt-10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} GIA Group. {fr ? 'Tous droits réservés.' : 'All rights reserved.'}</p>
          <div className="flex gap-6">
            {[
              { fr: 'Confidentialité', en: 'Privacy Policy' },
              { fr: 'Conditions d\'utilisation', en: 'Terms of Service' },
              { fr: 'Cookies', en: 'Cookie Policy' },
            ].map(item => (
              <a key={item.en} href="#" className="hover:text-white transition-colors">
                {fr ? item.fr : item.en}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
