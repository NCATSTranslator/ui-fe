import { useEffect, useState } from 'react';
import { deleteUserSave, getAllUserSaves, getSaves } from '../../Utilities/userApi';
import { findStringMatch, handleResultsError, handleEvidenceModalClose,
  handleResultsRefresh, handleClearAllFilters, getResultsShareURLPath } from "../../Utilities/resultsInteractionFunctions";
import styles from './UserSaves.module.scss';
import ResultsItem from '../ResultsItem/ResultsItem';
import EvidenceModal from '../Modals/EvidenceModal';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import {ReactComponent as ExternalLink} from '../../Icons/external-link.svg';
import { getFormattedDate } from '../../Utilities/utilities';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BookmarkAddedMarkup, BookmarkRemovedMarkup } from '../BookmarkToasts/BookmarkToasts';

const UserSaves = () => {

  const [userSaves, setUserSaves] = useState(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [currentEvidence, setCurrentEvidence] = useState([]);
  const [selectedItem, setSelectedItem] = useState({});
  const [selectedEdges, setSelectedEdges] = useState([]);
  const [isAllEvidence, setIsAllEvidence] = useState(true);
  const [zoomKeyDown, setZoomKeyDown] = useState(false);

  const bookmarkAddedToast = () => toast.success(<BookmarkAddedMarkup/>);
  const bookmarkRemovedToast = () => toast.success(<BookmarkRemovedMarkup/>);

  const queryClient = new QueryClient();

  const activateEvidence = (evidence, item, edgeGroup, isAll) => {
    setIsAllEvidence(isAll);
    setSelectedItem(item);
    setSelectedEdges(edgeGroup);
    setCurrentEvidence(evidence);
    setEvidenceOpen(true);
  }

  useEffect(() => {
    getSaves(setUserSaves);
  },[]);

  const resetUserSaves = () => {
    for(const query of Object.values(userSaves)) {
      console.log(query);
      for(const save of Array.from(query.saves)) {
        deleteUserSave(save.id);
        setUserSaves(null);
      }
    }
  }


  useEffect(() => {
    const handleKeyDown = (ev) => {
      if (ev.keyCode === 90) {
        setZoomKeyDown(true);
      }
    };
  
    const handleKeyUp = (ev) => {
      if (ev.keyCode === 90) {
        setZoomKeyDown(false);
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return(
    <QueryClientProvider client={queryClient}>
      <div>
        <button onClick={resetUserSaves}>Reset</button>
        <ToastContainer
          position="top-center"
          autoClose={3000}
          theme="light"
          transition={Slide}
          pauseOnFocusLoss={false}
          hideProgressBar
          className="toastContainer"
          closeOnClick={false}
          closeButton={false}
        />
        <EvidenceModal
          isOpen={evidenceOpen}
          onClose={()=>handleEvidenceModalClose(setEvidenceOpen)}
          className="evidence-modal"
          currentEvidence={currentEvidence}
          item={selectedItem}
          isAll={isAllEvidence}
          edgeGroup={selectedEdges}
        />
        <h4>Workspace</h4>
        {
          (userSaves == null || Object.entries(userSaves).length <= 0)
          ? 
          <p>No bookmarks to show</p>
          :
          Object.entries(userSaves).map((item) => {
            let key = item[0];
            let queryObject = item[1];
            let typeString = queryObject.query.type.label;
            let queryNodeString = queryObject.query.nodeLabel;
            let shareURL = getResultsShareURLPath(queryNodeString, queryObject.query.nodeId, queryObject.query.type.id, key);
            // console.log(queryObject.saves.values().next());
            let submittedDate = (queryObject?.query?.submitted_time) ? getFormattedDate(new Date(queryObject.query.submitted_time)) : '';
            // let submittedDate = new Date();
            return(
              <div key={key}>
                <div className={styles.topBar}>
                  <h4>{typeString} <span>{queryNodeString}</span></h4>
                  <p>{submittedDate.toString()}</p>
                  <a href={shareURL} target="_blank" rel="noreferrer"><ExternalLink/></a>
                </div>
                <div className={styles.resultsList}>
                  {queryObject.saves && Array.from(queryObject.saves).map((save) => {
                    let queryType = save.data.query.type;
                    let queryItem = save.data.item;
                    let arspk = save.data.query.pk;
                    let queryNodeID = save.data.query.nodeId;
                    let queryNodeLabel = save.data.query.nodeLabel;
                    let queryNodeDescription = save.data.query.nodeDescription;
                    return (
                      <div key={save.id}>
                        <ResultsItem
                          rawResults={null}
                          type={queryType}
                          item={queryItem}
                          activateEvidence={(evidence, item, edgeGroup, isAll)=>activateEvidence(evidence, item, edgeGroup, isAll)}
                          activeStringFilters={[]}
                          zoomKeyDown={zoomKeyDown}
                          currentQueryID={arspk}
                          queryNodeID={queryNodeID}
                          queryNodeLabel={queryNodeLabel}
                          queryNodeDescription={queryNodeDescription}
                          bookmarked
                          bookmarkID={save.id}
                          bookmarkAddedToast={bookmarkAddedToast}
                          bookmarkRemovedToast={bookmarkRemovedToast}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            );
          })
        }
      </div>
    </QueryClientProvider>
  )
}

export default UserSaves;