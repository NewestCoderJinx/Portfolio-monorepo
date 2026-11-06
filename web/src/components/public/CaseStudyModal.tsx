import {
  Badge,
  Box,
  Button,
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
import { formatUrl, type Project } from '../../api/projectstate';
import { CASE_STUDY_SECTIONS, formatProjectDate } from './caseStudy';
import { ExternalIcon, GitHubIcon } from './icons';

interface Props {
  project: Project | null;
  onClose: () => void;
}

export function CaseStudyModal({ project, onClose }: Props) {
  const github = formatUrl(project?.githubUrl);
  const demo = formatUrl(project?.demoUrl);
  // Only show the sections that were actually written.
  const sections = project ? CASE_STUDY_SECTIONS.filter((s) => project[s.key]?.trim()) : [];

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

            <ModalBody pb={6}>
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

            {(github || demo) && (
              <ModalFooter gap={2} borderTopWidth="1px" borderColor="border.subtle">
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
