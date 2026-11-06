import {
  Badge,
  Box,
  Button,
  IconButton,
  Divider,
  Heading,
  HStack,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Tag,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { useEffect } from 'react';
import { formatUrl, type Project } from '../../api/projectstate';
import { CASE_STUDY_SECTIONS, formatProjectDate, hasCaseStudy } from './caseStudy';
import { ArrowLeftIcon, ArrowRightIcon, ExternalIcon, GitHubIcon } from './icons';

interface Props {
  project: Project | null;
  /** All projects, in display order; previous/next steps through the ones with a case study. */
  projects: Project[];
  onNavigate: (p: Project) => void;
  onClose: () => void;
}

export function CaseStudyModal({ project, projects, onNavigate, onClose }: Props) {
  const github = formatUrl(project?.githubUrl);
  const demo = formatUrl(project?.demoUrl);
  // Only show the sections that were actually written.
  const sections = project ? CASE_STUDY_SECTIONS.filter((s) => project[s.key]?.trim()) : [];

  const stops = projects.filter(hasCaseStudy);
  const index = project ? stops.findIndex((p) => p.id === project.id) : -1;
  const prev = index > 0 ? stops[index - 1] : null;
  const next = index >= 0 && index < stops.length - 1 ? stops[index + 1] : null;
  const showNav = index >= 0 && stops.length > 1;

  // Left/right arrow keys page through case studies while the dialog is open.
  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowLeft' && prev) onNavigate(prev);
      if (e.key === 'ArrowRight' && next) onNavigate(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [project, prev, next, onNavigate]);

  return (
    <Modal isOpen={Boolean(project)} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent borderRadius="xl">
        {project && (
          <>
            <ModalHeader>
              <VStack align="start" spacing={1}>
                <HStack>
                  <Badge colorScheme="brand">Case Study</Badge>
                  {formatProjectDate(project.createdAt) && (
                    <Text fontSize="xs" color="fg.subtle" fontWeight="normal">
                      {formatProjectDate(project.createdAt)}
                    </Text>
                  )}
                </HStack>
                <Heading size="lg">{project.title}</Heading>
              </VStack>
            </ModalHeader>
            <ModalCloseButton />

            <ModalBody pb={6} key={project.id}>
              <VStack align="stretch" spacing={5}>
                {project.imageUrl && (
                  <Image src={project.imageUrl} alt={project.title} borderRadius="lg" maxH="260px" objectFit="cover" />
                )}

                {project.description && <Text color="fg.default" fontSize="md">{project.description}</Text>}

                {project.tags && project.tags.length > 0 && (
                  <Wrap spacing={1.5}>
                    {project.tags.map((tag) => (
                      <WrapItem key={tag}>
                        <Tag size="sm" colorScheme="brand" borderRadius="full">
                          {tag}
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                )}

                {sections.length > 0 && <Divider />}

                {sections.map((s) => (
                  <Box key={s.key}>
                    <Heading size="xs" color="fg.brand" textTransform="uppercase" letterSpacing="wide" mb={2}>
                      {s.title}
                    </Heading>
                    <Text color="fg.default" whiteSpace="pre-line" lineHeight="tall">
                      {project[s.key]}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </ModalBody>

            {(github || demo || showNav) && (
              <ModalFooter gap={2} borderTopWidth="1px" borderColor="border.subtle" flexWrap="wrap">
                {showNav && (
                  <HStack spacing={1} mr="auto">
                    <IconButton
                      aria-label={prev ? `Previous case study: ${prev.title}` : 'No previous case study'}
                      title={prev ? `Previous: ${prev.title}` : undefined}
                      icon={<ArrowLeftIcon />}
                      variant="ghost"
                      size="sm"
                      isDisabled={!prev}
                      onClick={() => prev && onNavigate(prev)}
                    />
                    <Text fontSize="xs" color="fg.muted" minW="3.5em" textAlign="center" aria-live="polite">
                      {index + 1} of {stops.length}
                    </Text>
                    <IconButton
                      aria-label={next ? `Next case study: ${next.title}` : 'No next case study'}
                      title={next ? `Next: ${next.title}` : undefined}
                      icon={<ArrowRightIcon />}
                      variant="ghost"
                      size="sm"
                      isDisabled={!next}
                      onClick={() => next && onNavigate(next)}
                    />
                  </HStack>
                )}
                {github && (
                  <Button as="a" href={github} target="_blank" rel="noopener noreferrer" variant="outline" leftIcon={<GitHubIcon />}>
                    View Code
                  </Button>
                )}
                {demo && (
                  <Button as="a" href={demo} target="_blank" rel="noopener noreferrer" colorScheme="brand" rightIcon={<ExternalIcon />}>
                    Live Demo
                  </Button>
                )}
              </ModalFooter>
            )}
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
