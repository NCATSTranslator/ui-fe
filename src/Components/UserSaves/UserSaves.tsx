import { useEffect, useState, useRef, useCallback, useMemo, Dispatch, SetStateAction, FormEvent } from 'react';
import { getSaves, mergeResultSets, SaveGroup } from '../../Utilities/userApi';
import { handleEvidenceModalClose } from "../../Utilities/resultsInteractionFunctions";
import styles from './UserSaves.module.scss';
import EvidenceModal from '../Modals/EvidenceModal';
import { QueryClient, QueryClientProvider } from 'react-query';
import SearchIcon from '../../Icons/Buttons/Search.svg?react';
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
import { Path, Result, ResultEdge, ResultSet } from '../../Types/results';
import { useDispatch } from 'react-redux';
import { setResultSets } from '../../Redux/resultsSlice';

const UserSaves = () => {

  const dispatch = useDispatch();
  const [user, loading] = useUser();
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [savesLoaded, setSavesLoaded] = useState(false);
  const [userSaves, setUserSaves] = useState<{[key: string]: SaveGroup;} | null>(null);
  const [filteredUserSaves, setFilteredUserSaves] = useState<{[key: string]: SaveGroup;} | null>(null);
  const currentSearchString = useRef("");
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<Result | undefined>(undefined);
  const [selectedEdge, setSelectedEdge] = useState<ResultEdge | undefined>(undefined);
  const [selectedPath, setSelectedPath] = useState<Path | undefined>(undefined);
  const [selectedPK, setSelectedPK] = useState<string | undefined>(undefined);
  const [zoomKeyDown, setZoomKeyDown] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  // eslint-disable-next-line
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const shareResultID = useRef<null | string>(null);
  const setShareResultID = (newID: string) => shareResultID.current = newID;

  const [confidenceWeight] = useState(1.0);
  const [noveltyWeight] = useState(0.1);
  const [clinicalWeight] = useState(1.0);

  const scoreWeights = useMemo(()=> { return {confidenceWeight: confidenceWeight, noveltyWeight: noveltyWeight, clinicalWeight: clinicalWeight}}, [confidenceWeight, noveltyWeight, clinicalWeight]);
  
  const noteLabel = useRef("");
  const currentBookmarkID = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const bookmarkAddedToast = () => toast.success(<BookmarkAddedMarkup/>);
  const bookmarkRemovedToast = () => toast.success(<BookmarkRemovedMarkup/>);
  const handleBookmarkError = () => toast.error(<BookmarkErrorMarkup/>);

  const queryClient = new QueryClient();

  const activateEvidence = (item: Result, edge: ResultEdge, path: Path, pk: string) => {
    if(!!edge && !!path) {
      setSelectedPK(pk);
      setSelectedResult(item);
      setSelectedEdge(edge);
      setSelectedPath(path);
      setEvidenceModalOpen(true);
    }
  }

  const activateNotes = (label: string, bookmarkID: string) => {
    noteLabel.current = label;
    currentBookmarkID.current = bookmarkID;
    setNotesOpen(true);
  }

  const initSaves = async () => {
    let resultSetsToAdd: {[key:string]: ResultSet} = {};
    let newSaves = await getSaves(setUserSaves);
    // list of obsolete saves 
    let saveGroupsToRemove = new Set<string>();
    for(const [key, saveGroup] of Object.entries(newSaves)) {
      let newResultSet;
      for(const save of saveGroup.saves) {
        if(newResultSet === undefined)
          newResultSet = save.data.query.resultSet;
        else 
          newResultSet = mergeResultSets(newResultSet, save.data.query.resultSet);
      }
      if(!!newResultSet)
        resultSetsToAdd[saveGroup.query.pk] = newResultSet;
      else
        saveGroupsToRemove.add(key);
    }
    // remove obsolete saves
    for(const saveGroupKey of saveGroupsToRemove)
      delete newSaves[saveGroupKey];

    console.log("merged result sets: ", resultSetsToAdd);
    dispatch(setResultSets(resultSetsToAdd))
    setSavesLoaded(true);
    setFilteredUserSaves(cloneDeep(newSaves));
  }

  const handleSearch = useCallback((
    value: string | false = false,
    userSaves: {[key: string]: SaveGroup;},
    setFilteredUserSaves: Dispatch<SetStateAction<{[key: string]: SaveGroup;} | null>>
  ) => {
    if(!value) {
      setFilteredUserSaves(cloneDeep(userSaves));
      currentSearchString.current = "";
      return;
    }

    let newFilteredUserSaves: {[key: string]: SaveGroup;} = {};
    for(const save of Object.entries(userSaves)) {
      const key = save[0];
      let item = save[1];
      let include = false;
      let tempValue = value.toLowerCase();
      currentSearchString.current = value;
      let submittedDate = (item?.query?.submitted_time) ? getFormattedDate(new Date(item.query.submitted_time)) : '';

      // check for match in query info
      if(
        item.query.nodeLabel.toLowerCase().includes(tempValue) ||
        (typeof item.query.nodeId === "string" && item.query.nodeId.toLowerCase().includes(tempValue)) || 
        (typeof submittedDate === "string" && submittedDate.toLowerCase().includes(tempValue)) || 
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
          save.data.item.drug_name.toLowerCase().includes(tempValue) ||
          save.data.item.object.toLowerCase().includes(tempValue) 
        )
          include = true;
      }

      if(include)
        newFilteredUserSaves[key] = item;
    }
    setFilteredUserSaves(newFilteredUserSaves);
    setIsSearchLoading(false);
  }, []);

  // eslint-disable-next-line
  const delayedSearch = useCallback(debounce((value, userSaves, setFilteredUserSaves)=>handleSearch(value, userSaves, setFilteredUserSaves), 750), [handleSearch]);

  const handleSearchBarItemChange = (value: string) => {
    if(!isSearchLoading)
      setIsSearchLoading(true);
    delayedSearch(value, userSaves, setFilteredUserSaves);
  }

  const clearSearchBar = () => {
    if(!!formRef.current && !!userSaves) {
      formRef.current.reset();
      handleSearch(false, userSaves, setFilteredUserSaves);
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if(!!formRef.current) {
      formRef.current.reset();
      clearSearchBar();
    }
  }

  useEffect(() => {
    initSaves();

    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.keyCode === 90) {
        setZoomKeyDown(true);
      }
    };
  
    const handleKeyUp = (ev: KeyboardEvent) => {
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
                isOpen={evidenceModalOpen}
                onClose={()=>handleEvidenceModalClose(setEvidenceModalOpen)}
                result={selectedResult}
                pk={(!!selectedPK) ? selectedPK : "-1"}
                edge={selectedEdge}
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
                            filteredUserSaves &&
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
                                  scoreWeights={scoreWeights}
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