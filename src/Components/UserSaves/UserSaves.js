import { useEffect, useState } from 'react';
import { getAllUserSaves } from '../../Utilities/userApi';
import { findStringMatch, handleResultsError, handleEvidenceModalClose,
  handleResultsRefresh, handleClearAllFilters } from "../../Utilities/resultsInteractionFunctions";
import styles from './UserSaves.module.scss';
import ResultsItem from '../ResultsItem/ResultsItem';
import EvidenceModal from '../Modals/EvidenceModal';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';

const UserSaves = () => {

  const [userSaves, setUserSaves] = useState(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [currentEvidence, setCurrentEvidence] = useState([]);
  const [selectedItem, setSelectedItem] = useState({});
  const [selectedEdges, setSelectedEdges] = useState([]);
  const [isAllEvidence, setIsAllEvidence] = useState(true);

  const queryClient = new QueryClient();

  useEffect(() => {
    getSaves();
  },[]);

  const getSaves = async () => {
    let saves = await getAllUserSaves();

    saves = formatUserSaves(saves);
    setUserSaves(saves);
  }

  const formatUserSaves = (saves) => { 
    console.log(saves);
    let newSaves = {};
    for(const save of saves) {
      if(!save?.data?.query)
        continue;

      if(!newSaves.hasOwnProperty(save.ars_pkey)) {
        newSaves[save.ars_pkey] = {
          saves: new Set([save]),
          query: save.data.query
        };
      } else {
        newSaves[save.ars_pkey].saves.add(save);
      }
    }
    console.log(newSaves);
    return newSaves;
  }

  return(
    <QueryClientProvider client={queryClient}>
      <div>
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
          userSaves && Object.entries(userSaves).map((item) => {
            console.log(item);
            let key = item[0];
            let queryObject = item[1];
            let typeString = queryObject.query.type.label;
            let queryNodeString = queryObject.query.nodeLabel;
            return(
              <div key={key}>
                <h4>{typeString} <span>{queryNodeString}</span></h4>
                <div>
                  {queryObject.saves && Array.from(queryObject.saves).map((save) => {
                    console.log(save);
                    return (
                      <div key={save.id}>
                        {
                          save.label
                        }
                        {/* <ResultsItem
                          rawResults={rawResults.current}
                          key={item.id}
                          type={initPresetTypeObject}
                          item={item}
                          activateEvidence={(evidence, item, edgeGroup, isAll)=>activateEvidence(evidence, item, edgeGroup, isAll)}
                          activeStringFilters={activeStringFilters}
                          zoomKeyDown={zoomKeyDown}
                          currentQueryID={currentQueryID}
                          queryNodeID={initNodeIdParam}
                          queryNodeLabel={initNodeLabelParam}
                          queryNodeDescription={nodeDescription}
                        />
                        {save.label} */}
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