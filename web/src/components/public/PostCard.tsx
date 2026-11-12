import { Box, Heading, HStack, Image, LinkBox, LinkOverlay, Tag, Text, Wrap } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { formatPostDate, type PostSummary } from '../../api/posts';

/** One post in a list. The whole card is a link to /blog/<slug>. */
export function PostCard({ post, compact = false }: { post: PostSummary; compact?: boolean }) {
  return (
    <LinkBox
      as="article"
      h="full"
      display="flex"
      flexDirection="column"
      bg="bg.surface"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="xl"
      overflow="hidden"
      transition="border-color 0.15s, transform 0.15s"
      _hover={{ borderColor: 'brand.400', transform: 'translateY(-2px)' }}
    >
      {post.coverImageUrl && !compact && (
        <Image src={post.coverImageUrl} alt="" h="180px" w="full" objectFit="cover" loading="lazy" />
      )}
      <Box p={{ base: 5, md: 6 }} flex={1} display="flex" flexDirection="column">
        <Text as="time" dateTime={post.publishedAt ?? undefined} fontSize="xs" color="fg.muted" mb={1}>
          {formatPostDate(post.publishedAt)}
        </Text>
        <Heading as="h3" size="sm" color="fg.heading" mb={2} lineHeight="short">
          <LinkOverlay as={RouterLink} to={`/blog/${post.slug}`}>
            {post.title}
          </LinkOverlay>
        </Heading>
        {post.excerpt && (
          <Text fontSize="sm" color="fg.secondary" noOfLines={3} flex={1}>
            {post.excerpt}
          </Text>
        )}
        {post.tags && post.tags.length > 0 && (
          <Wrap spacing={2} mt={4}>
            {post.tags.slice(0, 4).map((t) => (
              <Tag key={t} size="sm" variant="subtle" colorScheme="brand">
                {t}
              </Tag>
            ))}
          </Wrap>
        )}
        <HStack mt={4} fontSize="sm" fontWeight="semibold" color="fg.brand">
          <Text>Read post →</Text>
        </HStack>
      </Box>
    </LinkBox>
  );
}
