import { useState } from 'react';
import { Box, Button, Container, Heading, Text, VStack } from '@chakra-ui/react';
import { CaseStudyModal } from '../components/public/CaseStudyModal';
import { ContactSection } from '../components/public/ContactSection';
import { PortfolioStats } from '../components/public/PortfolioStats';
import { ProfileHero } from '../components/public/ProfileHero';
import { ProjectsSection } from '../components/public/ProjectsSection';
import { PublicFooter } from '../components/public/PublicFooter';
import { TechStack } from '../components/public/TechStack';
import { useCaseStudyLink } from '../hooks/useCaseStudyLink';
import { useHashScroll } from '../hooks/useHashScroll';
import { usePortfolio } from '../hooks/usePortfolio';
import { useProfileMeta } from '../hooks/useProfileMeta';

const NAV_SECTIONS = ['projects', 'contact'] as const;

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <Container maxW="container.md" py={24} textAlign="center">
      <Heading size="md" mb={2}>Couldn't load the portfolio</Heading>
      <Text color="gray.600" mb={6}>The server may be offline. Please try again in a moment.</Text>
      <Button colorScheme="blue" onClick={onRetry}>Retry</Button>
    </Container>
  );
}

export function PublicView() {
  const { profile, projects, loading, error, retry } = usePortfolio();
  const { selectedProject, openProject, closeProject, shareProject } = useCaseStudyLink(projects);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useProfileMeta(profile);
  useHashScroll(NAV_SECTIONS, !loading);

  const selectTag = (tag: string | null) => {
    setSelectedTag(tag);
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (error) return <LoadError onRetry={retry} />;

  return (
    <Box bg="gray.50" minH="calc(100vh - 70px)" py={{ base: 8, md: 12 }}>
      <Container maxW="container.lg">
        <VStack spacing={10} align="stretch">
          <ProfileHero profile={profile} loading={loading} />

          {!loading && (
            <>
              <PortfolioStats projects={projects} />
              <TechStack projects={projects} selectedTag={selectedTag} onSelect={selectTag} />
            </>
          )}

          <ProjectsSection
            projects={projects}
            loading={loading}
            selectedTag={selectedTag}
            onClearTag={() => setSelectedTag(null)}
            onOpen={openProject}
            onShare={shareProject}
          />

          {!loading && <ContactSection profile={profile} />}

          <PublicFooter name={profile?.name} />
        </VStack>
      </Container>

      <CaseStudyModal project={selectedProject} onClose={closeProject} />
    </Box>
  );
}

export default PublicView;
