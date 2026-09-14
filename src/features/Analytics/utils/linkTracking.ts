import type { MouseEvent } from 'react';
import type { LinkType } from '@/features/Analytics/types/analytics';
import { trackEvidenceLink } from '@/features/Analytics/utils/dataLayer';

/** MouseEvent.button value for the middle button. */
const MIDDLE_BUTTON = 1;

/**
 * Tracking handlers to spread onto an outbound evidence link.
 *
 * onClick alone misses middle-click, which opens the link in a new tab but
 * fires auxclick instead of click. Right-click fires auxclick too, but opens a
 * menu rather than the link, so only the middle button counts there.
 */
export const getEvidenceLinkTrackingProps = (linkType: LinkType, url: string | undefined) => ({
  onClick: () => trackEvidenceLink(linkType, url),
  onAuxClick: (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button === MIDDLE_BUTTON) trackEvidenceLink(linkType, url);
  },
});
