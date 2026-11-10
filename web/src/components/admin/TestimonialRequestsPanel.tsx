import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Badge, Box, Button, FormControl, FormHelperText, FormLabel, Heading, HStack, Input, Text, Textarea, useToast, VStack } from '@chakra-ui/react';
import { apiErrorMessage } from '../../api/profile';
import {
  createTestimonialRequest,
  getTestimonialRequests,
  requestLink,
  revokeTestimonialRequest,
  type TestimonialRequest,
} from '../../api/testimonialRequests';

const shortDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

function status(r: TestimonialRequest): { label: string; scheme: string; detail: string } {
  if (r.usedAt) return { label: 'Submitted', scheme: 'green', detail: `on ${shortDate(r.usedAt)}` };
  if (new Date(r.expiresAt) <= new Date()) return { label: 'Expired', scheme: 'gray', detail: `on ${shortDate(r.expiresAt)}` };
  return { label: 'Open', scheme: 'brand', detail: `until ${shortDate(r.expiresAt)}` };
}

/** Private, single-use links that let someone write a testimonial without an account. */
export function TestimonialRequestsPanel() {
  const [requests, setRequests] = useState<TestimonialRequest[]>([]);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  const load = useCallback(
    () =>
      getTestimonialRequests()
        .then(setRequests)
        .catch(() => toast({ title: 'Failed to load request links', status: 'error', duration: 4000, isClosable: true })),
    [toast],
  );

  useEffect(() => {
    load();
  }, [load]);

  const copy = async (r: TestimonialRequest, fresh = false) => {
    const url = requestLink(r);
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: fresh ? 'Link created and copied' : 'Link copied', description: 'Send it by email or chat. It works once, for 30 days.', status: 'success', duration: 4000, isClosable: true });
    } catch {
      toast({ title: 'Copy this link', description: url, status: 'info', duration: 12000, isClosable: true });
    }
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const r = await createTestimonialRequest({ recipientName: name.trim() || null, note: note.trim() || null });
      setRequests((prev) => [r, ...prev]);
      setName('');
      setNote('');
      await copy(r, true);
    } catch (err) {
      toast({ title: 'Could not create the link', description: apiErrorMessage(err, 'Please try again.'), status: 'error', duration: 6000, isClosable: true });
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (r: TestimonialRequest) => {
    if (!window.confirm(`Revoke the link${r.recipientName ? ` for ${r.recipientName}` : ''}? It will stop working.`)) return;
    try {
      await revokeTestimonialRequest(r.id);
      setRequests((prev) => prev.filter((x) => x.id !== r.id));
    } catch (err) {
      toast({ title: 'Could not revoke', description: apiErrorMessage(err, 'Please try again.'), status: 'error', duration: 6000, isClosable: true });
    }
  };

  const label = { fontSize: 'xs', fontWeight: 'bold', color: 'fg.secondary', mb: 1 } as const;

  return (
    <Box p={6} bg="bg.surface" borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="border.default">
      <Heading as="h2" size="sm" mb={1} color="fg.default">
        Request a Testimonial
      </Heading>
      <Text fontSize="sm" color="fg.muted" mb={4}>
        Create a private link for a colleague or client. They write it themselves; it stays hidden until you approve it.
      </Text>
      <VStack as="form" onSubmit={create} spacing={3} align="stretch">
        <FormControl>
          <FormLabel {...label}>Their name</FormLabel>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Optional, prefills the form" size="sm" />
        </FormControl>
        <FormControl>
          <FormLabel {...label}>Note to them</FormLabel>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2} size="sm" placeholder="e.g. Thanks for the great year on the payments team!" />
          <FormHelperText fontSize="xs">Optional. Shown at the top of their form.</FormHelperText>
        </FormControl>
        <Button type="submit" size="sm" colorScheme="brand" variant="outline" isLoading={creating} loadingText="Creating">
          Create and copy link
        </Button>
      </VStack>

      {requests.length > 0 && (
        <VStack as="ul" listStyleType="none" align="stretch" spacing={2} mt={5} pt={4} borderTopWidth="1px" borderColor="border.subtle">
          {requests.map((r) => {
            const s = status(r);
            const open = s.label === 'Open';
            return (
              <HStack as="li" key={r.id} justify="space-between" gap={2} fontSize="sm">
                <Box minW={0}>
                  <HStack spacing={2}>
                    <Text color="fg.heading" noOfLines={1}>
                      {r.recipientName || 'Unnamed link'}
                    </Text>
                    <Badge colorScheme={s.scheme} variant="subtle" fontSize="2xs" flexShrink={0}>
                      {s.label}
                    </Badge>
                  </HStack>
                  <Text fontSize="xs" color="fg.muted">
                    {s.label} {s.detail}
                  </Text>
                </Box>
                <HStack spacing={1} flexShrink={0}>
                  {open && (
                    <Button size="xs" variant="outline" onClick={() => copy(r)}>
                      Copy link
                    </Button>
                  )}
                  <Button size="xs" variant="ghost" colorScheme={open ? 'red' : 'gray'} onClick={() => revoke(r)} aria-label={open ? 'Revoke link' : 'Remove from list'}>
                    {open ? 'Revoke' : 'Remove'}
                  </Button>
                </HStack>
              </HStack>
            );
          })}
        </VStack>
      )}
    </Box>
  );
}
