import { useEffect, useState, useRef, useCallback, useMemo, FC, Dispatch, SetStateAction } from 'react';
import ExternalLink from '@/assets/icons/Buttons/External Link.svg?react';
import LoadingBar from "@/features/Common/components/LoadingBar/LoadingBar";
import styles from './PublicationsTable.module.scss';
import Select from '@/features/Common/components/Select/Select';
import ReactPaginate from "react-paginate";
import { handleEvidenceSort, updatePubdate, updateSnippet, updateJournal, 
  updateTitle, generatePubmedURL } from "@/features/Evidence/utils/evidenceModalFunctions";
import { sortNameHighLow, sortNameLowHigh, sortJournalHighLow, sortJournalLowHigh,
  sortDateYearHighLow, sortDateYearLowHigh } from '@/features/Common/utils/sortingFunctions';
import { cloneDeep, chunk } from "lodash";
import { useQuery } from "react-query";
import Info from '@/assets/icons/Status/Alerts/Info.svg?react';
import ChevUp from '@/assets/icons/Directional/Chevron/Chevron Up.svg?react';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import EmphasizeWord from '@/features/Common/components/EmphasizeWord/EmphasizeWord';
import { PreferencesContainer } from '@/features/User-Auth/types/user';
import { PublicationObject, PublicationSupport, PubmedMetadataMap, SortingState } from '@/features/Evidence/types/evidence';
import { ResultEdge, ResultSet } from '@/features/ResultList/types/results';
import { getNodeById, getResultSetById } from '@/features/ResultList/slices/resultsSlice';
import { useSelector } from 'react-redux';

interface PublicationsTableProps {
  isOpen: boolean;
  pk: string;
  prefs: PreferencesContainer;
  pubmedEvidence: PublicationObject[];
  selectedEdge: ResultEdge | null;
  selectedEdgeTrigger: boolean;
  setPubmedEvidence: Dispatch<SetStateAction<PublicationObject[]>>
}

const getInitItemsPerPage = (prefs: PreferencesContainer) => {
  if(!!prefs?.evidence_per_screen?.pref_value)
    return typeof prefs?.evidence_per_screen?.pref_value === "string" ? parseInt(prefs?.evidence_per_screen?.pref_value) : prefs?.evidence_per_screen?.pref_value;
  else
    return 5;
}

const PublicationsTable: FC<PublicationsTableProps> = ({ 
  isOpen,
  pk,
  prefs,
  pubmedEvidence,
  selectedEdge,
  selectedEdgeTrigger,
  setPubmedEvidence,
  }) => {

  const availableKnowledgeLevels = useMemo(() => {
    return new Set(pubmedEvidence.map(pub => pub.knowledgeLevel));
  }, [pubmedEvidence]);

  const resultSet = useSelector(getResultSetById(pk));

  const prevSelectedEdgeTrigger = useRef(selectedEdgeTrigger);
  const [itemsPerPage, setItemsPerPage] = useState<number>(getInitItemsPerPage(prefs));
  const [displayedPubmedEvidence, setDisplayedPubmedEvidence] = useState<PublicationObject[]>([]);
  const [knowledgeLevelFilter, setKnowledgeLevelFilter] = useState<'all' | 'trusted' | 'ml'>('all');
  const filteredEvidence = useMemo(() => {
    if (knowledgeLevelFilter === 'all') 
      return pubmedEvidence;
    return pubmedEvidence.filter(evidence => evidence.knowledgeLevel === knowledgeLevelFilter);
  }, [pubmedEvidence, knowledgeLevelFilter]);
  const [pageCount, setPageCount] = useState(1);
  const [itemOffset, setItemOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const endOffset = (itemOffset + itemsPerPage > filteredEvidence.length)
    ? filteredEvidence.length
    :  itemOffset + itemsPerPage;
  const [sortingState, setSortingState] = useState<SortingState>({ title: null, journal: null, date: null });
  const [isLoading, setIsLoading] = useState(true);
  const didMountRef = useRef(false);
  const isFetchingPubmedData = useRef(false);
  const fetchedPubmedData = useRef(false);
  const queryAmount = 200;
  const [processedEvidenceIDs, setProcessedEvidenceIDs] = useState<string[][]>([])
  const amountOfIDsProcessed = useRef(0);
  const evidenceToUpdate = useRef(null);

  // Handles direct page click
  const handlePageClick = useCallback((event: { selected: number }) => {
    const newOffset = (event.selected * itemsPerPage) % filteredEvidence.length;
    setCurrentPage(event.selected);
    setItemOffset(newOffset);
  }, [itemsPerPage, filteredEvidence]);

  const handleClose = () => {
    setIsLoading(true);
    setCurrentPage(0);
    setItemOffset(0);
    setSortingState({ title: null, journal: null, date: null });
    setKnowledgeLevelFilter('all')
    amountOfIDsProcessed.current = 0;
    evidenceToUpdate.current = null;
    fetchedPubmedData.current = false;
    isFetchingPubmedData.current = false;
  }

  const insertAdditionalPubmedData = (data: PubmedMetadataMap, existing: PublicationObject[]): PublicationObject[] => {
    const newEvidence = cloneDeep(existing);
    newEvidence.forEach((element) => {
      const md = element?.id ? data[element.id] : false;
      if (md && element.id) {
        updateJournal(element, data);
        updateTitle(element, data);
        updateSnippet(element, data);
        updatePubdate(element, data);
        if (!element.url) {
          element.url = generatePubmedURL(element.id);
        }
      }
    });
    return newEvidence;
  };

  const insertAdditionalEvidenceAndSort = (
    prefs: PreferencesContainer,
    insertFn: (data: PubmedMetadataMap, existing: PublicationObject[]) => PublicationObject[]
  ) => {
    if(prefs?.evidence_sort?.pref_value) {
      const dataToSort = insertFn(evidenceToUpdate.current || {}, pubmedEvidence);
      switch (prefs.evidence_sort.pref_value) {
        case "dateHighLow":
          setSortingState(prev => ({...prev, date: true}));
          setPubmedEvidence(sortDateYearHighLow(dataToSort));
          break;
        case "dateLowHigh":
          setSortingState(prev => ({...prev, date: false}));
          setPubmedEvidence(sortDateYearLowHigh(dataToSort));
          break;
        case "journalHighLow":
          setSortingState(prev => ({...prev, journal: false}));
          setPubmedEvidence(sortJournalHighLow(dataToSort));
          break;
        case "journalLowHigh":
          setSortingState(prev => ({...prev, journal: true}));
          setPubmedEvidence(sortJournalLowHigh(dataToSort));
          break;
        case "titleHighLow":
          setSortingState(prev => ({...prev, title: false}));
          setPubmedEvidence(sortNameHighLow(dataToSort) as PublicationObject[])
          break;      
        case "titleLowHigh":
          setSortingState(prev => ({...prev, title: true}));
          setPubmedEvidence(sortNameLowHigh(dataToSort) as PublicationObject[])
          break;            
        default:
          break;
      }
    } else {
      setSortingState(prev => ({...prev, date: true}));
    }
  }

  // retrieves pubmed metadata, then inserts it into the existing evidence and sorts
  // called in useQuery hook below, controlled by isFetchingPubmedData ref
  const fetchPubmedData = async (
    chunksArr: string[][],
    totalItems: number,
    insertFn: typeof insertAdditionalEvidenceAndSort,
    prefs: PreferencesContainer
  ): Promise<void[]> => {
    const metadataPromises = chunksArr.map(async (ids) => {
      try {
        const res = await fetch(
          `https://docmetadata.transltr.io/publications?pubids=${ids.join(
            ','
          )}&request_id=26394fad-bfd9-4e32-bb90-ef9d5044f593`
        );
        const data = await res.json();
        if (!isFetchingPubmedData.current || !isOpen) return;

        evidenceToUpdate.current = {
          ...(evidenceToUpdate.current || {}),
          ...data.results,
        };
        amountOfIDsProcessed.current += Object.keys(data.results).length;

        if (amountOfIDsProcessed.current >= totalItems) {
          insertFn(prefs, insertAdditionalPubmedData);
          fetchedPubmedData.current = true;
          isFetchingPubmedData.current = false;
          setIsLoading(false);
        }
      } catch (error) {
        console.warn('Error fetching PubMed data:', error);
        fetchedPubmedData.current = true;
        isFetchingPubmedData.current = false;
        setIsLoading(false);
      }
    });
    return Promise.all(metadataPromises);
  };
  

  useQuery({
    queryKey: ['pubmedMetadata', processedEvidenceIDs],
    queryFn: () =>
      fetchPubmedData(
        processedEvidenceIDs,
        pubmedEvidence.length,
        insertAdditionalEvidenceAndSort,
        prefs
      ),
    refetchInterval: 1000,
    enabled: isFetchingPubmedData.current,
  });

  const setupPubmedDataFetch = (
    evidence: PublicationObject[],
    setter: React.Dispatch<React.SetStateAction<string[][]>>
  ) => {
    const ids = evidence
      .map((e) => e.id)
      .filter((id): id is string => typeof id === 'string');

    setter(chunk(ids, queryAmount));
    isFetchingPubmedData.current = true;
  };

  useEffect(() => {
    if (pubmedEvidence.length === 0 && didMountRef.current) {
      setIsLoading(false);
      return;
    }

    didMountRef.current = true;

    if (pubmedEvidence.length > 0) {
      if (fetchedPubmedData.current) {
        setIsLoading(false);
      } else {
        setupPubmedDataFetch(pubmedEvidence, setProcessedEvidenceIDs);
      }
    }

    if (prevSelectedEdgeTrigger.current !== selectedEdgeTrigger) {
      handleClose();
      setupPubmedDataFetch(pubmedEvidence, setProcessedEvidenceIDs);
      prevSelectedEdgeTrigger.current = selectedEdgeTrigger;
    }
  }, [pubmedEvidence, selectedEdgeTrigger, isOpen]);

  const handleGetSupportTextOrSnippet = (
    resultSet: ResultSet,
    pub: PublicationObject,
    selectedEdge: ResultEdge | null,
  ): JSX.Element | string => {

    const checkEdgeForPub = (pubID: string, edge: ResultEdge): {id: string; support: PublicationSupport;} | false => {
      for(const pubTypeArr of Object.values(edge.publications)) {
        const match = pubTypeArr.find(publication => publication.id === pubID)
        if(match)
          return match;
      }
      return false;
    }
    const matchingEdgePub = !!pub?.id && !!selectedEdge  ? checkEdgeForPub(pub.id, selectedEdge) : false;
    if (!!matchingEdgePub && matchingEdgePub.support !== null) {
      const objectNode = getNodeById(resultSet, selectedEdge?.object);
      const objectName = objectNode?.names[0] || "";
      const subjectNode = getNodeById(resultSet, selectedEdge?.subject);
      const subjectName = subjectNode?.names[0] || "";
      return (
        <EmphasizeWord
          text={matchingEdgePub.support.text}
          objectName={objectName}
          objectPos={matchingEdgePub.support.object}
          subjectName={subjectName}
          subjectPos={matchingEdgePub.support.subject}
        />
      );
    } else {
      return pub.snippet ?? 'No snippet available.';
    }
  };


  const handleSetKnowledgeLevelFilter = (knowledgeLevel: 'all' | 'trusted' | 'ml') => {
    setCurrentPage(0);
    setItemOffset(0);
    setKnowledgeLevelFilter(knowledgeLevel);
  }

  // update defaults when prefs change, including when they're loaded from the db since the call for new prefs  
  // comes asynchronously in useEffect (which is at the end of the render cycle) in App.js 
  useEffect(() => {
    const value = prefs?.evidence_per_screen?.pref_value
      ? typeof prefs.evidence_per_screen.pref_value === "string" ? parseInt(prefs.evidence_per_screen.pref_value) : prefs.evidence_per_screen.pref_value
      : 10;
    setItemsPerPage(value);
  }, [prefs]);

  useEffect(() => {
    if(!isOpen) 
      handleClose();
  }, [isOpen]);

  // hook to handle setting the correct evidence when itemOffset or itemsPerPage change
  useEffect(() => {
    setDisplayedPubmedEvidence(filteredEvidence.slice(itemOffset, endOffset));
    setPageCount(Math.ceil(filteredEvidence.length / itemsPerPage));
  }, [itemOffset, itemsPerPage, filteredEvidence, endOffset]);

  if(!resultSet) {
    console.warn('Unable to display publications table, no result set available'); 
    return;
  }

  return(
    <div className={styles.publicationsTableContainer}>
      <div className={styles.top}>
        {
          filteredEvidence.length > 0
            ? <p className={styles.evidenceCount}>Showing {itemOffset + 1}-{endOffset} of {filteredEvidence.length} {filteredEvidence.length !== pubmedEvidence.length && `(${pubmedEvidence.length}) `}Publications</p>
            : <p className={styles.evidenceCount}>Showing 0-0 of 0 ({pubmedEvidence.length}) Publications</p>
        }
        <div className={styles.knowledgeLevelOptions}>
          <p className={styles.knowledgeLevelLabel}>Knowledge Level <Info data-tooltip-id='knowledge-level-tooltip' /></p>
          <Tooltip id='knowledge-level-tooltip'>
            <span className={styles.knowledgeLevelTooltip}>Denotes the type of reasoning used to attribute a given publication to the selected relationship.</span>
          </Tooltip>
          <div>
            <button 
              className={`${styles.knowledgeLevelButton} ${knowledgeLevelFilter === 'all' ? styles.selected : ''}`} 
              onClick={() => handleSetKnowledgeLevelFilter('all')}>
              All
            </button>
            <button 
              className={`${styles.knowledgeLevelButton} ${knowledgeLevelFilter === 'trusted' ? styles.selected : ''}`} 
              onClick={() => handleSetKnowledgeLevelFilter('trusted')}
              disabled={!availableKnowledgeLevels.has('trusted')}>
              Curated
            </button>
            <button 
              className={`${styles.knowledgeLevelButton} ${knowledgeLevelFilter === 'ml' ? styles.selected : ''}`} 
              onClick={() => handleSetKnowledgeLevelFilter('ml')}
              disabled={!availableKnowledgeLevels.has('ml')}>
              Text-Mined
            </button>
          </div>
        </div>
      </div>
      <table className={`table-body ${styles.pubsTable}`}>
        <thead className={`table-head`}>
          <tr>
            <th
              className={`head ${styles.title} ${sortingState.title ? 'true' : (sortingState.title === null) ? '' : 'false'}`}
              onClick={()=>{handleEvidenceSort((sortingState.title) ? 'titleHighLow': 'titleLowHigh', pubmedEvidence, handlePageClick, setSortingState, setPubmedEvidence)}}
              >
              <span className={`head-span`}>
                Title
                <ChevUp className='chev'/>
              </span>
            </th>
            <th 
              className={`head ${styles.pubdate} ${sortingState.date ? 'true' : (sortingState.date === null) ? '' : 'false'}`}
              onClick={()=>{handleEvidenceSort((sortingState.date) ? 'dateLowHigh': 'dateHighLow', pubmedEvidence, handlePageClick, setSortingState, setPubmedEvidence)}}
              >
              <span className={`head-span`}>
                Date(s)
                <ChevUp className='chev'/>
              </span>
            </th>
            <th
              className={`head ${styles.source} ${sortingState.journal ? 'true' : (sortingState.journal === null) ? '' : 'false'}`}
              onClick={()=>{handleEvidenceSort((sortingState.journal) ? 'journalHighLow': 'journalLowHigh', pubmedEvidence, handlePageClick, setSortingState, setPubmedEvidence)}}
              >
              <span className={`head-span`}>
                Journal
                <ChevUp className='chev'/>
              </span>
            </th>
            <th className={`head ${styles.snippet}`}>Snippet</th>
            <th className={`head ${styles.knowledgeLevel}`}>Source & Rationale</th>
          </tr>
        </thead>
        {
          isLoading
          ?
            <LoadingBar
              useIcon
              className={styles.loadingBar}
              loadingText="Retrieving Evidence"
            />
          :
            <tbody className={`table-items`} >
              {
                displayedPubmedEvidence.length === 0
                ? <p className={styles.noPubs}>No publications available.</p>
                :
                  displayedPubmedEvidence.map((pub)=> {
                    return (
                      <tr className={`table-item`} key={pub.id}>
                        <td className={`table-cell ${styles.tableCell} ${styles.title} title`} >
                          {pub.title && pub.url && <a href={pub.url} target="_blank" rel="noreferrer">{pub.title}</a> }
                          {!pub.title && pub.url && <a href={pub.url} target="_blank" rel="noreferrer">No Title Available</a> }
                        </td>
                        <td className={`table-cell ${styles.tableCell} ${styles.pubdate} pubdate`}>
                          {!!pub.pubdate ? pub.pubdate : 'N/A' }
                        </td>
                        <td className={`table-cell ${styles.tableCell} ${styles.source} source`}>
                          <span>
                            {!!pub.journal ? pub.journal : "N/A" }
                          </span>
                        </td>
                        <td className={`table-cell ${styles.tableCell} ${styles.snippet}`}>
                          <span>
                            {
                              handleGetSupportTextOrSnippet(resultSet, pub, selectedEdge)
                            }
                          </span>
                            {pub.url && <a href={pub.url} className={`url ${styles.url}`} target="_blank" rel="noreferrer">Read More <ExternalLink/></a>}
                        </td>
                        <td className={`table-cell ${styles.tableCell} ${styles.knowledgeLevel}`}>
                          {/* <span className={styles.knowledgeLevelSpan}>{knowledgeLevelString}</span> */}
                          {
                            pub.source && pub.source?.url 
                            ? <a className={styles.sourceName} href={pub.source.url} target="_blank" rel='noreferrer'><span>{pub.source.name}</span></a>
                            : <span className={`${styles.noLink} ${styles.sourceName}`}>{(!!pub?.source?.name) ? pub.source.name : "Unknown"}</span>
                          }
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
        }
      </table>
      <div className={styles.bottom}>
        <div className={styles.perPage}>
          <p className={styles.label}>Publications per Page</p>
          <Select
            label=""
            name="Items Per Page"
            handleChange={(value)=>{
              setItemsPerPage(value);
              handlePageClick({selected: 0});
            }}
            value={itemsPerPage}
            >
            <option value="5" key="0">5</option>
            <option value="10" key="1">10</option>
            <option value="20" key="2">20</option>
          </Select>
        </div>
        <div className={styles.pagination}>
          <ReactPaginate
            breakLabel="..."
            nextLabel="Next"
            previousLabel="Previous"
            onPageChange={handlePageClick}
            pageRangeDisplayed={2}
            marginPagesDisplayed={2}
            pageCount={pageCount}
            renderOnZeroPageCount={null}
            className={styles.pageNums}
            pageClassName={styles.pageNum}
            activeClassName={styles.current}
            previousLinkClassName={`${styles.prev} ${styles.button}`}
            nextLinkClassName={`${styles.prev} ${styles.button}`}
            disabledLinkClassName={styles.disabled}
            forcePage={currentPage}
          />
        </div>
      </div>
    </div>
  )
}

export default PublicationsTable;