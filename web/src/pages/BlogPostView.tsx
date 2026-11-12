import { useEffect, useState } from 'react';
import { Avatar, Box, Button, Container, Divider, Heading, HStack, Image, Skeleton, SkeletonText, Tag, Text, VStack, Wrap } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { formatPostDate, getPost, readingTime, type Post } from '../api/posts';
import { getProfile, type Profile } from '../api/profile';
import { Markdown } from '../components/Markdown';
import { BackToTop } from '../components/public/BackToTop';
import { PublicFooter } from '../components/public/PublicFooter';
import { applyPageMeta } from '../seo';

type Loaded = { status: 'ready'; post: Post } | { status: 'missing' } | { status: 'error' };
type State = { status: 'loading' } | Loaded;

export function BlogPostView() {
  const { slug = '' } = useParams();
  // The result is tagged with the slug and attempt it answers, so a new link or a retry shows the loader again.
  const [result, setResult] = useState<{ key: string; value: Loaded } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    getProfile().then(setProfile).catch(() => setProfile(null));
  }, []);

  const key = `${slug}#${attempt}`;
  const state: State = result?.key === key ? result.value : { status: 'loading' };

  useEffect(() => {
    let live = true;
    const settle = (value: Loaded) => live && setResult({ key, value });
    getPost(slug)
      .then((post) => settle({ status: 'ready', post }))
      .catch((err) => settle({ status: isAxiosError(err) && err.response?.status === 404 ? 'missing' : 'error' }));
    window.scrollTo({ top: 0 });
    return () => {
      live = false;
    };
  }, [slug, key]);

  const post = state.status === 'ready' ? state.post : null;

  useEffect(() => {
    if (!post) return;
    applyPageMeta({
      title: profile?.name ? `${post.title} | ${profile.name}` : post.title,
      description: post.excerpt || post.body,
      image: post.coverImageUrl || profile?.avatarUrl,
      url: `${window.location.origin}/blog/${post.slug}`,
    });
  }, [post, profile]);

  return (
    <Box bg="bg.canvas" minH="calc(100vh - 70px)" py={{ base: 8, md: 12 }}>
      <Container maxW="container.md">
        <Button as={RouterLink} to="/blog" variant="ghost" size="sm" ml={-3} mb={6}>
          ← All posts
        </Button>

        {state.status === 'loading' && (
          <VStack align="stretch" spacing={6}>
            <Skeleton h="44px" w="80%" />
            <Skeleton h="16px" w="40%" />
            <SkeletonText noOfLines={8} spacing={4} />
          </VStack>
        )}

        {state.status === 'missing' && (
          <Box textAlign="center" py={16}>
            <Heading size="md" mb={2}>
              Post not found
            </Heading>
            <Text color="fg.secondary" mb={6}>
              It may have been moved or unpublished.
            </Text>
            <Button as={RouterLink} to="/blog" colorScheme="brand">
              See all posts
            </Button>
          </Box>
        )}

        {state.status === 'error' && (
          <Box textAlign="center" py={16}>
            <Text color="fg.secondary" mb={4}>
              Couldn't load this post. The server may be offline.
            </Text>
            <Button colorScheme="brand" onClick={() => setAttempt((n) => n + 1)}>
              Retry
            </Button>
          </Box>
        )}

        {post && (
          <Box as="article">
            <Heading as="h1" size={{ base: 'xl', md: '2xl' }} color="fg.heading" lineHeight="shorter" mb={4}>
              {post.title}
            </Heading>
            <HStack spacing={3} color="fg.muted" fontSize="sm" mb={6} flexWrap="wrap">
              {profile && <Avatar size="xs" name={profile.name} src={profile.avatarUrl ?? undefined} />}
              {profile && <Text color="fg.secondary">{profile.name}</Text>}
              <Text>
                <time dateTime={post.publishedAt ?? undefined}>{formatPostDate(post.publishedAt)}</time> · {readingTime(post.body)}
              </Text>
            </HStack>
            {post.coverImageUrl && <Image src={post.coverImageUrl} alt="" w="full" maxH="420px" objectFit="cover" borderRadius="xl" mb={8} />}
            <Markdown source={post.body} />
            {post.tags && post.tags.length > 0 && (
              <Wrap spacing={2} mt={8}>
                {post.tags.map((t) => (
                  <Tag key={t} variant="subtle" colorScheme="brand">
                    {t}
                  </Tag>
                ))}
              </Wrap>
            )}
          </Box>
        )}

        <Divider my={12} borderColor="border.default" />
        <PublicFooter name={profile?.name} />
      </Container>
      <BackToTop />
    </Box>
  );
}

export default BlogPostView;
