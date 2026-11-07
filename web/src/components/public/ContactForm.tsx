import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Box, Button, FormControl, FormErrorMessage, FormLabel, Input, Text, Textarea, VStack } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { sendMessage, type NewMessage } from '../../api/messages';
import { apiErrorMessage } from '../../api/profile';

const EMPTY: Required<NewMessage> = { name: '', email: '', body: '', website: '' };
const BODY_MIN = 10;
const BODY_MAX = 5000;

type Status = 'idle' | 'sending' | 'sent';

/** Contact form that saves the message to the owner's Admin inbox. */
export function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const set = (key: keyof NewMessage) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const emailInvalid = touched && !/^\S+@\S+\.\S+$/.test(form.email.trim());
  const bodyInvalid = touched && form.body.trim().length < BODY_MIN;
  const nameInvalid = touched && !form.name.trim();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email.trim()) || form.body.trim().length < BODY_MIN) return;
    setStatus('sending');
    setError(null);
    try {
      await sendMessage(form);
      setStatus('sent');
      setForm(EMPTY);
      setTouched(false);
    } catch (err) {
      setStatus('idle');
      setError(
        isAxiosError(err) && err.response?.status === 429
          ? 'You have sent several messages recently. Please try again in an hour.'
          : apiErrorMessage(err, 'Your message could not be sent. Please try again, or use the email link.'),
      );
    }
  };

  if (status === 'sent') {
    return (
      <VStack bg="bg.surface" color="fg.default" borderRadius="xl" p={{ base: 6, md: 8 }} spacing={3} textAlign="center" role="status">
        <Text fontSize="3xl" aria-hidden>
          ✓
        </Text>
        <Text fontWeight="semibold" color="fg.heading" fontSize="lg">
          Thanks, your message was sent.
        </Text>
        <Text color="fg.secondary" fontSize="sm">
          I'll reply to the email address you gave.
        </Text>
        <Button size="sm" variant="ghost" colorScheme="brand" onClick={() => setStatus('idle')}>
          Send another message
        </Button>
      </VStack>
    );
  }

  return (
    <Box as="form" onSubmit={handleSubmit} noValidate bg="bg.surface" color="fg.default" borderRadius="xl" p={{ base: 5, md: 7 }} textAlign="left">
      <VStack spacing={4} align="stretch">
        <FormControl isRequired isInvalid={nameInvalid}>
          <FormLabel fontSize="sm">Name</FormLabel>
          <Input value={form.name} onChange={set('name')} maxLength={100} autoComplete="name" />
          <FormErrorMessage>Please add your name.</FormErrorMessage>
        </FormControl>
        <FormControl isRequired isInvalid={emailInvalid}>
          <FormLabel fontSize="sm">Email</FormLabel>
          <Input type="email" value={form.email} onChange={set('email')} maxLength={200} autoComplete="email" />
          <FormErrorMessage>Please enter a valid email so I can reply.</FormErrorMessage>
        </FormControl>
        <FormControl isRequired isInvalid={bodyInvalid}>
          <FormLabel fontSize="sm">Message</FormLabel>
          <Textarea value={form.body} onChange={set('body')} rows={5} maxLength={BODY_MAX} placeholder="Tell me about the role, project or idea." />
          <FormErrorMessage>Please write at least {BODY_MIN} characters.</FormErrorMessage>
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

        <Button type="submit" colorScheme="brand" isLoading={status === 'sending'} loadingText="Sending">
          Send message
        </Button>
      </VStack>
    </Box>
  );
}
