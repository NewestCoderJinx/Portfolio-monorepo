import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
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
  createCredential,
  deleteCredential,
  formatCredentialDates,
  getCredentials,
  KIND_LABELS,
  updateCredential,
  type Credential,
  type CredentialInput,
  type CredentialKind,
} from '../../api/credentials';
import { apiErrorMessage } from '../../api/profile';
import { formatUrl } from '../../api/projectstate';

interface Form {
  kind: CredentialKind;
  title: string;
  institution: string;
  /** YYYY-MM, as used by <input type="month"> */
  start: string;
  end: string;
  /** Education only: still studying, so no end date. */
  current: boolean;
  credentialUrl: string;
  description: string;
}

const EMPTY: Form = { kind: 'education', title: '', institution: '', start: '', end: '', current: false, credentialUrl: '', description: '' };

const toForm = (c: Credential): Form => ({
  kind: c.kind,
  title: c.title,
  institution: c.institution,
  start: c.startDate?.slice(0, 7) ?? '',
  end: c.endDate?.slice(0, 7) ?? '',
  current: c.kind === 'education' && Boolean(c.startDate) && !c.endDate,
  credentialUrl: c.credentialUrl ?? '',
  description: c.description ?? '',
});

const toPayload = (f: Form): CredentialInput => {
  const education = f.kind === 'education';
  return {
    kind: f.kind,
    title: f.title.trim(),
    institution: f.institution.trim(),
    // Certifications only have an issue date.
    startDate: education && f.start ? `${f.start}-01` : null,
    endDate: (education && f.current) || !f.end ? null : `${f.end}-01`,
    credentialUrl: formatUrl(f.credentialUrl) ?? null,
    description: f.description.trim() || null,
  };
};

const COPY = {
  education: { title: 'Degree or course', titleHint: 'e.g. BSc Computer Science', institution: 'School', institutionHint: 'e.g. Makerere University', end: 'End month' },
  certification: { title: 'Certificate name', titleHint: 'e.g. AWS Certified Developer – Associate', institution: 'Issued by', institutionHint: 'e.g. Amazon Web Services', end: 'Issue month' },
} as const;

export function CredentialsEditor() {
  const [entries, setEntries] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const load = useCallback(
    () =>
      getCredentials()
        .then(setEntries)
        .catch(() => toast({ title: 'Failed to load education & certifications', status: 'error', duration: 4000, isClosable: true }))
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

  const startEdit = (c: Credential) => {
    setEditingId(c.id);
    setForm(toForm(c));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const education = form.kind === 'education';
  const copy = COPY[form.kind];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (education && form.start && !form.current && form.end && form.end < form.start) {
      toast({ title: 'The end month is before the start month', status: 'warning', duration: 4000, isClosable: true });
      return;
    }
    setSaving(true);
    try {
      const payload = toPayload(form);
      if (editingId) await updateCredential(editingId, payload);
      else await createCredential(payload);
      toast({ title: editingId ? 'Saved' : `${KIND_LABELS[form.kind]} added`, status: 'success', duration: 3000, isClosable: true });
      reset();
      await load();
    } catch (err) {
      toast({ title: 'Could not save', description: apiErrorMessage(err, 'Please try again.'), status: 'error', duration: 6000, isClosable: true });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Credential) => {
    if (!window.confirm(`Delete "${c.title}"?`)) return;
    try {
      await deleteCredential(c.id);
      if (editingId === c.id) reset();
      setEntries((prev) => prev.filter((x) => x.id !== c.id));
      toast({ title: 'Deleted', status: 'success', duration: 3000, isClosable: true });
    } catch (err) {
      toast({ title: 'Could not delete', description: apiErrorMessage(err, 'Please try again.'), status: 'error', duration: 6000, isClosable: true });
    }
  };

  const label = { fontSize: 'xs', fontWeight: 'bold', color: 'fg.secondary', mb: 1 } as const;

  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} alignItems="start">
      <Box as="form" onSubmit={handleSubmit} p={6} bg="bg.surface" borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="border.default">
        <Heading as="h2" size="sm" mb={1} color="fg.default">
          {editingId ? 'Edit Entry' : 'Add Education or a Certification'}
        </Heading>
        <Text fontSize="sm" color="fg.muted" mb={4}>
          Shown on your public page and printable résumé.
        </Text>
        <VStack spacing={4}>
          <ButtonGroup size="sm" isAttached variant="outline" alignSelf="start" role="radiogroup" aria-label="Type">
            {(['education', 'certification'] as const).map((k) => (
              <Button
                key={k}
                role="radio"
                aria-checked={form.kind === k}
                variant={form.kind === k ? 'solid' : 'outline'}
                colorScheme={form.kind === k ? 'brand' : 'gray'}
                onClick={() => setForm((prev) => ({ ...prev, kind: k }))}
              >
                {KIND_LABELS[k]}
              </Button>
            ))}
          </ButtonGroup>
          <FormControl isRequired>
            <FormLabel {...label}>{copy.title}</FormLabel>
            <Input value={form.title} onChange={set('title')} maxLength={150} placeholder={copy.titleHint} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel {...label}>{copy.institution}</FormLabel>
            <Input value={form.institution} onChange={set('institution')} maxLength={150} placeholder={copy.institutionHint} />
          </FormControl>
          <SimpleGrid columns={{ base: 1, sm: education ? 2 : 1 }} spacing={4} w="full">
            {education && (
              <FormControl>
                <FormLabel {...label}>Start month</FormLabel>
                <Input type="month" value={form.start} onChange={set('start')} />
              </FormControl>
            )}
            <FormControl isDisabled={education && form.current}>
              <FormLabel {...label}>{copy.end}</FormLabel>
              <Input type="month" value={education && form.current ? '' : form.end} onChange={set('end')} min={(education && form.start) || undefined} />
            </FormControl>
          </SimpleGrid>
          {education && (
            <Checkbox isChecked={form.current} onChange={set('current')} alignSelf="start" colorScheme="brand" isDisabled={!form.start}>
              I am still studying here
            </Checkbox>
          )}
          <FormControl>
            <FormLabel {...label}>{education ? 'Link' : 'Verification link'}</FormLabel>
            <Input value={form.credentialUrl} onChange={set('credentialUrl')} placeholder={education ? 'Course or transcript page' : 'e.g. credly.com/badges/...'} />
            {!education && <FormHelperText fontSize="xs">Lets visitors confirm the certificate is real.</FormHelperText>}
          </FormControl>
          <FormControl>
            <FormLabel {...label}>Note</FormLabel>
            <Textarea value={form.description} onChange={set('description')} rows={3} maxLength={1000} placeholder={education ? 'e.g. First Class Honours. Thesis on distributed caching.' : 'e.g. Covered serverless design and CI/CD on AWS.'} />
          </FormControl>
          <HStack w="full">
            <Button type="submit" colorScheme="brand" flex={1} isLoading={saving} loadingText="Saving">
              {editingId ? 'Save Changes' : `Add ${KIND_LABELS[form.kind]}`}
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
          Your Education & Certifications ({entries.length})
        </Heading>
        {loading ? (
          <Spinner color="brand.500" alignSelf="center" my={8} />
        ) : entries.length === 0 ? (
          <Box textAlign="center" py={10} bg="bg.surface" borderRadius="xl" borderStyle="dashed" borderWidth="2px" borderColor="border.strong">
            <Text color="fg.muted" fontSize="sm">
              Nothing yet. The section stays hidden until you add an entry.
            </Text>
          </Box>
        ) : (
          entries.map((c) => (
            <Box key={c.id} p={4} bg="bg.surface" borderRadius="lg" borderWidth="1px" borderColor={editingId === c.id ? 'brand.400' : 'border.default'}>
              <HStack justify="space-between" align="start" gap={3}>
                <Box minW={0}>
                  <HStack spacing={2} mb={0.5}>
                    <Badge colorScheme={c.kind === 'education' ? 'brand' : 'accent'} variant="subtle" fontSize="2xs">
                      {KIND_LABELS[c.kind]}
                    </Badge>
                  </HStack>
                  <Text fontWeight="semibold" color="fg.heading" noOfLines={1}>
                    {c.title}
                  </Text>
                  <Text fontSize="sm" color="fg.brand" noOfLines={1}>
                    {c.institution}
                  </Text>
                  {formatCredentialDates(c) && (
                    <Text fontSize="xs" color="fg.muted">
                      {formatCredentialDates(c)}
                    </Text>
                  )}
                </Box>
                <HStack spacing={1} flexShrink={0}>
                  <Button size="xs" variant="outline" onClick={() => startEdit(c)}>
                    Edit
                  </Button>
                  <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleDelete(c)}>
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
