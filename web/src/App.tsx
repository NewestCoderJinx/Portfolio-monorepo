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
  Badge,
  useToast,
  Divider,
} from '@chakra-ui/react';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  type Project,
} from './api/projectstate';

export function App() {
  const [projects, setProjects] = useState<Project[]>([]);
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
      toast({ title: 'Project published!', status: 'success', duration: 3000, isClosable: true });
      fetchProjects();
    } catch (err) {
      toast({ title: 'Failed to create project', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this project?')) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast({ title: 'Project removed', status: 'info', duration: 3000, isClosable: true });
    } catch (err) {
      toast({ title: 'Failed to delete project', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const startEditing = (p: Project) => {
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
      toast({ title: 'Failed to update project', status: 'error', duration: 3000, isClosable: true });
    }
  };

  return (
    <Box bg="gray.50" minH="100vh" py={12}>
      <Container maxW="container.lg">
        <VStack spacing={8} align="stretch">
          
          {/* Header Section */}
          <VStack spacing={2} textAlign="center">
            <Badge colorScheme="blue" px={3} py={1} borderRadius="full" fontSize="xs">
              Developer Workspace
            </Badge>
            <Heading as="h1" size="xl" letterSpacing="tight">
              Portfolio Management
            </Heading>
            <Text color="gray.600">
              Manage your engineering projects stored in PostgreSQL
            </Text>
          </VStack>

          {/* Creation Form Card */}
          <Box as="form" onSubmit={handleCreate} p={6} bg="white" borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="gray.200">
            <Heading as="h2" size="sm" mb={4} color="gray.700">
              Add New Showcase Item
            </Heading>
            <VStack spacing={4}>
              <Input
                placeholder="Project Title (e.g. Developer Portfolio App)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                isRequired
                focusBorderColor="blue.500"
              />
              <Textarea
                placeholder="Short technical description of stack, features, and architecture..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                focusBorderColor="blue.500"
                rows={3}
              />
              <Input
                placeholder="Cover Image URL (optional)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                focusBorderColor="blue.500"
              />
              <Button type="submit" colorScheme="blue" width="full" size="md">
                Publish Project
              </Button>
            </VStack>
          </Box>

          <Divider />

          {/* Projects Display Grid */}
          {loading ? (
            <VStack py={12}>
              <Spinner size="xl" color="blue.500" thickness="3px" />
              <Text color="gray.500" fontSize="sm">Fetching latest records...</Text>
            </VStack>
          ) : projects.length === 0 ? (
            <Box textAlign="center" py={12} bg="white" borderRadius="xl" borderStyle="dashed" borderWidth="2px" borderColor="gray.300">
              <Text color="gray.500">No projects found. Publish your first item using the form above!</Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {projects.map((p) => (
                <Card key={p.id} borderWidth="1px" borderColor="gray.200" borderRadius="xl" overflow="hidden" boxShadow="xs" bg="white">
                  <CardBody p={5}>
                    {editingId === p.id ? (
                      <VStack spacing={3}>
                        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} size="sm" />
                        <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} size="sm" rows={3} />
                        <HStack width="full" pt={2}>
                          <Button colorScheme="green" size="xs" flex={1} onClick={() => handleUpdate(p.id)}>
                            Save
                          </Button>
                          <Button size="xs" flex={1} onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </HStack>
                      </VStack>
                    ) : (
                      <VStack align="start" spacing={3} height="100%" justifyContent="space-between">
                        <Box width="full">
                          {p.imageUrl && (
                            <Image src={p.imageUrl} alt={p.title} borderRadius="lg" maxH="140px" w="full" objectFit="cover" mb={3} />
                          )}
                          <Heading size="sm" color="gray.800">{p.title}</Heading>
                          <Text color="gray.600" fontSize="xs" mt={2} noOfLines={3}>
                            {p.description || 'No description provided.'}
                          </Text>
                        </Box>
                        
                        <HStack width="full" pt={3} borderTopWidth="1px" borderColor="gray.100">
                          <Button size="xs" variant="outline" colorScheme="gray" flex={1} onClick={() => startEditing(p)}>
                            Edit
                          </Button>
                          <Button size="xs" variant="ghost" colorScheme="red" flex={1} onClick={() => handleDelete(p.id)}>
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
    </Box>
  );
}

export default App;