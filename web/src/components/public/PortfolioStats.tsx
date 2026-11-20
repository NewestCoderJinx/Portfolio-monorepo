import { Box, HStack, Text } from '@chakra-ui/react';
import type { Project } from '../../api/projectstate';
import { hasCaseStudy } from './caseStudy';

/**
 * Every number here is computed from real project data, never hard-coded. Zeros are left out, and so
 * are counts that only repeat the project total ("3 projects, 3 case studies" says nothing new).
 */
export function portfolioStats(projects: Project[]) {
  const total = projects.length;
  const technologies = new Set(projects.flatMap((p) => p.tags || [])).size;
  const caseStudies = projects.filter(hasCaseStudy).length;
  const liveDemos = projects.filter((p) => p.demoUrl).length;

  return [
    { label: total === 1 ? 'Project' : 'Projects', value: total },
    { label: technologies === 1 ? 'Technology' : 'Technologies', value: technologies },
    { label: caseStudies === 1 ? 'Case study' : 'Case studies', value: caseStudies, skip: caseStudies === total },
    { label: liveDemos === 1 ? 'Live demo' : 'Live demos', value: liveDemos, skip: liveDemos === total },
  ].filter((s) => s.value > 0 && !s.skip);
}

/** A slim row of numbers, as a description list (label first in the markup, shown under the number). */
export function PortfolioStats({ projects }: { projects: Project[] }) {
  const stats = portfolioStats(projects);
  if (stats.length === 0) return null;

  return (
    // Separators are borders, not elements: a <dl> may only hold <div> groups of <dt>/<dd>.
    <HStack as="dl" spacing={0}>
      {stats.map((s) => (
        <Box
          key={s.label}
          display="flex"
          flexDirection="column-reverse"
          alignItems="center"
          px={{ base: 3, md: 5 }}
          _first={{ pl: 0 }}
          _last={{ pr: 0 }}
          sx={{ '& + &': { borderLeftWidth: '1px', borderColor: 'border.default' } }}
        >
          <Text as="dt" color="fg.muted" fontSize="xs" textTransform="uppercase" letterSpacing="wide" whiteSpace="nowrap">
            {s.label}
          </Text>
          <Text as="dd" fontSize="2xl" fontWeight="bold" color="fg.brand" lineHeight="short">
            {s.value}
          </Text>
        </Box>
      ))}
    </HStack>
  );
}
