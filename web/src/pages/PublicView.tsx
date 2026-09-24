import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  Image,
  Tag,
  Wrap,
  WrapItem,
  VStack,
  HStack,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Badge,
  Icon,
} from '@chakra-ui/react';
import { getProjects, type Project } from '../api/projectstate';

// Simple search icon SVG wrapper
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

export function PublicView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    getProjects()
      .then((data) => setProjects(data))
      .catch((err) => console.error('Error fetching public projects:', err))
      .finally(() => setLoading(false));
  }, []);

  // Collect unique tech stack tags from all projects
  const allTags = Array.from(
    new Set(projects.flatMap((p) => p.tags || []))
  );

  // Filter projects by search term and selected tag
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = selectedTag ? p.tags?.includes(selectedTag) : true;

    return matchesSearch && matchesTag;
  });

  return (
    <Box bg="gray.50" minH="100vh" py={12}>
      <Container maxW="container.lg">
        <VStack spacing={8} align="stretch">
          
          {/* Header Hero Section */}
          <VStack spacing={3} textAlign="center">
            <Badge colorScheme="blue" px={3} py={1} borderRadius="full" fontSize="xs">
              Full-Stack Software Engineer
            </Badge>
            <Heading as="h1" size="2xl" letterSpacing="tight">
              Featured Engineering Projects
            </Heading>
            <Text color="gray.600" maxW="2xl" fontSize="md">
              Explore custom web applications, APIs, and microservices built with modern enterprise technologies.
            </Text>
          </VStack>

          {/* Search Bar & Tag Filter Pills */}
          <VStack spacing={4} align="stretch" bg="white" p={5} borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="gray.200">
            <InputGroup size="md">
              <InputLeftElement pointerEvents="none" children={<SearchIcon />} />
              <Input
                placeholder="Search by project name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                borderRadius="md"
              />
            </InputGroup>

            {allTags.length > 0 && (
              <HStack spacing={2} flexWrap="wrap" pt={2}>
                <Text fontSize="xs" fontWeight="bold" color="gray.500" mr={1}>
                  Filter by Tag:
                </Text>
                <Tag
                  size="sm"
                  cursor="pointer"
                  colorScheme={selectedTag === null ? 'blue' : 'gray'}
                  variant={selectedTag === null ? 'solid' : 'subtle'}
                  onClick={() => setSelectedTag(null)}
                >
                  All
                </Tag>
                {allTags.map((tag) => (
                  <Tag
                    key={tag}
                    size="sm"
                    cursor="pointer"
                    colorScheme={selectedTag === tag ? 'blue' : 'gray'}
                    variant={selectedTag === tag ? 'solid' : 'subtle'}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  >
                    {tag}
                  </Tag>
                ))}
              </HStack>
            )}
          </VStack>

          {/* Project Grid */}
          {loading ? (
            <VStack py={16}>
              <Spinner size="xl" color="blue.500" thickness="3px" />
              <Text color="gray.500" fontSize="sm">Loading portfolio showcase...</Text>
            </VStack>
          ) : filteredProjects.length === 0 ? (
            <Box textAlign="center" py={12} bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.200">
              <Text color="gray.500">No projects match your search criteria.</Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {filteredProjects.map((p) => (
                <Card key={p.id} borderWidth="1px" borderColor="gray.200" borderRadius="xl" overflow="hidden" boxShadow="sm" bg="white">
                  <CardBody p={5} display="flex" flexDirection="column" justifyContent="space-between">
                    <Box>
                      {p.imageUrl && (
                        <Image src={p.imageUrl} alt={p.title} borderRadius="lg" maxH="160px" w="full" objectFit="cover" mb={4} />
                      )}
                      <Heading size="md" color="gray.800" mb={2}>{p.title}</Heading>
                      <Text color="gray.600" fontSize="sm" mb={4}>
                        {p.description || 'No description provided.'}
                      </Text>

                      {p.tags && p.tags.length > 0 && (
                        <Wrap mb={4} spacing={1.5}>
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

                    {/* Interactive Links */}
                    <HStack spacing={3} pt={4} borderTopWidth="1px" borderColor="gray.100">
                      {p.githubUrl && (
                        <Button
                          as="a"
                          href={p.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="sm"
                          variant="outline"
                          colorScheme="gray"
                          flex={1}
                        >
                          Code Repository
                        </Button>
                      )}
                      {p.demoUrl && (
                        <Button
                          as="a"
                          href={p.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="sm"
                          colorScheme="blue"
                          flex={1}
                        >
                          Live Demo
                        </Button>
                      )}
                    </HStack>
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

export default PublicView;