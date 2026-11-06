import { SimpleGrid, Stat, StatLabel, StatNumber } from '@chakra-ui/react';
import type { Project } from '../../api/projectstate';
import { hasCaseStudy } from './caseStudy';

/** Every number here is computed from real project data, never hard-coded. */
export function PortfolioStats({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;

  const technologies = new Set(projects.flatMap((p) => p.tags || [])).size;
  const caseStudies = projects.filter(hasCaseStudy).length;
  const liveDemos = projects.filter((p) => p.demoUrl).length;

  const stats = [
    { label: 'Projects', value: projects.length },
    { label: 'Technologies', value: technologies },
    { label: 'Case studies', value: caseStudies },
    { label: 'Live demos', value: liveDemos },
  ];

  return (
    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
      {stats.map((s) => (
        <Stat key={s.label} bg="bg.surface" p={4} borderRadius="xl" borderWidth="1px" borderColor="border.default" textAlign="center">
          <StatNumber fontSize="3xl" color="fg.brand">
            {s.value}
          </StatNumber>
          <StatLabel color="fg.muted" fontSize="xs" textTransform="uppercase" letterSpacing="wide">
            {s.label}
          </StatLabel>
        </Stat>
      ))}
    </SimpleGrid>
  );
}
