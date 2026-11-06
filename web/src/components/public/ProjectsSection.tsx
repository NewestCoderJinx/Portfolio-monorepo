import { useMemo, useState, type ReactNode } from 'react';
import { Box, Button, Heading, HStack, Input, InputGroup, InputLeftElement, SimpleGrid, Skeleton, Text } from '@chakra-ui/react';
import type { Project } from '../../api/projectstate';
import { SearchIcon } from './icons';
import { ProjectCard } from './ProjectCard';

const GRID_COLUMNS = { base: 1, md: 2, lg: 3 };

interface Props {
  projects: Project[];
  loading: boolean;
  selectedTag: string | null;
  onClearTag: () => void;
  onOpen: (p: Project) => void;
  onShare: (p: Project) => void;
}

function filterProjects(projects: Project[], query: string, tag: string | null) {
  const q = query.trim().toLowerCase();
  return projects.filter((p) => {
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.tags?.some((t) => t.toLowerCase().includes(q));
    const matchesTag = !tag || p.tags?.includes(tag);
    return matchesSearch && matchesTag;
  });
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <Box textAlign="center" py={12} bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.200">
      {children}
    </Box>
  );
}

export function ProjectsSection({ projects, loading, selectedTag, onClearTag, onOpen, onShare }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const filteredProjects = useMemo(
    () => filterProjects(projects, searchQuery, selectedTag),
    [projects, searchQuery, selectedTag],
  );

  const clearFilters = () => {
    setSearchQuery('');
    onClearTag();
  };

  let body: ReactNode;
  if (loading) {
    body = (
      <SimpleGrid columns={GRID_COLUMNS} spacing={6}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} h="360px" borderRadius="xl" />
        ))}
      </SimpleGrid>
    );
  } else if (projects.length === 0) {
    body = (
      <EmptyState>
        <Text color="gray.500">Projects are on their way. Check back soon.</Text>
      </EmptyState>
    );
  } else if (filteredProjects.length === 0) {
    body = (
      <EmptyState>
        <Text color="gray.500" mb={3}>No projects match your search.</Text>
        <Button size="sm" colorScheme="blue" variant="ghost" onClick={clearFilters}>
          Clear search & filters
        </Button>
      </EmptyState>
    );
  } else {
    body = (
      <SimpleGrid columns={GRID_COLUMNS} spacing={6}>
        {filteredProjects.map((p) => (
          <ProjectCard key={p.id} project={p} onOpen={onOpen} onShare={onShare} />
        ))}
      </SimpleGrid>
    );
  }

  return (
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

      {body}
    </Box>
  );
}
