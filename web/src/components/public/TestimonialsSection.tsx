import { Avatar, Box, Heading, HStack, Link, SimpleGrid, Text } from '@chakra-ui/react';
import { formatAttribution, type Testimonial } from '../../api/testimonials';
import { QuoteIcon } from './icons';
import { Reveal } from './Reveal';

function TestimonialCard({ t }: { t: Testimonial }) {
  const attribution = formatAttribution(t);
  return (
    <Box
      as="figure"
      h="full"
      display="flex"
      flexDirection="column"
      bg="bg.surface"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="xl"
      p={{ base: 5, md: 6 }}
    >
      <Box color="accent.400" _dark={{ color: 'accent.300' }} mb={3}>
        <QuoteIcon width={28} height={28} />
      </Box>
      <Text as="blockquote" color="fg.default" fontSize="md" lineHeight="tall" whiteSpace="pre-line" flex={1} mb={5}>
        {t.quote}
      </Text>
      <HStack as="figcaption" spacing={3} pt={4} borderTopWidth="1px" borderColor="border.subtle">
        <Avatar size="sm" name={t.name} src={t.avatarUrl ?? undefined} />
        <Box minW={0}>
          {t.linkUrl ? (
            <Link href={t.linkUrl} isExternal fontWeight="semibold" color="fg.heading" title={`${t.name}'s profile`}>
              {t.name}
            </Link>
          ) : (
            <Text fontWeight="semibold" color="fg.heading">
              {t.name}
            </Text>
          )}
          {attribution && (
            <Text fontSize="sm" color="fg.muted">
              {attribution}
            </Text>
          )}
        </Box>
      </HStack>
    </Box>
  );
}

/** Quotes from people the developer has worked with. Renders nothing until one is published. */
export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <Box id="testimonials" scrollMarginTop="90px">
      <Heading as="h2" size="lg">
        What People Say
      </Heading>
      <Text color="fg.muted" fontSize="sm" mb={6}>
        From clients and teammates I have worked with
      </Text>
      <SimpleGrid columns={{ base: 1, md: testimonials.length === 1 ? 1 : 2 }} spacing={6}>
        {testimonials.map((t, i) => (
          <Reveal key={t.id} delay={(i % 2) * 0.08}>
            <TestimonialCard t={t} />
          </Reveal>
        ))}
      </SimpleGrid>
    </Box>
  );
}
