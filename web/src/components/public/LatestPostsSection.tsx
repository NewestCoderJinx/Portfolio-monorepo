import { useEffect, useState } from 'react';
import { Box, Button, Heading, HStack, SimpleGrid, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { getPosts, type PostSummary } from '../../api/posts';
import { PostCard } from './PostCard';
import { Reveal } from './Reveal';

const SHOWN = 3;

/** The newest posts on the home page. Renders nothing until a post is published, or if the blog can't load. */
export function LatestPostsSection() {
  const [posts, setPosts] = useState<PostSummary[]>([]);

  useEffect(() => {
    getPosts()
      .then(setPosts)
      .catch(() => setPosts([]));
  }, []);

  if (posts.length === 0) return null;

  return (
    <Box id="writing" scrollMarginTop="90px">
      <HStack justify="space-between" align="end" mb={6} gap={4}>
        <Box>
          <Heading as="h2" size="lg">
            Latest Writing
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Notes on what I build and learn
          </Text>
        </Box>
        {posts.length > SHOWN && (
          <Button as={RouterLink} to="/blog" variant="ghost" size="sm" colorScheme="brand" flexShrink={0}>
            All posts ({posts.length})
          </Button>
        )}
      </HStack>
      <SimpleGrid columns={{ base: 1, md: Math.min(posts.length, SHOWN) }} spacing={6}>
        {posts.slice(0, SHOWN).map((p, i) => (
          <Reveal key={p.id} delay={i * 0.08}>
            <PostCard post={p} compact />
          </Reveal>
        ))}
      </SimpleGrid>
    </Box>
  );
}
