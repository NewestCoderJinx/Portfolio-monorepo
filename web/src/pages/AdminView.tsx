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
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';
import { AccountPanel } from '../components/admin/AccountPanel';
import { ExperienceEditor } from '../components/admin/ExperienceEditor';
import { GalleryField } from '../components/admin/GalleryField';
import { InboxPanel } from '../components/admin/InboxPanel';
import { useInbox } from '../hooks/useInbox';
import { ProfileEditor } from '../components/admin/ProfileEditor';
import { TestimonialsEditor } from '../components/admin/TestimonialsEditor';
import {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  reorderProjects,
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
  const inbox = useInbox();

  // Basic Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
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
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editGallery, setEditGallery] = useState<string[]>([]);
  const [editUploading, setEditUploading] = useState(false);

  const fetchProjects = () => {
    setLoading(true);
    getAllProjects()
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

  const handleEditFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setEditUploading(true);
    try {
      setEditImageUrl(await uploadProjectImage(file));
    } catch (err) {
      toast({ title: 'Failed to upload image', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setEditUploading(false);
    }
  };

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    saveNewProject(true);
  };

  const saveNewProject = async (published: boolean) => {
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
        gallery: gallery.length ? gallery : undefined,
        tags,
        githubUrl: formatUrl(githubUrl),
        demoUrl: formatUrl(demoUrl),
        published,
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
      setGallery([]);
      setTagsInput('');
      setGithubUrl('');
      setDemoUrl('');

      toast({
        title: published ? 'Project published!' : 'Draft saved',
        description: published ? undefined : 'Only you can see it. Publish it from its card when ready.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchProjects();
    } catch (err) {
      toast({ title: 'Failed to create project', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFeatured = async (p: Project) => {
    try {
      await updateProject(p.id, { featured: !p.featured });
      toast({ title: p.featured ? 'Removed from featured' : 'Featured: pinned to the top', status: 'success', duration: 2500, isClosable: true });
      fetchProjects();
    } catch (err) {
      toast({ title: 'Failed to update project', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const handleTogglePublished = async (p: Project) => {
    const published = p.published === false;
    try {
      await updateProject(p.id, { published });
      setProjects((prev) => prev.map((x) => (x.id === p.id ? { ...x, published } : x)));
      toast({ title: published ? 'Published: now on your public page' : 'Moved to drafts: hidden from the public page', status: 'success', duration: 2500, isClosable: true });
    } catch {
      toast({ title: 'Failed to update project', status: 'error', duration: 3000, isClosable: true });
    }
  };

  // Featured projects always sort above the rest, so moves stay within the same group.
  const canMove = (index: number, dir: -1 | 1) => {
    const neighbor = projects[index + dir];
    return Boolean(neighbor) && Boolean(neighbor.featured) === Boolean(projects[index].featured);
  };

  const handleMove = async (index: number, dir: -1 | 1) => {
    if (!canMove(index, dir)) return;
    const next = [...projects];
    [next[index], next[index + dir]] = [next[index + dir], next[index]];
    setProjects(next); // optimistic
    try {
      await reorderProjects(next.map((p) => p.id));
    } catch (err) {
      toast({ title: 'Failed to save new order', status: 'error', duration: 3000, isClosable: true });
      fetchProjects();
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
    setEditImageUrl(p.imageUrl || '');
    setEditGallery(p.gallery ?? []);
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
        imageUrl: editImageUrl.trim() || null,
        gallery: editGallery.length ? editGallery : null,
        // null (not undefined) so clearing a link actually removes it
        githubUrl: formatUrl(editGithubUrl) ?? null,
        demoUrl: formatUrl(editDemoUrl) ?? null,
      });
      setEditingId(null);
      fetchProjects();
      toast({ title: 'Project updated!', status: 'success', duration: 3000, isClosable: true });
    } catch (err) {
      toast({ title: 'Failed to update project', status: 'error', duration: 3000, isClosable: true });
    }
  };

  return (
    <Box bg="bg.canvas" minH="100vh" py={12}>
      <Container maxW="container.lg">
        <VStack spacing={8} align="stretch">
          
          {/* Header */}
          <VStack spacing={2} textAlign="center">
            <Badge colorScheme="brand" px={3} py={1} borderRadius="full" fontSize="xs">
              Developer Workspace
            </Badge>
            <Heading as="h1" size="xl" letterSpacing="tight">
              Portfolio Management
            </Heading>
            <Text color="fg.secondary">
              Manage your profile, projects, experience, testimonials and messages
            </Text>
          </VStack>

          <Tabs colorScheme="brand" variant="enclosed-colored" isLazy>
            {/* Scrolls sideways on phones instead of widening the page. */}
            <TabList overflowX="auto" overflowY="hidden" sx={{ scrollbarWidth: 'none', '& > button': { flexShrink: 0 } }}>
              <Tab fontWeight="semibold">Projects</Tab>
              <Tab fontWeight="semibold">Profile</Tab>
              <Tab fontWeight="semibold">Experience</Tab>
              <Tab fontWeight="semibold">Testimonials</Tab>
              <Tab fontWeight="semibold" gap={2}>
                Inbox
                {inbox.unread > 0 && (
                  <Badge colorScheme="accent" variant="solid" borderRadius="full" aria-label={`${inbox.unread} unread`}>
                    {inbox.unread}
                  </Badge>
                )}
              </Tab>
              <Tab fontWeight="semibold">Account</Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={0}>
                <VStack spacing={8} align="stretch">
          {/* Creation Form */}
          <Box as="form" onSubmit={handleCreate} p={6} bg="bg.surface" borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="border.default">
            <Heading as="h2" size="sm" mb={4} color="fg.default">
              Add New Showcase Item
            </Heading>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="bold" color="fg.secondary" mb={1}>Project Title</FormLabel>
                <Input
                  placeholder="e.g. Microservices Order Processing API"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold" color="fg.secondary" mb={1}>Short Summary / Description</FormLabel>
                <Textarea
                  placeholder="Short technical overview..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold" color="fg.secondary" mb={1}>Tech Stack Tags</FormLabel>
                <Input
                  placeholder="Comma-separated: React, NestJS, PostgreSQL"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              </FormControl>

              {/* Case Study Accordion */}
              <Accordion allowToggle width="full" borderStyle="none">
                <AccordionItem border="1px" borderColor="border.default" borderRadius="md">
                  <h2>
                    <AccordionButton bg="bg.subtle" _expanded={{ bg: 'bg.brandSubtle', color: 'fg.brand' }}>
                      <Box as="span" flex="1" textAlign="left" fontSize="xs" fontWeight="bold">
                        Detailed Technical Case Study (Optional)
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <VStack spacing={3}>
                      <FormControl>
                        <FormLabel fontSize="xs" color="fg.secondary">The Problem</FormLabel>
                        <Textarea placeholder="What real-world problem did this project address?" value={problem} onChange={(e) => setProblem(e.target.value)} size="sm" rows={2} />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs" color="fg.secondary">The Solution</FormLabel>
                        <Textarea placeholder="Architectural solution implemented..." value={solution} onChange={(e) => setSolution(e.target.value)} size="sm" rows={2} />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs" color="fg.secondary">Engineering Decisions</FormLabel>
                        <Textarea placeholder="Key trade-offs or technical decisions..." value={decisions} onChange={(e) => setDecisions(e.target.value)} size="sm" rows={2} />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs" color="fg.secondary">Challenges Encountered</FormLabel>
                        <Textarea placeholder="Technical roadblocks and how they were solved..." value={challenges} onChange={(e) => setChallenges(e.target.value)} size="sm" rows={2} />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs" color="fg.secondary">Lessons Learned</FormLabel>
                        <Textarea placeholder="Key takeaways and future improvements..." value={lessonsLearned} onChange={(e) => setLessonsLearned(e.target.value)} size="sm" rows={2} />
                      </FormControl>
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold" color="fg.secondary" mb={1}>Cover Image</FormLabel>
                <VStack align="stretch" spacing={2}>
                  <Input type="file" accept="image/*" onChange={handleFileUpload} p={1} />
                  {uploadingImage && (
                    <HStack spacing={2}>
                      <Spinner size="xs" color="brand.500" />
                      <Text fontSize="xs" color="fg.muted">Uploading image to server...</Text>
                    </HStack>
                  )}
                  {imageUrl && !uploadingImage && (
                    <Box mt={1}>
                      <Text fontSize="xs" color="fg.muted" mb={1}>Preview:</Text>
                      <Image src={imageUrl} alt="Cover preview" maxH="120px" borderRadius="md" objectFit="cover" />
                    </Box>
                  )}
                </VStack>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold" color="fg.secondary" mb={1}>Screenshots</FormLabel>
                <GalleryField value={gallery} onChange={setGallery} />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold" color="fg.secondary" mb={1}>GitHub Repository URL</FormLabel>
                <Input
                  placeholder="github.com/username/repository"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold" color="fg.secondary" mb={1}>Live Demo URL</FormLabel>
                <Input
                  placeholder="my-demo-app.vercel.app"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                />
              </FormControl>

              <HStack width="full" spacing={3}>
                <Button
                  type="submit"
                  colorScheme="brand"
                  flex={1}
                  isLoading={submitting}
                  isDisabled={uploadingImage}
                  loadingText="Saving..."
                >
                  Publish Project
                </Button>
                <Button
                  variant="outline"
                  onClick={() => saveNewProject(false)}
                  isDisabled={submitting || uploadingImage}
                  title="Save without showing it on your public page"
                >
                  Save as Draft
                </Button>
              </HStack>
            </VStack>
          </Box>

          <Divider />

          {/* Projects Display Grid */}
          {loading ? (
            <VStack py={12}>
              <Spinner size="xl" color="brand.500" thickness="3px" />
              <Text color="fg.muted" fontSize="sm">Fetching latest records...</Text>
            </VStack>
          ) : projects.length === 0 ? (
            <Box textAlign="center" py={12} bg="bg.surface" borderRadius="xl" borderStyle="dashed" borderWidth="2px" borderColor="border.strong">
              <Text color="fg.muted">No projects found. Publish your first item using the form above!</Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {projects.map((p, index) => (
                <Card
                  key={p.id}
                  borderWidth="1px"
                  borderColor={p.published === false ? 'border.strong' : 'border.default'}
                  borderStyle={p.published === false ? 'dashed' : 'solid'}
                  borderRadius="xl" overflow="hidden" boxShadow="xs" bg="bg.surface">
                  <CardBody p={5}>
                    {editingId === p.id ? (
                      <VStack spacing={3}>
                        <Heading size="xs" color="fg.brand">Edit Project</Heading>
                        <Box width="full">
                          {editImageUrl ? (
                            <Image src={editImageUrl} alt="Cover" borderRadius="md" maxH="120px" w="full" objectFit="cover" />
                          ) : (
                            <Box h="60px" borderRadius="md" borderWidth="1px" borderStyle="dashed" borderColor="border.strong" display="flex" alignItems="center" justifyContent="center">
                              <Text fontSize="xs" color="fg.subtle">No cover image</Text>
                            </Box>
                          )}
                          <HStack mt={2} spacing={2}>
                            <Button as="label" size="xs" variant="outline" flex={1} cursor="pointer" isLoading={editUploading} loadingText="Uploading...">
                              {editImageUrl ? 'Change image' : 'Add image'}
                              <input type="file" accept="image/*" hidden onChange={handleEditFileUpload} />
                            </Button>
                            {editImageUrl && (
                              <Button size="xs" variant="ghost" colorScheme="red" onClick={() => setEditImageUrl('')} isDisabled={editUploading}>
                                Remove
                              </Button>
                            )}
                          </HStack>
                        </Box>
                        <Box width="full">
                          <Text fontSize="xs" fontWeight="bold" color="fg.secondary" mb={1}>Screenshots</Text>
                          <GalleryField value={editGallery} onChange={setEditGallery} />
                        </Box>
                        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} size="sm" placeholder="Title" />
                        <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} size="sm" rows={2} placeholder="Description" />
                        <Input value={editTagsInput} onChange={(e) => setEditTagsInput(e.target.value)} size="sm" placeholder="Tags (comma-separated)" />
                        
                        <Accordion allowToggle width="full" borderStyle="none">
                          <AccordionItem border="1px" borderColor="border.default" borderRadius="md">
                            <h2>
                              <AccordionButton bg="bg.subtle" py={1}>
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
                          <Button colorScheme="green" size="xs" flex={1} onClick={() => handleUpdate(p.id)} isDisabled={editUploading}>
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
                          <HStack justify="space-between" align="start" gap={2}>
                            <Heading size="sm" color="fg.heading">{p.title}</Heading>
                            {p.published === false && (
                              <Badge colorScheme="gray" variant="outline" flexShrink={0}>Draft</Badge>
                            )}
                          </HStack>
                          <Text color="fg.secondary" fontSize="xs" mt={2} noOfLines={3}>
                            {p.description || 'No description provided.'}
                          </Text>
                          {p.published !== false && (
                            <Text fontSize="xs" color="fg.muted" mt={2} title="Times visitors opened this case study (your own visits while logged in aren't counted)">
                              {p.views ?? 0} case-study {p.views === 1 ? 'view' : 'views'}
                            </Text>
                          )}
                          {p.tags && p.tags.length > 0 && (
                            <Wrap mt={3} spacing={1.5}>
                              {p.tags.map((tag, idx) => (
                                <WrapItem key={idx}>
                                  <Tag size="sm" colorScheme="brand" variant="subtle" borderRadius="full">
                                    {tag}
                                  </Tag>
                                </WrapItem>
                              ))}
                            </Wrap>
                          )}
                        </Box>

                        <HStack width="full" pt={3} borderTopWidth="1px" borderColor="border.subtle" spacing={1}>
                          <Button size="xs" variant="ghost" aria-label="Move up" title="Move up" onClick={() => handleMove(index, -1)} isDisabled={!canMove(index, -1)}>
                            ↑
                          </Button>
                          <Button size="xs" variant="ghost" aria-label="Move down" title="Move down" onClick={() => handleMove(index, 1)} isDisabled={!canMove(index, 1)}>
                            ↓
                          </Button>
                          <Button
                            size="xs"
                            variant={p.featured ? 'solid' : 'ghost'}
                            colorScheme="yellow"
                            onClick={() => handleToggleFeatured(p)}
                            title={p.featured ? 'Unpin from top' : 'Pin to top of public page'}
                            flex={1}
                          >
                            {p.featured ? '★ Featured' : '☆ Feature'}
                          </Button>
                        </HStack>
                        <HStack width="full" mt={-1}>
                          <Button
                            size="xs"
                            variant={p.published === false ? 'solid' : 'ghost'}
                            colorScheme={p.published === false ? 'brand' : 'gray'}
                            flex={1}
                            onClick={() => handleTogglePublished(p)}
                            title={p.published === false ? 'Show on your public page' : 'Hide from your public page'}
                          >
                            {p.published === false ? 'Publish' : 'Unpublish'}
                          </Button>
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
              </TabPanel>
              <TabPanel px={0}>
                <ProfileEditor />
              </TabPanel>
              <TabPanel px={0}>
                <ExperienceEditor />
              </TabPanel>
              <TabPanel px={0}>
                <TestimonialsEditor />
              </TabPanel>
              <TabPanel px={0}>
                <InboxPanel inbox={inbox} />
              </TabPanel>
              <TabPanel px={0}>
                <AccountPanel />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>
    </Box>
  );
}

export default AdminView;