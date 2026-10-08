import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
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
  Tag,
  Wrap,
  WrapItem,
  Divider,
  FormControl,
  FormLabel,
  useToast,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  uploadProjectImage,
  formatUrl,
  type Project,
} from '../api/projectstate';

export function AdminView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const toast = useToast();

  // Basic Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');

  // Case Study Form state
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [challenges, setChallenges] = useState('');
  const [decisions, setDecisions] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTagsInput, setEditTagsInput] = useState('');
  const [editGithubUrl, setEditGithubUrl] = useState('');
  const [editDemoUrl, setEditDemoUrl] = useState('');
  const [editProblem, setEditProblem] = useState('');
  const [editSolution, setEditSolution] = useState('');
  const [editChallenges, setEditChallenges] = useState('');
  const [editDecisions, setEditDecisions] = useState('');
  const [editLessonsLearned, setEditLessonsLearned] = useState('');

  const fetchProjects = () => {
    setLoading(true);
    getProjects()
      .then((data) => setProjects(data))
      .catch((err) => {
        console.error('Error fetching projects:', err);
        toast({ title: 'Failed to load projects', status: 'error', duration: 3000, isClosable: true });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await uploadProjectImage(file);
      setImageUrl(url);
      toast({ title: 'Image uploaded successfully!', status: 'success', duration: 3000, isClosable: true });
    } catch (err) {
      toast({ title: 'Failed to upload image', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: 'Project title is required', status: 'warning', duration: 3000, isClosable: true });
      return;
    }

    setSubmitting(true);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      await createProject({
        title: title.trim(),
        description: description.trim(),
        problem: problem.trim(),
        solution: solution.trim(),
        challenges: challenges.trim(),
        decisions: decisions.trim(),
        lessonsLearned: lessonsLearned.trim(),
        imageUrl: imageUrl.trim(),
        tags,
        githubUrl: formatUrl(githubUrl),
        demoUrl: formatUrl(demoUrl),
      });

      // Reset form fields
      setTitle('');
      setDescription('');
      setProblem('');
      setSolution('');
      setChallenges('');
      setDecisions('');
      setLessonsLearned('');
      setImageUrl('');
      setTagsInput('');
      setGithubUrl('');
      setDemoUrl('');

      toast({ title: 'Project published!', status: 'success', duration: 3000, isClosable: true });
      fetchProjects();
    } catch (err) {
      toast({ title: 'Failed to create project', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setSubmitting(false);
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
    setEditTagsInput(p.tags ? p.tags.join(', ') : '');
    setEditGithubUrl(p.githubUrl || '');
    setEditDemoUrl(p.demoUrl || '');
    setEditProblem(p.problem || '');
    setEditSolution(p.solution || '');
    setEditChallenges(p.challenges || '');
    setEditDecisions(p.decisions || '');
    setEditLessonsLearned(p.lessonsLearned || '');
  };

  const handleUpdate = async (id: string) => {
    const tags = editTagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      await updateProject(id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        problem: editProblem.trim(),
        solution: editSolution.trim(),
        challenges: editChallenges.trim(),
        decisions: editDecisions.trim(),
        lessonsLearned: editLessonsLearned.trim(),
        tags,
        githubUrl: formatUrl(editGithubUrl),
        demoUrl: formatUrl(editDemoUrl),
      });
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
          
          {/* Header */}
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

          {/* Creation Form */}
          <Box as="form" onSubmit={handleCreate} p={6} bg="white" borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="gray.200">
            <Heading as="h2" size="sm" mb={4} color="gray.700">
              Add New Showcase Item
            </Heading>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>Project Title</FormLabel>
                <Input
                  placeholder="e.g. Microservices Order Processing API"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>Short Summary / Description</FormLabel>
                <Textarea
                  placeholder="Short technical overview..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>Tech Stack Tags</FormLabel>
                <Input
                  placeholder="Comma-separated: React, NestJS, PostgreSQL"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              </FormControl>

              {/* Case Study Accordion */}
              <Accordion allowToggle width="full" borderStyle="none">
                <AccordionItem border="1px" borderColor="gray.200" borderRadius="md">
                  <h2>
                    <AccordionButton bg="gray.50" _expanded={{ bg: 'blue.50', color: 'blue.600' }}>
                      <Box as="span" flex="1" textAlign="left" fontSize="xs" fontWeight="bold">
                        Detailed Technical Case Study (Optional)
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <VStack spacing={3}>
                      <FormControl>
                        <FormLabel fontSize="xs" color="gray.600">The Problem</FormLabel>
                        <Textarea placeholder="What real-world problem did this project address?" value={problem} onChange={(e) => setProblem(e.target.value)} size="sm" rows={2} />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs" color="gray.600">The Solution</FormLabel>
                        <Textarea placeholder="Architectural solution implemented..." value={solution} onChange={(e) => setSolution(e.target.value)} size="sm" rows={2} />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs" color="gray.600">Engineering Decisions</FormLabel>
                        <Textarea placeholder="Key trade-offs or technical decisions..." value={decisions} onChange={(e) => setDecisions(e.target.value)} size="sm" rows={2} />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs" color="gray.600">Challenges Encountered</FormLabel>
                        <Textarea placeholder="Technical roadblocks and how they were solved..." value={challenges} onChange={(e) => setChallenges(e.target.value)} size="sm" rows={2} />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs" color="gray.600">Lessons Learned</FormLabel>
                        <Textarea placeholder="Key takeaways and future improvements..." value={lessonsLearned} onChange={(e) => setLessonsLearned(e.target.value)} size="sm" rows={2} />
                      </FormControl>
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>Cover Image</FormLabel>
                <VStack align="stretch" spacing={2}>
                  <Input type="file" accept="image/*" onChange={handleFileUpload} p={1} />
                  {uploadingImage && (
                    <HStack spacing={2}>
                      <Spinner size="xs" color="blue.500" />
                      <Text fontSize="xs" color="gray.500">Uploading image to server...</Text>
                    </HStack>
                  )}
                  {imageUrl && !uploadingImage && (
                    <Box mt={1}>
                      <Text fontSize="xs" color="gray.500" mb={1}>Preview:</Text>
                      <Image src={imageUrl} alt="Cover preview" maxH="120px" borderRadius="md" objectFit="cover" />
                    </Box>
                  )}
                </VStack>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>GitHub Repository URL</FormLabel>
                <Input
                  placeholder="github.com/username/repository"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>Live Demo URL</FormLabel>
                <Input
                  placeholder="my-demo-app.vercel.app"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                width="full"
                isLoading={submitting}
                isDisabled={uploadingImage}
                loadingText="Publishing..."
              >
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
                        <Heading size="xs" color="blue.600">Edit Project</Heading>
                        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} size="sm" placeholder="Title" />
                        <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} size="sm" rows={2} placeholder="Description" />
                        <Input value={editTagsInput} onChange={(e) => setEditTagsInput(e.target.value)} size="sm" placeholder="Tags (comma-separated)" />
                        
                        <Accordion allowToggle width="full" borderStyle="none">
                          <AccordionItem border="1px" borderColor="gray.200" borderRadius="md">
                            <h2>
                              <AccordionButton bg="gray.50" py={1}>
                                <Box as="span" flex="1" textAlign="left" fontSize="xs">
                                  Edit Case Study Details
                                </Box>
                                <AccordionIcon />
                              </AccordionButton>
                            </h2>
                            <AccordionPanel pb={2}>
                              <VStack spacing={2}>
                                <Textarea value={editProblem} onChange={(e) => setEditProblem(e.target.value)} size="xs" placeholder="Problem" rows={2} />
                                <Textarea value={editSolution} onChange={(e) => setEditSolution(e.target.value)} size="xs" placeholder="Solution" rows={2} />
                                <Textarea value={editDecisions} onChange={(e) => setEditDecisions(e.target.value)} size="xs" placeholder="Decisions" rows={2} />
                                <Textarea value={editChallenges} onChange={(e) => setEditChallenges(e.target.value)} size="xs" placeholder="Challenges" rows={2} />
                                <Textarea value={editLessonsLearned} onChange={(e) => setEditLessonsLearned(e.target.value)} size="xs" placeholder="Lessons Learned" rows={2} />
                              </VStack>
                            </AccordionPanel>
                          </AccordionItem>
                        </Accordion>

                        <Input value={editGithubUrl} onChange={(e) => setEditGithubUrl(e.target.value)} size="sm" placeholder="GitHub URL" />
                        <Input value={editDemoUrl} onChange={(e) => setEditDemoUrl(e.target.value)} size="sm" placeholder="Demo URL" />

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
                          {p.tags && p.tags.length > 0 && (
                            <Wrap mt={3} spacing={1.5}>
                              {p.tags.map((tag, idx) => (
                                <WrapItem key={idx}>
                                  <Tag size="sm" colorScheme="blue" variant="subtle" borderRadius="full">
                                    {tag}
                                  </Tag>
                                </WrapItem>
                              ))}
                            </Wrap>
                          )}
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

export default AdminView;