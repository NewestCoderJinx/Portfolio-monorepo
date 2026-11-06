import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  useToast,
  VStack,
} from '@chakra-ui/react';
import {
  createExperience,
  deleteExperience,
  formatPeriod,
  getExperience,
  updateExperience,
  type Experience,
  type ExperienceInput,
} from '../../api/experience';
import { apiErrorMessage } from '../../api/profile';

interface Form {
  role: string;
  company: string;
  location: string;
  /** YYYY-MM, as used by <input type="month"> */
  start: string;
  end: string;
  current: boolean;
  description: string;
  skills: string;
}

const EMPTY: Form = { role: '', company: '', location: '', start: '', end: '', current: false, description: '', skills: '' };

const toForm = (e: Experience): Form => ({
  role: e.role,
  company: e.company,
  location: e.location ?? '',
  start: e.startDate.slice(0, 7),
  end: e.endDate?.slice(0, 7) ?? '',
  current: !e.endDate,
  description: e.description ?? '',
  skills: (e.skills ?? []).join(', '),
});

const toPayload = (f: Form): ExperienceInput => {
  const skills = f.skills.split(',').map((s) => s.trim()).filter(Boolean);
  return {
    role: f.role.trim(),
    company: f.company.trim(),
    location: f.location.trim() || null,
    startDate: `${f.start}-01`,
    endDate: f.current || !f.end ? null : `${f.end}-01`,
    description: f.description.trim() || null,
    skills: skills.length ? skills : null,
  };
};

export function ExperienceEditor() {
  const [entries, setEntries] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const load = useCallback(
    () =>
      getExperience()
        .then(setEntries)
        .catch(() => toast({ title: 'Failed to load experience', status: 'error', duration: 4000, isClosable: true }))
        .finally(() => setLoading(false)),
    [toast],
  );

  useEffect(() => {
    load();
  }, [load]);

  const set = (key: keyof Form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
  };

  const startEdit = (e: Experience) => {
    setEditingId(e.id);
    setForm(toForm(e));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.current && !form.end) {
      toast({ title: 'Add an end month, or tick "I currently work here"', status: 'warning', duration: 4000, isClosable: true });
      return;
    }
    if (!form.current && form.end < form.start) {
      toast({ title: 'The end month is before the start month', status: 'warning', duration: 4000, isClosable: true });
      return;
    }
    setSaving(true);
    try {
      const payload = toPayload(form);
      if (editingId) await updateExperience(editingId, payload);
      else await createExperience(payload);
      toast({ title: editingId ? 'Experience updated' : 'Experience added', status: 'success', duration: 3000, isClosable: true });
      reset();
      await load();
    } catch (err) {
      toast({ title: 'Could not save', description: apiErrorMessage(err, 'Please try again.'), status: 'error', duration: 6000, isClosable: true });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e: Experience) => {
    if (!window.confirm(`Delete "${e.role}" at ${e.company}?`)) return;
    try {
      await deleteExperience(e.id);
      if (editingId === e.id) reset();
      setEntries((prev) => prev.filter((x) => x.id !== e.id));
      toast({ title: 'Experience deleted', status: 'success', duration: 3000, isClosable: true });
    } catch (err) {
      toast({ title: 'Could not delete', description: apiErrorMessage(err, 'Please try again.'), status: 'error', duration: 6000, isClosable: true });
    }
  };

  const label = { fontSize: 'xs', fontWeight: 'bold', color: 'fg.secondary', mb: 1 } as const;

  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} alignItems="start">
      <Box as="form" onSubmit={handleSubmit} p={6} bg="bg.surface" borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="border.default">
        <Heading as="h2" size="sm" mb={1} color="fg.default">
          {editingId ? 'Edit Role' : 'Add a Role'}
        </Heading>
        <Text fontSize="sm" color="fg.muted" mb={4}>
          Shown as a timeline on your public page, current roles first.
        </Text>
        <VStack spacing={4}>
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} w="full">
            <FormControl isRequired>
              <FormLabel {...label}>Role / title</FormLabel>
              <Input value={form.role} onChange={set('role')} maxLength={120} placeholder="e.g. Backend Engineer" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel {...label}>Company</FormLabel>
              <Input value={form.company} onChange={set('company')} maxLength={120} placeholder="e.g. Acme Ltd" />
            </FormControl>
          </SimpleGrid>
          <FormControl>
            <FormLabel {...label}>Location</FormLabel>
            <Input value={form.location} onChange={set('location')} maxLength={100} placeholder="e.g. Remote, or Kampala" />
          </FormControl>
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} w="full">
            <FormControl isRequired>
              <FormLabel {...label}>Start month</FormLabel>
              <Input type="month" value={form.start} onChange={set('start')} />
            </FormControl>
            <FormControl isRequired={!form.current} isDisabled={form.current}>
              <FormLabel {...label}>End month</FormLabel>
              <Input type="month" value={form.current ? '' : form.end} onChange={set('end')} min={form.start || undefined} />
            </FormControl>
          </SimpleGrid>
          <Checkbox isChecked={form.current} onChange={set('current')} alignSelf="start" colorScheme="brand">
            I currently work here
          </Checkbox>
          <FormControl>
            <FormLabel {...label}>What you did</FormLabel>
            <Textarea value={form.description} onChange={set('description')} rows={5} maxLength={3000} placeholder={'One achievement per line, e.g.\nCut API response times by 40%'} />
            <FormHelperText fontSize="xs">Each line becomes a bullet point.</FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel {...label}>Skills used</FormLabel>
            <Input value={form.skills} onChange={set('skills')} placeholder="NestJS, PostgreSQL, Docker" />
            <FormHelperText fontSize="xs">Comma separated.</FormHelperText>
          </FormControl>
          <HStack w="full">
            <Button type="submit" colorScheme="brand" flex={1} isLoading={saving} loadingText="Saving">
              {editingId ? 'Save Changes' : 'Add Role'}
            </Button>
            {editingId && (
              <Button variant="ghost" onClick={reset}>
                Cancel
              </Button>
            )}
          </HStack>
        </VStack>
      </Box>

      <VStack align="stretch" spacing={3}>
        <Heading as="h2" size="sm" color="fg.default">
          Your Roles ({entries.length})
        </Heading>
        {loading ? (
          <Spinner color="brand.500" alignSelf="center" my={8} />
        ) : entries.length === 0 ? (
          <Box textAlign="center" py={10} bg="bg.surface" borderRadius="xl" borderStyle="dashed" borderWidth="2px" borderColor="border.strong">
            <Text color="fg.muted" fontSize="sm">
              No roles yet. The Experience section stays hidden until you add one.
            </Text>
          </Box>
        ) : (
          entries.map((e) => (
            <Box
              key={e.id}
              p={4}
              bg="bg.surface"
              borderRadius="lg"
              borderWidth="1px"
              borderColor={editingId === e.id ? 'brand.400' : 'border.default'}
            >
              <HStack justify="space-between" align="start" gap={3}>
                <Box minW={0}>
                  <Text fontWeight="semibold" color="fg.heading" noOfLines={1}>
                    {e.role}
                  </Text>
                  <Text fontSize="sm" color="fg.brand" noOfLines={1}>
                    {e.company}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {formatPeriod(e)}
                  </Text>
                </Box>
                <HStack spacing={1} flexShrink={0}>
                  <Button size="xs" variant="outline" onClick={() => startEdit(e)}>
                    Edit
                  </Button>
                  <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleDelete(e)}>
                    Delete
                  </Button>
                </HStack>
              </HStack>
            </Box>
          ))
        )}
      </VStack>
    </SimpleGrid>
  );
}
