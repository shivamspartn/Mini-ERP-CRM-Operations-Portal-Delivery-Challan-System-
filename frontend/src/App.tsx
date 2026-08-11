import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard'; // 👈 Added
import { Customers } from './pages/Customers';
import { Inventory } from './pages/Inventory';
import { Challans } from './pages/Challans';

const NavigationHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navLinkStyle = (path: string) => ({
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '600',
    color: location.pathname === path ? '#2563eb' : '#4b5563',
    backgroundColor: location.pathname === path ? '#eff6ff' : 'transparent',
  });

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb', backgroundColor: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>🚀 Mini ERP + CRM</h2>
        <nav style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/dashboard" style={navLinkStyle('/dashboard')}>📊 Dashboard</Link>
          <Link to="/customers" style={navLinkStyle('/customers')}>🏢 Customers</Link>
          <Link to="/inventory" style={navLinkStyle('/inventory')}>📦 Inventory</Link>
          <Link to="/challans" style={navLinkStyle('/challans')}>📄 Challans</Link>
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
          <strong>{user?.name}</strong> (<span style={{ fontWeight: 'bold', color: '#1e40af' }}>{user?.role}</span>)
        </span>
        <button onClick={logout} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.875rem' }}>
          Logout
        </button>
      </div>
    </header>
  );
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>
    <NavigationHeader />
    <main>{children}</main>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
            <Route path="/customers" element={<MainLayout><Customers /></MainLayout>} />
            <Route path="/inventory" element={<MainLayout><Inventory /></MainLayout>} />
            <Route path="/challans" element={<MainLayout><Challans /></MainLayout>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;