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
  Image,
  Input,
  Link,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { createPost, deletePost, formatPostDate, getAllPosts, readingTime, slugify, updatePost, type Post, type PostInput } from '../../api/posts';
import { apiErrorMessage } from '../../api/profile';
import { uploadProjectImage } from '../../api/projectstate';
import { Markdown } from '../Markdown';

interface Form {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImageUrl: string;
  tags: string;
  published: boolean;
}

const EMPTY: Form = { title: '', slug: '', excerpt: '', body: '', coverImageUrl: '', tags: '', published: false };

const toForm = (p: Post): Form => ({
  title: p.title,
  slug: p.slug,
  excerpt: p.excerpt ?? '',
  body: p.body,
  coverImageUrl: p.coverImageUrl ?? '',
  tags: (p.tags ?? []).join(', '),
  published: p.published,
});

const toPayload = (f: Form): PostInput => ({
  title: f.title.trim(),
  // Blank lets the API generate one from the title (new posts) or keeps the current one (edits).
  ...(f.slug.trim() ? { slug: f.slug.trim() } : {}),
  excerpt: f.excerpt.trim() || null,
  body: f.body,
  coverImageUrl: f.coverImageUrl.trim() || null,
  tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean),
  published: f.published,
});

export function PostsEditor() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const toast = useToast();

  const load = useCallback(
    () =>
      getAllPosts()
        .then(setPosts)
        .catch(() => toast({ title: 'Failed to load posts', status: 'error', duration: 4000, isClosable: true }))
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
    setPreview(false);
  };

  const startEdit = (p: Post) => {
    setEditingId(p.id);
    setForm(toForm(p));
    setPreview(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCover = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProjectImage(file);
      setForm((prev) => ({ ...prev, coverImageUrl: url }));
    } catch (err) {
      toast({ title: 'Upload failed', description: apiErrorMessage(err, 'Please try another image.'), status: 'error', duration: 6000, isClosable: true });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = toPayload(form);
      const saved = editingId ? await updatePost(editingId, payload) : await createPost(payload);
      toast({
        title: saved.published ? (editingId ? 'Post updated' : 'Post published') : 'Draft saved',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      reset();
      await load();
    } catch (err) {
      toast({ title: 'Could not save', description: apiErrorMessage(err, 'Please try again.'), status: 'error', duration: 6000, isClosable: true });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Post) => {
    if (!window.confirm(`Delete "${p.title}"? This can't be undone.`)) return;
    try {
      await deletePost(p.id);
      if (editingId === p.id) reset();
      setPosts((prev) => prev.filter((x) => x.id !== p.id));
      toast({ title: 'Deleted', status: 'success', duration: 3000, isClosable: true });
    } catch (err) {
      toast({ title: 'Could not delete', description: apiErrorMessage(err, 'Please try again.'), status: 'error', duration: 6000, isClosable: true });
    }
  };

  const label = { fontSize: 'xs', fontWeight: 'bold', color: 'fg.secondary', mb: 1 } as const;
  const slugHint = form.slug.trim() || (editingId ? posts.find((p) => p.id === editingId)?.slug : form.title.trim() && slugify(form.title));

  return (
    <SimpleGrid columns={{ base: 1, xl: 5 }} spacing={6} alignItems="start">
      <Box
        as="form"
        onSubmit={handleSubmit}
        gridColumn={{ xl: 'span 3' }}
        p={6}
        bg="bg.surface"
        borderRadius="xl"
        boxShadow="sm"
        borderWidth="1px"
        borderColor="border.default"
      >
        <Heading as="h2" size="sm" mb={1} color="fg.default">
          {editingId ? 'Edit Post' : 'Write a Post'}
        </Heading>
        <Text fontSize="sm" color="fg.muted" mb={4}>
          Published posts appear on your blog. Drafts stay here until you publish them.
        </Text>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel {...label}>Title</FormLabel>
            <Input value={form.title} onChange={set('title')} maxLength={200} placeholder="e.g. What I learned shipping my first NestJS API" />
          </FormControl>
          <FormControl>
            <FormLabel {...label}>Link</FormLabel>
            <Input value={form.slug} onChange={set('slug')} maxLength={80} placeholder={editingId ? 'Keep the current link' : 'Made from the title'} />
            <FormHelperText fontSize="xs">
              {slugHint ? `/blog/${slugHint}` : 'Lowercase letters, numbers and hyphens.'}
              {editingId && ' Changing it breaks links people already shared.'}
            </FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel {...label}>Summary</FormLabel>
            <Textarea value={form.excerpt} onChange={set('excerpt')} rows={2} maxLength={500} placeholder="One or two sentences for the post list and link previews." />
          </FormControl>
          <FormControl>
            <FormLabel {...label}>Cover image</FormLabel>
            <HStack align="start">
              <Input value={form.coverImageUrl} onChange={set('coverImageUrl')} placeholder="Paste a URL or upload" />
              <Button as="label" variant="outline" flexShrink={0} isLoading={uploading} cursor="pointer">
                Upload
                <input type="file" accept="image/*" hidden onChange={handleCover} />
              </Button>
            </HStack>
            {form.coverImageUrl && <Image src={form.coverImageUrl} alt="" mt={2} maxH="140px" borderRadius="md" objectFit="cover" />}
          </FormControl>
          <FormControl>
            <FormLabel {...label}>Tags</FormLabel>
            <Input value={form.tags} onChange={set('tags')} placeholder="e.g. NestJS, Career, Postgres" />
            <FormHelperText fontSize="xs">Separate with commas.</FormHelperText>
          </FormControl>
          <FormControl>
            <HStack justify="space-between" mb={1}>
              <FormLabel {...label} mb={0}>
                Post
              </FormLabel>
              <ButtonGroup size="xs" isAttached variant="outline">
                <Button variant={preview ? 'outline' : 'solid'} colorScheme={preview ? 'gray' : 'brand'} onClick={() => setPreview(false)}>
                  Write
                </Button>
                <Button variant={preview ? 'solid' : 'outline'} colorScheme={preview ? 'brand' : 'gray'} onClick={() => setPreview(true)}>
                  Preview
                </Button>
              </ButtonGroup>
            </HStack>
            {preview ? (
              <Box minH="320px" maxH="600px" overflowY="auto" p={4} borderWidth="1px" borderColor="border.default" borderRadius="md">
                {form.body.trim() ? <Markdown source={form.body} /> : <Text color="fg.muted">Nothing to preview yet.</Text>}
              </Box>
            ) : (
              <Textarea
                value={form.body}
                onChange={set('body')}
                rows={16}
                fontFamily="mono"
                fontSize="sm"
                placeholder={'Write in Markdown.\n\n## A heading\n\nSome **bold** text, a [link](https://example.com) and a list:\n\n- one\n- two\n\n```ts\nconst code = true;\n```'}
              />
            )}
            <FormHelperText fontSize="xs">Markdown: ## headings, **bold**, [links](url), lists, `code`, tables. {form.body.trim() && `· ${readingTime(form.body)}`}</FormHelperText>
          </FormControl>
          <Checkbox isChecked={form.published} onChange={set('published')} alignSelf="start" colorScheme="brand">
            Published (visible on your blog)
          </Checkbox>
          <HStack w="full">
            <Button type="submit" colorScheme="brand" flex={1} isLoading={saving} loadingText="Saving">
              {form.published ? (editingId ? 'Save Changes' : 'Publish') : 'Save Draft'}
            </Button>
            {editingId && (
              <Button variant="ghost" onClick={reset}>
                Cancel
              </Button>
            )}
          </HStack>
        </VStack>
      </Box>

      <VStack align="stretch" spacing={3} gridColumn={{ xl: 'span 2' }}>
        <HStack justify="space-between">
          <Heading as="h2" size="sm" color="fg.default">
            Your Posts ({posts.length})
          </Heading>
          {posts.some((p) => p.published) && (
            <Link as={RouterLink} to="/blog" fontSize="sm" color="fg.brand">
              View blog
            </Link>
          )}
        </HStack>
        {loading ? (
          <Spinner color="brand.500" alignSelf="center" my={8} />
        ) : posts.length === 0 ? (
          <Box textAlign="center" py={10} bg="bg.surface" borderRadius="xl" borderStyle="dashed" borderWidth="2px" borderColor="border.strong">
            <Text color="fg.muted" fontSize="sm">
              No posts yet. The blog stays hidden until you publish one.
            </Text>
          </Box>
        ) : (
          posts.map((p) => (
            <Box key={p.id} p={4} bg="bg.surface" borderRadius="lg" borderWidth="1px" borderColor={editingId === p.id ? 'brand.400' : 'border.default'}>
              <HStack justify="space-between" align="start" gap={3}>
                <Box minW={0}>
                  <Badge colorScheme={p.published ? 'green' : 'gray'} variant="subtle" fontSize="2xs" mb={1}>
                    {p.published ? 'Published' : 'Draft'}
                  </Badge>
                  <Text fontWeight="semibold" color="fg.heading" noOfLines={2}>
                    {p.title}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {p.published ? formatPostDate(p.publishedAt) : `Edited ${formatPostDate(p.updatedAt)}`} · {readingTime(p.body)}
                  </Text>
                </Box>
                <HStack spacing={1} flexShrink={0}>
                  {p.published && (
                    <Button as={RouterLink} to={`/blog/${p.slug}`} size="xs" variant="ghost">
                      View
                    </Button>
                  )}
                  <Button size="xs" variant="outline" onClick={() => startEdit(p)}>
                    Edit
                  </Button>
                  <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleDelete(p)}>
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
