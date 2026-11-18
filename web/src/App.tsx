import { lazy, Suspense, useEffect, useState } from 'react';
import { Box, Center, SkipNavLink, Spinner } from '@chakra-ui/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { getToken, isAuthenticated, logoutUser, SESSION_EXPIRED_EVENT, signOut, tokenExpiry } from './api/auth';
import { Navbar } from './components/Navbar';
import { PublicView } from './pages/PublicView';

// Only the home page is in the main bundle; other pages load when first visited.
const AuthForm = lazy(() => import('./components/AuthForm').then((m) => ({ default: m.AuthForm })));
const AdminView = lazy(() => import('./pages/AdminView').then((m) => ({ default: m.AdminView })));
const BlogListView = lazy(() => import('./pages/BlogListView').then((m) => ({ default: m.BlogListView })));
const BlogPostView = lazy(() => import('./pages/BlogPostView').then((m) => ({ default: m.BlogPostView })));
const NotFoundView = lazy(() => import('./pages/NotFoundView').then((m) => ({ default: m.NotFoundView })));
const ResumeView = lazy(() => import('./pages/ResumeView').then((m) => ({ default: m.ResumeView })));
const TestimonialRequestView = lazy(() =>
  import('./pages/TestimonialRequestView').then((m) => ({ default: m.TestimonialRequestView })),
);

const pageLoading = (
  <Center py={24}>
    <Spinner color="fg.brand" label="Loading page" />
  </Center>
);

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
    void signOut();
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
        {/* Fixed and above the sticky navbar, which would otherwise cover it when it appears on focus. */}
        <SkipNavLink id="main" position="fixed" zIndex="skipLink">
          Skip to content
        </SkipNavLink>
        <Navbar isAuth={isAuth} onLogout={handleLogout} />
        {/* tabIndex lets the skip link move keyboard focus here, not just scroll. */}
        <Box as="main" id="main" tabIndex={-1} _focus={{ outline: 'none' }}>
          <Suspense fallback={pageLoading}>
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
              <Route path="*" element={<NotFoundView />} />
            </Routes>
          </Suspense>
        </Box>
      </Box>
    </BrowserRouter>
  );
}

export default App;
