import { Box, Heading, IconButton, Image, Modal, ModalBody, ModalCloseButton, ModalContent, ModalOverlay, SimpleGrid, Text } from '@chakra-ui/react';
import { ArrowLeftIcon, ArrowRightIcon } from './icons';

interface Props {
  urls: string[];
  title: string;
  /** Index of the screenshot shown enlarged, or null. */
  zoom: number | null;
  onZoom: (index: number | null) => void;
}

/** Screenshot thumbnails for a case study, with an enlarged viewer. */
export function CaseStudyGallery({ urls, title, zoom, onZoom }: Props) {
  if (urls.length === 0) return null;
  const current = zoom !== null ? urls[zoom] : null;

  return (
    <Box>
      <Heading size="xs" color="fg.brand" textTransform="uppercase" letterSpacing="wide" mb={2}>
        Screenshots
      </Heading>
      <SimpleGrid columns={{ base: 2, sm: 3 }} spacing={2}>
        {urls.map((url, i) => (
          <Box
            key={url}
            as="button"
            type="button"
            onClick={() => onZoom(i)}
            borderRadius="md"
            overflow="hidden"
            borderWidth="1px"
            borderColor="border.default"
            transition="transform 0.15s, box-shadow 0.15s"
            _hover={{ transform: 'scale(1.02)', boxShadow: 'md' }}
            aria-label={`View screenshot ${i + 1} of ${urls.length}`}
          >
            <Image src={url} alt="" h="96px" w="full" objectFit="cover" loading="lazy" />
          </Box>
        ))}
      </SimpleGrid>

      <Modal isOpen={current !== null} onClose={() => onZoom(null)} size="6xl" isCentered>
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg="transparent" boxShadow="none">
          <ModalCloseButton color="white" bg="blackAlpha.600" _hover={{ bg: 'blackAlpha.800' }} zIndex={2} />
          <ModalBody p={0} position="relative">
            {current && (
              <Image src={current} alt={`${title}: screenshot ${zoom! + 1} of ${urls.length}`} maxH="85vh" mx="auto" borderRadius="lg" objectFit="contain" />
            )}
            {urls.length > 1 && zoom !== null && (
              <>
                <IconButton
                  aria-label="Previous screenshot"
                  icon={<ArrowLeftIcon />}
                  position="absolute"
                  left={2}
                  top="50%"
                  transform="translateY(-50%)"
                  borderRadius="full"
                  isDisabled={zoom === 0}
                  onClick={() => onZoom(zoom - 1)}
                />
                <IconButton
                  aria-label="Next screenshot"
                  icon={<ArrowRightIcon />}
                  position="absolute"
                  right={2}
                  top="50%"
                  transform="translateY(-50%)"
                  borderRadius="full"
                  isDisabled={zoom === urls.length - 1}
                  onClick={() => onZoom(zoom + 1)}
                />
                <Text textAlign="center" color="whiteAlpha.800" fontSize="sm" mt={2} aria-live="polite">
                  {zoom + 1} / {urls.length}
                </Text>
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
