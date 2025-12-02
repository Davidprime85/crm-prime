import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { AttendantDashboard } from './pages/AttendantDashboard';
import { ClientDashboard } from './pages/ClientDashboard';
import { Layout } from './components/Layout';
import { authService } from './services/authService';
import { User } from './types';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (e) {
        console.error("Auth init error", e);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const handleLogin = (user: User) => {
    setUser(user);
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="animate-spin text-amber-500" size={40} />
          <p className="text-slate-500 font-medium">Conectando ao Prime CRM...</p>
        </div>
      </div>
    );
  }

  // Route helper to determine dashboard based on role
  const DashboardRouter = () => {
    if (!user) return <Navigate to="/login" />;

    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'attendant':
        return <AttendantDashboard />;
      case 'client':
        return <ClientDashboard />;
      default:
        return <Navigate to="/login" />;
    }
  };

  const SettingsRouter = () => {
    if (!user) return <Navigate to="/login" />;
    if (user.role !== 'admin') return <Navigate to="/" />;
    return <AdminDashboard initialTab="settings" />;
  };

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/login"
          element={!user ? <Login onLoginSuccess={handleLogin} /> : <Navigate to="/" />}
        />

        {/* Root Redirect Logic */}
        <Route
          path="/"
          element={
            user ? (
              user.role === 'admin' ? <Navigate to="/admin" /> :
                user.role === 'attendant' ? <Navigate to="/attendant" /> :
                  <Navigate to="/client" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Explicit Routes */}
        <Route
          path="/admin"
          element={
            user && user.role === 'admin' ? (
              <Layout user={user} onLogout={handleLogout}>
                <AdminDashboard />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/attendant"
          element={
            user && user.role === 'attendant' ? (
              <Layout user={user} onLogout={handleLogout}>
                <AttendantDashboard />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/client"
          element={
            user && user.role === 'client' ? (
              <Layout user={user} onLogout={handleLogout}>
                <ClientDashboard />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* Legacy/Alias Routes */}
        <Route path="/processes" element={<Navigate to="/client" />} />

        <Route
          path="/settings"
          element={
            user ? (
              <Layout user={user} onLogout={handleLogout}>
                <SettingsRouter />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </HashRouter>
  );
};

export default App;