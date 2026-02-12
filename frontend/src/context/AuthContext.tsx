import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI } from '../services/api';
import { User, AuthContextType, RegisterData } from '../types';

/**
 * Authentication Context to provide security state across the application
 */
export const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Authentication Provider component that manages user sessions and JWT persistence
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /**
   * Clears user session, removes local tokens, and redirects to login if necessary
   */
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('token');
    if (window.location.pathname !== '/login') {
      navigate('/login');
    }
  }, [navigate]);

  /**
   * Initialization on mount: Verify existing token validity with the backend
   */
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await authAPI.getMe();
        setUser(res.data.data.user);
      } catch (error) {
        // Invalid or expired token -> silent cleanup
        // Axios interceptor handles redirects elsewhere; here we just clear local state
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []); // Empty dependency array: runs only once on mount

  /**
   * Authenticates user and initializes the session
   * @param email User credentials
   * @param password User credentials
   */
  const login = async (email: string, password: string) => {
    const res = await authAPI.login({ email, password });
    const { user, token } = res.data.data;

    // 1. Persist the JWT in localStorage
    localStorage.setItem('token', token);

    // 2. Update global state (triggers ProtectedRoute re-renders)
    setUser(user);

    // 3. UI Notification
    toast.success(`Bienvenue, ${user.firstName} !`);

    // 4. Role-based routing logic (supports mixed case roles from backend)
    navigate(user.role === 'admin' || user.role === 'ADMIN' ? '/admin' : '/dashboard');
  };

  /**
   * Registers a new user and signs them in immediately
   * @param data Registration form payload
   */
  const register = async (data: RegisterData) => {
    const res = await authAPI.register(data);
    const { user, token } = res.data.data;

    localStorage.setItem('token', token);
    setUser(user);

    toast.success(`Bienvenue, ${user.firstName} !`);
    navigate('/dashboard');
  };

  /**
   * Context value exported to the useAuth hook
   */
  const value: AuthContextType = {
    user,
    token: localStorage.getItem('token'),
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};