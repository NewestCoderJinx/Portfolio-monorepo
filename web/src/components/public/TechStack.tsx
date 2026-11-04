import { Box, Heading, Tag, TagLabel, Text, Wrap, WrapItem } from '@chakra-ui/react';
import type { Project } from '../../api/projectstate';

interface Props {
  projects: Project[];
  selectedTag: string | null;
  onSelect: (tag: string | null) => void;
}

/** Technologies ranked by how many projects actually use them. */
export function TechStack({ projects, selectedTag, onSelect }: Props) {
  const counts = new Map<string, number>();
  projects.forEach((p) => (p.tags || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  if (ranked.length === 0) return null;

  return (
    <Box bg="white" p={6} borderRadius="xl" borderWidth="1px" borderColor="gray.200">
      <Heading as="h2" size="md" mb={1}>
        Tech Stack
      </Heading>
      <Text color="gray.500" fontSize="sm" mb={4}>
        Technologies used across my projects. Select one to see where I've used it.
      </Text>
      <Wrap spacing={2}>
        {ranked.map(([tag, count]) => {
          const active = selectedTag === tag;
          return (
            <WrapItem key={tag}>
              <Tag
                as="button"
                size="lg"
                borderRadius="full"
                colorScheme={active ? 'blue' : 'gray'}
                variant={active ? 'solid' : 'subtle'}
                onClick={() => onSelect(active ? null : tag)}
                aria-pressed={active}
              >
                <TagLabel>{tag}</TagLabel>
                <Text as="span" ml={2} fontSize="xs" opacity={0.7}>
                  {count}
                </Text>
              </Tag>
            </WrapItem>
          );
        })}
      </Wrap>
    </Box>
  );
}
