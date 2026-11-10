import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Box, Button, Container, FormControl, FormErrorMessage, FormHelperText, FormLabel, Heading, Input, SimpleGrid, Spinner, Text, Textarea, VStack } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { apiErrorMessage } from '../api/profile';
import { formatUrl } from '../api/projectstate';
import { getRequestInvite, submitTestimonial, type RequestInvite } from '../api/testimonialRequests';
import { setMeta } from '../seo';

const QUOTE_MAX = 1000;
const QUOTE_MIN = 20;

type State = { kind: 'loading' } | { kind: 'invalid'; message: string } | { kind: 'form'; invite: RequestInvite } | { kind: 'sent'; ownerName: string | null };

/** The page behind a private testimonial link: a short form, no login. */
export function TestimonialRequestView() {
  const { token = '' } = useParams();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [form, setForm] = useState({ name: '', role: '', company: '', quote: '', linkUrl: '', website: '' });
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Private links shouldn't end up in search results.
  useEffect(() => {
    setMeta('name', 'robots', 'noindex');
    document.title = 'Write a testimonial';
  }, []);

  useEffect(() => {
    getRequestInvite(token)
      .then((invite) => {
        setState({ kind: 'form', invite });
        if (invite.recipientName) setForm((f) => ({ ...f, name: f.name || invite.recipientName! }));
      })
      .catch((err) =>
        setState({
          kind: 'invalid',
          message:
            isAxiosError(err) && err.response?.status === 429
              ? 'Too many attempts. Please try again later.'
              : apiErrorMessage(err, 'This link could not be opened. Please check it, or ask for a new one.'),
        }),
      );
  }, [token]);

  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const nameInvalid = touched && !form.name.trim();
  const quoteInvalid = touched && form.quote.trim().length < QUOTE_MIN;

  if (state.kind === 'loading') {
    return (
      <VStack py={24}>
        <Spinner color="brand.500" />
      </VStack>
    );
  }

  if (state.kind === 'invalid' || state.kind === 'sent') {
    const sent = state.kind === 'sent';
    return (
      <Container maxW="container.sm" py={{ base: 16, md: 24 }} textAlign="center">
        <VStack spacing={4} bg="bg.surface" borderRadius="2xl" borderWidth="1px" borderColor="border.default" p={{ base: 8, md: 10 }} role="status">
          {sent && (
            <Text fontSize="3xl" aria-hidden>
              ✓
            </Text>
          )}
          <Heading as="h1" size="md" color="fg.heading">
            {sent ? 'Thank you!' : 'This link isn’t available'}
          </Heading>
          <Text color="fg.secondary">
            {sent
              ? `Your testimonial was sent${state.ownerName ? ` to ${state.ownerName}` : ''}. It will appear on the portfolio once it’s been reviewed.`
              : state.message}
          </Text>
          <Button as={RouterLink} to="/" variant="outline" size="sm">
            Visit the portfolio
          </Button>
        </VStack>
      </Container>
    );
  }

  const { invite } = state;
  const owner = invite.ownerName ?? 'me';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!form.name.trim() || form.quote.trim().length < QUOTE_MIN) return;
    setSending(true);
    setError(null);
    try {
      await submitTestimonial(token, {
        name: form.name.trim(),
        role: form.role.trim() || null,
        company: form.company.trim() || null,
        quote: form.quote.trim(),
        linkUrl: formatUrl(form.linkUrl) ?? null,
        website: form.website,
      });
      setState({ kind: 'sent', ownerName: invite.ownerName });
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 410) {
        setState({ kind: 'invalid', message: apiErrorMessage(err, 'This link has already been used.') });
        return;
      }
      setError(
        isAxiosError(err) && err.response?.status === 429
          ? 'Too many attempts. Please try again in an hour.'
          : apiErrorMessage(err, 'Your testimonial could not be sent. Please try again.'),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Container maxW="container.sm" py={{ base: 10, md: 16 }}>
      <VStack align="stretch" spacing={6}>
        <Box>
          <Text fontSize="xs" fontWeight="bold" letterSpacing="wider" textTransform="uppercase" color="fg.brand" mb={2}>
            Testimonial
          </Text>
          <Heading as="h1" size="lg" color="fg.heading">
            {invite.recipientName ? `Hi ${invite.recipientName}, ` : ''}would you write a few words about working with {owner}?
          </Heading>
          {invite.ownerHeadline && (
            <Text color="fg.muted" mt={1}>
              {invite.ownerName} · {invite.ownerHeadline}
            </Text>
          )}
          {invite.note && (
            <Box mt={4} p={4} bg="bg.subtle" borderRadius="lg" borderLeftWidth="3px" borderLeftColor="accent.400">
              <Text color="fg.default" whiteSpace="pre-line">
                {invite.note}
              </Text>
            </Box>
          )}
        </Box>

        <Box as="form" onSubmit={handleSubmit} noValidate bg="bg.surface" borderRadius="xl" borderWidth="1px" borderColor="border.default" p={{ base: 5, md: 7 }}>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired isInvalid={quoteInvalid}>
              <FormLabel fontSize="sm">Your testimonial</FormLabel>
              <Textarea
                value={form.quote}
                onChange={set('quote')}
                rows={6}
                maxLength={QUOTE_MAX}
                placeholder="What was it like working together? What stood out?"
              />
              {quoteInvalid ? (
                <FormErrorMessage>Please write at least {QUOTE_MIN} characters.</FormErrorMessage>
              ) : (
                <FormHelperText fontSize="xs">
                  {form.quote.trim().length}/{QUOTE_MAX}. Shown publicly once approved.
                </FormHelperText>
              )}
            </FormControl>
            <FormControl isRequired isInvalid={nameInvalid}>
              <FormLabel fontSize="sm">Your name</FormLabel>
              <Input value={form.name} onChange={set('name')} maxLength={100} autoComplete="name" />
              <FormErrorMessage>Please add your name.</FormErrorMessage>
            </FormControl>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">Role</FormLabel>
                <Input value={form.role} onChange={set('role')} maxLength={120} autoComplete="organization-title" placeholder="e.g. Engineering Manager" />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Company</FormLabel>
                <Input value={form.company} onChange={set('company')} maxLength={120} autoComplete="organization" />
              </FormControl>
            </SimpleGrid>
            <FormControl>
              <FormLabel fontSize="sm">LinkedIn or website</FormLabel>
              <Input value={form.linkUrl} onChange={set('linkUrl')} maxLength={300} placeholder="linkedin.com/in/your-name" inputMode="url" />
              <FormHelperText fontSize="xs">Optional. Lets readers see you’re real.</FormHelperText>
            </FormControl>

            {/* Honeypot: hidden from people and screen readers; bots tend to fill every field. */}
            <Box position="absolute" left="-10000px" w="1px" h="1px" overflow="hidden" aria-hidden>
              <label>
                Website
                <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
              </label>
            </Box>

            {error && (
              <Text color="red.500" _dark={{ color: 'red.300' }} fontSize="sm" role="alert">
                {error}
              </Text>
            )}

            <Button type="submit" colorScheme="brand" isLoading={sending} loadingText="Sending">
              Send testimonial
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}
