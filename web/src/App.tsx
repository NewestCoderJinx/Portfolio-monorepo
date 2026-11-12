import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { getToken, isAuthenticated, logoutUser, SESSION_EXPIRED_EVENT, tokenExpiry } from './api/auth';
import { AuthForm } from './components/AuthForm';
import { Navbar } from './components/Navbar';
import { AdminView } from './pages/AdminView';
import { BlogListView } from './pages/BlogListView';
import { BlogPostView } from './pages/BlogPostView';
import { PublicView } from './pages/PublicView';
import { ResumeView } from './pages/ResumeView';
import { TestimonialRequestView } from './pages/TestimonialRequestView';

export function App() {
  const [isAuth, setIsAuth] = useState<boolean>(isAuthenticated());
  const [sessionExpired, setSessionExpired] = useState(false);

  // Sign out when the API rejects the token, or as soon as it expires while the page is open.
  useEffect(() => {
    if (!isAuth) return;
    const expire = () => {
      logoutUser();
      setIsAuth(false);
      setSessionExpired(true);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, expire);
    const token = getToken();
    const expiry = token ? tokenExpiry(token) : null;
    // setTimeout can't wait longer than ~24.8 days; longer sessions rely on the API's 401 instead.
    const wait = expiry === null ? null : expiry - Date.now();
    const timer = wait !== null && wait < 2 ** 31 - 1 ? window.setTimeout(expire, Math.max(0, wait)) : undefined;
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, expire);
      window.clearTimeout(timer);
    };
  }, [isAuth]);

  const handleLogout = () => {
    logoutUser();
    setIsAuth(false);
    setSessionExpired(false);
  };

  const handleLogin = () => {
    setIsAuth(true);
    setSessionExpired(false);
  };

  return (
    <BrowserRouter>
      <Box minH="100vh" bg="bg.canvas">
        <Navbar isAuth={isAuth} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<PublicView />} />
          <Route path="/resume" element={<ResumeView />} />
          <Route path="/blog" element={<BlogListView />} />
          <Route path="/blog/:slug" element={<BlogPostView />} />
          <Route path="/testimonial/:token" element={<TestimonialRequestView />} />
          <Route
            path="/admin"
            element={
              isAuth ? (
                <AdminView />
              ) : (
                <AuthForm
                  onSuccess={handleLogin}
                  notice={sessionExpired ? 'Your session expired. Please sign in again.' : undefined}
                />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </BrowserRouter>
  );
}

export default App;
