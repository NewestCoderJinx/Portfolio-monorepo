import { Box, Heading, HStack, Link, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { formatCredentialDates, type Credential, type CredentialKind } from '../../api/credentials';
import { ExternalIcon } from './icons';
import { Reveal } from './Reveal';

const GROUPS: { kind: CredentialKind; title: string; linkLabel: string }[] = [
  { kind: 'education', title: 'Education', linkLabel: 'Details' },
  { kind: 'certification', title: 'Certifications', linkLabel: 'Verify' },
];

function CredentialCard({ c, linkLabel }: { c: Credential; linkLabel: string }) {
  const dates = formatCredentialDates(c);
  return (
    <Box bg="bg.surface" borderWidth="1px" borderColor="border.default" borderRadius="xl" p={5}>
      <HStack justify="space-between" align="start" gap={3}>
        <Box minW={0}>
          <Heading as="h4" size="sm" color="fg.heading">
            {c.title}
          </Heading>
          <Text fontWeight="semibold" fontSize="sm" color="fg.brand">
            {c.institution}
          </Text>
        </Box>
        {c.credentialUrl && (
          <Link
            href={c.credentialUrl}
            isExternal
            fontSize="sm"
            fontWeight="semibold"
            color="fg.brand"
            display="inline-flex"
            alignItems="center"
            gap={1}
            flexShrink={0}
            aria-label={`${linkLabel}: ${c.title}`}
          >
            {linkLabel} <ExternalIcon width={13} height={13} />
          </Link>
        )}
      </HStack>
      {dates && (
        <Text fontSize="sm" color="fg.muted" mt={1}>
          {dates}
        </Text>
      )}
      {c.description && (
        <Text fontSize="sm" color="fg.secondary" mt={2} whiteSpace="pre-line">
          {c.description}
        </Text>
      )}
    </Box>
  );
}

/** Degrees and certificates, grouped. Renders nothing until the owner adds one. */
export function CredentialsSection({ credentials }: { credentials: Credential[] }) {
  const groups = GROUPS.map((g) => ({ ...g, items: credentials.filter((c) => c.kind === g.kind) })).filter((g) => g.items.length > 0);
  if (groups.length === 0) return null;

  const heading = groups.length === 2 ? 'Education & Certifications' : groups[0].title;

  return (
    <Box id="education" scrollMarginTop="90px">
      <Heading as="h2" size="lg">
        {heading}
      </Heading>
      <Text color="fg.muted" fontSize="sm" mb={6}>
        Where I studied and what I am certified in
      </Text>
      <SimpleGrid columns={{ base: 1, md: groups.length }} spacing={6} alignItems="start">
        {groups.map((g) => (
          <Box key={g.kind}>
            {groups.length === 2 && (
              <Heading as="h3" size="xs" textTransform="uppercase" letterSpacing="wide" color="fg.secondary" mb={3}>
                {g.title}
              </Heading>
            )}
            <VStack align="stretch" spacing={4}>
              {g.items.map((c, i) => (
                <Reveal key={c.id} delay={i * 0.06}>
                  <CredentialCard c={c} linkLabel={g.linkLabel} />
                </Reveal>
              ))}
            </VStack>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}
