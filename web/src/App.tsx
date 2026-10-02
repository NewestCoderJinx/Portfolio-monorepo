import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AdminView } from './pages/AdminView'; 
import { AuthForm } from './components/AuthForm';
import { isAuthenticated, logoutUser } from './api/auth';
import { useState } from 'react';
import { PublicView } from './pages/PublicView';

// ... inside <Routes>
<Route path="/" element={<PublicView />} />
export function App() {
  const [isAuth, setIsAuth] = useState<boolean>(isAuthenticated());

  const handleLogout = () => {
    logoutUser();
    setIsAuth(false);
  };

  return (
    <BrowserRouter>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#1e40af', fontSize: '1.25rem', fontWeight: 'bold' }}>
          DevPortfolio
        </Link>

        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#334155', fontWeight: 500 }}>
            Public View
          </Link>
          <Link to="/admin" style={{ textDecoration: 'none', color: '#334155', fontWeight: 500 }}>
            Admin
          </Link>
          {isAuth && (
            <button
              onClick={handleLogout}
              style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
            >
              Logout
            </button>
          )}
        </nav>
      </header>
      <div style={{ padding: '2rem' }}>
        {/* Routes */}
        <Routes>
          <Route path="/" element={<div style={{ padding: '2rem', textAlign: 'center' }}>Public Portfolio View</div>} />
          <Route
            path="/admin"
            element={isAuth ? <AdminView /> : <AuthForm onSuccess={() => setIsAuth(true)} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;