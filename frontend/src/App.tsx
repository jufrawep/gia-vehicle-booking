import { Routes, Route }   from 'react-router-dom';
import { AuthProvider }     from './context/AuthContext';
import { LangProvider }     from './i18n';              // ← Context global de langue
import { Navbar }           from './components/Navbar';
import { Footer }           from './components/Footer';
import { ProtectedRoute }   from './components/ProtectedRoute';

// Pages
import { Home }           from './pages/Home';
import { Login }          from './pages/Login';
import { Register }       from './pages/Register';
import { Vehicles }       from './pages/Vehicles';
import { VehicleDetails } from './pages/VehicleDetails';
import { Dashboard }      from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword }  from './pages/ResetPassword';
import { NotFound }       from './pages/NotFound';

function App() {
  return (
    // LangProvider DOIT être le premier wrapper :
    // tous les composants enfants partagent le même état `lang`,
    // donc setLang() dans la Navbar re-rend IMMÉDIATEMENT tout l'arbre.
    <LangProvider>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Navbar />

          <main className="flex-grow">
            <Routes>
              {/* ── Public ── */}
              <Route path="/"                element={<Home />} />
              <Route path="/login"           element={<Login />} />
              <Route path="/register"        element={<Register />} />
              <Route path="/vehicles"        element={<Vehicles />} />
              <Route path="/vehicles/:id"    element={<VehicleDetails />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password"  element={<ResetPassword />} />

              {/* ── Protected — User ── */}
              <Route path="/dashboard" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              } />

              {/* ── Protected — Admin ── */}
              <Route path="/admin" element={
                <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
              } />

              {/* ── 404 ── */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </AuthProvider>
    </LangProvider>
  );
}

export default App;
