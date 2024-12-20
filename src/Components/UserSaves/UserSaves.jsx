import { useEffect, useState, useRef, useCallback } from 'react';
import { getSaves } from '../../Utilities/userApi';
import { handleEvidenceModalClose } from "../../Utilities/resultsInteractionFunctions";
import styles from './UserSaves.module.scss';
import EvidenceModal from '../Modals/EvidenceModal';
import { QueryClient, QueryClientProvider } from 'react-query';
import SearchIcon from '../../Icons/Buttons/Search.svg?react';
// import ChevUp from '../../Icons/Directional/Chevron/Chevron Up.svg?react';
import RefreshIcon from '../../Icons/Buttons/Refresh.svg?react';
import CloseIcon from '../../Icons/Buttons/Close/Close.svg?react';
import { getFormattedDate } from '../../Utilities/utilities';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BookmarkAddedMarkup, BookmarkRemovedMarkup, BookmarkErrorMarkup } from '../BookmarkToasts/BookmarkToasts';
import NotesModal from '../Modals/NotesModal';
import TextInput from "../Core/TextInput";
import { cloneDeep } from 'lodash';
import UserSave from '../UserSave/UserSave';
import LoginWarning from '../LoginWarning/LoginWarning';
import LoadingWrapper from '../LoadingWrapper/LoadingWrapper'
import { useUser } from '../../Utilities/userApi';
import { debounce } from 'lodash';
// import Button from '../Core/Button';

const UserSaves = () => {

  const [user, loading] = useUser();
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [savesLoaded, setSavesLoaded] = useState(false);
  const [userSaves, setUserSaves] = useState(null);
  const [filteredUserSaves, setFilteredUserSaves] = useState(null)
  const currentSearchString = useRef("");
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState({});
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);
  const [zoomKeyDown, setZoomKeyDown] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  // eslint-disable-next-line
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const shareResultID = useRef(null);
  const setShareResultID = (newID) => shareResultID.current = newID;
  
  const noteLabel = useRef("");
  const currentBookmarkID = useRef(null);
  const formRef = useRef(null);

  const bookmarkAddedToast = () => toast.success(<BookmarkAddedMarkup/>);
  const bookmarkRemovedToast = () => toast.success(<BookmarkRemovedMarkup/>);
  const handleBookmarkError = () => toast.error(<BookmarkErrorMarkup/>);

  const queryClient = new QueryClient();

  const activateEvidence = useCallback((item, edgeGroup, path) => {
    setSelectedItem(item);
    setSelectedEdge(edgeGroup);
    setSelectedPath(path);
    setEvidenceOpen(true);
  },[])

  const activateNotes = (label, bookmarkID) => {
    noteLabel.current = label;
    currentBookmarkID.current = bookmarkID;
    setNotesOpen(true);
  }

  const initSaves = async () => {
    let newSaves = await getSaves(setUserSaves);
    setSavesLoaded(true);
    setFilteredUserSaves(cloneDeep(newSaves));
  }

  const handleSearch = useCallback((value = false, userSaves, setFilteredUserSaves) => {
    if(!value) {
      setFilteredUserSaves(cloneDeep(userSaves));
      currentSearchString.current = "";
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
    setIsSearchLoading(false);
  }, []);

  // eslint-disable-next-line
  const delayedSearch = useCallback(debounce((value, userSaves, setFilteredUserSaves)=>handleSearch(value, userSaves, setFilteredUserSaves), 750), [handleSearch]);

  const handleSearchBarItemChange = (value) => {
    if(!isSearchLoading)
      setIsSearchLoading(true);
    delayedSearch(value, userSaves, setFilteredUserSaves);
  }

  const clearSearchBar = () => {
    formRef.current.reset();
    handleSearch(false, userSaves, setFilteredUserSaves);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    formRef.current.reset();
    clearSearchBar();
  }

  useEffect(() => {
    initSaves();

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
      <LoadingWrapper loading={loading}>
        {
          !!user
          ?
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
                noteLabel={noteLabel.current}
                bookmarkID={currentBookmarkID.current}
              />
              <EvidenceModal
                isOpen={evidenceOpen}
                onClose={()=>handleEvidenceModalClose(setEvidenceOpen)}
                item={selectedItem}
                edgeGroup={selectedEdge}
                path={selectedPath}
              />
              <div className="page-header">
                <div className="container">
                  <div className={styles.headerTop}>
                    <h1 className="h4">Workspace</h1>
                    {/* <Button
                      isSecondary
                      smallFont
                      className={styles.collapseButton}
                      >
                      <ChevUp/> Collapse All
                    </Button> */}
                  </div>
                  <p>Bookmarked results and any notes added to them are stored indefinitely.</p>
                  <div className={styles.searchBarContainer}>
                    <form onSubmit={(e)=>{handleSubmit(e)}} className={styles.form} ref={formRef}>
                      <TextInput 
                        placeholder="Search Saved Results" 
                        handleChange={(e)=>handleSearchBarItemChange(e)} 
                        className={styles.input}
                        iconLeft={<SearchIcon/>}
                        iconRight={!!isSearchLoading ? <RefreshIcon className={`loadingIcon ${styles.loadingIcon}`}/> : !!currentSearchString.current && <CloseIcon className={styles.closeIcon} onClick={clearSearchBar} />}
                      />
                    </form>
                  </div>
                </div>
              </div>
              <div className='container'>
                {
                  savesLoaded
                  ? 
                    (userSaves == null || Object.entries(userSaves).length <= 0)
                    ? 
                      <div className={styles.none}>
                        <p>You haven't saved any results yet!</p>
                        <p>Submit a query, then click the bookmark icon on a result to save it for later. You can then view that result here.</p>
                      </div>
                    : <>
                        <div className={styles.saves}>
                          {
                            Object.entries(filteredUserSaves).sort((a, b)=> -a[1].query.submitted_time.localeCompare(b[1].query.submitted_time)).map((item) => {
                              return(
                                <UserSave
                                  save={item}
                                  currentSearchString={currentSearchString}
                                  zoomKeyDown={zoomKeyDown}
                                  activateEvidence={activateEvidence}
                                  activateNotes={activateNotes}
                                  handleBookmarkError={handleBookmarkError}
                                  bookmarkAddedToast={bookmarkAddedToast}
                                  bookmarkRemovedToast={bookmarkRemovedToast}
                                  setShareModalOpen={setShareModalOpen}
                                  setShareResultID={setShareResultID}
                                />
                              );
                            })
                          }
                        </div>
                      </>
                  : <></>
                }
              </div>
            </div>
          :
            <LoginWarning text="Use the Log In link above in order to view and manage your saved results."/>
        }
      </LoadingWrapper>
    </QueryClientProvider>
  )
}

export default UserSaves;