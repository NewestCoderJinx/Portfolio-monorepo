import { useState } from 'react';
import { useToast } from '@chakra-ui/react';
import type { Project } from '../api/projectstate';

const PROJECT_HASH = /^#project-(.+)$/;

const projectUrl = (p: Project) => `${window.location.origin}${window.location.pathname}#project-${p.id}`;

/**
 * Tracks the open case study and mirrors it in the URL hash, so /#project-<id> deep links
 * open that project once the list has loaded.
 */
export function useCaseStudyLink(projects: Project[]) {
  // Seeded from the URL so a deep link resolves as soon as the projects arrive.
  const [selectedId, setSelectedId] = useState(() => window.location.hash.match(PROJECT_HASH)?.[1] ?? null);
  const selectedProject = projects.find((p) => p.id === selectedId) ?? null;
  const toast = useToast();

  const openProject = (p: Project) => {
    setSelectedId(p.id);
    window.history.replaceState(null, '', `#project-${p.id}`);
  };

  const closeProject = () => {
    setSelectedId(null);
    window.history.replaceState(null, '', window.location.pathname);
  };

  const shareProject = async (p: Project) => {
    const url = projectUrl(p);
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied', description: `Share link for "${p.title}" copied.`, status: 'success', duration: 3000, position: 'bottom-right' });
    } catch {
      toast({ title: 'Copy this link', description: url, status: 'info', duration: 8000, isClosable: true, position: 'bottom-right' });
    }
  };

  return { selectedProject, openProject, closeProject, shareProject };
}
