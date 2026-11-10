import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Avatar,
  Badge,
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
import { apiErrorMessage } from '../../api/profile';
import { formatUrl, uploadProjectImage } from '../../api/projectstate';
import {
  createTestimonial,
  deleteTestimonial,
  formatAttribution,
  getAllTestimonials,
  updateTestimonial,
  type Testimonial,
  type TestimonialInput,
} from '../../api/testimonials';
import { TestimonialRequestsPanel } from './TestimonialRequestsPanel';

const QUOTE_MAX = 1000;

interface Form {
  name: string;
  role: string;
  company: string;
  quote: string;
  avatarUrl: string;
  linkUrl: string;
  published: boolean;
}

const EMPTY: Form = { name: '', role: '', company: '', quote: '', avatarUrl: '', linkUrl: '', published: true };

const toForm = (t: Testimonial): Form => ({
  name: t.name,
  role: t.role ?? '',
  company: t.company ?? '',
  quote: t.quote,
  avatarUrl: t.avatarUrl ?? '',
  linkUrl: t.linkUrl ?? '',
  published: t.published !== false,
});

const toPayload = (f: Form): TestimonialInput => ({
  name: f.name.trim(),
  role: f.role.trim() || null,
  company: f.company.trim() || null,
  quote: f.quote.trim(),
  avatarUrl: f.avatarUrl.trim() || null,
  linkUrl: formatUrl(f.linkUrl) ?? null,
  published: f.published,
});

export function TestimonialsEditor() {
  const [entries, setEntries] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const load = useCallback(
    () =>
      getAllTestimonials()
        .then(setEntries)
        .catch(() => toast({ title: 'Failed to load testimonials', status: 'error', duration: 4000, isClosable: true }))
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

  const startEdit = (t: Testimonial) => {
    setEditingId(t.id);
    setForm(toForm(t));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProjectImage(file);
      setForm((prev) => ({ ...prev, avatarUrl: url }));
    } catch (err) {
      toast({ title: 'Could not upload photo', description: apiErrorMessage(err, 'Please try another image.'), status: 'error', duration: 5000, isClosable: true });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = toPayload(form);
      if (editingId) await updateTestimonial(editingId, payload);
      else await createTestimonial(payload);
      toast({ title: editingId ? 'Testimonial updated' : 'Testimonial added', status: 'success', duration: 3000, isClosable: true });
      reset();
      await load();
    } catch (err) {
      toast({ title: 'Could not save', description: apiErrorMessage(err, 'Please try again.'), status: 'error', duration: 6000, isClosable: true });
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (t: Testimonial) => {
    const published = t.published === false;
    try {
      await updateTestimonial(t.id, { published });
      // Publishing approves a link submission (the API clears `submitted` too).
      setEntries((prev) => prev.map((x) => (x.id === t.id ? { ...x, published, submitted: published ? false : x.submitted } : x)));
      if (published && t.submitted) toast({ title: 'Approved: now on your public page', status: 'success', duration: 3000, isClosable: true });
      if (editingId === t.id) setForm((prev) => ({ ...prev, published }));
    } catch (err) {
      toast({ title: 'Could not update', description: apiErrorMessage(err, 'Please try again.'), status: 'error', duration: 6000, isClosable: true });
    }
  };

  const handleDelete = async (t: Testimonial) => {
    if (!window.confirm(`Delete the testimonial from ${t.name}?`)) return;
    try {
      await deleteTestimonial(t.id);
      if (editingId === t.id) reset();
      setEntries((prev) => prev.filter((x) => x.id !== t.id));
      toast({ title: 'Testimonial deleted', status: 'success', duration: 3000, isClosable: true });
    } catch (err) {
      toast({ title: 'Could not delete', description: apiErrorMessage(err, 'Please try again.'), status: 'error', duration: 6000, isClosable: true });
    }
  };

  const label = { fontSize: 'xs', fontWeight: 'bold', color: 'fg.secondary', mb: 1 } as const;
  const visible = entries.filter((t) => t.published !== false).length;
  // Link submissions waiting for approval come first, so they're not missed.
  const awaiting = entries.filter((t) => t.submitted && t.published === false);
  const ordered = [...awaiting, ...entries.filter((t) => !awaiting.includes(t))];

  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} alignItems="start">
      <VStack align="stretch" spacing={6}>
        <Box as="form" onSubmit={handleSubmit} p={6} bg="bg.surface" borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="border.default">
          <Heading as="h2" size="sm" mb={1} color="fg.default">
            {editingId ? 'Edit Testimonial' : 'Add a Testimonial'}
          </Heading>
          <Text fontSize="sm" color="fg.muted" mb={4}>
            Quotes from clients, managers or teammates. Only add what the person agreed to share.
          </Text>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel {...label}>What they said</FormLabel>
              <Textarea value={form.quote} onChange={set('quote')} rows={5} maxLength={QUOTE_MAX} placeholder="e.g. Delivered our new API two weeks early and documented it so well the team could take over on day one." />
              <FormHelperText fontSize="xs">
                {form.quote.length} / {QUOTE_MAX}
              </FormHelperText>
            </FormControl>
            <FormControl isRequired>
              <FormLabel {...label}>Their name</FormLabel>
              <Input value={form.name} onChange={set('name')} maxLength={100} placeholder="e.g. Grace Nakato" />
            </FormControl>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} w="full">
              <FormControl>
                <FormLabel {...label}>Their role</FormLabel>
                <Input value={form.role} onChange={set('role')} maxLength={120} placeholder="e.g. Engineering Manager" />
              </FormControl>
              <FormControl>
                <FormLabel {...label}>Company</FormLabel>
                <Input value={form.company} onChange={set('company')} maxLength={120} placeholder="e.g. Acme Ltd" />
              </FormControl>
            </SimpleGrid>
            <FormControl>
              <FormLabel {...label}>Profile link</FormLabel>
              <Input value={form.linkUrl} onChange={set('linkUrl')} placeholder="linkedin.com/in/their-name" />
              <FormHelperText fontSize="xs">Lets visitors check the person is real.</FormHelperText>
            </FormControl>
            <FormControl>
              <FormLabel {...label}>Photo</FormLabel>
              <HStack spacing={3}>
                <Avatar size="md" name={form.name || undefined} src={form.avatarUrl || undefined} />
                <Button as="label" size="sm" variant="outline" cursor="pointer" isLoading={uploading} loadingText="Uploading">
                  {form.avatarUrl ? 'Change photo' : 'Upload photo'}
                  <input type="file" accept="image/*" hidden onChange={handleAvatar} />
                </Button>
                {form.avatarUrl && (
                  <Button size="sm" variant="ghost" colorScheme="red" onClick={() => setForm((prev) => ({ ...prev, avatarUrl: '' }))}>
                    Remove
                  </Button>
                )}
              </HStack>
              <FormHelperText fontSize="xs">Optional. Without one, their initials are shown.</FormHelperText>
            </FormControl>
            <Checkbox isChecked={form.published} onChange={set('published')} alignSelf="start" colorScheme="brand">
              Show on my public page
            </Checkbox>
            <HStack w="full">
              <Button type="submit" colorScheme="brand" flex={1} isLoading={saving} isDisabled={uploading} loadingText="Saving">
                {editingId ? 'Save Changes' : 'Add Testimonial'}
              </Button>
              {editingId && (
                <Button variant="ghost" onClick={reset}>
                  Cancel
                </Button>
              )}
            </HStack>
          </VStack>
        </Box>
        <TestimonialRequestsPanel />
      </VStack>

      <VStack align="stretch" spacing={3}>
        <Heading as="h2" size="sm" color="fg.default">
          Your Testimonials ({entries.length}{entries.length !== visible ? `, ${visible} shown` : ''})
        </Heading>
        {awaiting.length > 0 && (
          <Text fontSize="sm" color="fg.secondary">
            {awaiting.length === 1 ? '1 testimonial is' : `${awaiting.length} testimonials are`} awaiting your approval. Read it, edit if needed,
            then approve to show it publicly.
          </Text>
        )}
        {loading ? (
          <Spinner color="brand.500" alignSelf="center" my={8} />
        ) : entries.length === 0 ? (
          <Box textAlign="center" py={10} bg="bg.surface" borderRadius="xl" borderStyle="dashed" borderWidth="2px" borderColor="border.strong">
            <Text color="fg.muted" fontSize="sm">
              No testimonials yet. The section stays hidden until one is shown.
            </Text>
          </Box>
        ) : (
          ordered.map((t) => {
            const hidden = t.published === false;
            const pending = hidden && t.submitted;
            return (
              <Box
                key={t.id}
                p={4}
                bg="bg.surface"
                borderRadius="lg"
                borderWidth="1px"
                borderStyle={hidden && !pending ? 'dashed' : 'solid'}
                borderColor={editingId === t.id ? 'brand.400' : pending ? 'accent.400' : hidden ? 'border.strong' : 'border.default'}
              >
                <HStack align="start" spacing={3}>
                  <Avatar size="sm" name={t.name} src={t.avatarUrl ?? undefined} />
                  <Box minW={0} flex={1}>
                    <HStack spacing={2}>
                      <Text fontWeight="semibold" color="fg.heading" noOfLines={1}>
                        {t.name}
                      </Text>
                      {pending ? (
                        <Badge variant="subtle" colorScheme="accent" flexShrink={0}>
                          Awaiting approval
                        </Badge>
                      ) : (
                        hidden && (
                          <Badge variant="outline" colorScheme="gray" flexShrink={0}>
                            Hidden
                          </Badge>
                        )
                      )}
                    </HStack>
                    {formatAttribution(t) && (
                      <Text fontSize="xs" color="fg.muted" noOfLines={1}>
                        {formatAttribution(t)}
                      </Text>
                    )}
                    <Text fontSize="sm" color="fg.secondary" mt={2} noOfLines={pending ? undefined : 3}>
                      “{t.quote}”
                    </Text>
                  </Box>
                </HStack>
                <HStack spacing={1} mt={3} justify="end">
                  {pending ? (
                    <Button size="xs" colorScheme="brand" onClick={() => togglePublished(t)}>
                      Approve
                    </Button>
                  ) : (
                    <Button size="xs" variant="ghost" onClick={() => togglePublished(t)}>
                      {hidden ? 'Show' : 'Hide'}
                    </Button>
                  )}
                  <Button size="xs" variant="outline" onClick={() => startEdit(t)}>
                    Edit
                  </Button>
                  <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleDelete(t)}>
                    Delete
                  </Button>
                </HStack>
              </Box>
            );
          })
        )}
      </VStack>
    </SimpleGrid>
  );
}
