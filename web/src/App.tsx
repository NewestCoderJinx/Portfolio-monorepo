import { useEffect, useState, type FormEvent } from 'react';
import { 
  getProjects, 
  createProject, 
  updateProject, 
  deleteProject, 
  type Project 
} from './api/projectstate';

export function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form state for creating projects
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

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

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await createProject({ title, description, imageUrl });
      setTitle('');
      setDescription('');
      setImageUrl('');
      fetchProjects();
    } catch (err) {
      console.error('Error creating project:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  const startEditing = (project: Project) => {
    setEditingId(project.id);
    setEditTitle(project.title);
    setEditDescription(project.description || '');
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateProject(id, { title: editTitle, description: editDescription });
      setEditingId(null);
      fetchProjects();
    } catch (err) {
      console.error('Error updating project:', err);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>Portfolio Projects</h1>

      {/* Creation Form */}
      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
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
          style={{ padding: '0.5rem', minHeight: '60px' }}
        />
        <input 
          type="text" 
          placeholder="Image URL (optional)" 
          value={imageUrl} 
          onChange={(e) => setImageUrl(e.target.value)} 
          style={{ padding: '0.5rem' }}
        />
        <button type="submit" style={{ padding: '0.5rem', cursor: 'pointer' }}>Create Project</button>
      </form>

      {/* Projects Grid */}
      {loading ? (
        <p style={{ textAlign: 'center' }}>Loading projects...</p>
      ) : projects.length === 0 ? (
        <p style={{ textAlign: 'center' }}>No projects found.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {projects.map((p) => (
            <div key={p.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {editingId === p.id ? (
                /* Edit Mode View */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    value={editTitle} 
                    onChange={(e) => setEditTitle(e.target.value)} 
                    style={{ padding: '0.4rem' }}
                  />
                  <textarea 
                    value={editDescription} 
                    onChange={(e) => setEditDescription(e.target.value)} 
                    style={{ padding: '0.4rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button onClick={() => handleUpdate(p.id)} style={{ flex: 1, padding: '0.3rem', cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: '0.3rem', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                /* Standard Card View */
                <>
                  <div>
                    <h4>{p.title}</h4>
                    <p style={{ fontSize: '0.9rem', color: '#555' }}>{p.description || 'No description provided.'}</p>
                    {p.imageUrl && <img src={p.imageUrl} alt={p.title} style={{ width: '100%', borderRadius: '4px' }} />}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button onClick={() => startEditing(p)} style={{ flex: 1, padding: '0.4rem', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleDelete(p.id)} style={{ flex: 1, padding: '0.4rem', backgroundColor: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;