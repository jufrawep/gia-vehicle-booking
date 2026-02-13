/**
 * @file  context/AuthContext.tsx
 * @desc  Authentication context — session management and JWT persistence.
 *
 * Corrections:
 *   - isAdmin: user.role === 'ADMIN' (UPPERCASE) au lieu de 'admin'
 *   - navigate uses 'ADMIN' UPPERCASE comparison
 *   - Logs ajoutés sur login/logout/register
 */

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI } from '../services/api';
import { User, AuthContextType, RegisterData } from '../types';
import { logger } from '../utils/logger';

const CTX = 'AuthContext';

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate              = useNavigate();

  const logout = useCallback(() => {
    logger.info(CTX, 'User logged out');
    setUser(null);
    localStorage.removeItem('token');
    if (window.location.pathname !== '/login') {
      navigate('/login');
    }
  }, [navigate]);

  // Verify existing token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await authAPI.getMe();
        const userData = res.data.data.user;
        setUser(userData);
        logger.info(CTX, 'Session restored', { userId: userData.id, role: userData.role });
      } catch {
        logger.warn(CTX, 'Session token invalid — clearing');
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    logger.info(CTX, 'Login attempt', { email });
    const res = await authAPI.login({ email, password });
    const { user: userData, token } = res.data.data;

    localStorage.setItem('token', token);
    setUser(userData);

    logger.info(CTX, 'Login successful', { userId: userData.id, role: userData.role });
    toast.success(`Bienvenue, ${userData.firstName} !`);

    // UPPERCASE comparison — matches JWT payload
    navigate(userData.role === 'ADMIN' ? '/admin' : '/dashboard');
  };

  const register = async (data: RegisterData) => {
    logger.info(CTX, 'Register attempt', { email: data.email });
    const res = await authAPI.register(data);
    const { user: userData, token } = res.data.data;

    localStorage.setItem('token', token);
    setUser(userData);

    logger.info(CTX, 'Registration successful', { userId: userData.id });
    toast.success(`Bienvenue, ${userData.firstName} !`);
    navigate('/dashboard');
  };

  const value: AuthContextType = {
    user,
    token:           localStorage.getItem('token'),
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin:         user?.role === 'ADMIN',  // FIXED: UPPERCASE
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
