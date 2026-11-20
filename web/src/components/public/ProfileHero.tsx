import type { MouseEvent } from 'react';
import { Avatar, Box, Button, Flex, Heading, HStack, Skeleton, SkeletonCircle, Stack, Text, VStack } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import type { Profile } from '../../api/profile';
import { scrollBehavior } from '../../motion';
import { ArrowRightIcon, MapPinIcon, MailIcon } from './icons';
import { SocialLinks } from './SocialLinks';

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.55); }
  70% { box-shadow: 0 0 0 8px rgba(20, 184, 166, 0); }
  100% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0); }
`;

function AvailabilityBadge({ text }: { text: string }) {
  return (
    <HStack
      spacing={2}
      px={3}
      py={1}
      borderRadius="full"
      bg="accent.50"
      color="accent.800"
      borderWidth="1px"
      borderColor="accent.200"
      _dark={{ bg: 'rgba(20, 184, 166, 0.12)', color: 'accent.200', borderColor: 'accent.800' }}
      fontSize="sm"
      fontWeight="medium"
    >
      <Box
        boxSize="8px"
        borderRadius="full"
        bg="accent.500"
        animation={`${pulse} 2s infinite`}
        sx={{ '@media (prefers-reduced-motion: reduce)': { animation: 'none' } }}
        aria-hidden
      />
      <Text>{text}</Text>
    </HStack>
  );
}

/** In-page jump that still works as a normal link (new tab, no JavaScript). */
function jumpTo(e: MouseEvent, id: string) {
  const target = document.getElementById(id);
  if (!target || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  history.replaceState(null, '', `#${id}`);
}

interface Props {
  profile: Profile | null;
  loading: boolean;
}

export function ProfileHero({ profile, loading }: Props) {
  if (loading) {
    return (
      <Flex direction={{ base: 'column-reverse', md: 'row' }} align="center" gap={8} py={{ base: 4, md: 10 }}>
        <VStack spacing={4} align={{ base: 'center', md: 'start' }} flex={1} w="full">
          <Skeleton h="24px" w="160px" borderRadius="full" />
          <Skeleton h="48px" w="320px" maxW="full" />
          <Skeleton h="20px" w="420px" maxW="full" />
          <Skeleton h="20px" w="380px" maxW="full" />
        </VStack>
        <SkeletonCircle boxSize={{ base: '128px', md: '192px', lg: '220px' }} />
      </Flex>
    );
  }

  // No profile yet: keep the page presentable instead of showing placeholder personal details.
  if (!profile) {
    return (
      <VStack spacing={3} textAlign="center" py={10}>
        <Heading as="h1" size="2xl" letterSpacing="tight">
          Engineering Portfolio
        </Heading>
        <Text color="fg.secondary" maxW="2xl">
          Selected projects with the problems, decisions and lessons behind them.
        </Text>
      </VStack>
    );
  }

  const align = { base: 'center', md: 'start' } as const;

  return (
    <Flex
      as="section"
      aria-label="Introduction"
      direction={{ base: 'column-reverse', md: 'row' }}
      align="center"
      justify="space-between"
      gap={{ base: 8, md: 12 }}
      py={{ base: 4, md: 10 }}
    >
      <VStack spacing={5} align={align} textAlign={{ base: 'center', md: 'left' }} flex={1} minW={0}>
        {profile.availability && <AvailabilityBadge text={profile.availability} />}

        <VStack spacing={2} align={align}>
          <Heading as="h1" fontSize={{ base: '4xl', md: '5xl', lg: '6xl' }} lineHeight="1.05" letterSpacing="tighter">
            {profile.name}
          </Heading>
          {profile.headline && (
            <Text
              fontSize={{ base: 'lg', md: 'xl' }}
              fontWeight="semibold"
              bgGradient="linear(to-r, brand.600, accent.600)"
              _dark={{ bgGradient: 'linear(to-r, brand.200, accent.300)' }}
              bgClip="text"
            >
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
          <Text color="fg.secondary" fontSize={{ base: 'md', md: 'lg' }} lineHeight="tall" whiteSpace="pre-line" maxW="xl">
            {profile.bio}
          </Text>
        )}

        <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} w={{ base: 'full', sm: 'auto' }} pt={1}>
          <Button
            as="a"
            href="#projects"
            onClick={(e: MouseEvent) => jumpTo(e, 'projects')}
            colorScheme="brand"
            size="lg"
            rightIcon={<ArrowRightIcon />}
          >
            View my work
          </Button>
          <Button
            as="a"
            href="#contact"
            onClick={(e: MouseEvent) => jumpTo(e, 'contact')}
            variant="outline"
            bg="bg.surface"
            size="lg"
            leftIcon={<MailIcon />}
          >
            Get in touch
          </Button>
        </Stack>

        <SocialLinks profile={profile} compact justify={align} />
      </VStack>

      <Box position="relative" flexShrink={0}>
        {/* Soft glow behind the photo; decoration only. */}
        <Box
          position="absolute"
          inset="-14%"
          borderRadius="full"
          bgGradient="radial(accent.200, transparent 70%)"
          _dark={{ bgGradient: 'radial(rgba(20, 184, 166, 0.25), transparent 70%)' }}
          aria-hidden
        />
        <Box p="5px" borderRadius="full" bgGradient="linear(to-br, brand.500, accent.400)" position="relative" boxShadow="xl">
          <Avatar
            boxSize={{ base: '128px', md: '192px', lg: '220px' }}
            // Chakra sizes the initials from its own size scale, which a custom boxSize skips.
            sx={{ '.chakra-avatar__initials': { fontSize: { base: '5xl', md: '7xl' }, fontWeight: 'bold' } }}
            name={profile.name}
            src={profile.avatarUrl || undefined}
            bg="brand.600"
            color="white"
            borderWidth="4px"
            borderColor="bg.canvas"
          />
        </Box>
      </Box>
    </Flex>
  );
}
