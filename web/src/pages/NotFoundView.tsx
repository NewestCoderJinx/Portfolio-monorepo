import { useEffect } from 'react';
import { Button, Container, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';

/**
 * Shown for addresses the app doesn't know. nginx answers every path with the app (status 200), so a
 * robots "noindex" tag stops search engines listing these pages as if they were real.
 */
export function NotFoundView() {
  const { pathname } = useLocation();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Page not found';
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex';
    document.head.appendChild(robots);
    return () => {
      document.title = previousTitle;
      robots.remove();
    };
  }, []);

  return (
    <Container maxW="container.md" py={{ base: 16, md: 24 }}>
      <VStack spacing={4} textAlign="center">
        <Text fontSize="sm" fontWeight="semibold" color="fg.brand" letterSpacing="wide">
          404
        </Text>
        <Heading as="h1" size="xl" color="fg.heading">
          Page not found
        </Heading>
        <Text color="fg.secondary" maxW="md" wordBreak="break-word">
          There's nothing at <Text as="code">{pathname}</Text>. It may have moved, or the link may have a typo.
        </Text>
        <HStack spacing={3} pt={4} wrap="wrap" justify="center">
          <Button as={RouterLink} to="/" colorScheme="brand">
            Go to the home page
          </Button>
          <Button as={RouterLink} to="/blog" variant="outline" colorScheme="brand">
            Read the blog
          </Button>
        </HStack>
      </VStack>
    </Container>
  );
}

export default NotFoundView;
