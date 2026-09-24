import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicView } from './pages/PublicView';
import AdminView from './pages/AdminView';
import { LoginView } from './pages/LoginView';
import type { JSX } from 'react/jsx-runtime';
function isAuthenticated() {
  return Boolean(localStorage.getItem('token'));
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicView />} />
        <Route path="/login" element={<LoginView />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminView />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;