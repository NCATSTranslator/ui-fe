import { useId } from 'react';
import Highlighter from 'react-highlight-words';
import styles from './CanvasObjectList.module.scss';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
import type { CanvasSearchMatch } from '@/features/Canvas/utils/canvasFunctions';
import { formatCanvasSearchMatchTooltip } from '@/features/Canvas/utils/canvasFunctions';

interface ObjectListSearchNameProps {
  displayName: string;
  searchTerm?: string;
  externalSearchMatches?: CanvasSearchMatch[];
}

const ObjectListSearchName = ({
  displayName,
  searchTerm,
  externalSearchMatches = [],
}: ObjectListSearchNameProps) => {
  const matchTooltipId = useId();
  const hasExternalSearchMatches = externalSearchMatches.length > 0;

  if (!searchTerm) return displayName;

  return (
    <>
      <Highlighter
        highlightClassName="highlight"
        searchWords={[searchTerm]}
        autoEscape={true}
        textToHighlight={displayName}
      />
      {hasExternalSearchMatches && (
        <>
          <Tooltip id={matchTooltipId} place="top">
            <span>{formatCanvasSearchMatchTooltip(externalSearchMatches)}</span>
          </Tooltip>
          <span
            data-tooltip-id={matchTooltipId}
            className={joinClasses(styles.nameMatch, styles.nameMatchIndicator)}
          >
            <Highlighter
              highlightClassName="highlight"
              searchWords={['*']}
              autoEscape={true}
              textToHighlight=" *"
            />
          </span>
        </>
      )}
    </>
  );
};

export default ObjectListSearchName;
