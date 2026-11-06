import { Avatar, Box, Heading, HStack, Skeleton, SkeletonCircle, Text, VStack } from '@chakra-ui/react';
import type { Profile } from '../../api/profile';
import { MapPinIcon } from './icons';
import { SocialLinks } from './SocialLinks';

interface Props {
  profile: Profile | null;
  loading: boolean;
}

export function ProfileHero({ profile, loading }: Props) {
  if (loading) {
    return (
      <VStack spacing={4} py={6}>
        <SkeletonCircle size="24" />
        <Skeleton h="36px" w="260px" />
        <Skeleton h="20px" w="360px" maxW="full" />
      </VStack>
    );
  }

  // No profile yet: keep the page presentable instead of showing placeholder personal details.
  if (!profile) {
    return (
      <VStack spacing={3} textAlign="center" py={6}>
        <Heading as="h1" size="2xl" letterSpacing="tight">
          Engineering Portfolio
        </Heading>
        <Text color="fg.secondary" maxW="2xl">
          Selected projects with the problems, decisions and lessons behind them.
        </Text>
      </VStack>
    );
  }

  return (
    <VStack spacing={5} textAlign="center" py={6}>
      <Avatar
        size="2xl"
        name={profile.name}
        src={profile.avatarUrl || undefined}
        bg="brand.600"
        color="white"
        boxShadow="md"
        borderWidth="4px"
        borderColor="bg.surface"
      />

      <VStack spacing={2}>
        <Heading as="h1" size="2xl" letterSpacing="tight">
          {profile.name}
        </Heading>
        {profile.headline && (
          <Text fontSize="lg" fontWeight="medium" color="fg.brand">
            {profile.headline}
          </Text>
        )}
        {profile.location && (
          <HStack spacing={1} color="fg.muted" fontSize="sm">
            <MapPinIcon width={14} height={14} />
            <Text>{profile.location}</Text>
          </HStack>
        )}
      </VStack>

      {profile.bio && (
        <Box maxW="2xl">
          <Text color="fg.secondary" fontSize="md" lineHeight="tall" whiteSpace="pre-line">
            {profile.bio}
          </Text>
        </Box>
      )}

      <SocialLinks profile={profile} />
    </VStack>
  );
}
