import { useMemo, useState, type ReactNode } from 'react';
import { Box, Button, Flex, Heading, HStack, Input, InputGroup, InputLeftElement, Select, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react';
import type { Project } from '../../api/projectstate';
import { FeaturedProject } from './FeaturedProject';
import { SearchIcon } from './icons';
import { ProjectCard } from './ProjectCard';

const GRID_COLUMNS = { base: 1, md: 2, lg: 3 };

const SORTS = {
  // The owner's manual order from Admin, as the API returns it.
  default: { label: 'Recommended', compare: null },
  newest: { label: 'Newest first', compare: (a: Project, b: Project) => dateOf(b) - dateOf(a) },
  oldest: { label: 'Oldest first', compare: (a: Project, b: Project) => dateOf(a) - dateOf(b) },
  title: { label: 'Title (A–Z)', compare: (a: Project, b: Project) => a.title.localeCompare(b.title) },
} as const;
type SortKey = keyof typeof SORTS;

function dateOf(p: Project) {
  const t = p.createdAt ? Date.parse(p.createdAt) : NaN;
  return Number.isNaN(t) ? 0 : t;
}

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
    <Box textAlign="center" py={12} bg="bg.surface" borderRadius="xl" borderWidth="1px" borderColor="border.default">
      {children}
    </Box>
  );
}

export function ProjectsSection({ projects, loading, selectedTag, onClearTag, onOpen, onShare }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('default');
  const filteredProjects = useMemo(() => {
    const matches = filterProjects(projects, searchQuery, selectedTag);
    const { compare } = SORTS[sort];
    return compare ? [...matches].sort(compare) : matches;
  }, [projects, searchQuery, selectedTag, sort]);

  // Featured projects get the spotlight only on the default view; searching, a tag or a sort shows plain cards.
  const isFiltering = Boolean(searchQuery.trim() || selectedTag);
  const spotlight = !isFiltering && sort === 'default';
  const featured = spotlight ? filteredProjects.filter((p) => p.featured) : [];
  const gridProjects = spotlight ? filteredProjects.filter((p) => !p.featured) : filteredProjects;

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
        <Text color="fg.muted">Projects are on their way. Check back soon.</Text>
      </EmptyState>
    );
  } else if (filteredProjects.length === 0) {
    body = (
      <EmptyState>
        <Text color="fg.muted" mb={3}>No projects match your search.</Text>
        <Button size="sm" colorScheme="brand" variant="ghost" onClick={clearFilters}>
          Clear search & filters
        </Button>
      </EmptyState>
    );
  } else {
    body = (
      <VStack spacing={6} align="stretch">
        {featured.map((p) => (
          <FeaturedProject key={p.id} project={p} onOpen={onOpen} onShare={onShare} />
        ))}
        {gridProjects.length > 0 && (
          <SimpleGrid columns={GRID_COLUMNS} spacing={6}>
            {gridProjects.map((p) => (
              <ProjectCard key={p.id} project={p} onOpen={onOpen} onShare={onShare} />
            ))}
          </SimpleGrid>
        )}
      </VStack>
    );
  }

  return (
    <Box id="projects" scrollMarginTop="90px">
      <HStack justify="space-between" align="end" mb={4} flexWrap="wrap" gap={3}>
        <Box>
          <Heading as="h2" size="lg">Projects</Heading>
          <Text color="fg.muted" fontSize="sm">
            {selectedTag ? `Showing projects built with ${selectedTag}` : 'What I have built, and how I built it'}
          </Text>
        </Box>
        {(searchQuery || selectedTag) && (
          <Button size="sm" variant="ghost" colorScheme="brand" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </HStack>

      {!loading && projects.length > 0 && (
        <>
          <Flex gap={3} mb={2} direction={{ base: 'column', sm: 'row' }}>
            <InputGroup bg="bg.surface" borderRadius="md" flex={1}>
              <InputLeftElement pointerEvents="none" color="fg.subtle">
                <SearchIcon />
              </InputLeftElement>
              <Input
                placeholder="Search projects by name, description or technology..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search projects"
              />
            </InputGroup>
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort projects"
              bg="bg.surface"
              w={{ base: 'full', sm: '190px' }}
              flexShrink={0}
            >
              {Object.entries(SORTS).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </Flex>
          <Text fontSize="xs" color="fg.muted" mb={5} aria-live="polite">
            {isFiltering
              ? `Showing ${filteredProjects.length} of ${projects.length} projects`
              : `${projects.length} ${projects.length === 1 ? 'project' : 'projects'}`}
          </Text>
        </>
      )}

      {body}
    </Box>
  );
}
