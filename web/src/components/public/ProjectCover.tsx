import { Box, Flex, Text } from '@chakra-ui/react';
import type { Project } from '../../api/projectstate';

/** Gradient pairs from the brand and accent palettes, so projects without a picture still look different. */
const GRADIENTS = [
  'linear(to-br, brand.700, accent.500)',
  'linear(to-br, brand.800, brand.400)',
  'linear(to-br, accent.700, brand.500)',
  'linear(to-br, brand.600, accent.300)',
  'linear(to-br, gray.800, brand.500)',
];

/** Same project, same gradient: an FNV-1a hash of the id (spreads similar UUIDs better than h * 31). */
function gradientFor(id: string) {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

/** Up to two initials from the title's first words, skipping small words ("The Real-Time App" → "RA"). */
export function projectInitials(title: string) {
  const words = title
    .split(/[\s\-–—:]+/)
    .filter((w) => /^[\p{L}\p{N}]/u.test(w) && !/^(a|an|the|and|of|for|&)$/i.test(w));
  return (words.length ? words : [title])
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

interface Props {
  project: Project;
  size?: 'md' | 'lg';
}

/**
 * Stand-in cover for a project with no image: its own gradient, a faint dot grid and its initials.
 * Purely decorative (the title is shown beside it), so it's hidden from screen readers.
 */
export function ProjectCover({ project, size = 'md' }: Props) {
  const tags = (project.tags || []).slice(0, 3);
  return (
    <Flex position="absolute" inset={0} direction="column" justify="space-between" p={size === 'lg' ? 8 : 5} bgGradient={gradientFor(project.id)} overflow="hidden" aria-hidden>
      <Box
        position="absolute"
        inset={0}
        opacity={0.18}
        bgImage="radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)"
        bgSize="18px 18px"
        sx={{ maskImage: 'linear-gradient(to bottom left, black, transparent 75%)' }}
      />
      <Text
        position="relative"
        color="white"
        fontSize={size === 'lg' ? '7xl' : '5xl'}
        fontWeight="extrabold"
        letterSpacing="tight"
        lineHeight={1}
        opacity={0.92}
      >
        {projectInitials(project.title)}
      </Text>
      {tags.length > 0 && (
        <Text position="relative" color="whiteAlpha.900" fontSize="xs" fontWeight="semibold" letterSpacing="wider" textTransform="uppercase" noOfLines={1}>
          {tags.join(' · ')}
        </Text>
      )}
    </Flex>
  );
}
