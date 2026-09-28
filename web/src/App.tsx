import { useEffect, useState } from 'react';
import { fetchProjects, Projects } from './api/projects';
import { isAuthenticated, logoutUser } from './api/auth';
import { AuthForm } from './components/AuthForm';

export function App() {
  const [projects, setProjects] = useState<Projects[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuth, setIsAuth] = useState<boolean>(isAuthenticated());

  const loadProjects = () => {
    setLoading(true);
    fetchProjects()
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load projects:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleLogout = () => {
    logoutUser();
    setIsAuth(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Portfolio Projects</h1>
        {isAuth && (
          <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
            Logout
          </button>
        )}
      </header>

      {!isAuth ? (
        <AuthForm onSuccess={() => setIsAuth(true)} />
      ) : (
        <div>
          <p style={{ color: 'green', fontWeight: 'bold' }}>Authenticated successfully!</p>
          {loading ? (
            <p>Loading projects...</p>
          ) : (
            <ul>
              {projects.map((proj) => (
                <li key={proj.id} style={{ marginBottom: '1rem' }}>
                  <strong>{proj.title}</strong>: {proj.description}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default App;