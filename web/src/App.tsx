import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicView } from './pages/PublicView';
import AdminView from './pages/AdminView';
import { LoginView } from './pages/LoginView';
import Navbar from './components/Navbar';
import { isAuthenticated } from './api/auth';

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function App() {
  return (
    <BrowserRouter>
      <Navbar />
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