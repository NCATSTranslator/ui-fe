import styles from './UserSave.module.scss';
import { useState, useEffect } from 'react';
import Highlighter from 'react-highlight-words';
import ExternalLink from '../../Icons/Buttons/External Link.svg?react';
import Tooltip from '../Tooltip/Tooltip';
import ResultsItem from '../ResultsItem/ResultsItem';
import { emptyEditor } from '../../Utilities/userApi';
import { getResultsShareURLPath } from "../../Utilities/resultsInteractionFunctions";
import { getFormattedDate } from '../../Utilities/utilities';
import AnimateHeight from 'react-animate-height';
import ChevDown from "../../Icons/Directional/Chevron/Chevron Down.svg?react"

const UserSave = ({save, currentSearchString, zoomKeyDown, activateEvidence, activateNotes,
  handleBookmarkError, bookmarkAddedToast, bookmarkRemovedToast, setShareModalOpen, setShareResultID}) => {

  let key = save[0];
  let queryObject = save[1];
  let typeString = queryObject.query.type.label;
  let queryNodeString = queryObject.query.nodeLabel;
  let shareURL = getResultsShareURLPath(queryNodeString, queryObject.query.nodeId, '0', queryObject.query.type.id, key);
  let submittedDate = (queryObject?.query?.submitted_time) ? getFormattedDate(new Date(queryObject.query.submitted_time)) : '';
  const [isExpanded, setIsExpanded] = useState(true);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if(isExpanded === false)
      setHeight(0);
    else
      setHeight('auto');
  }, [isExpanded])

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  }
  return (
    <div key={key} className={styles.query}>
      <div className={styles.topBar}>
        <div className={styles.headingContainer}>
          <span onClick={handleToggle} target="_blank" rel="noreferrer">
            <h4 className={styles.heading}>{typeString}:
              <Highlighter
                highlightClassName="highlight"
                searchWords={[currentSearchString.current]}
                autoEscape={true}
                textToHighlight={queryNodeString}
              />
            </h4>
          </span>
          <p className={styles.date}>
            <Highlighter
              highlightClassName="highlight"
              searchWords={[currentSearchString.current]}
              autoEscape={true}
              textToHighlight={submittedDate.toString()}
            />
          </p>
        </div>
        {
          queryObject.saves && Array.from(queryObject.saves).length > 0 &&
          <p className={styles.numSaves}>{Array.from(queryObject.saves).length} saved item{(Array.from(queryObject.saves).length > 1) && "s"}</p>
        }
        <a
          href={shareURL}
          target="_blank"
          rel="noreferrer"
          className={styles.link}
          data-tooltip-id={`originalquery-${key}`}
          aria-describedby={`originalquery-${key}`}
          >
          <ExternalLink/>
          <Tooltip id={`originalquery-${key}`}>
            <span className={styles.tooltip}>Open this query in a new tab.</span>
          </Tooltip>
        </a>
        <button className={`${styles.accordionButton} accordionButton ${isExpanded ? 'open' : 'closed' }`} onClick={handleToggle}>
          <ChevDown/>
        </button>
      </div>
      <div className={styles.separator}></div>
      <AnimateHeight
        className={`${styles.resultsList}
          ${isExpanded ? styles.open : styles.closed }
        `}
        duration={500}
        height={height}
        >
        {queryObject.saves && Array.from(queryObject.saves).sort((a, b) => a.label.localeCompare(b.label)).map((save) => {
          let queryType = save.data.query.type;
          let queryItem = save.data.item;
          let arspk = save.data.query.pk;
          let queryNodeID = save.data.query.nodeId;
          let queryNodeLabel = save.data.query.nodeLabel;
          let queryNodeDescription = save.data.query.nodeDescription;
          queryItem.hasNotes = (save.notes.length === 0 || JSON.stringify(save.notes) === emptyEditor) ? false : true;
          return (
            <div key={save.id} className={styles.result}>
              <ResultsItem
                rawResults={null}
                key={queryItem.id}
                type={queryType}
                item={queryItem}
                activateEvidence={activateEvidence}
                activateNotes={activateNotes}
                activeEntityFilters={[currentSearchString.current]}
                zoomKeyDown={zoomKeyDown}
                currentQueryID={arspk}
                queryNodeID={queryNodeID}
                queryNodeLabel={queryNodeLabel}
                queryNodeDescription={queryNodeDescription}
                bookmarked={true}
                bookmarkID={save.id}
                hasNotes={queryItem.hasNotes}
                handleBookmarkError={handleBookmarkError}
                bookmarkAddedToast={bookmarkAddedToast}
                bookmarkRemovedToast={bookmarkRemovedToast}
                setShareModalOpen={setShareModalOpen}
                setShareResultID={setShareResultID}
                isInUserSave={true}
                resultsComplete={true}
              />
            </div>
          )
        })}
      </AnimateHeight>
    </div>
  )
}

export default UserSave;
