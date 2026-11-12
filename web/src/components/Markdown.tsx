import { Box, Code, Divider, Heading, Image, Link, ListItem, OrderedList, Table, Td, Text, Th, UnorderedList } from '@chakra-ui/react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Raw HTML in the source is shown as text, never run: react-markdown doesn't render it without rehype-raw.
const components: Components = {
  h1: ({ children }) => <Heading as="h2" size="lg" mt={10} mb={4} color="fg.heading">{children}</Heading>,
  h2: ({ children }) => <Heading as="h2" size="md" mt={10} mb={3} color="fg.heading">{children}</Heading>,
  h3: ({ children }) => <Heading as="h3" size="sm" mt={8} mb={2} color="fg.heading">{children}</Heading>,
  h4: ({ children }) => <Heading as="h4" size="xs" mt={6} mb={2} color="fg.heading">{children}</Heading>,
  p: ({ children }) => <Text mb={5} lineHeight="tall">{children}</Text>,
  a: ({ href, children }) => {
    const external = !!href && /^https?:\/\//i.test(href);
    return (
      <Link href={href} color="fg.brand" textDecoration="underline" isExternal={external}>
        {children}
      </Link>
    );
  },
  ul: ({ children }) => <UnorderedList mb={5} spacing={1} pl={2}>{children}</UnorderedList>,
  ol: ({ children }) => <OrderedList mb={5} spacing={1} pl={2}>{children}</OrderedList>,
  li: ({ children }) => <ListItem lineHeight="tall">{children}</ListItem>,
  blockquote: ({ children }) => (
    <Box as="blockquote" borderLeftWidth="4px" borderColor="brand.400" pl={4} py={1} my={5} color="fg.secondary" fontStyle="italic">
      {children}
    </Box>
  ),
  hr: () => <Divider my={8} borderColor="border.default" />,
  img: ({ src, alt }) => <Image src={typeof src === 'string' ? src : undefined} alt={alt ?? ''} borderRadius="lg" my={6} mx="auto" maxH="480px" loading="lazy" />,
  pre: ({ children }) => (
    <Box as="pre" bg="bg.subtle" borderWidth="1px" borderColor="border.default" borderRadius="lg" p={4} my={5} overflowX="auto" fontSize="sm" sx={{ code: { bg: 'transparent', p: 0 } }}>
      {children}
    </Box>
  ),
  code: ({ children }) => <Code fontSize="0.9em" px={1} borderRadius="sm" bg="bg.subtle" color="fg.default">{children}</Code>,
  table: ({ children }) => (
    <Box overflowX="auto" my={5}>
      <Table size="sm" variant="simple">{children}</Table>
    </Box>
  ),
  th: ({ children }) => <Th borderColor="border.default">{children}</Th>,
  td: ({ children }) => <Td borderColor="border.default">{children}</Td>,
};

/** Renders a post body. GitHub-flavoured: tables, task lists, strikethrough and bare links. */
export function Markdown({ source }: { source: string }) {
  return (
    <Box color="fg.default" fontSize={{ base: 'md', md: 'lg' }} sx={{ '& > :first-child': { mt: 0 } }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </Box>
  );
}
