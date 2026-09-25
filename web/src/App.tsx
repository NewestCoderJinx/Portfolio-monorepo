import { useEffect, useState } from 'react';
import { fetchProjects, type Project } from './api/projects';

export function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects()
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load projects:', err);
        setError('Could not connect to NestJS API');
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Loading projects...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Portfolio Projects</h1>
      {projects.length === 0 ? (
        <p>No projects found in PostgreSQL database.</p>
      ) : (
        <ul>
          {projects.map((proj) => (
            <li key={proj.id}>
              <strong>{proj.title}</strong>: {proj.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;