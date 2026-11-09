import { useEffect, useState, type ReactNode } from 'react';
import { Box, Button, Heading, HStack, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react';
import { getCredentials, type Credential } from '../../api/credentials';
import { getExperience, type Experience } from '../../api/experience';
import { getProfile, type Profile } from '../../api/profile';
import type { Project } from '../../api/projectstate';
import { getAllTestimonials, type Testimonial } from '../../api/testimonials';
import type { useInbox } from '../../hooks/useInbox';

export type AdminTab = 'projects' | 'profile' | 'experience' | 'education' | 'testimonials' | 'inbox';

interface Props {
  projects: Project[];
  projectsLoading: boolean;
  inbox: ReturnType<typeof useInbox>;
  onGoTo: (tab: AdminTab) => void;
}

interface Extras {
  profile: Profile | null;
  experience: Experience[];
  credentials: Credential[];
  testimonials: Testimonial[];
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Box p={6} bg="bg.surface" borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="border.default">
      <HStack justify="space-between" mb={4}>
        <Heading as="h2" size="sm" color="fg.default">
          {title}
        </Heading>
        {action}
      </HStack>
      {children}
    </Box>
  );
}

function StatTile({ label, value, detail, onClick }: { label: string; value: number | string; detail: string; onClick: () => void }) {
  return (
    <Box
      as="button"
      type="button"
      onClick={onClick}
      textAlign="left"
      p={5}
      bg="bg.surface"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      boxShadow="sm"
      transition="border-color 0.15s, transform 0.15s"
      _hover={{ borderColor: 'brand.400', transform: 'translateY(-1px)' }}
      _focusVisible={{ boxShadow: 'outline' }}
    >
      <Text fontSize="xs" fontWeight="bold" color="fg.secondary" textTransform="uppercase" letterSpacing="wide">
        {label}
      </Text>
      <Text fontSize="3xl" fontWeight="bold" color="fg.heading" lineHeight="short" mt={1}>
        {value}
      </Text>
      <Text fontSize="xs" color="fg.muted">
        {detail}
      </Text>
    </Box>
  );
}

/** Horizontal bars of case-study views; the number sits beside each bar, so nothing depends on color. */
function TopProjects({ projects }: { projects: Project[] }) {
  const ranked = projects
    .filter((p) => p.published !== false && (p.views ?? 0) > 0)
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, 5);
  if (ranked.length === 0) {
    return (
      <Text fontSize="sm" color="fg.muted">
        No case-study views yet. Counts appear here once visitors open your projects.
      </Text>
    );
  }
  const max = ranked[0].views ?? 1;
  return (
    <VStack as="ol" listStyleType="none" align="stretch" spacing={3}>
      {ranked.map((p) => (
        <Box as="li" key={p.id} title={`${p.title}: ${plural(p.views ?? 0, 'view')}`}>
          <HStack justify="space-between" fontSize="sm" mb={1} gap={3}>
            <Text color="fg.default" noOfLines={1}>
              {p.title}
            </Text>
            <Text color="fg.secondary" fontWeight="semibold" flexShrink={0}>
              {p.views}
            </Text>
          </HStack>
          <Box h="8px" bg="bg.subtle" borderRadius="4px" overflow="hidden">
            <Box h="full" w={`${Math.max(2, ((p.views ?? 0) / max) * 100)}%`} bg="brand.500" _dark={{ bg: 'brand.300' }} borderRadius="4px" />
          </Box>
        </Box>
      ))}
    </VStack>
  );
}

/** Things that make the public page stronger, with a shortcut to fix each. */
function Checklist({ items, onGoTo }: { items: { label: string; done: boolean; tab: AdminTab }[]; onGoTo: (t: AdminTab) => void }) {
  const done = items.filter((i) => i.done).length;
  return (
    <>
      <HStack mb={2} justify="space-between" fontSize="sm">
        <Text color="fg.secondary">
          {done} of {items.length} done
        </Text>
        <Text color="fg.muted">{Math.round((done / items.length) * 100)}%</Text>
      </HStack>
      <Box h="8px" bg="bg.subtle" borderRadius="4px" overflow="hidden" mb={4} role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={items.length} aria-label="Profile completeness">
        <Box h="full" w={`${(done / items.length) * 100}%`} bg="accent.500" _dark={{ bg: 'accent.300' }} borderRadius="4px" />
      </Box>
      <VStack as="ul" listStyleType="none" align="stretch" spacing={1}>
        {items.map((i) => (
          <HStack as="li" key={i.label} justify="space-between" py={1} fontSize="sm">
            <HStack spacing={2}>
              <Box
                as="span"
                aria-hidden
                boxSize="18px"
                borderRadius="full"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                fontSize="xs"
                fontWeight="bold"
                bg={i.done ? 'accent.100' : 'transparent'}
                color={i.done ? 'accent.700' : 'fg.subtle'}
                borderWidth={i.done ? 0 : '1.5px'}
                borderColor="border.strong"
                _dark={i.done ? { bg: 'accent.800', color: 'accent.100' } : undefined}
              >
                {i.done ? '✓' : ''}
              </Box>
              <Text color={i.done ? 'fg.muted' : 'fg.default'} textDecoration={i.done ? 'line-through' : undefined}>
                {i.label}
              </Text>
              <Text srOnly>{i.done ? '(done)' : '(to do)'}</Text>
            </HStack>
            {!i.done && (
              <Button size="xs" variant="ghost" colorScheme="brand" onClick={() => onGoTo(i.tab)}>
                Add
              </Button>
            )}
          </HStack>
        ))}
      </VStack>
    </>
  );
}

export function OverviewPanel({ projects, projectsLoading, inbox, onGoTo }: Props) {
  const [extras, setExtras] = useState<Extras | null>(null);

  useEffect(() => {
    Promise.all([
      getProfile().catch(() => null),
      getExperience().catch(() => []),
      getCredentials().catch(() => []),
      getAllTestimonials().catch(() => []),
    ]).then(([profile, experience, credentials, testimonials]) => setExtras({ profile, experience, credentials, testimonials }));
  }, []);

  if (!extras || projectsLoading || inbox.loading) {
    return (
      <VStack align="stretch" spacing={6}>
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} h="112px" borderRadius="xl" />
          ))}
        </SimpleGrid>
        <Skeleton h="240px" borderRadius="xl" />
      </VStack>
    );
  }

  const { profile, experience, credentials, testimonials } = extras;
  const published = projects.filter((p) => p.published !== false);
  const drafts = projects.length - published.length;
  const totalViews = published.reduce((sum, p) => sum + (p.views ?? 0), 0);
  const shownQuotes = testimonials.filter((t) => t.published !== false).length;
  const recent = inbox.messages.slice(0, 3);

  const checklist = [
    { label: 'Name and headline', done: Boolean(profile?.name && profile.headline), tab: 'profile' as const },
    { label: 'Profile photo', done: Boolean(profile?.avatarUrl), tab: 'profile' as const },
    { label: 'Short bio', done: Boolean(profile?.bio?.trim()), tab: 'profile' as const },
    { label: 'Résumé', done: Boolean(profile?.resumeUrl), tab: 'profile' as const },
    { label: 'At least 3 published projects', done: published.length >= 3, tab: 'projects' as const },
    { label: 'A featured project', done: published.some((p) => p.featured), tab: 'projects' as const },
    { label: 'Work experience', done: experience.length > 0, tab: 'experience' as const },
    { label: 'Education or a certification', done: credentials.length > 0, tab: 'education' as const },
    { label: 'A testimonial', done: shownQuotes > 0, tab: 'testimonials' as const },
  ];

  return (
    <VStack align="stretch" spacing={6}>
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <StatTile label="Projects" value={published.length} detail={drafts ? `${plural(drafts, 'draft')} not shown` : 'all published'} onClick={() => onGoTo('projects')} />
        <StatTile label="Case-study views" value={totalViews} detail="since counting began" onClick={() => onGoTo('projects')} />
        <StatTile
          label="Unread"
          value={inbox.failed ? '–' : inbox.unread}
          detail={inbox.failed ? 'inbox unavailable' : `of ${plural(inbox.messages.length, 'message')}`}
          onClick={() => onGoTo('inbox')}
        />
        <StatTile
          label="Testimonials"
          value={shownQuotes}
          detail={testimonials.length > shownQuotes ? `${testimonials.length - shownQuotes} hidden` : 'shown publicly'}
          onClick={() => onGoTo('testimonials')}
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} alignItems="start">
        <VStack align="stretch" spacing={6}>
          <Panel title="Most-viewed case studies">
            <TopProjects projects={projects} />
          </Panel>
          <Panel
            title="Latest messages"
            action={
              inbox.messages.length > 0 && (
                <Button size="xs" variant="ghost" colorScheme="brand" onClick={() => onGoTo('inbox')}>
                  Open inbox
                </Button>
              )
            }
          >
            {recent.length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                {inbox.failed ? 'Couldn’t load messages.' : 'No messages yet. They arrive from the contact form on your public page.'}
              </Text>
            ) : (
              <VStack as="ul" listStyleType="none" align="stretch" spacing={3}>
                {recent.map((m) => (
                  <Box as="li" key={m.id} fontSize="sm">
                    <HStack justify="space-between" gap={2}>
                      <Text fontWeight={m.read ? 'normal' : 'bold'} color="fg.heading" noOfLines={1}>
                        {m.name}
                        {!m.read && (
                          <Text as="span" fontWeight="semibold" fontSize="xs" color="fg.brand" ml={2}>
                            New
                          </Text>
                        )}
                      </Text>
                      <Text fontSize="xs" color="fg.muted" flexShrink={0}>
                        {new Date(m.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      </Text>
                    </HStack>
                    <Text color="fg.secondary" noOfLines={1}>
                      {m.body}
                    </Text>
                  </Box>
                ))}
              </VStack>
            )}
          </Panel>
        </VStack>

        <Panel title="Make your page stronger">
          <Checklist items={checklist} onGoTo={onGoTo} />
        </Panel>
      </SimpleGrid>
    </VStack>
  );
}
