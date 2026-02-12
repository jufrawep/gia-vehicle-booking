import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader } from './Loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

/**
 * Higher-Order Component (HOC) to manage route access based on authentication status and user roles.
 * It prevents unauthenticated users or non-admin users from accessing restricted application paths.
 */
export const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  /**
   * Prevents premature redirection by displaying a loader while the 
   * authentication state is being initialized (e.g., during token verification)
   */
  if (loading) {
    return <Loader />;
  }

  /**
   * Unauthorized access check:
   * If the user is not logged in, redirect to the login page.
   * 'replace' is used to prevent the login page from being added to the history stack.
   */
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  /**
   * Role-based access check:
   * If the route is restricted to admins and the current user lacks administrative 
   * privileges, redirect to the standard user dashboard.
   */
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  /**
   * Access granted: 
   * Render the protected component tree
   */
  return <>{children}</>;
};