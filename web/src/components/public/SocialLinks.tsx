import type { MouseEvent, ReactElement } from 'react';
import { Button, Wrap, WrapItem } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import type { Profile } from '../../api/profile';
import { formatUrl } from '../../api/projectstate';
import { FileIcon, GitHubIcon, GlobeIcon, LinkedInIcon, MailIcon } from './icons';

interface Props {
  profile: Profile;
  size?: 'sm' | 'md';
  /** Use on dark/colored backgrounds. */
  inverted?: boolean;
}

/** Renders only the contact links the profile actually has. */
export function SocialLinks({ profile, size = 'sm', inverted = false }: Props) {
  const navigate = useNavigate();
  const links = [
    profile.email && { label: 'Email', href: `mailto:${profile.email}`, icon: <MailIcon />, primary: true },
    profile.githubUrl && { label: 'GitHub', href: formatUrl(profile.githubUrl), icon: <GitHubIcon /> },
    profile.linkedinUrl && { label: 'LinkedIn', href: formatUrl(profile.linkedinUrl), icon: <LinkedInIcon /> },
    profile.websiteUrl && { label: 'Website', href: formatUrl(profile.websiteUrl), icon: <GlobeIcon /> },
    // An uploaded PDF wins; otherwise the résumé page generated from this portfolio.
    profile.resumeUrl
      ? { label: 'Résumé', href: formatUrl(profile.resumeUrl), icon: <FileIcon /> }
      : { label: 'Résumé', to: '/resume', icon: <FileIcon /> },
  ].filter(Boolean) as { label: string; href?: string; to?: string; icon: ReactElement; primary?: boolean }[];

  if (links.length === 0) return null;

  // Plain clicks use the router; modified clicks (new tab, etc.) keep normal link behaviour.
  const openInApp = (e: MouseEvent, to: string) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  };

  return (
    <Wrap spacing={2} justify="center">
      {links.map((l) => (
        <WrapItem key={l.label}>
          <Button
            as="a"
            href={l.to ?? l.href}
            // In-app pages open in place; external links get a new tab.
            target={l.to || l.href?.startsWith('mailto:') ? undefined : '_blank'}
            rel={l.to ? undefined : 'noopener noreferrer'}
            onClick={l.to ? (e: MouseEvent) => openInApp(e, l.to as string) : undefined}
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
