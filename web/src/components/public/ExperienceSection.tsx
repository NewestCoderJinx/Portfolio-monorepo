import { Badge, Box, Heading, HStack, Tag, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react';
import { formatDuration, formatPeriod, type Experience } from '../../api/experience';
import { MapPinIcon } from './icons';
import { Reveal } from './Reveal';

/** Work history as a vertical timeline. Renders nothing until the owner adds an entry. */
export function ExperienceSection({ experience }: { experience: Experience[] }) {
  if (experience.length === 0) return null;

  return (
    <Box id="experience" scrollMarginTop="90px">
      <Heading as="h2" size="lg">
        Experience
      </Heading>
      <Text color="fg.muted" fontSize="sm" mb={6}>
        Where I have worked and what I did there
      </Text>

      <VStack as="ol" listStyleType="none" spacing={0} align="stretch" position="relative">
        {experience.map((e, i) => {
          const current = !e.endDate;
          const bullets = (e.description ?? '').split('\n').map((l) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
          const isLast = i === experience.length - 1;
          return (
            <Box as="li" key={e.id} position="relative" pl={{ base: 8, md: 10 }} pb={isLast ? 0 : 6}>
              {/* Timeline rail and marker */}
              {!isLast && <Box position="absolute" left="11px" top="24px" bottom={0} w="2px" bg="border.default" aria-hidden />}
              <Box
                position="absolute"
                left={0}
                top="6px"
                boxSize="24px"
                borderRadius="full"
                bg={current ? 'accent.400' : 'bg.surface'}
                borderWidth="4px"
                borderColor={current ? 'accent.100' : 'brand.400'}
                _dark={{ borderColor: current ? 'accent.800' : 'brand.300' }}
                aria-hidden
              />

              <Reveal>
                <Box bg="bg.surface" borderWidth="1px" borderColor="border.default" borderRadius="xl" p={{ base: 5, md: 6 }}>
                  <HStack justify="space-between" align="start" flexWrap="wrap" gap={2} mb={1}>
                    <Box>
                      <Heading as="h3" size="md">
                        {e.role}
                      </Heading>
                      <Text fontWeight="semibold" color="fg.brand">
                        {e.company}
                      </Text>
                    </Box>
                    {current && (
                      <Badge colorScheme="accent" variant="subtle" borderRadius="full" px={2.5}>
                        Current
                      </Badge>
                    )}
                  </HStack>

                  <HStack spacing={2} fontSize="sm" color="fg.muted" flexWrap="wrap" mb={bullets.length || e.skills?.length ? 4 : 0}>
                    <Text>{formatPeriod(e)}</Text>
                    <Text aria-hidden>·</Text>
                    <Text>{formatDuration(e)}</Text>
                    {e.location && (
                      <HStack spacing={1}>
                        <Text aria-hidden>·</Text>
                        <MapPinIcon width={13} height={13} />
                        <Text>{e.location}</Text>
                      </HStack>
                    )}
                  </HStack>

                  {bullets.length > 0 && (
                    <Box as="ul" pl={5} mb={e.skills?.length ? 4 : 0} color="fg.secondary" fontSize="sm" lineHeight="tall">
                      {bullets.map((b, j) => (
                        <li key={j}>{b}</li>
                      ))}
                    </Box>
                  )}

                  {e.skills && e.skills.length > 0 && (
                    <Wrap spacing={1.5}>
                      {e.skills.map((s) => (
                        <WrapItem key={s}>
                          <Tag size="sm" colorScheme="brand" variant="subtle" borderRadius="full">
                            {s}
                          </Tag>
                        </WrapItem>
                      ))}
                    </Wrap>
                  )}
                </Box>
              </Reveal>
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
}
