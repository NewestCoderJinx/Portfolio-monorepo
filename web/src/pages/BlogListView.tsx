import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Container, Heading, SimpleGrid, Skeleton, Tag, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react';
import { getPosts, type PostSummary } from '../api/posts';
import { getProfile, type Profile } from '../api/profile';
import { PostCard } from '../components/public/PostCard';
import { PublicFooter } from '../components/public/PublicFooter';
import { applyPageMeta } from '../seo';

export function BlogListView() {
  const [posts, setPosts] = useState<PostSummary[] | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState(false);
  const [tag, setTag] = useState<string | null>(null);

  const fetchPosts = () =>
    getPosts()
      .then(setPosts)
      .catch(() => setError(true));

  const retry = () => {
    setError(false);
    setPosts(null);
    fetchPosts();
  };

  useEffect(() => {
    fetchPosts();
    getProfile().then(setProfile).catch(() => setProfile(null));
  }, []);

  useEffect(() => {
    const name = profile?.name;
    applyPageMeta({
      title: name ? `Writing | ${name}` : 'Writing',
      description: name ? `Posts by ${name}${profile?.headline ? `, ${profile.headline}` : ''}.` : 'Posts and notes.',
      image: profile?.avatarUrl,
      url: `${window.location.origin}/blog`,
    });
  }, [profile]);

  const tags = useMemo(() => [...new Set((posts ?? []).flatMap((p) => p.tags ?? []))].sort((a, b) => a.localeCompare(b)), [posts]);
  const shown = tag ? (posts ?? []).filter((p) => p.tags?.includes(tag)) : posts ?? [];

  return (
    <Box bg="bg.canvas" minH="calc(100vh - 70px)" py={{ base: 8, md: 12 }}>
      <Container maxW="container.lg">
        <VStack spacing={10} align="stretch">
          <Box>
            <Heading as="h1" size="xl" color="fg.heading">
              Writing
            </Heading>
            <Text color="fg.secondary" mt={2}>
              Notes on what I build, break and learn along the way.
            </Text>
          </Box>

          {tags.length > 1 && (
            <Wrap spacing={2} role="group" aria-label="Filter by tag">
              {[null, ...tags].map((t) => (
                <WrapItem key={t ?? 'all'}>
                  <Tag
                    as="button"
                    size="md"
                    cursor="pointer"
                    variant={tag === t ? 'solid' : 'subtle'}
                    colorScheme={tag === t ? 'brand' : 'gray'}
                    aria-pressed={tag === t}
                    onClick={() => setTag(t)}
                  >
                    {t ?? 'All'}
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          )}

          {error ? (
            <Box textAlign="center" py={16}>
              <Text color="fg.secondary" mb={4}>
                Couldn't load the posts. The server may be offline.
              </Text>
              <Button colorScheme="brand" onClick={retry}>
                Retry
              </Button>
            </Box>
          ) : posts === null ? (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} h="260px" borderRadius="xl" />
              ))}
            </SimpleGrid>
          ) : posts.length === 0 ? (
            <Box textAlign="center" py={16} bg="bg.surface" borderRadius="xl" borderWidth="1px" borderColor="border.default">
              <Text color="fg.muted">No posts yet. Check back soon.</Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              {shown.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </SimpleGrid>
          )}

          <PublicFooter name={profile?.name} />
        </VStack>
      </Container>
    </Box>
  );
}

export default BlogListView;
