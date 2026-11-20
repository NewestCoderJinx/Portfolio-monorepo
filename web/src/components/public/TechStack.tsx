import { useState } from 'react';
import { Box, Button, Flex, Heading, Tag, TagLabel, Text, useBreakpointValue, Wrap, WrapItem } from '@chakra-ui/react';
import type { Project } from '../../api/projectstate';
import { PortfolioStats } from './PortfolioStats';

/** On phones only the most-used technologies show at first, so the card doesn't fill the screen. */
const PHONE_LIMIT = 8;

interface Props {
  projects: Project[];
  selectedTag: string | null;
  onSelect: (tag: string | null) => void;
}

/** The portfolio at a glance: headline numbers, and technologies ranked by how many projects use them. */
export function TechStack({ projects, selectedTag, onSelect }: Props) {
  const [showAll, setShowAll] = useState(false);
  const isPhone = useBreakpointValue({ base: true, md: false }, { ssr: false });

  const counts = new Map<string, number>();
  projects.forEach((p) => (p.tags || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  if (projects.length === 0) return null;

  const limited = isPhone && !showAll && ranked.length > PHONE_LIMIT;
  // Keep a selected technology visible even when the list is cut short.
  const shown = limited ? ranked.filter(([tag], i) => i < PHONE_LIMIT || tag === selectedTag) : ranked;

  return (
    <Box as="section" aria-labelledby="tech-stack-heading" bg="bg.surface" p={{ base: 5, md: 6 }} borderRadius="2xl" borderWidth="1px" borderColor="border.default" boxShadow="sm">
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'start', md: 'center' }} gap={4} mb={ranked.length ? 5 : 0}>
        <Box>
          <Heading as="h2" id="tech-stack-heading" size="md" mb={1}>
            Tech stack
          </Heading>
          {ranked.length > 0 && (
            <Text color="fg.muted" fontSize="sm">
              Select a technology to see the projects that use it.
            </Text>
          )}
        </Box>
        <PortfolioStats projects={projects} />
      </Flex>

      {ranked.length > 0 && (
        <Wrap spacing={2} pt={5} borderTopWidth="1px" borderColor="border.subtle">
          {shown.map(([tag, count]) => {
            const active = selectedTag === tag;
            return (
              <WrapItem key={tag}>
                <Tag
                  as="button"
                  size="lg"
                  borderRadius="full"
                  colorScheme={active ? 'brand' : 'gray'}
                  variant={active ? 'solid' : 'subtle'}
                  onClick={() => onSelect(active ? null : tag)}
                  aria-pressed={active}
                  aria-label={`${tag}, ${count} ${count === 1 ? 'project' : 'projects'}`}
                  transition="background 0.15s, transform 0.15s"
                  _hover={active ? undefined : { bg: 'bg.brandSubtle', color: 'fg.brand' }}
                  _active={{ transform: 'scale(0.97)' }}
                >
                  <TagLabel>{tag}</TagLabel>
                  <Box
                    as="span"
                    ml={2}
                    px={1.5}
                    minW="5"
                    textAlign="center"
                    fontSize="xs"
                    fontWeight="semibold"
                    borderRadius="full"
                    bg={active ? 'whiteAlpha.300' : 'blackAlpha.100'}
                    _dark={{ bg: active ? 'blackAlpha.300' : 'whiteAlpha.200' }}
                    aria-hidden
                  >
                    {count}
                  </Box>
                </Tag>
              </WrapItem>
            );
          })}
          {isPhone && ranked.length > PHONE_LIMIT && (
            <WrapItem>
              <Button size="sm" variant="ghost" color="fg.brand" borderRadius="full" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}>
                {showAll ? 'Show fewer' : `Show all ${ranked.length}`}
              </Button>
            </WrapItem>
          )}
        </Wrap>
      )}
    </Box>
  );
}
