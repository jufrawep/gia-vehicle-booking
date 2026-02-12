import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { FaEnvelope, FaLock } from "react-icons/fa";

/**
 * Login Component
 * Handles user authentication by interfacing with the AuthContext.
 * Includes a form for credentials and a helpful section for test accounts.
 */
export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  /**
   * Processes the login submission
   * @param e React Form Event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // The login function from useAuth handles redirection and state updates
      await login(email, password);
    } catch (error) {
      // Errors are typically caught and displayed via toast within the auth hook,
      // but we log here for debugging purposes.
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Main Login Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-primary-dark">Connexion</h2>
            <p className="text-gray-600 mt-2">Connectez-vous à votre compte</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Password Recovery Link */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-primary-light hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-dark text-white py-3 rounded-lg font-bold hover:bg-primary-light transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          {/* Test Accounts Info Box */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm border border-blue-100">
            <p className="font-semibold text-primary-dark mb-2">
              Comptes de test :
            </p>
            <p className="text-gray-700">
              <strong>Admin:</strong> admin@giagroup.net / admin123
            </p>
            <p className="text-gray-700">
              <strong>User:</strong> jean.dupont@example.com / user123
            </p>
          </div>

          {/* Navigation to Registration */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Vous n'avez pas de compte ?{" "}
              <Link
                to="/register"
                className="text-primary-light font-bold hover:underline"
              >
                Inscrivez-vous
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};