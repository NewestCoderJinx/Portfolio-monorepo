import { AspectRatio, Badge, Box, Button, Card, CardBody, Flex, Heading, HStack, IconButton, Image, Tag, Text, Wrap, WrapItem } from '@chakra-ui/react';
import { formatUrl, type Project } from '../../api/projectstate';
import { formatProjectDate, hasCaseStudy } from './caseStudy';
import { ArrowRightIcon, ExternalIcon, GitHubIcon, ShareIcon } from './icons';
import { ProjectCover } from './ProjectCover';

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
  const caseStudy = hasCaseStudy(p);

  return (
    <Card
      id={`project-${p.id}`}
      role="group"
      h="full"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="2xl"
      overflow="hidden"
      boxShadow="sm"
      bg="bg.surface"
      transition="box-shadow 0.2s, transform 0.2s, border-color 0.2s"
      _hover={{ boxShadow: 'lg', transform: 'translateY(-3px)', borderColor: 'border.strong' }}
      sx={{ '@media (prefers-reduced-motion: reduce)': { _hover: { transform: 'none' } } }}
    >
      <AspectRatio ratio={16 / 9} overflow="hidden">
        <Box>
          {p.imageUrl ? (
            // The title is right below, so the image is decorative for screen readers.
            <Image
              src={p.imageUrl}
              alt=""
              w="full"
              h="full"
              objectFit="cover"
              loading="lazy"
              decoding="async"
              transition="transform 0.4s"
              _groupHover={{ transform: 'scale(1.04)' }}
            />
          ) : (
            <ProjectCover project={p} />
          )}
          {p.featured && (
            <Badge position="absolute" top={3} right={3} colorScheme="yellow" variant="solid" borderRadius="full" px={2.5} py={0.5} boxShadow="sm">
              ★ Featured
            </Badge>
          )}
        </Box>
      </AspectRatio>

      <CardBody p={5} display="flex" flexDirection="column">
        <Box flex="1">
          {date && (
            <Text fontSize="xs" color="fg.subtle" mb={1}>
              {date}
            </Text>
          )}
          <Heading as="h3" size="md" color="fg.heading" mb={2} lineHeight="short">
            {caseStudy ? (
              <Box
                as="button"
                sx={{ font: 'inherit' }}
                textAlign="left"
                onClick={() => onOpen(p)}
                _hover={{ color: 'fg.brand' }}
                _focusVisible={{ outline: '2px solid', outlineColor: 'brand.400', outlineOffset: '2px', borderRadius: 'sm' }}
              >
                {p.title}
              </Box>
            ) : (
              p.title
            )}
          </Heading>
          <Text color="fg.secondary" fontSize="sm" mb={4} noOfLines={3}>
            {p.description || 'No description provided.'}
          </Text>

          {tags.length > 0 && (
            <Wrap mb={4} spacing={1.5}>
              {tags.slice(0, MAX_TAGS).map((tag) => (
                <WrapItem key={tag}>
                  <Tag size="sm" colorScheme="brand" variant="subtle" borderRadius="full">
                    {tag}
                  </Tag>
                </WrapItem>
              ))}
              {tags.length > MAX_TAGS && (
                <WrapItem>
                  <Tag size="sm" variant="subtle" borderRadius="full" title={tags.slice(MAX_TAGS).join(', ')}>
                    +{tags.length - MAX_TAGS}
                  </Tag>
                </WrapItem>
              )}
            </Wrap>
          )}
        </Box>

        <Flex pt={3} borderTopWidth="1px" borderColor="border.subtle" align="center" justify="space-between" gap={2}>
          {caseStudy ? (
            <Button
              variant="link"
              colorScheme="brand"
              size="sm"
              rightIcon={<ArrowRightIcon />}
              onClick={() => onOpen(p)}
              // The visible words come first in the name, so voice control ("click Read case study") still works.
              aria-label={`Read case study: ${p.title}`}
              sx={{ '& svg': { transition: 'transform 0.2s' } }}
              _hover={{ textDecoration: 'none', '& svg': { transform: 'translateX(3px)' } }}
            >
              Read case study
            </Button>
          ) : (
            <Box />
          )}
          <HStack spacing={1}>
            {github && (
              <IconButton
                as="a"
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Source code for ${p.title} (opens in a new tab)`}
                title="Source code"
                icon={<GitHubIcon />}
                size="sm"
                variant="ghost"
                color="fg.secondary"
              />
            )}
            {demo && (
              <IconButton
                as="a"
                href={demo}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Live demo of ${p.title} (opens in a new tab)`}
                title="Live demo"
                icon={<ExternalIcon />}
                size="sm"
                variant="ghost"
                color="fg.secondary"
              />
            )}
            <IconButton
              aria-label={`Share ${p.title}`}
              title="Share"
              icon={<ShareIcon />}
              size="sm"
              variant="ghost"
              color="fg.secondary"
              onClick={() => onShare(p)}
            />
          </HStack>
        </Flex>
      </CardBody>
    </Card>
  );
}
