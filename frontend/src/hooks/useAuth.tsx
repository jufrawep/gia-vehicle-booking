import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { AuthContextType } from '../types';

/**
 * Custom hook to access the Authentication Context.
 * Provides easy access to user state, login, logout, and registration methods
 * throughout the component tree.
 * * @returns {AuthContextType} The authentication state and methods.
 * @throws {Error} If used outside of an AuthProvider.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};