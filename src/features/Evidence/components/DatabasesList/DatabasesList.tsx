import { FC } from 'react';
import InfoTooltip from '@/features/Core/components/Tooltip/InfoTooltip';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import { GroupedSource } from '@/features/Evidence/utils/utilities';
import EvidenceLink from '@/features/Evidence/components/EvidenceLink/EvidenceLink';
import cardStyles from '@/features/Evidence/components/EvidenceSection/evidenceCards.module.scss';
import styles from './DatabasesList.module.scss';

interface DatabasesListProps {
  /** Already grouped by name (see groupSourcesByName). */
  sources: GroupedSource[];
}

const DatabaseCard: FC<{ source: GroupedSource }> = ({ source }) => {
  // A database with one link is linked from its name; several links are listed beneath it
  const [firstUrl, ...otherUrls] = source.urls;
  const nameUrl = otherUrls.length === 0 ? firstUrl : undefined;

  return (
    <li className={cardStyles.card}>
      <div className={styles.name}>
        {nameUrl ? (
          <EvidenceLink linkType="source" url={nameUrl} className={cardStyles.title}>
            {source.name}
          </EvidenceLink>
        ) : (
          <span className={joinClasses(cardStyles.title, source.urls.length === 0 && cardStyles.plainTitle)}>
            {source.name}
          </span>
        )}
        {source.wiki && (
          <InfoTooltip iconClassName={styles.infoIcon}>
            <EvidenceLink linkType="source" url={source.wiki} className={styles.wikiLink}>
              Why do we use this source?
            </EvidenceLink>
          </InfoTooltip>
        )}
      </div>
      {otherUrls.length > 0 && (
        <ul className={styles.urls}>
          {source.urls.map((url) => (
            <li key={url}>
              <EvidenceLink linkType="source" url={url} className={cardStyles.metaLink}>
                {url}
              </EvidenceLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

/**
 * The databases (knowledge sources) that provided the selected relationship.
 */
const DatabasesList: FC<DatabasesListProps> = ({ sources }) => (
  <ul className={cardStyles.list}>
    {sources.map((source) => <DatabaseCard key={source.name} source={source} />)}
  </ul>
);

export default DatabasesList;
