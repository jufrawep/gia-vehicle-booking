import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { newsletterAPI } from '../services/api';

/**
 * Footer Component
 * Provides company information, contact details, social media links, 
 * and a newsletter subscription form.
 */
export const Footer = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /**
   * Handles newsletter subscription requests.
   * @param e - Form event
   */
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await newsletterAPI.subscribe(newsletterEmail);
      toast.success('Subscription successful! Please check your email.');
      setNewsletterEmail('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'An error occurred during subscription');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-primary-dark text-white mt-auto border-t border-white/10">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-primary-light">GIA Vehicle Booking</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your trusted partner for premium vehicle rentals in Cameroon. 
              We provide high-quality fleet solutions tailored to your professional 
              and personal mobility needs.
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-primary-light">Contact Us</h3>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-center space-x-3 group cursor-pointer">
                <FaMapMarkerAlt className="text-primary-light group-hover:scale-110 transition-transform" />
                <span className="group-hover:text-white transition-colors">Douala, Cameroon</span>
              </div>
              <div className="flex items-center space-x-3 group cursor-pointer">
                <FaPhone className="text-primary-light group-hover:scale-110 transition-transform" />
                <span className="group-hover:text-white transition-colors">+237 672 96 97 99</span>
              </div>
              <div className="flex items-center space-x-3 group cursor-pointer">
                <FaEnvelope className="text-primary-light group-hover:scale-110 transition-transform" />
                <span className="group-hover:text-white transition-colors">gia@giagroup.net</span>
              </div>
            </div>
          </div>

          {/* Newsletter & Social Presence */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-4 text-primary-light">Follow Us</h3>
              <div className="flex space-x-5">
                {[FaFacebook, FaTwitter, FaInstagram, FaLinkedin].map((Icon, index) => (
                  <a 
                    key={index} 
                    href="#" 
                    className="text-xl text-gray-400 hover:text-primary-light hover:-translate-y-1 transition-all duration-200"
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>

            {/* Newsletter Form */}
            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Newsletter</h4>
              <form onSubmit={handleNewsletterSubmit} className="flex group">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 px-4 py-2 rounded-l-lg text-gray-900 text-sm focus:ring-2 focus:ring-primary-light outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary-light hover:bg-opacity-90 px-5 py-2 rounded-r-lg transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Subscribe"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FaEnvelope />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Legal Footer */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 space-y-4 md:space-y-0">
          <p>&copy; {new Date().getFullYear()} GIA Group. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};