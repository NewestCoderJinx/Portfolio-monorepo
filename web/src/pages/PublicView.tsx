import { useState } from 'react';
import { Box, Button, Container, Heading, Text, VStack } from '@chakra-ui/react';
import { BackToTop } from '../components/public/BackToTop';
import { CaseStudyModal } from '../components/public/CaseStudyModal';
import { ContactSection } from '../components/public/ContactSection';
import { CredentialsSection } from '../components/public/CredentialsSection';
import { ExperienceSection } from '../components/public/ExperienceSection';
import { PortfolioStats } from '../components/public/PortfolioStats';
import { ProfileHero } from '../components/public/ProfileHero';
import { SkillsSection } from '../components/public/SkillsSection';
import { ProjectsSection } from '../components/public/ProjectsSection';
import { PublicFooter } from '../components/public/PublicFooter';
import { Reveal } from '../components/public/Reveal';
import { TechStack } from '../components/public/TechStack';
import { TestimonialsSection } from '../components/public/TestimonialsSection';
import { useCaseStudyLink } from '../hooks/useCaseStudyLink';
import { useHashScroll } from '../hooks/useHashScroll';
import { usePortfolio } from '../hooks/usePortfolio';
import { useProfileMeta } from '../hooks/useProfileMeta';
import { useStructuredData } from '../hooks/useStructuredData';

const NAV_SECTIONS = ['projects', 'experience', 'education', 'skills', 'testimonials', 'contact'] as const;

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <Container maxW="container.md" py={24} textAlign="center">
      <Heading size="md" mb={2}>Couldn't load the portfolio</Heading>
      <Text color="fg.secondary" mb={6}>The server may be offline. Please try again in a moment.</Text>
      <Button colorScheme="brand" onClick={onRetry}>Retry</Button>
    </Container>
  );
}

export function PublicView() {
  const { profile, projects, experience, testimonials, credentials, skills, loading, error, retry } = usePortfolio();
  const { selectedProject, openProject, closeProject, shareProject } = useCaseStudyLink(projects);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useProfileMeta(profile, selectedProject);
  useStructuredData(profile, skills);
  useHashScroll(NAV_SECTIONS, !loading);

  const selectTag = (tag: string | null) => {
    setSelectedTag(tag);
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (error) return <LoadError onRetry={retry} />;

  return (
    <Box bg="bg.canvas" minH="calc(100vh - 70px)" py={{ base: 8, md: 12 }}>
      <Container maxW="container.lg">
        <VStack spacing={10} align="stretch">
          <Reveal>
            <ProfileHero profile={profile} loading={loading} />
          </Reveal>

          {!loading && (
            <>
              <Reveal delay={0.1}>
                <PortfolioStats projects={projects} />
              </Reveal>
              <Reveal>
                <TechStack projects={projects} selectedTag={selectedTag} onSelect={selectTag} />
              </Reveal>
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

          {!loading && <ExperienceSection experience={experience} />}

          {!loading && <CredentialsSection credentials={credentials} />}

          {!loading && <SkillsSection skills={skills} />}

          {!loading && <TestimonialsSection testimonials={testimonials} />}

          {!loading && (
            <Reveal>
              <ContactSection profile={profile} />
            </Reveal>
          )}

          <PublicFooter name={profile?.name} />
        </VStack>
      </Container>

      <CaseStudyModal project={selectedProject} projects={projects} onNavigate={openProject} onClose={closeProject} />
      <BackToTop />
    </Box>
  );
}

export default PublicView;
