import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaCar, FaUser, FaSignOutAlt, FaSignInAlt,
  FaTachometerAlt, FaCaretDown, FaBars, FaTimes,
} from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../i18n';
import { useState, useRef, useEffect } from 'react';

export const Navbar = () => {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const { t, lang, setLang } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };

  /**
   * Classe commune pour chaque lien desktop.
   * min-w-[90px] + text-center : le lien occupe toujours le même espace
   * même quand le texte est plus court en anglais → pas de shift visuel.
   */
  const navLink = `
    min-w-[90px] text-center
    inline-flex items-center justify-center
    px-2 py-1 rounded-lg
    hover:text-primary-light hover:bg-white/10
    transition-colors font-medium text-sm
  `;

  return (
    <nav className="bg-primary-dark text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">

          {/* Brand */}
          <Link to="/"
            className="flex items-center space-x-2 text-xl font-bold hover:text-primary-light transition-colors shrink-0">
            <FaCar className="text-2xl text-primary-light" />
            <span className="tracking-tight hidden sm:inline">GIA Vehicle Booking</span>
            <span className="tracking-tight sm:hidden">GIA</span>
          </Link>

          {/* ── Desktop links ── */}
          <div className="hidden md:flex items-center gap-1">

            {/* Vehicles link — largeur fixe */}
            <Link to="/vehicles" className={navLink}>
              {t('nav.vehicles')}
            </Link>

            {/* Sélecteur de langue — taille fixe */}
            <button
              onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
              className="w-[52px] text-center text-xs font-bold bg-white/10 hover:bg-white/20 px-2 py-1.5 rounded-lg transition"
              title="Switch language"
            >
              {lang === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}
            </button>

            {isAuthenticated ? (
              <>
                {/* Dashboard link — largeur fixe */}
                <Link to={isAdmin ? '/admin' : '/dashboard'} className={navLink}>
                  <FaTachometerAlt className="mr-1.5 shrink-0" />
                  <span>{t('nav.dashboard')}</span>
                </Link>

                {/* Profile dropdown */}
                <div className="relative ml-1" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1.5 hover:bg-white/10 px-2 py-1 rounded-full transition-all"
                  >
                    <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center font-bold border border-white/20 text-sm">
                      {user?.firstName?.charAt(0) || <FaUser />}
                    </div>
                    <FaCaretDown className={`text-xs transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-gray-500 truncate mb-1">{user?.email}</p>
                        {isAdmin && (
                          <span className="inline-block text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                            ADMINISTRATOR
                          </span>
                        )}
                      </div>
                      <Link to={isAdmin ? '/admin' : '/dashboard'}
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setDropdownOpen(false)}>
                        <FaTachometerAlt className="mr-3 text-gray-400" />
                        {t('nav.dashboard')}
                      </Link>
                      <button onClick={() => { setDropdownOpen(false); handleLogout(); }}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-50">
                        <FaSignOutAlt className="mr-3" />
                        {t('nav.logout')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1 ml-1">
                {/* Login — largeur fixe */}
                <Link to="/login" className={navLink}>
                  <FaSignInAlt className="mr-1.5 shrink-0" />
                  <span>{t('nav.login')}</span>
                </Link>
                {/* Register — largeur fixe via min-w */}
                <Link to="/register"
                  className="min-w-[90px] text-center bg-primary-light hover:bg-opacity-90 px-4 py-2 rounded-lg transition-all font-bold text-sm shadow-md active:scale-95">
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>

          {/* ── Mobile: lang + hamburger ── */}
          <div className="flex md:hidden items-center gap-2">
            <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
              className="text-xs font-bold bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition">
              {lang === 'fr' ? '🇬🇧' : '🇫🇷'}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg hover:bg-white/10 transition" aria-label="Toggle menu">
              {mobileOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="md:hidden bg-primary-dark border-t border-white/10 px-4 pb-4 space-y-1">
          {isAuthenticated && (
            <div className="flex items-center gap-3 py-3 border-b border-white/10 mb-2">
              <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center font-bold text-white text-sm">
                {user?.firstName?.charAt(0) || <FaUser />}
              </div>
              <div>
                <p className="font-semibold text-sm">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-white/60">{user?.email}</p>
                {isAdmin && (
                  <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-bold">ADMIN</span>
                )}
              </div>
            </div>
          )}

          <Link to="/vehicles"
            className="flex items-center py-2.5 px-2 rounded-lg hover:bg-white/10 transition font-medium">
            <FaCar className="mr-3 text-primary-light" />{t('nav.vehicles')}
          </Link>

          {isAuthenticated ? (
            <>
              <Link to={isAdmin ? '/admin' : '/dashboard'}
                className="flex items-center py-2.5 px-2 rounded-lg hover:bg-white/10 transition font-medium">
                <FaTachometerAlt className="mr-3 text-primary-light" />{t('nav.dashboard')}
              </Link>
              <button onClick={handleLogout}
                className="w-full flex items-center py-2.5 px-2 rounded-lg hover:bg-red-500/20 text-red-300 transition font-medium">
                <FaSignOutAlt className="mr-3" />{t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login"
                className="flex items-center py-2.5 px-2 rounded-lg hover:bg-white/10 transition font-medium">
                <FaSignInAlt className="mr-3 text-primary-light" />{t('nav.login')}
              </Link>
              <Link to="/register"
                className="block text-center mt-2 bg-primary-light hover:bg-opacity-90 px-5 py-2.5 rounded-lg font-bold transition">
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};
