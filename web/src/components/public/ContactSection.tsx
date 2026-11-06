import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import type { Profile } from '../../api/profile';
import { SocialLinks } from './SocialLinks';

export function ContactSection({ profile }: { profile: Profile | null }) {
  if (!profile || !(profile.email || profile.githubUrl || profile.linkedinUrl || profile.websiteUrl)) return null;

  return (
    <Box id="contact" scrollMarginTop="90px" bgGradient="linear(to-br, brand.700, brand.900)" color="white" position="relative" overflow="hidden" borderTopWidth="4px" borderTopColor="accent.400" borderRadius="2xl" p={{ base: 8, md: 12 }} textAlign="center">
      <VStack spacing={4}>
        <Heading as="h2" size="lg" color="white">
          Let's work together
        </Heading>
        <Text maxW="xl" opacity={0.9}>
          Have a project, role or idea in mind? I'd be glad to hear from you.
        </Text>
        <SocialLinks profile={profile} size="md" inverted />
      </VStack>
    </Box>
  );
}
