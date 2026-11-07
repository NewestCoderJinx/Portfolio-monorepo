import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
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
  Text,
  Textarea,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { apiErrorMessage, getProfile, updateProfile, uploadResume, type Profile } from '../../api/profile';
import { formatUrl, uploadProjectImage } from '../../api/projectstate';
import { ProfileHero } from '../public/ProfileHero';

const FIELDS = ['name', 'headline', 'availability', 'location', 'email', 'bio', 'avatarUrl', 'githubUrl', 'linkedinUrl', 'websiteUrl', 'resumeUrl'] as const;
type Field = (typeof FIELDS)[number];
type Form = Record<Field, string>;

const BIO_MAX = 3000;
const URL_FIELDS: Field[] = ['avatarUrl', 'githubUrl', 'linkedinUrl', 'websiteUrl', 'resumeUrl'];

const toForm = (p: Profile | null): Form =>
  Object.fromEntries(FIELDS.map((f) => [f, p?.[f] ?? ''])) as Form;

/** Trim everything; empty optional fields become null so they're cleared, URLs get https:// added. */
const toPayload = (form: Form) =>
  Object.fromEntries(
    FIELDS.map((f) => {
      const v = form[f].trim();
      if (f === 'name') return [f, v];
      if (!v) return [f, null];
      return [f, URL_FIELDS.includes(f) ? formatUrl(v) : v];
    }),
  );

export function ProfileEditor() {
  const [saved, setSaved] = useState<Form>(toForm(null));
  const [form, setForm] = useState<Form>(toForm(null));
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const toast = useToast();

  useEffect(() => {
    getProfile()
      .then((p) => {
        setExists(Boolean(p));
        setSaved(toForm(p));
        setForm(toForm(p));
      })
      .catch(() => toast({ title: 'Failed to load profile', status: 'error', duration: 4000, isClosable: true }))
      .finally(() => setLoading(false));
  }, [toast]);

  const dirty = FIELDS.some((f) => form[f] !== saved[f]);
  const set = (f: Field) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [f]: e.target.value }));

  // What the public page would show with the current (unsaved) values.
  const preview = useMemo<Profile | null>(() => {
    const p = toPayload(form);
    if (!p.name) return null;
    return { id: 'preview', ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v ?? undefined])) } as Profile;
  }, [form]);

  const handleAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProjectImage(file);
      setForm((prev) => ({ ...prev, avatarUrl: url }));
    } catch (err) {
      toast({ title: apiErrorMessage(err, 'Failed to upload photo'), status: 'error', duration: 4000, isClosable: true });
    } finally {
      setUploading(false);
    }
  };

  const handleResume = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingResume(true);
    try {
      const url = await uploadResume(file);
      setForm((prev) => ({ ...prev, resumeUrl: url }));
      toast({ title: 'Résumé uploaded', description: 'Save your profile to publish it.', status: 'info', duration: 4000, isClosable: true });
    } catch (err) {
      toast({ title: apiErrorMessage(err, 'Failed to upload résumé'), status: 'error', duration: 4000, isClosable: true });
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: 'Name is required', status: 'warning', duration: 3000, isClosable: true });
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProfile(toPayload(form));
      setExists(true);
      setSaved(toForm(updated));
      setForm(toForm(updated));
      toast({ title: exists ? 'Profile updated' : 'Profile created', status: 'success', duration: 3000, isClosable: true });
    } catch (err) {
      toast({ title: 'Could not save profile', description: apiErrorMessage(err, 'Please try again.'), status: 'error', duration: 6000, isClosable: true });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <VStack py={12}>
        <Spinner color="brand.500" />
      </VStack>
    );
  }

  const label = { fontSize: 'xs', fontWeight: 'bold', color: 'fg.secondary', mb: 1 } as const;

  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} alignItems="start">
      <Box as="form" onSubmit={handleSubmit} p={6} bg="bg.surface" borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="border.default">
        <Heading as="h2" size="sm" mb={1} color="fg.default">
          {exists ? 'Edit Your Profile' : 'Create Your Profile'}
        </Heading>
        <Text fontSize="sm" color="fg.muted" mb={5}>
          This is the first thing visitors see on your public page.
        </Text>

        <VStack spacing={4} align="stretch">
          <FormControl>
            <FormLabel {...label}>Profile Photo</FormLabel>
            <HStack spacing={3}>
              <Input type="file" accept="image/*" onChange={handleAvatar} p={1} isDisabled={uploading} />
              {uploading && <Spinner size="sm" color="brand.500" />}
              {form.avatarUrl && !uploading && (
                <Button size="sm" variant="ghost" colorScheme="red" onClick={() => setForm((p) => ({ ...p, avatarUrl: '' }))}>
                  Remove
                </Button>
              )}
            </HStack>
            <FormHelperText fontSize="xs">A square photo works best. JPG, PNG, WEBP or GIF up to 5 MB.</FormHelperText>
          </FormControl>

          <FormControl isRequired>
            <FormLabel {...label}>Full Name</FormLabel>
            <Input value={form.name} onChange={set('name')} placeholder="Your name" maxLength={100} />
          </FormControl>

          <FormControl>
            <FormLabel {...label}>Headline</FormLabel>
            <Input value={form.headline} onChange={set('headline')} placeholder="e.g. Full-Stack Engineer focused on APIs and cloud infrastructure" maxLength={150} />
          </FormControl>

          <FormControl>
            <FormLabel {...label}>Availability</FormLabel>
            <Input value={form.availability} onChange={set('availability')} placeholder="e.g. Open to full-time roles" maxLength={80} />
            <FormHelperText fontSize="xs">Shown as a badge at the top of your page. Leave empty to hide it.</FormHelperText>
          </FormControl>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel {...label}>Location</FormLabel>
              <Input value={form.location} onChange={set('location')} placeholder="City, Country / Remote" maxLength={100} />
            </FormControl>
            <FormControl>
              <FormLabel {...label}>Contact Email</FormLabel>
              <Input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
            </FormControl>
          </SimpleGrid>

          <FormControl>
            <FormLabel {...label}>About You</FormLabel>
            <Textarea value={form.bio} onChange={set('bio')} rows={5} maxLength={BIO_MAX} placeholder="What you work on, what you care about, and what you're looking for." />
            <FormHelperText fontSize="xs" textAlign="right">
              {form.bio.length}/{BIO_MAX}
            </FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel {...label}>GitHub</FormLabel>
            <Input value={form.githubUrl} onChange={set('githubUrl')} placeholder="github.com/username" />
          </FormControl>
          <FormControl>
            <FormLabel {...label}>LinkedIn</FormLabel>
            <Input value={form.linkedinUrl} onChange={set('linkedinUrl')} placeholder="linkedin.com/in/username" />
          </FormControl>
          <FormControl>
            <FormLabel {...label}>Personal Website</FormLabel>
            <Input value={form.websiteUrl} onChange={set('websiteUrl')} placeholder="yourname.dev" />
          </FormControl>
          <FormControl>
            <FormLabel {...label}>Résumé / CV Link</FormLabel>
            <Input value={form.resumeUrl} onChange={set('resumeUrl')} placeholder="Upload a PDF below, or paste a link (e.g. Google Drive)" />
            <HStack spacing={3} mt={2}>
              <Input type="file" accept="application/pdf" onChange={handleResume} p={1} isDisabled={uploadingResume} aria-label="Upload résumé PDF" />
              {uploadingResume && <Spinner size="sm" color="brand.500" />}
              {form.resumeUrl && !uploadingResume && (
                <Button as="a" href={formatUrl(form.resumeUrl)} target="_blank" rel="noopener noreferrer" size="sm" variant="ghost" flexShrink={0}>
                  View
                </Button>
              )}
            </HStack>
            <FormHelperText fontSize="xs">PDF up to 10 MB. A pasted link must be viewable by anyone who has it.</FormHelperText>
          </FormControl>

          <HStack pt={2}>
            <Button type="submit" colorScheme="brand" flex={1} isLoading={saving} isDisabled={!dirty || uploading || uploadingResume} loadingText="Saving...">
              {exists ? 'Save Changes' : 'Create Profile'}
            </Button>
            {dirty && (
              <Button variant="ghost" onClick={() => setForm(saved)} isDisabled={saving}>
                Discard
              </Button>
            )}
          </HStack>
        </VStack>
      </Box>

      <Box position={{ lg: 'sticky' }} top={{ lg: '90px' }}>
        <HStack justify="space-between" mb={2}>
          <Text fontSize="xs" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
            Live Preview {dirty && '(unsaved)'}
          </Text>
          <Button as={RouterLink} to="/" size="xs" variant="link" colorScheme="brand">
            Open public page
          </Button>
        </HStack>
        <Box bg="bg.subtle" borderWidth="1px" borderStyle="dashed" borderColor="border.strong" borderRadius="xl" px={4}>
          <ProfileHero profile={preview} loading={false} />
        </Box>
      </Box>
    </SimpleGrid>
  );
}
