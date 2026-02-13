import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaEye, FaEyeSlash, FaChevronDown } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { PasswordStrength } from '../components/PasswordStrength';
import { useTranslation } from '../i18n';
import { logger } from '../utils/logger';

const CTX = 'Register';

// ─── Country codes ────────────────────────────────────────────────────────────
const COUNTRY_CODES = [
  { code: '+237', flag: '🇨🇲', name: 'Cameroun',       placeholder: '6XX XXX XXX' },
  { code: '+33',  flag: '🇫🇷', name: 'France',          placeholder: '6 XX XX XX XX' },
  { code: '+1',   flag: '🇺🇸', name: 'USA / Canada',    placeholder: '(XXX) XXX-XXXX' },
  { code: '+44',  flag: '🇬🇧', name: 'Royaume-Uni',     placeholder: '7XXX XXX XXX' },
  { code: '+49',  flag: '🇩🇪', name: 'Allemagne',       placeholder: '1XX XXXXXXXX' },
  { code: '+34',  flag: '🇪🇸', name: 'Espagne',         placeholder: '6XX XXX XXX' },
  { code: '+39',  flag: '🇮🇹', name: 'Italie',          placeholder: '3XX XXX XXXX' },
  { code: '+32',  flag: '🇧🇪', name: 'Belgique',        placeholder: '4XX XX XX XX' },
  { code: '+41',  flag: '🇨🇭', name: 'Suisse',          placeholder: '7X XXX XX XX' },
  { code: '+212', flag: '🇲🇦', name: 'Maroc',           placeholder: '6XX XXX XXX' },
  { code: '+225', flag: '🇨🇮', name: 'Côte d\'Ivoire',  placeholder: 'XX XXX XXX' },
  { code: '+221', flag: '🇸🇳', name: 'Sénégal',         placeholder: '7X XXX XX XX' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria',         placeholder: '7XX XXX XXXX' },
  { code: '+27',  flag: '🇿🇦', name: 'Afrique du Sud',  placeholder: '6X XXX XXXX' },
];

export const Register = () => {
  const { t } = useTranslation();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    firstName:       '',
    lastName:        '',
    email:           '',
    phone:           '',
    password:        '',
    confirmPassword: '',
  });
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [countryDropdown, setCountryDropdown] = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm,  setShowConfirm]        = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.info(CTX, 'Submit attempt', { email: formData.email });

    // Validations
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error(t('validation.email')); return;
    }
    if (formData.phone) {
      const raw = formData.phone.replace(/\s/g, '');
      if (!/^\d{6,14}$/.test(raw)) {
        toast.error(t('validation.phone')); return;
      }
    }
    if (formData.password.length < 8)                              { toast.error(t('validation.password_min'));  return; }
    if (!/[a-z]/.test(formData.password) || !/[A-Z]/.test(formData.password)) { toast.error(t('validation.password_case')); return; }
    if (!/\d/.test(formData.password))                             { toast.error(t('validation.password_num'));  return; }
    if (!/[^a-zA-Z0-9]/.test(formData.password))                  { toast.error(t('validation.password_spec')); return; }
    if (formData.password !== formData.confirmPassword)            { toast.error(t('validation.password_match')); return; }

    setLoading(true);
    try {
      const phone = formData.phone
        ? `${selectedCountry.code}${formData.phone.replace(/\s/g, '')}`
        : undefined;

      await register({
        firstName: formData.firstName,
        lastName:  formData.lastName,
        email:     formData.email,
        phone,
        password:  formData.password,
      });
      logger.info(CTX, 'Registration successful');
    } catch (error: any) {
      logger.error(CTX, 'Registration failed', { error: error?.response?.data?.message });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent transition';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-primary-dark">{t('auth.register.title')}</h2>
            <p className="text-gray-500 mt-1">{t('auth.register.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* First + Last name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{t('auth.register.firstname')}</label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-3 text-gray-400" />
                  <input type="text" name="firstName" value={formData.firstName}
                    onChange={handleChange} className={inputClass} placeholder="Jean" required />
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('auth.register.lastname')}</label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-3 text-gray-400" />
                  <input type="text" name="lastName" value={formData.lastName}
                    onChange={handleChange} className={inputClass} placeholder="Dupont" required />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className={labelClass}>{t('auth.register.email')}</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                <input type="email" name="email" value={formData.email}
                  onChange={handleChange} className={inputClass}
                  placeholder="jean.dupont@example.com" required />
              </div>
            </div>

            {/* Phone with country code selector */}
            <div>
              <label className={labelClass}>
                {t('auth.register.phone')}
              </label>
              <div className="flex gap-2">

                {/* Country code dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCountryDropdown(!countryDropdown)}
                    className="flex items-center gap-1.5 h-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition text-sm font-medium whitespace-nowrap"
                  >
                    <span className="text-lg">{selectedCountry.flag}</span>
                    <span className="text-gray-700">{selectedCountry.code}</span>
                    <FaChevronDown className={`text-xs text-gray-400 transition-transform ${countryDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {countryDropdown && (
                    <div className="absolute left-0 top-full mt-1 w-60 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                      {COUNTRY_CODES.map((c) => (
                        <button
                          key={c.code + c.name}
                          type="button"
                          onClick={() => { setSelectedCountry(c); setCountryDropdown(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm transition ${selectedCountry.code === c.code && selectedCountry.name === c.name ? 'bg-primary-light/10 font-semibold' : ''}`}
                        >
                          <span className="text-lg">{c.flag}</span>
                          <span className="text-gray-700 flex-1 text-left">{c.name}</span>
                          <span className="text-gray-400 font-mono">{c.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Phone number input */}
                <div className="relative flex-1">
                  <FaPhone className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder={selectedCountry.placeholder}
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={labelClass}>{t('auth.register.password')}</label>
              <div className="relative">
                <FaLock className="absolute left-3 top-3 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} name="password"
                  value={formData.password} onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent transition"
                  placeholder="••••••••" required minLength={8} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <PasswordStrength password={formData.password} />
            </div>

            {/* Confirm password */}
            <div>
              <label className={labelClass}>{t('auth.register.confirm')}</label>
              <div className="relative">
                <FaLock className="absolute left-3 top-3 text-gray-400" />
                <input type={showConfirm ? 'text' : 'password'} name="confirmPassword"
                  value={formData.confirmPassword} onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent transition"
                  placeholder="••••••••" required minLength={8} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary-dark text-white py-3 rounded-lg font-bold hover:bg-primary-light transition disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {loading ? t('auth.register.loading') : t('auth.register.submit')}
            </button>
          </form>

          <p className="mt-5 text-center text-gray-600 text-sm">
            {t('auth.register.has_account')}{' '}
            <Link to="/login" className="text-primary-light font-bold hover:underline">
              {t('auth.register.login_link')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
