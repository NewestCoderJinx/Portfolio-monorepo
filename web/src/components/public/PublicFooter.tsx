import { Flex, HStack, Link, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { isAuthenticated } from '../../api/auth';
import { scrollBehavior } from '../../motion';
import { ArrowUpIcon, RssIcon } from './icons';

const footerLink = { color: 'fg.muted', _hover: { color: 'fg.brand' } } as const;

export function PublicFooter({ name }: { name?: string }) {
  return (
    <Flex
      as="footer"
      direction={{ base: 'column', sm: 'row' }}
      justify="space-between"
      align="center"
      gap={3}
      pt={6}
      borderTopWidth="1px"
      borderColor="border.default"
      fontSize="sm"
      color="fg.subtle"
    >
      <Text>
        © {new Date().getFullYear()} {name ?? 'Portfolio'}
      </Text>
      <HStack as="nav" aria-label="Footer" spacing={5} flexWrap="wrap" justify="center">
        <Link as={RouterLink} to="/resume" {...footerLink}>
          Résumé
        </Link>
        <Link href="/rss.xml" display="inline-flex" alignItems="center" gap={1} {...footerLink}>
          <RssIcon width={14} height={14} /> RSS
        </Link>
        {!isAuthenticated() && (
          <Link as={RouterLink} to="/admin" {...footerLink}>
            Admin
          </Link>
        )}
        <Link
          href="#top"
          display="inline-flex"
          alignItems="center"
          gap={1}
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: scrollBehavior() });
          }}
          {...footerLink}
        >
          Back to top <ArrowUpIcon width={14} height={14} />
        </Link>
      </HStack>
    </Flex>
  );
}
