import { useRef, useEffect } from 'react';
import { MAIN_SCROLL_ELEMENT_ID } from '@/features/Navigation/utils/navigationUtils';

/**
 * Preserves and restores scroll position of the main content area
 * across route transitions within a layout.
 *
 * Continuously tracks scroll position via a passive listener while
 * `isBaseView` is true. When the user navigates away (`isBaseView`
 * becomes false), the last tracked position is retained and the view
 * scrolls to top. When the user returns, the saved position is restored.
 * @param isBaseView - Whether the current view is the base view (e.g. /results)
 * @returns A function that navigates to a results page with the current search params.
 */
const useScrollPreservation = (isBaseView: boolean) => {
  const scrollRef = useRef(0);

  useEffect(() => {
    const scrollEl = document.getElementById(MAIN_SCROLL_ELEMENT_ID);
    if (!scrollEl) return;

    if (isBaseView) {
      requestAnimationFrame(() => scrollEl.scrollTo({ top: scrollRef.current }));
      const onScroll = () => { scrollRef.current = scrollEl.scrollTop; };
      scrollEl.addEventListener('scroll', onScroll, { passive: true });
      return () => scrollEl.removeEventListener('scroll', onScroll);
    } else {
      scrollEl.scrollTo({ top: 0 });
    }
  }, [isBaseView]);
};

export default useScrollPreservation;
