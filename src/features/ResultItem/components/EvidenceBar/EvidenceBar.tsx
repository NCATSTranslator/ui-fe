import { CSSProperties, FC, useMemo, useState } from 'react';
import styles from './EvidenceBar.module.scss';
import { EvidenceCountsContainer } from '@/features/Evidence/types/evidence';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import { EvidenceTypeKey } from '@/features/Evidence/utils/evidenceLabels';
import { getEvidenceBarScale, getEvidenceSegments } from '@/features/Evidence/utils/evidenceSegments';
import { EVIDENCE_TYPE_ICONS } from '@/features/Evidence/utils/evidenceIcons';

interface EvidenceBarProps {
  evidenceCounts: EvidenceCountsContainer | null;
  // Largest total evidence count of any result in the query; the bar's length is relative to it
  maxEvidenceTotal: number;
}

/**
 * A result's evidence as a total followed by a bar split into one pill per evidence type. Each
 * pill's width reflects its share of the result's evidence, and the whole bar's length reflects
 * the result's evidence relative to the other results in the query. Hovering or focusing a pill
 * shows its count and type below the bar without affecting layout.
 */
const EvidenceBar: FC<EvidenceBarProps> = ({ evidenceCounts, maxEvidenceTotal }) => {
  const [hoveredKey, setHoveredKey] = useState<EvidenceTypeKey | null>(null);
  const segments = useMemo(() => getEvidenceSegments(evidenceCounts), [evidenceCounts]);
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);
  const hovered = segments.find((segment) => segment.key === hoveredKey);
  const HoveredIcon = hovered ? EVIDENCE_TYPE_ICONS[hovered.key] : undefined;
  const trackStyle = {
    '--bar-scale': getEvidenceBarScale(total, maxEvidenceTotal),
    '--segment-count': segments.length,
  } as CSSProperties;

  return (
    <div className={styles.evidenceBar}>
      <span className={styles.total}>
        {total.toLocaleString()}
        <span className={styles.visuallyHidden}> total evidence</span>
      </span>
      {segments.length > 0 && (
        <div className={styles.barArea}>
          <div className={styles.track} style={trackStyle} onMouseLeave={() => setHoveredKey(null)}>
            {segments.map((segment) => (
              <span
                key={segment.key}
                role="img"
                tabIndex={0}
                aria-label={segment.label}
                className={joinClasses(styles.segment, styles[segment.key], segment.key === hoveredKey && styles.hovered)}
                // eslint-disable-next-line no-restricted-syntax -- pill width is proportional to its runtime count
                style={{ flexGrow: segment.count }}
                onMouseEnter={() => setHoveredKey(segment.key)}
                onFocus={() => setHoveredKey(segment.key)}
                onBlur={() => setHoveredKey(null)}
              />
            ))}
          </div>
          {hovered && (
            <span className={styles.label} aria-hidden="true">
              {HoveredIcon && <HoveredIcon className={styles.labelIcon} />}
              {hovered.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default EvidenceBar;
