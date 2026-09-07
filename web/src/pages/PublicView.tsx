import { useEffect, useState } from 'react';
import { Box,Container,Heading,VStack,SimpleGrid,Card,CardBody,Text,Image,Spinner,Badge,Tag,Wrap,WrapItem,HStack,Button,Link,Flex,} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { getProjects, type Project } from '../api/projectstate';

export function PublicView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    getProjects()
      .then((data) => setProjects(data))
      .catch((err) => console.error('Error fetching projects:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box bg="gray.50" minH="100vh">
      {/* Top Navigation */}
      <Box bg="white" borderBottomWidth="1px" borderColor="gray.200" py={4} px={8}>
        <Flex maxW="container.lg" mx="auto" justify="space-between" align="center">
          <Heading size="md" color="blue.600" letterSpacing="tight">
            DevPortfolio
          </Heading>
          <Button as={RouterLink} to="/admin" size="sm" variant="ghost" colorScheme="gray">
            Admin Workspace
          </Button>
        </Flex>
      </Box>

      <Container maxW="container.lg" py={16}>
        <VStack spacing={12} align="stretch">
          
          {/* Hero Section */}
          <VStack spacing={4} textAlign="center" maxW="2xl" mx="auto">
            <Badge colorScheme="blue" px={3} py={1} borderRadius="full" fontSize="xs">
              Full-Stack Software Engineer
            </Badge>
            <Heading as="h1" size="2xl" letterSpacing="tight">
              Featured Engineering Projects
            </Heading>
            <Text color="gray.600" fontSize="lg">
              Explore custom web applications, APIs, and microservices built with modern enterprise technologies.
            </Text>
          </VStack>

          {/* Project Cards Grid */}
          {loading ? (
            <VStack py={16}>
              <Spinner size="xl" color="blue.500" thickness="3px" />
              <Text color="gray.500" fontSize="sm">Loading portfolio items...</Text>
            </VStack>
          ) : projects.length === 0 ? (
            <Box textAlign="center" py={16} bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.200">
              <Text color="gray.500">No projects currently displayed.</Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
              {projects.map((p) => (
                <Card
                  key={p.id}
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="xl"
                  overflow="hidden"
                  boxShadow="sm"
                  bg="white"
                  transition="all 0.2s"
                  _hover={{ transform: 'translateY(-4px)', boxShadow: 'md' }}
                >
                  <CardBody p={6} display="flex" flexDirection="column" justifyContent="space-between">
                    <Box>
                      {p.imageUrl ? (
                        <Image src={p.imageUrl} alt={p.title} borderRadius="lg" maxH="160px" w="full" objectFit="cover" mb={4} />
                      ) : (
                        <Box h="140px" w="full" bg="gray.100" borderRadius="lg" mb={4} display="flex" alignItems="center" justifyContent="center">
                          <Text color="gray.400" fontSize="xs">No preview image</Text>
                        </Box>
                      )}
                      
                      <Heading size="md" color="gray.800" mb={2}>
                        {p.title}
                      </Heading>
                      
                      <Text color="gray.600" fontSize="sm" mb={4} noOfLines={3}>
                        {p.description || 'No description provided.'}
                      </Text>
                    </Box>

                    <Box pt={4} borderTopWidth="1px" borderColor="gray.100">
                      {p.tags && p.tags.length > 0 && (
                        <Wrap spacing={1.5}>
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