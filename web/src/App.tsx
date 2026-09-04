import { useEffect, useState } from 'react';
import { getProjects } from './api/projects';
import type { Project } from './api/projects';

export function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    getProjects()
      .then((data) => setProjects(data))
      .catch((err) => console.error('Error fetching projects:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Portfolio Projects</h1>
      {loading ? (
        <p>Loading projects...</p>
      ) : projects.length === 0 ? (
        <p>No projects found yet. Add one via Swagger UI or POST request!</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
          {projects.map((project) => (
            <div key={project.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem' }}>
              <h3>{project.title}</h3>
              <p>{project.description || 'No description provided.'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;