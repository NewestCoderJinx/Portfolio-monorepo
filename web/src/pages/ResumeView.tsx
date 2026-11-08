import { useEffect, type ReactNode } from 'react';
import { Box, Button, Container, Divider, Heading, HStack, Link, Spinner, Text, VStack } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { formatDuration, formatPeriod } from '../api/experience';
import { formatUrl, type Project } from '../api/projectstate';
import { ArrowLeftIcon, FileIcon } from '../components/public/icons';
import { usePortfolio } from '../hooks/usePortfolio';

const MAX_PROJECTS = 4;
const MAX_SKILLS = 24;

/** "github.com/name" rather than "https://github.com/name/", since this is meant to be printed. */
const shortUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');

/** Most-used first: every skill from experience entries and project tags, de-duplicated case-insensitively. */
function collectSkills(lists: (string[] | null | undefined)[]): string[] {
  const counts = new Map<string, { name: string; n: number }>();
  for (const list of lists) {
    for (const raw of list ?? []) {
      const name = raw.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      const entry = counts.get(key) ?? { name, n: 0 };
      entry.n += 1;
      counts.set(key, entry);
    }
  }
  return [...counts.values()].sort((a, b) => b.n - a.n).slice(0, MAX_SKILLS).map((e) => e.name);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box as="section" mt={7}>
      <Heading as="h2" fontSize="sm" textTransform="uppercase" letterSpacing="widest" color="brand.700" mb={1}>
        {title}
      </Heading>
      <Divider borderColor="gray.300" mb={4} />
      {children}
    </Box>
  );
}

function ProjectEntry({ p }: { p: Project }) {
  const links = [formatUrl(p.demoUrl), formatUrl(p.githubUrl)].filter(Boolean) as string[];
  return (
    <Box sx={{ breakInside: 'avoid' }}>
      <Text fontWeight="bold" color="gray.900">
        {p.title}
      </Text>
      {p.description && (
        <Text fontSize="sm" color="gray.700">
          {p.description}
        </Text>
      )}
      {(p.tags?.length || links.length > 0) && (
        <Text fontSize="xs" color="gray.600" mt={0.5}>
          {[p.tags?.join(', '), ...links.map(shortUrl)].filter(Boolean).join('  ·  ')}
        </Text>
      )}
    </Box>
  );
}

/**
 * A one-page CV built from the portfolio data, styled as a white sheet in both color modes
 * and laid out for "Print / Save as PDF".
 */
export function ResumeView() {
  const { profile, projects, experience, loading, error, retry } = usePortfolio();

  // The document title becomes the default file name when saving as PDF.
  useEffect(() => {
    if (!profile?.name) return;
    const previous = document.title;
    document.title = `${profile.name} - Résumé`;
    return () => {
      document.title = previous;
    };
  }, [profile?.name]);

  if (loading) {
    return (
      <VStack py={24}>
        <Spinner color="brand.500" />
      </VStack>
    );
  }

  if (error || !profile) {
    return (
      <Container maxW="container.sm" py={24} textAlign="center">
        <Text color="fg.secondary" mb={4}>
          {error ? 'Couldn’t load the résumé. The server may be offline.' : 'The résumé will appear here once the profile is set up.'}
        </Text>
        {error ? (
          <Button colorScheme="brand" onClick={retry}>
            Retry
          </Button>
        ) : (
          <Button as={RouterLink} to="/" variant="outline">
            Back to portfolio
          </Button>
        )}
      </Container>
    );
  }

  const contact = [
    profile.location,
    profile.email,
    ...[profile.websiteUrl, profile.githubUrl, profile.linkedinUrl].map((u) => formatUrl(u)).filter(Boolean).map((u) => shortUrl(u as string)),
  ].filter(Boolean) as string[];
  const selected = [...projects.filter((p) => p.featured), ...projects.filter((p) => !p.featured)].slice(0, MAX_PROJECTS);
  const skills = collectSkills([...experience.map((e) => e.skills), ...projects.map((p) => p.tags)]);
  const pdf = formatUrl(profile.resumeUrl);

  return (
    <Box bg="bg.canvas" py={{ base: 6, md: 10 }} px={{ base: 4, md: 0 }} className="resume-page">
      <Container maxW="820px" px={0}>
        <HStack className="no-print" justify="space-between" mb={4} flexWrap="wrap" gap={2}>
          <Button as={RouterLink} to="/" variant="ghost" size="sm" leftIcon={<ArrowLeftIcon />}>
            Portfolio
          </Button>
          <HStack spacing={2}>
            {pdf && (
              <Button as="a" href={pdf} target="_blank" rel="noopener noreferrer" size="sm" variant="outline" bg="bg.surface" leftIcon={<FileIcon />}>
                Original PDF
              </Button>
            )}
            <Button size="sm" colorScheme="brand" onClick={() => window.print()}>
              Print / Save as PDF
            </Button>
          </HStack>
        </HStack>

        <Box
          as="article"
          className="resume-sheet"
          bg="white"
          color="gray.800"
          borderRadius="md"
          boxShadow="lg"
          px={{ base: 6, md: 12 }}
          py={{ base: 8, md: 12 }}
        >
          <Box as="header">
            <Heading as="h1" fontSize={{ base: '2xl', md: '3xl' }} color="gray.900" letterSpacing="tight">
              {profile.name}
            </Heading>
            {profile.headline && (
              <Text fontSize="lg" color="brand.700" fontWeight="medium">
                {profile.headline}
              </Text>
            )}
            {contact.length > 0 && (
              <Text fontSize="sm" color="gray.600" mt={2}>
                {contact.join('  ·  ')}
              </Text>
            )}
          </Box>

          {profile.bio && (
            <Section title="Summary">
              <Text fontSize="sm" lineHeight="tall" whiteSpace="pre-line">
                {profile.bio}
              </Text>
            </Section>
          )}

          {experience.length > 0 && (
            <Section title="Experience">
              <VStack align="stretch" spacing={5}>
                {experience.map((e) => {
                  const bullets = (e.description ?? '').split('\n').map((l) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
                  return (
                    <Box key={e.id} sx={{ breakInside: 'avoid' }}>
                      <HStack justify="space-between" align="baseline" flexWrap="wrap" columnGap={4}>
                        <Text fontWeight="bold" color="gray.900">
                          {e.role}
                          <Text as="span" fontWeight="normal" color="gray.700">
                            {' '}
                            · {e.company}
                          </Text>
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {formatPeriod(e)} ({formatDuration(e)})
                        </Text>
                      </HStack>
                      {e.location && (
                        <Text fontSize="xs" color="gray.600">
                          {e.location}
                        </Text>
                      )}
                      {bullets.length > 0 && (
                        <Box as="ul" pl={5} mt={1.5} fontSize="sm" lineHeight="tall">
                          {bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </VStack>
            </Section>
          )}

          {selected.length > 0 && (
            <Section title="Selected Projects">
              <VStack align="stretch" spacing={4}>
                {selected.map((p) => (
                  <ProjectEntry key={p.id} p={p} />
                ))}
              </VStack>
            </Section>
          )}

          {skills.length > 0 && (
            <Section title="Skills">
              <Text fontSize="sm" lineHeight="tall">
                {skills.join('  ·  ')}
              </Text>
            </Section>
          )}

          <Text className="no-print" fontSize="xs" color="gray.500" mt={10} textAlign="center">
            Generated from{' '}
            <Link as={RouterLink} to="/" color="brand.700">
              the live portfolio
            </Link>
            , so it is always up to date.
          </Text>
        </Box>
      </Container>
    </Box>
  );
}

export default ResumeView;
