// App.jsx
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar.jsx';
import Footer from './components/Footer/Footer.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import Login from './pages/Login/Login.jsx';
import Reports from './pages/Reports/Reports.jsx';
import Bills from './pages/Bills/Bills.jsx';
import Branches from './pages/Branches/Branches.jsx';
import Settings from './pages/Settings/Settings.jsx';

const RequireAuth = ({ children }) => {
  const token = window.localStorage.getItem('auth_token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isLoginPage && <Navbar />}
      
      <main style={{ flex: 1, paddingTop: isLoginPage ? 0 : 24, paddingBottom: isLoginPage ? 0 : 24 }} className={!isLoginPage ? 'container' : ''}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/bills"
            element={
              <RequireAuth>
                <Bills />
              </RequireAuth>
            }
          />
          <Route
            path="/branches"
            element={
              <RequireAuth>
                <Branches />
              </RequireAuth>
            }
          />
          <Route
            path="/reports"
            element={
              <RequireAuth>
                <Reports />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <Settings />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      {!isLoginPage && <Footer />}
    </div>
  );
}
