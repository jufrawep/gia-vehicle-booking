import { Link, useNavigate } from "react-router-dom";
import {
  FaCar,
  FaUser,
  FaSignOutAlt,
  FaSignInAlt,
  FaTachometerAlt,
  FaCaretDown,
} from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";
import { useState, useRef, useEffect } from "react";

/**
 * Navbar Component
 * Handles main navigation, user authentication state, and profile dropdown.
 */
export const Navbar = () => {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // Local state for profile dropdown visibility
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Effect: Closes dropdown when clicking outside of the component area.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Handles user logout and redirects to home page.
   */
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-primary-dark text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 text-xl font-bold hover:text-primary-light transition-colors"
          >
            <FaCar className="text-2xl text-primary-light" />
            <span className="tracking-tight">GIA Vehicle Booking</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link
              to="/vehicles"
              className="hover:text-primary-light transition-colors font-medium"
            >
              Vehicles
            </Link>

            {isAuthenticated ? (
              <>
                {/* Quick Link to Dashboard */}
                <Link
                  to={isAdmin ? "/admin" : "/dashboard"}
                  className="hidden md:flex items-center space-x-1 hover:text-primary-light transition-colors"
                >
                  <FaTachometerAlt />
                  <span>Dashboard</span>
                </Link>

                {/* Profile Dropdown Menu */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 hover:bg-white/10 p-1 px-2 rounded-full transition-all"
                  >
                    <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center text-white font-bold border border-white/20">
                      {user?.firstName?.charAt(0) || <FaUser />}
                    </div>
                    <FaCaretDown className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Content */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate mb-1">
                          {user?.email}
                        </p>
                        {isAdmin && (
                          <span className="inline-block text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                            ADMINISTRATOR
                          </span>
                        )}
                      </div>

                      {/* Menu Items */}
                      <Link
                        to={isAdmin ? "/admin" : "/dashboard"}
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <FaTachometerAlt className="mr-3 text-gray-400" />
                        My Dashboard
                      </Link>

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-50"
                      >
                        <FaSignOutAlt className="mr-3" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Guest Actions */
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="flex items-center space-x-1 hover:text-primary-light transition-colors font-medium"
                >
                  <FaSignInAlt />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-light hover:bg-opacity-90 px-5 py-2 rounded-lg transition-all font-bold shadow-md active:scale-95"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};