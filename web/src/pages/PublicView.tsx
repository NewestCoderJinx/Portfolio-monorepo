import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Skeleton,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../api/auth';
import { getProfile, type Profile } from '../api/profile';
import { getProjects, type Project } from '../api/projectstate';
import { CaseStudyModal } from '../components/public/CaseStudyModal';
import { ContactSection } from '../components/public/ContactSection';
import { SearchIcon } from '../components/public/icons';
import { PortfolioStats } from '../components/public/PortfolioStats';
import { ProfileHero } from '../components/public/ProfileHero';
import { ProjectCard } from '../components/public/ProjectCard';
import { TechStack } from '../components/public/TechStack';
import { setMeta, summarize } from '../seo';

const PROJECT_HASH = /^#project-(.+)$/;

export function PublicView() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const toast = useToast();
  const { hash } = useLocation();

  const fetchPortfolio = useCallback(
    () =>
      Promise.all([getProfile(), getProjects()])
        .then(([prof, projs]) => {
          setProfile(prof);
          setProjects(projs);
          setLoadError(false);
          // Deep link: /#project-<id> opens that project's case study.
          const match = window.location.hash.match(PROJECT_HASH);
          if (match) setSelectedProject(projs.find((p) => p.id === match[1]) ?? null);
        })
        .catch((err) => {
          console.error('Failed to load portfolio:', err);
          setLoadError(true);
        })
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const retry = () => {
    setLoading(true);
    setLoadError(false);
    fetchPortfolio();
  };

  // Navbar links (/#projects, /#contact) scroll here once the content exists.
  useEffect(() => {
    if (loading || (hash !== '#projects' && hash !== '#contact')) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash, loading]);

  // Keep title/description in sync with the live profile (the static build-time tags are the fallback).
  useEffect(() => {
    if (!profile) return;
    const title = `${profile.name}${profile.headline ? ` | ${profile.headline}` : ''}`;
    document.title = title;
    setMeta('property', 'og:title', title);
    const description = profile.bio || profile.headline;
    if (description) {
      setMeta('name', 'description', summarize(description));
      setMeta('property', 'og:description', summarize(description));
    }
  }, [profile]);

  const openProject = (p: Project) => {
    setSelectedProject(p);
    window.history.replaceState(null, '', `#project-${p.id}`);
  };

  const closeProject = () => {
    setSelectedProject(null);
    window.history.replaceState(null, '', window.location.pathname);
  };

  const shareProject = async (p: Project) => {
    const url = `${window.location.origin}${window.location.pathname}#project-${p.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied', description: `Share link for "${p.title}" copied.`, status: 'success', duration: 3000, position: 'bottom-right' });
    } catch {
      toast({ title: 'Copy this link', description: url, status: 'info', duration: 8000, isClosable: true, position: 'bottom-right' });
    }
  };

  const selectTag = (tag: string | null) => {
    setSelectedTag(tag);
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q));
      const matchesTag = !selectedTag || p.tags?.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [projects, searchQuery, selectedTag]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTag(null);
  };

  if (loadError) {
    return (
      <Container maxW="container.md" py={24} textAlign="center">
        <Heading size="md" mb={2}>Couldn't load the portfolio</Heading>
        <Text color="gray.600" mb={6}>The server may be offline. Please try again in a moment.</Text>
        <Button colorScheme="blue" onClick={retry}>Retry</Button>
      </Container>
    );
  }

  return (
    <Box bg="gray.50" minH="calc(100vh - 70px)" py={{ base: 8, md: 12 }}>
      <Container maxW="container.lg">
        <VStack spacing={10} align="stretch">
          <ProfileHero profile={profile} loading={loading} />

          {!loading && <PortfolioStats projects={projects} />}

          {!loading && <TechStack projects={projects} selectedTag={selectedTag} onSelect={selectTag} />}

          {/* Projects */}
          <Box id="projects" scrollMarginTop="90px">
            <HStack justify="space-between" align="end" mb={4} flexWrap="wrap" gap={3}>
              <Box>
                <Heading as="h2" size="lg">Projects</Heading>
                <Text color="gray.500" fontSize="sm">
                  {selectedTag ? `Showing projects built with ${selectedTag}` : 'What I have built, and how I built it'}
                </Text>
              </Box>
              {(searchQuery || selectedTag) && (
                <Button size="sm" variant="ghost" colorScheme="blue" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </HStack>

            {projects.length > 0 && (
              <InputGroup mb={6} bg="white" borderRadius="md">
                <InputLeftElement pointerEvents="none" color="gray.400">
                  <SearchIcon />
                </InputLeftElement>
                <Input
                  placeholder="Search projects by name, description or technology..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search projects"
                />
              </InputGroup>
            )}

            {loading ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} h="360px" borderRadius="xl" />
                ))}
              </SimpleGrid>
            ) : projects.length === 0 ? (
              <Box textAlign="center" py={12} bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.200">
                <Text color="gray.500">Projects are on their way. Check back soon.</Text>
              </Box>
            ) : filteredProjects.length === 0 ? (
              <Box textAlign="center" py={12} bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.200">
                <Text color="gray.500" mb={3}>No projects match your search.</Text>
                <Button size="sm" colorScheme="blue" variant="ghost" onClick={clearFilters}>
                  Clear search & filters
                </Button>
              </Box>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {filteredProjects.map((p) => (
                  <ProjectCard key={p.id} project={p} onOpen={openProject} onShare={shareProject} />
                ))}
              </SimpleGrid>
            )}
          </Box>

          {!loading && <ContactSection profile={profile} />}

          <HStack justify="center" spacing={3} fontSize="xs" color="gray.400">
            <Text>© {new Date().getFullYear()} {profile?.name ?? 'Portfolio'}</Text>
            {!isAuthenticated() && (
              <>
                <Text aria-hidden>·</Text>
                <Text as={RouterLink} to="/admin" _hover={{ color: 'gray.600' }}>
                  Admin
                </Text>
              </>
            )}
          </HStack>
        </VStack>
      </Container>

      <CaseStudyModal project={selectedProject} onClose={closeProject} />
    </Box>
  );
}

export default PublicView;
