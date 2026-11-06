import type { ReactElement } from 'react';
import { Button, Wrap, WrapItem } from '@chakra-ui/react';
import type { Profile } from '../../api/profile';
import { formatUrl } from '../../api/projectstate';
import { GitHubIcon, GlobeIcon, LinkedInIcon, MailIcon } from './icons';

interface Props {
  profile: Profile;
  size?: 'sm' | 'md';
  /** Use on dark/colored backgrounds. */
  inverted?: boolean;
}

/** Renders only the contact links the profile actually has. */
export function SocialLinks({ profile, size = 'sm', inverted = false }: Props) {
  const links = [
    profile.email && { label: 'Email', href: `mailto:${profile.email}`, icon: <MailIcon />, primary: true },
    profile.githubUrl && { label: 'GitHub', href: formatUrl(profile.githubUrl), icon: <GitHubIcon /> },
    profile.linkedinUrl && { label: 'LinkedIn', href: formatUrl(profile.linkedinUrl), icon: <LinkedInIcon /> },
    profile.websiteUrl && { label: 'Website', href: formatUrl(profile.websiteUrl), icon: <GlobeIcon /> },
  ].filter(Boolean) as { label: string; href: string; icon: ReactElement; primary?: boolean }[];

  if (links.length === 0) return null;

  return (
    <Wrap spacing={2} justify="center">
      {links.map((l) => (
        <WrapItem key={l.label}>
          <Button
            as="a"
            href={l.href}
            target={l.href.startsWith('mailto:') ? undefined : '_blank'}
            rel="noopener noreferrer"
            size={size}
            leftIcon={l.icon}
            {...(inverted
              ? l.primary
                ? { bg: 'white', color: 'brand.700', _hover: { bg: 'brand.50' } }
                : { variant: 'outline', color: 'white', borderColor: 'whiteAlpha.700', _hover: { bg: 'whiteAlpha.200' } }
              : l.primary
                ? { colorScheme: 'brand' }
                : { variant: 'outline', bg: 'bg.surface' })}
          >
            {l.label}
          </Button>
        </WrapItem>
      ))}
    </Wrap>
  );
}
