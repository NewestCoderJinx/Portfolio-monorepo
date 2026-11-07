import { Box, Heading, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import type { Profile } from '../../api/profile';
import { ContactForm } from './ContactForm';
import { SocialLinks } from './SocialLinks';

export function ContactSection({ profile }: { profile: Profile | null }) {
  // The form needs somewhere to send messages, which exists once the owner has set up a profile.
  if (!profile) return null;

  return (
    <Box
      id="contact"
      scrollMarginTop="90px"
      bgGradient="linear(to-br, brand.700, brand.900)"
      color="white"
      position="relative"
      borderTopWidth="4px"
      borderTopColor="accent.400"
      borderRadius="2xl"
      p={{ base: 6, md: 12 }}
    >
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 8, md: 12 }} alignItems="center">
        <VStack spacing={4} align={{ base: 'center', md: 'start' }} textAlign={{ base: 'center', md: 'left' }}>
          <Heading as="h2" size="lg" color="white">
            Let's work together
          </Heading>
          <Text opacity={0.9}>
            Have a project, role or idea in mind? Send me a message and I'll get back to you.
          </Text>
          <Box alignSelf={{ base: 'center', md: 'start' }} sx={{ '& .chakra-wrap__list': { justifyContent: { md: 'flex-start' } } }}>
            <SocialLinks profile={profile} size="md" inverted />
          </Box>
        </VStack>
        <ContactForm />
      </SimpleGrid>
    </Box>
  );
}
