import { useEffect, useState, useRef } from 'react';
import { getSaves, emptyEditor } from '../../Utilities/userApi';
import { handleEvidenceModalClose, getResultsShareURLPath } from "../../Utilities/resultsInteractionFunctions";
import styles from './UserSaves.module.scss';
import ResultsItem from '../ResultsItem/ResultsItem';
import EvidenceModal from '../Modals/EvidenceModal';
import { QueryClient, QueryClientProvider } from 'react-query';
import {ReactComponent as ExternalLink} from '../../Icons/external-link.svg';
import { getFormattedDate } from '../../Utilities/utilities';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BookmarkAddedMarkup, BookmarkRemovedMarkup, BookmarkErrorMarkup } from '../BookmarkToasts/BookmarkToasts';
import NotesModal from '../Modals/NotesModal';
import TextInput from "../FormFields/TextInput";
import {ReactComponent as SearchIcon} from '../../Icons/Buttons/Search.svg';
import { cloneDeep } from 'lodash';
import Highlighter from 'react-highlight-words';

const UserSaves = () => {

  const [userSaves, setUserSaves] = useState(null);
  const [filteredUserSaves, setFilteredUserSaves] = useState(null)
  const currentSearchString = useRef("");
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [currentEvidence, setCurrentEvidence] = useState([]);
  const [selectedItem, setSelectedItem] = useState({});
  const [selectedEdges, setSelectedEdges] = useState([]);
  const [isAllEvidence, setIsAllEvidence] = useState(true);
  const [zoomKeyDown, setZoomKeyDown] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const noteLabel = useRef("");
  const currentBookmarkID = useRef(null);
  const formRef = useRef(null);

  const bookmarkAddedToast = () => toast.success(<BookmarkAddedMarkup/>);
  const bookmarkRemovedToast = () => toast.success(<BookmarkRemovedMarkup/>);
  const handleBookmarkError = () => toast.error(<BookmarkErrorMarkup/>);

  const queryClient = new QueryClient();

  const activateEvidence = (evidence, item, edgeGroup, isAll) => {
    setIsAllEvidence(isAll);
    setSelectedItem(item);
    setSelectedEdges(edgeGroup);
    setCurrentEvidence(evidence);
    setEvidenceOpen(true);
  }

  const activateNotes = (label, bookmarkID) => {
    noteLabel.current = label;
    currentBookmarkID.current = bookmarkID;
    setNotesOpen(true);
  }

  const initSaves = async () => {
    let newSaves = await getSaves(setUserSaves);
    setFilteredUserSaves(cloneDeep(newSaves));
  }
  useEffect(() => {
    initSaves();
  },[]);

  // const resetUserSaves = () => {
  //   for(const query of Object.values(userSaves)) {
  //     console.log(query);
  //     for(const save of Array.from(query.saves)) {
  //       deleteUserSave(save.id);
  //       setUserSaves(null);
  //     }
  //   }
  // }

  const handleSearch = (value = false) => {
    if(!value) {
      setFilteredUserSaves(cloneDeep(userSaves));
      return;
    }

    setFilteredUserSaves(Object.values(userSaves).filter((item) => {
      let include = false;
      let tempValue = value.toLowerCase();
      currentSearchString.current = value;
      let submittedDate = (item?.query?.submitted_time) ? getFormattedDate(new Date(item.query.submitted_time)) : '';

      // check for match in query info
      if(
        item.query.nodeLabel.toLowerCase().includes(tempValue) ||
        item.query.nodeId.toLowerCase().includes(tempValue) || 
        submittedDate.toLowerCase().includes(tempValue) || 
        item.query.nodeDescription.toLowerCase().includes(tempValue) || 
        item.query.type.label.toLowerCase().includes(tempValue) || 
        item.query.type.filterType.toLowerCase().includes(tempValue) 
      )
        include = true;
      
        // check saves for match
      for(const save of Array.from(item.saves)) {
        if(
          save.label.toLowerCase().includes(tempValue) ||
          save.notes.toLowerCase().includes(tempValue) ||
          save.object_ref.toLowerCase().includes(tempValue) ||
          save.data.item.id.toLowerCase().includes(tempValue) ||
          save.data.item.name.toLowerCase().includes(tempValue) ||
          save.data.item.type.toLowerCase().includes(tempValue) ||
          save.data.item.object.toLowerCase().includes(tempValue) 
        )
          include = true;
      }

      return include;
    }))
  }

  const clearSearchBar = () => {
    formRef.current.reset();
    handleSearch();
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    formRef.current.reset();
    clearSearchBar();
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

  const handleClearNotesEditor = () => {
    initSaves();
  }

  return(
    <QueryClientProvider client={queryClient}>
      <div>
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
        <NotesModal
          isOpen={notesOpen}
          onClose={()=>(setNotesOpen(false))}
          handleClearNotesEditor={handleClearNotesEditor}
          className="notes-modal"
          noteLabel={noteLabel.current}
          bookmarkID={currentBookmarkID.current}
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
        <h1 className={`h4 ${styles.pageHeading}`}>Saved Results</h1>
        {
          (userSaves == null || Object.entries(userSaves).length <= 0)
          ? 
            <div className={styles.none}>
              <p>You haven't saved any results yet!</p>
              <p>Submit a query, then click the bookmark icon on a result to save it for later. You can then view that result here.</p>
            </div>
          : <>
              <div className={styles.searchBarContainer}>
                <form onSubmit={(e)=>{handleSubmit(e)}} className={styles.form} ref={formRef}>
                  <TextInput 
                    placeholder="Search Saved Results" 
                    handleChange={(e)=>handleSearch(e)} 
                    className={styles.input}
                    size=""
                    icon={<SearchIcon/>}
                  />
                  <button type="submit" size="" >
                    <span>Clear</span>
                  </button>
                </form>
              </div>
              {
                Object.entries(filteredUserSaves).length < Object.entries(userSaves).length &&
                <div className={styles.showingContainer}>
                  <p className={styles.showing}>Showing {Object.entries(filteredUserSaves).length} of {Object.entries(userSaves).length} total saved results.</p>
                  <button onClick={clearSearchBar} className={styles.showingButton}>(Clear Search Bar)</button>
                </div>
              }
              <div className={styles.saves}>
                {
                  Object.entries(filteredUserSaves).reverse().map((item) => {
                    let key = item[0];
                    let queryObject = item[1];
                    let typeString = queryObject.query.type.label;
                    let queryNodeString = queryObject.query.nodeLabel;
                    let shareURL = getResultsShareURLPath(queryNodeString, queryObject.query.nodeId, queryObject.query.type.id, key);
                    // console.log(queryObject.saves.values().next());
                    let submittedDate = (queryObject?.query?.submitted_time) ? getFormattedDate(new Date(queryObject.query.submitted_time)) : '';
                    // let submittedDate = new Date();
                    return(
                      <div key={key} className={styles.query}>
                        <div className={styles.topBar}>
                          <div className={styles.headingContainer}>
                            <a href={shareURL} target="_blank" rel="noreferrer">
                              <h4 className={styles.heading}>{typeString}: 
                                <Highlighter
                                  highlightClassName="highlight"
                                  searchWords={[currentSearchString.current]}
                                  autoEscape={true}
                                  textToHighlight={queryNodeString}
                                />
                              </h4>
                            </a>
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
                            <p className={styles.numSaves}>{Array.from(queryObject.saves).length} saved items</p>
                          }
                          <a href={shareURL} target="_blank" rel="noreferrer" className={styles.link}><ExternalLink/></a>
                        </div>
                        <div className={styles.separator}></div>
                        <div className={styles.resultsList}>
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
                                  type={queryType}
                                  item={queryItem}
                                  activateEvidence={(evidence, item, edgeGroup, isAll)=>activateEvidence(evidence, item, edgeGroup, isAll)}
                                  activateNotes={activateNotes}
                                  activeStringFilters={[currentSearchString.current]}
                                  zoomKeyDown={zoomKeyDown}
                                  currentQueryID={arspk}
                                  queryNodeID={queryNodeID}
                                  queryNodeLabel={queryNodeLabel}
                                  queryNodeDescription={queryNodeDescription}
                                  bookmarked
                                  bookmarkID={save.id}
                                  hasNotes={queryItem.hasNotes}
                                  handleBookmarkError={handleBookmarkError}
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
            </>
        }
      </div>
    </QueryClientProvider>
  )
}

export default UserSaves;