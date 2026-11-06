import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { isAuthenticated, logoutUser } from './api/auth';
import { AuthForm } from './components/AuthForm';
import { Navbar } from './components/Navbar';
import { AdminView } from './pages/AdminView';
import { PublicView } from './pages/PublicView';

export function App() {
  const [isAuth, setIsAuth] = useState<boolean>(isAuthenticated());

  const handleLogout = () => {
    logoutUser();
    setIsAuth(false);
  };

  return (
    <BrowserRouter>
      <Box minH="100vh" bg="bg.canvas">
        <Navbar isAuth={isAuth} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<PublicView />} />
          <Route
            path="/admin"
            element={isAuth ? <AdminView /> : <AuthForm onSuccess={() => setIsAuth(true)} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </BrowserRouter>
  );
}

export default App;
