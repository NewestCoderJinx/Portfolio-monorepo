import { Badge, Box, Button, Flex, Heading, HStack, Image, Tag, Text, Wrap, WrapItem } from '@chakra-ui/react';
import { formatUrl, type Project } from '../../api/projectstate';
import { formatProjectDate, hasCaseStudy } from './caseStudy';
import { ExternalIcon, GitHubIcon } from './icons';

interface Props {
  project: Project;
  onOpen: (p: Project) => void;
  onShare: (p: Project) => void;
}

/** Wide showcase card for a project the owner marked as featured. */
export function FeaturedProject({ project: p, onOpen, onShare }: Props) {
  const date = formatProjectDate(p.createdAt);
  const github = formatUrl(p.githubUrl);
  const demo = formatUrl(p.demoUrl);

  return (
    <Flex
      id={`project-${p.id}`}
      direction={{ base: 'column', md: 'row' }}
      bg="bg.surface"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="2xl"
      overflow="hidden"
      boxShadow="md"
      position="relative"
      transition="box-shadow 0.2s"
      _hover={{ boxShadow: 'lg' }}
    >
      <Box w={{ base: 'full', md: '42%' }} flexShrink={0} minH={{ base: '200px', md: '280px' }} position="relative">
        {p.imageUrl ? (
          <Image src={p.imageUrl} alt={p.title} position="absolute" inset={0} w="full" h="full" objectFit="cover" />
        ) : (
          <Flex position="absolute" inset={0} align="center" justify="center" bgGradient="linear(to-br, brand.700, accent.500)">
            <Text color="white" fontSize="7xl" fontWeight="extrabold" opacity={0.85}>
              {p.title.charAt(0).toUpperCase()}
            </Text>
          </Flex>
        )}
      </Box>

      <Flex direction="column" p={{ base: 6, md: 8 }} flex={1} borderLeftWidth={{ md: '4px' }} borderTopWidth={{ base: '4px', md: 0 }} borderColor="accent.400">
        <HStack spacing={3} mb={2}>
          <Badge colorScheme="accent" variant="subtle" borderRadius="full" px={2.5}>
            ★ Featured project
          </Badge>
          {date && (
            <Text fontSize="xs" color="fg.subtle">
              {date}
            </Text>
          )}
        </HStack>

        <Heading as="h3" size="lg" mb={3}>
          {p.title}
        </Heading>
        <Text color="fg.secondary" mb={4} noOfLines={4}>
          {p.description || 'No description provided.'}
        </Text>
        {p.problem && (
          <Text fontSize="sm" color="fg.muted" mb={4} noOfLines={2}>
            <Text as="span" fontWeight="semibold" color="fg.brand">
              Problem:{' '}
            </Text>
            {p.problem}
          </Text>
        )}

        {p.tags && p.tags.length > 0 && (
          <Wrap spacing={1.5} mb={6}>
            {p.tags.map((tag) => (
              <WrapItem key={tag}>
                <Tag size="sm" colorScheme="brand" variant="subtle" borderRadius="full">
                  {tag}
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        )}

        <HStack spacing={2} mt="auto" flexWrap="wrap">
          {hasCaseStudy(p) && (
            <Button size="sm" colorScheme="brand" onClick={() => onOpen(p)}>
              Read Case Study
            </Button>
          )}
          {demo && (
            <Button as="a" href={demo} target="_blank" rel="noopener noreferrer" size="sm" variant="outline" colorScheme="brand" rightIcon={<ExternalIcon />}>
              Live Demo
            </Button>
          )}
          {github && (
            <Button as="a" href={github} target="_blank" rel="noopener noreferrer" size="sm" variant="ghost" leftIcon={<GitHubIcon width={14} height={14} />}>
              Code
            </Button>
          )}
          <Button size="sm" variant="ghost" colorScheme="accent" onClick={() => onShare(p)}>
            Share
          </Button>
        </HStack>
      </Flex>
    </Flex>
  );
}
