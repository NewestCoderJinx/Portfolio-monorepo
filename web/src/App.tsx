import { useEffect, useState, type FormEvent } from 'react';
import { getProjects, type Project } from './api/projectstate.ts';

export function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const fetchProjects = () => {
    setLoading(true);
    getProjects()
      .then((data) => setProjects(data))
      .catch((err) => console.error('Error fetching projects:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      // Create project via API POST request
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, imageUrl }),
      });
      if (!res.ok) throw new Error('Failed to create project');
      setTitle('');
      setDescription('');
      setImageUrl('');
      fetchProjects(); // Refresh the list after adding
    } catch (err) {
      console.error('Error creating project:', err);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>Portfolio Projects</h1>

      {/* Creation Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Add New Project</h3>
        <input 
          type="text" 
          placeholder="Project Title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          required 
          style={{ padding: '0.5rem' }}
        />
        <textarea 
          placeholder="Description" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          style={{ padding: '0.5rem', minHeight: '80px' }}
        />
        <input 
          type="text" 
          placeholder="Image URL (optional)" 
          value={imageUrl} 
          onChange={(e) => setImageUrl(e.target.value)} 
          style={{ padding: '0.5rem' }}
        />
        <button type="submit" style={{ padding: '0.75rem', cursor: 'pointer' }}>
          Create Project
        </button>
      </form>

      {/* Projects List */}
      {loading ? (
        <p style={{ textAlign: 'center' }}>Loading projects...</p>
      ) : projects.length === 0 ? (
        <p style={{ textAlign: 'center' }}>No projects found yet. Use the form above to add one!</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {projects.map((p) => (
            <div key={p.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem' }}>
              <h4>{p.title}</h4>
              <p>{p.description || 'No description provided.'}</p>
              {p.imageUrl && <img src={p.imageUrl} alt={p.title} style={{ width: '100%', borderRadius: '4px' }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;