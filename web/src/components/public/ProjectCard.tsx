import { Badge, Box, Button, Card, CardBody, Flex, Heading, HStack, Image, Tag, Text, Wrap, WrapItem } from '@chakra-ui/react';
import { formatUrl, type Project } from '../../api/projectstate';
import { formatProjectDate, hasCaseStudy } from './caseStudy';
import { ExternalIcon, GitHubIcon } from './icons';

const MAX_TAGS = 4;

interface Props {
  project: Project;
  onOpen: (p: Project) => void;
  onShare: (p: Project) => void;
}

export function ProjectCard({ project: p, onOpen, onShare }: Props) {
  const tags = p.tags || [];
  const date = formatProjectDate(p.createdAt);
  const github = formatUrl(p.githubUrl);
  const demo = formatUrl(p.demoUrl);

  return (
    <Card
      id={`project-${p.id}`}
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      overflow="hidden"
      boxShadow="sm"
      bg="white"
      transition="all 0.2s"
      _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
    >
      <Box position="relative">
        {p.imageUrl ? (
          <Image src={p.imageUrl} alt={p.title} h="170px" w="full" objectFit="cover" />
        ) : (
          <Flex h="170px" align="center" justify="center" bgGradient="linear(to-br, blue.500, purple.500)">
            <Text color="white" fontSize="5xl" fontWeight="bold" opacity={0.85}>
              {p.title.charAt(0).toUpperCase()}
            </Text>
          </Flex>
        )}
        {p.featured && (
          <Badge position="absolute" top={3} left={3} colorScheme="yellow" variant="solid" borderRadius="full" px={2.5} py={0.5} boxShadow="sm">
            ★ Featured
          </Badge>
        )}
      </Box>

      <CardBody p={5} display="flex" flexDirection="column">
        <Box flex="1">
          {date && (
            <Text fontSize="xs" color="gray.400" mb={1}>
              {date}
            </Text>
          )}
          <Heading size="md" color="gray.800" mb={2}>
            {p.title}
          </Heading>
          <Text color="gray.600" fontSize="sm" mb={4} noOfLines={3}>
            {p.description || 'No description provided.'}
          </Text>

          {tags.length > 0 && (
            <Wrap mb={4} spacing={1.5}>
              {tags.slice(0, MAX_TAGS).map((tag) => (
                <WrapItem key={tag}>
                  <Tag size="sm" colorScheme="blue" variant="subtle" borderRadius="full">
                    {tag}
                  </Tag>
                </WrapItem>
              ))}
              {tags.length > MAX_TAGS && (
                <WrapItem>
                  <Tag size="sm" variant="subtle" borderRadius="full">
                    +{tags.length - MAX_TAGS}
                  </Tag>
                </WrapItem>
              )}
            </Wrap>
          )}
        </Box>

        <Box pt={4} borderTopWidth="1px" borderColor="gray.100">
          {hasCaseStudy(p) && (
            <Button size="sm" colorScheme="blue" variant="outline" w="full" mb={2} onClick={() => onOpen(p)}>
              Read Case Study
            </Button>
          )}
          <HStack spacing={2}>
            {github && (
              <Button as="a" href={github} target="_blank" rel="noopener noreferrer" size="xs" variant="outline" leftIcon={<GitHubIcon width={14} height={14} />} flex={1}>
                Code
              </Button>
            )}
            {demo && (
              <Button as="a" href={demo} target="_blank" rel="noopener noreferrer" size="xs" colorScheme="blue" rightIcon={<ExternalIcon />} flex={1}>
                Live Demo
              </Button>
            )}
            <Button size="xs" variant="ghost" colorScheme="teal" onClick={() => onShare(p)}>
              Share
            </Button>
          </HStack>
        </Box>
      </CardBody>
    </Card>
  );
}
