import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Link,
  SimpleGrid,
  Skeleton,
  Tag,
  Text,
  VStack,
  VisuallyHidden,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { getPosts, type PostSummary } from '../api/posts';
import { getProfile, type Profile } from '../api/profile';
import { RssIcon, SearchIcon } from '../components/public/icons';
import { PostCard } from '../components/public/PostCard';
import { PublicFooter } from '../components/public/PublicFooter';
import { applyPageMeta } from '../seo';

export function BlogListView() {
  const [posts, setPosts] = useState<PostSummary[] | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState(false);
  // The search and tag are mirrored into the URL (/blog?q=…&tag=…), so a filtered list can be shared
  // or bookmarked. State is the source of truth; the URL is only read on first load.
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(() => params.get('q') ?? '');
  /** The search actually run: the typed text, once typing pauses. */
  const [search, setSearch] = useState(() => (params.get('q') ?? '').trim());
  const [tag, setTag] = useState<string | null>(() => params.get('tag'));
  /** Results for the last search sent; ignored once the search has moved on. */
  const [results, setResults] = useState<{ search: string; posts: PostSummary[] } | null>(null);
  /** Bumped by Retry, so a failed search runs again. */
  const [attempt, setAttempt] = useState(0);

  const fetchPosts = () =>
    getPosts()
      .then(setPosts)
      .catch(() => setError(true));

  const retry = () => {
    setError(false);
    setPosts(null);
    fetchPosts();
    setAttempt((n) => n + 1);
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

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const next = new URLSearchParams(params);
    for (const [key, value] of [['q', search], ['tag', tag]] as const) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  }, [search, tag, params, setParams]);

  useEffect(() => {
    if (!search) return;
    let current = true;
    getPosts(search)
      .then((found) => current && setResults({ search, posts: found }))
      .catch(() => current && setError(true));
    return () => {
      current = false;
    };
  }, [search, attempt]);

  const tags = useMemo(() => [...new Set((posts ?? []).flatMap((p) => p.tags ?? []))].sort((a, b) => a.localeCompare(b)), [posts]);
  /** Posts for the current search (null while it's loading), before the tag filter. */
  const matching = search ? (results?.search === search ? results.posts : null) : posts;
  const shown = matching && tag ? matching.filter((p) => p.tags?.includes(tag)) : matching;
  const filtering = !!(search || tag);

  const clearFilters = () => {
    setQuery('');
    setSearch('');
    setTag(null);
  };

  return (
    <Box bg="bg.canvas" minH="calc(100vh - 70px)" py={{ base: 8, md: 12 }}>
      <Container maxW="container.lg">
        <VStack spacing={10} align="stretch">
          <Flex justify="space-between" align="flex-start" gap={4} wrap="wrap">
            <Box>
              <Heading as="h1" size="xl" color="fg.heading">
                Writing
              </Heading>
              <Text color="fg.secondary" mt={2}>
                Notes on what I build, break and learn along the way.
              </Text>
            </Box>
            <Link
              href="/rss.xml"
              display="inline-flex"
              alignItems="center"
              gap={2}
              mt={2}
              fontSize="sm"
              fontWeight="medium"
              color="fg.secondary"
              _hover={{ color: 'fg.brand' }}
              title="Follow new posts in a feed reader"
            >
              <RssIcon />
              RSS feed
            </Link>
          </Flex>

          {posts && posts.length > 0 && (
            <InputGroup bg="bg.surface" borderRadius="md" role="search">
              <InputLeftElement pointerEvents="none" color="fg.subtle">
                <SearchIcon />
              </InputLeftElement>
              <Input
                type="search"
                placeholder="Search posts by title, content or tag..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                maxLength={100}
                aria-label="Search posts"
              />
            </InputGroup>
          )}

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
          ) : shown === null ? (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} aria-busy="true">
              {[0, 1].map((i) => (
                <Skeleton key={i} h="260px" borderRadius="xl" />
              ))}
            </SimpleGrid>
          ) : shown.length === 0 ? (
            <Box textAlign="center" py={16} bg="bg.surface" borderRadius="xl" borderWidth="1px" borderColor="border.default">
              <Text color="fg.muted" mb={4}>
                No posts match {search ? `“${search}”` : 'this tag'}
                {search && tag ? ` tagged ${tag}` : ''}.
              </Text>
              <Button variant="outline" colorScheme="brand" onClick={clearFilters}>
                Clear search
              </Button>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              {shown.map((p) => (
                <PostCard key={p.id} post={p} heading="h2" />
              ))}
            </SimpleGrid>
          )}

          {/* Tells screen-reader users how many posts the search or tag left. */}
          <VisuallyHidden role="status" aria-live="polite">
            {filtering && shown ? `${shown.length} ${shown.length === 1 ? 'post' : 'posts'} found` : ''}
          </VisuallyHidden>

          <PublicFooter name={profile?.name} />
        </VStack>
      </Container>
    </Box>
  );
}

export default BlogListView;
