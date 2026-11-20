import { Box, Heading, HStack, IconButton, Link, SimpleGrid, Text, useClipboard, VStack } from '@chakra-ui/react';
import type { Profile } from '../../api/profile';
import { ContactForm } from './ContactForm';
import { CheckIcon, CopyIcon, MailIcon, MapPinIcon } from './icons';
import { SocialLinks } from './SocialLinks';

/** The owner's address as a mail link, with a button that copies it for people who don't use a mail app. */
function EmailRow({ email }: { email: string }) {
  const { onCopy, hasCopied } = useClipboard(email);
  return (
    <HStack spacing={2} bg="whiteAlpha.100" borderWidth="1px" borderColor="whiteAlpha.300" borderRadius="lg" pl={3} pr={1} py={1} maxW="full">
      <MailIcon />
      <Link href={`mailto:${email}`} fontWeight="medium" noOfLines={1} wordBreak="break-all" _hover={{ textDecoration: 'underline' }}>
        {email}
      </Link>
      <IconButton
        aria-label={hasCopied ? 'Email address copied' : 'Copy email address'}
        title={hasCopied ? 'Copied' : 'Copy'}
        icon={hasCopied ? <CheckIcon /> : <CopyIcon />}
        onClick={onCopy}
        size="sm"
        variant="ghost"
        color="white"
        _hover={{ bg: 'whiteAlpha.200' }}
      />
      {/* Announce the copy for screen readers; the icon change alone is silent. */}
      <Box as="span" role="status" position="absolute" w="1px" h="1px" overflow="hidden" sx={{ clip: 'rect(0 0 0 0)' }}>
        {hasCopied ? 'Email address copied' : ''}
      </Box>
    </HStack>
  );
}

export function ContactSection({ profile }: { profile: Profile | null }) {
  // The form needs somewhere to send messages, which exists once the owner has set up a profile.
  if (!profile) return null;

  return (
    <Box
      as="section"
      id="contact"
      aria-labelledby="contact-heading"
      scrollMarginTop="90px"
      bgGradient="linear(to-br, brand.700, brand.900)"
      color="white"
      position="relative"
      overflow="hidden"
      borderRadius="2xl"
      boxShadow="xl"
      p={{ base: 6, md: 12 }}
    >
      {/* Decoration: a teal glow and a faint dot grid in the top corner. */}
      <Box position="absolute" top="-30%" right="-10%" w="60%" h="80%" bgGradient="radial(rgba(45, 212, 191, 0.28), transparent 65%)" aria-hidden />
      <Box
        position="absolute"
        inset={0}
        opacity={0.12}
        bgImage="radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)"
        bgSize="20px 20px"
        sx={{ maskImage: 'linear-gradient(to bottom right, black, transparent 55%)' }}
        aria-hidden
      />

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 8, md: 12 }} alignItems="center" position="relative">
        <VStack spacing={5} align={{ base: 'center', md: 'start' }} textAlign={{ base: 'center', md: 'left' }}>
          <Text fontSize="xs" fontWeight="bold" letterSpacing="widest" textTransform="uppercase" color="accent.300">
            Contact
          </Text>
          <Heading as="h2" id="contact-heading" size="xl" color="white" mt={-2}>
            Let's work together
          </Heading>
          <Text opacity={0.9} fontSize="lg" maxW="md">
            Have a project, role or idea in mind? Send me a message and I'll get back to you.
          </Text>

          <VStack spacing={3} align={{ base: 'center', md: 'start' }} w="full">
            {profile.email && <EmailRow email={profile.email} />}
            {profile.location && (
              <HStack spacing={2} opacity={0.85} fontSize="sm">
                <MapPinIcon />
                <Text>{profile.location}</Text>
              </HStack>
            )}
          </VStack>

          <SocialLinks profile={profile} compact inverted justify={{ base: 'center', md: 'start' }} />
        </VStack>
        <ContactForm />
      </SimpleGrid>
    </Box>
  );
}
