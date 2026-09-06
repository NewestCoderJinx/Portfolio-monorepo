import { useEffect, useState, type FormEvent } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  Input,
  Textarea,
  Button,
  SimpleGrid,
  Card,
  CardBody,
  Text,
  Image,
  HStack,
  Spinner,
  useTabs,
} from '@chakra-ui/react';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  type Projects,
} from './api/projects';

export function App() {
  const [projects, setProjects] = useState<Projects>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const toast = useToast();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Edit state
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
      toast({ title: 'Project created!', status: 'success', duration: 3000, isClosable: true });
      fetchProjects();
    } catch (err) {
      toast({ title: 'Error creating project', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast({ title: 'Project deleted', status: 'info', duration: 3000, isClosable: true });
    } catch (err) {
      toast({ title: 'Error deleting project', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const startEditing = (p: Projects) => {
    setEditingId(p.id);
    setEditTitle(p.title);
    setEditDescription(p.description || '');
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateProject(id, { title: editTitle, description: editDescription });
      setEditingId(null);
      fetchProjects();
      toast({ title: 'Project updated!', status: 'success', duration: 3000, isClosable: true });
    } catch (err) {
      toast({ title: 'Error updating project', status: 'error', duration: 3000, isClosable: true });
    }
  };

  return (
    <Container maxW="container.md" py={10}>
      <VStack gap={8} align="stretch">
        <Heading as="h1" textAlign="center" size="xl">
          Portfolio Projects
        </Heading>

        {/* Creation Form Card */}
        <Box as="form" onSubmit={handleCreate} p={6} bg="white" borderRadius="lg" boxShadow="sm" borderWidth="1px">
          <Heading as="h2" size="md" mb={4}>
            Add New Project
          </Heading>
          <VStack gap={4}>
            <Input
              placeholder="Project Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              placeholder="Image URL (optional)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <Button type="submit" colorScheme="blue" width="full">
              Create Project
            </Button>
          </VStack>
        </Box>

        {/* Projects List */}
        {loading ? (
          <VStack py={10}>
            <Spinner size="xl" color="blue.500" />
            <Text color="gray.500">Loading projects...</Text>
          </VStack>
        ) : projects.length === 0 ? (
          <Text textAlign="center" color="gray.500">
            No projects found. Create one using the form above!
          </Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {projects.map((p) => (
              <Card key={p.id} borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="sm">
                <CardBody>
                  {editingId === p.id ? (
                        <VStack gap={3}>
                      <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                      <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                      <HStack width="full">
                        <Button colorScheme="green" size="sm" flex={1} onClick={() => handleUpdate(p.id)}>
                          Save
                        </Button>
                        <Button size="sm" flex={1} onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </HStack>
                    </VStack>
                  ) : (
                    <VStack align="start" gap={3}>
                      {p.imageUrl && <Image src={p.imageUrl} alt={p.title} borderRadius="md" maxH="160px" w="full" objectFit="cover" />}
                      <Heading size="md">{p.title}</Heading>
                      <Text color="gray.600" fontSize="sm">
                        {p.description || 'No description provided.'}
                      </Text>
                      <HStack width="full" pt={2}>
                        <Button size="sm" flex={1} onClick={() => startEditing(p)}>
                          Edit
                        </Button>
                        <Button size="sm" colorScheme="red" flex={1} onClick={() => handleDelete(p.id)}>
                          Delete
                        </Button>
                      </HStack>
                    </VStack>
                  )}
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </Container>
  );
}

export default App;

function useToast() {
  throw new Error('Function not implemented.');
}
