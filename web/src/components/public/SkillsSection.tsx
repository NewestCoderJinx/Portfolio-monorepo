import { Box, Heading, SimpleGrid, Tag, Text, Wrap, WrapItem } from '@chakra-ui/react';
import { groupSkills, type Skill } from '../../api/skills';
import { Reveal } from './Reveal';

function SkillTags({ skills }: { skills: Skill[] }) {
  return (
    <Wrap spacing={2}>
      {skills.map((s) => (
        <WrapItem key={s.id}>
          <Tag size="lg" variant="subtle" colorScheme="brand" borderRadius="full" fontSize="sm">
            {s.name}
          </Tag>
        </WrapItem>
      ))}
    </Wrap>
  );
}

/** Skills grouped by category, in the owner's order. Renders nothing until they add one. */
export function SkillsSection({ skills }: { skills: Skill[] }) {
  if (skills.length === 0) return null;
  const groups = groupSkills(skills);
  // With no categories at all, a lone "Other" heading would just be noise.
  const showHeadings = groups.length > 1;

  return (
    <Box id="skills" scrollMarginTop="90px">
      <Heading as="h2" size="lg">
        Skills
      </Heading>
      <Text color="fg.muted" fontSize="sm" mb={6}>
        Languages, frameworks and tools I work with
      </Text>
      {showHeadings ? (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} alignItems="start">
          {groups.map((g, i) => (
            <Reveal key={g.category} delay={i * 0.06}>
              <Box bg="bg.surface" borderWidth="1px" borderColor="border.default" borderRadius="xl" p={5} h="full">
                <Heading as="h3" size="xs" textTransform="uppercase" letterSpacing="wide" color="fg.secondary" mb={3}>
                  {g.category}
                </Heading>
                <SkillTags skills={g.skills} />
              </Box>
            </Reveal>
          ))}
        </SimpleGrid>
      ) : (
        <Reveal>
          <SkillTags skills={skills} />
        </Reveal>
      )}
    </Box>
  );
}
