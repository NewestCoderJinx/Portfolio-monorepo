import { useEffect, useState } from 'react';
import { IconButton, ScaleFade } from '@chakra-ui/react';
import { ArrowUpIcon } from './icons';

const SHOW_AFTER_PX = 600;

/** Floating button that appears once the visitor has scrolled well down the page. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <ScaleFade in={visible} unmountOnExit initialScale={0.8}>
      <IconButton
        aria-label="Back to top"
        title="Back to top"
        icon={<ArrowUpIcon width={18} height={18} />}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        position="fixed"
        bottom={{ base: 5, md: 8 }}
        right={{ base: 5, md: 8 }}
        zIndex={90}
        colorScheme="brand"
        borderRadius="full"
        size="lg"
        boxShadow="lg"
      />
    </ScaleFade>
  );
}
