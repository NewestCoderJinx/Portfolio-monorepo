import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Spinner,
  Tag,
  TagLabel,
  TagLeftIcon,
  Text,
  useToast,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { getExperience } from '../../api/experience';
import { apiErrorMessage } from '../../api/profile';
import { getAllProjects } from '../../api/projectstate';
import { createSkill, deleteSkill, getSkills, groupSkills, OTHER_CATEGORY, reorderSkills, updateSkill, type Skill } from '../../api/skills';

const MAX_SUGGESTIONS = 20;

const PlusIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M8 3v10M3 8h10" />
  </svg>
);

/** Splits "React, Node.js,  Docker" into unique, trimmed names, keeping the first spelling. */
const splitNames = (raw: string): string[] => {
  const seen = new Set<string>();
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()));
};

export function SkillsEditor() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [names, setNames] = useState('');
  const [category, setCategory] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  /** Skills already listed on experience entries and project tags, most-used first. */
  const [used, setUsed] = useState<string[]>([]);
  const toast = useToast();

  const load = useCallback(
    () =>
      getSkills()
        .then(setSkills)
        .catch(() => toast({ title: 'Failed to load skills', status: 'error', duration: 4000, isClosable: true }))
        .finally(() => setLoading(false)),
    [toast],
  );

  useEffect(() => {
    load();
    Promise.all([getExperience().catch(() => []), getAllProjects().catch(() => [])]).then(([experience, projects]) => {
      const counts = new Map<string, { name: string; n: number }>();
      for (const name of [...experience.flatMap((e) => e.skills ?? []), ...projects.flatMap((p) => p.tags ?? [])]) {
        const key = name.trim().toLowerCase();
        if (!key) continue;
        const entry = counts.get(key) ?? { name: name.trim(), n: 0 };
        entry.n += 1;
        counts.set(key, entry);
      }
      setUsed([...counts.values()].sort((a, b) => b.n - a.n).map((e) => e.name));
    });
  }, [load]);

  const groups = useMemo(() => groupSkills(skills), [skills]);
  const categories = useMemo(() => groups.map((g) => g.category).filter((c) => c !== OTHER_CATEGORY), [groups]);
  const suggestions = useMemo(() => {
    const have = new Set(skills.map((s) => s.name.toLowerCase()));
    return used.filter((n) => !have.has(n.toLowerCase())).slice(0, MAX_SUGGESTIONS);
  }, [used, skills]);

  const reset = () => {
    setNames('');
    setCategory('');
    setEditingId(null);
  };

  const startEdit = (s: Skill) => {
    setEditingId(s.id);
    setNames(s.name);
    setCategory(s.category ?? '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** Adds each name in turn so one duplicate doesn't block the rest. */
  const addSkills = async (list: string[], cat: string | null) => {
    const failed: string[] = [];
    for (const name of list) {
      try {
        await createSkill({ name, category: cat });
      } catch (err) {
        failed.push(apiErrorMessage(err, `Could not add "${name}"`));
      }
    }
    const added = list.length - failed.length;
    if (added) toast({ title: added === 1 ? 'Skill added' : `${added} skills added`, status: 'success', duration: 2500, isClosable: true });
    if (failed.length) toast({ title: 'Some skills were not added', description: failed.join('. '), status: 'warning', duration: 6000, isClosable: true });
    await load();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const list = splitNames(names);
    if (!list.length) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateSkill(editingId, { name: list[0], category: category.trim() || null });
        toast({ title: 'Saved', status: 'success', duration: 2500, isClosable: true });
        await load();
      } else {
        await addSkills(list, category.trim() || null);
      }
      reset();
    } catch (err) {
      toast({ title: 'Could not save', description: apiErrorMessage(err, 'Please try again.'), status: 'error', duration: 6000, isClosable: true });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: Skill) => {
    if (!window.confirm(`Delete "${s.name}"?`)) return;
    try {
      await deleteSkill(s.id);
      if (editingId === s.id) reset();
      setSkills((prev) => prev.filter((x) => x.id !== s.id));
    } catch (err) {
      toast({ title: 'Could not delete', description: apiErrorMessage(err, 'Please try again.'), status: 'error', duration: 6000, isClosable: true });
    }
  };

  /** Swaps a skill with its neighbour in the same group, since that's the order visitors see. */
  const move = async (group: Skill[], index: number, dir: -1 | 1) => {
    const a = group[index];
    const b = group[index + dir];
    if (!a || !b) return;
    const next = [...skills];
    const ia = next.findIndex((s) => s.id === a.id);
    const ib = next.findIndex((s) => s.id === b.id);
    [next[ia], next[ib]] = [next[ib], next[ia]];
    setSkills(next); // optimistic
    try {
      await reorderSkills(next.map((s) => s.id));
    } catch {
      toast({ title: 'Failed to save new order', status: 'error', duration: 3000, isClosable: true });
      load();
    }
  };

  const label = { fontSize: 'xs', fontWeight: 'bold', color: 'fg.secondary', mb: 1 } as const;

  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} alignItems="start">
      <VStack align="stretch" spacing={6}>
        <Box as="form" onSubmit={handleSubmit} p={6} bg="bg.surface" borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="border.default">
          <Heading as="h2" size="sm" mb={1} color="fg.default">
            {editingId ? 'Edit Skill' : 'Add Skills'}
          </Heading>
          <Text fontSize="sm" color="fg.muted" mb={4}>
            Shown on your public page and printable résumé, grouped by category.
          </Text>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel {...label}>{editingId ? 'Name' : 'Names'}</FormLabel>
              <Input value={names} onChange={(e) => setNames(e.target.value)} maxLength={editingId ? 60 : 1000} placeholder={editingId ? 'e.g. TypeScript' : 'e.g. TypeScript, Python, Go'} />
              {!editingId && <FormHelperText fontSize="xs">Separate several skills with commas to add them all at once.</FormHelperText>}
            </FormControl>
            <FormControl>
              <FormLabel {...label}>Category</FormLabel>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} maxLength={60} placeholder="e.g. Languages" list="skill-categories" />
              <datalist id="skill-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <FormHelperText fontSize="xs">Optional. Skills without one are listed under "Other".</FormHelperText>
            </FormControl>
            <HStack w="full">
              <Button type="submit" colorScheme="brand" flex={1} isLoading={saving} loadingText="Saving">
                {editingId ? 'Save Changes' : 'Add'}
              </Button>
              {editingId && (
                <Button variant="ghost" onClick={reset}>
                  Cancel
                </Button>
              )}
            </HStack>
          </VStack>
        </Box>

        {suggestions.length > 0 && (
          <Box p={6} bg="bg.surface" borderRadius="xl" borderWidth="1px" borderColor="border.default">
            <Heading as="h3" size="xs" mb={1} color="fg.default">
              Suggestions
            </Heading>
            <Text fontSize="sm" color="fg.muted" mb={3}>
              From your experience and project tags. Click one to add it{category.trim() ? ` to "${category.trim()}"` : ''}.
            </Text>
            <Wrap spacing={2}>
              {suggestions.map((name) => (
                <WrapItem key={name}>
                  <Tag
                    as="button"
                    type="button"
                    size="md"
                    variant="outline"
                    colorScheme="brand"
                    borderRadius="full"
                    cursor="pointer"
                    _hover={{ bg: 'bg.subtle' }}
                    onClick={() => addSkills([name], category.trim() || null)}
                  >
                    <TagLeftIcon as={PlusIcon} boxSize="10px" />
                    <TagLabel>{name}</TagLabel>
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          </Box>
        )}
      </VStack>

      <VStack align="stretch" spacing={4}>
        <Heading as="h2" size="sm" color="fg.default">
          Your Skills ({skills.length})
        </Heading>
        {loading ? (
          <Spinner color="brand.500" alignSelf="center" my={8} />
        ) : skills.length === 0 ? (
          <Box textAlign="center" py={10} bg="bg.surface" borderRadius="xl" borderStyle="dashed" borderWidth="2px" borderColor="border.strong">
            <Text color="fg.muted" fontSize="sm">
              No skills yet. The section stays hidden until you add one.
            </Text>
          </Box>
        ) : (
          groups.map((g) => (
            <Box key={g.category} p={4} bg="bg.surface" borderRadius="lg" borderWidth="1px" borderColor="border.default">
              <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" color="fg.muted" mb={2}>
                {g.category}
              </Text>
              <VStack align="stretch" spacing={1}>
                {g.skills.map((s, i) => (
                  <HStack key={s.id} justify="space-between" py={1} px={2} borderRadius="md" bg={editingId === s.id ? 'bg.subtle' : undefined}>
                    <Text fontSize="sm" color="fg.heading" noOfLines={1}>
                      {s.name}
                    </Text>
                    <HStack spacing={0.5} flexShrink={0}>
                      <Button size="xs" variant="ghost" aria-label={`Move ${s.name} up`} title="Move up" onClick={() => move(g.skills, i, -1)} isDisabled={i === 0}>
                        ↑
                      </Button>
                      <Button size="xs" variant="ghost" aria-label={`Move ${s.name} down`} title="Move down" onClick={() => move(g.skills, i, 1)} isDisabled={i === g.skills.length - 1}>
                        ↓
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => startEdit(s)}>
                        Edit
                      </Button>
                      <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleDelete(s)}>
                        Delete
                      </Button>
                    </HStack>
                  </HStack>
                ))}
              </VStack>
            </Box>
          ))
        )}
      </VStack>
    </SimpleGrid>
  );
}
