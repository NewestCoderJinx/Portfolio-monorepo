import { useState, type ChangeEvent } from 'react';
import { Box, Button, CloseButton, HStack, Image, SimpleGrid, Spinner, Text, useToast } from '@chakra-ui/react';
import { apiErrorMessage } from '../../api/profile';
import { uploadProjectImage } from '../../api/projectstate';

export const GALLERY_MAX = 8;

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
}

/** Upload, preview and remove a project's extra screenshots. */
export function GalleryField({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(0);
  const toast = useToast();
  const room = GALLERY_MAX - value.length;

  const handleFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    if (files.length > room) {
      toast({ title: `You can add ${room} more image${room === 1 ? '' : 's'} (max ${GALLERY_MAX}).`, status: 'warning', duration: 4000, isClosable: true });
    }
    const batch = files.slice(0, room);
    setUploading(batch.length);
    const results = await Promise.allSettled(batch.map((f) => uploadProjectImage(f)));
    setUploading(0);
    const urls = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failed) {
      toast({ title: apiErrorMessage(failed.reason, 'Some images failed to upload'), status: 'error', duration: 4000, isClosable: true });
    }
    if (urls.length) onChange([...value, ...urls]);
  };

  return (
    <Box w="full">
      {value.length > 0 && (
        <SimpleGrid columns={{ base: 3, sm: 4 }} spacing={2} mb={2}>
          {value.map((url, i) => (
            <Box key={url} position="relative" borderRadius="md" overflow="hidden" borderWidth="1px" borderColor="border.default">
              <Image src={url} alt={`Screenshot ${i + 1}`} h="64px" w="full" objectFit="cover" />
              <CloseButton
                size="sm"
                position="absolute"
                top={1}
                right={1}
                bg="blackAlpha.600"
                color="white"
                _hover={{ bg: 'blackAlpha.800' }}
                aria-label={`Remove screenshot ${i + 1}`}
                onClick={() => onChange(value.filter((u) => u !== url))}
              />
            </Box>
          ))}
        </SimpleGrid>
      )}
      <HStack spacing={2}>
        <Button as="label" size="xs" variant="outline" cursor="pointer" isDisabled={room <= 0 || uploading > 0}>
          {value.length ? 'Add more screenshots' : 'Add screenshots'}
          <input type="file" accept="image/*" multiple hidden onChange={handleFiles} disabled={room <= 0 || uploading > 0} />
        </Button>
        {uploading > 0 && (
          <HStack spacing={1}>
            <Spinner size="xs" color="brand.500" />
            <Text fontSize="xs" color="fg.muted">
              Uploading {uploading}…
            </Text>
          </HStack>
        )}
        <Text fontSize="xs" color="fg.subtle">
          {value.length}/{GALLERY_MAX}
        </Text>
      </HStack>
    </Box>
  );
}
