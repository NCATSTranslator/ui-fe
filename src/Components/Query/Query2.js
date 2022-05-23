import React, {useState, useEffect} from "react";
import { useSelector, useDispatch } from 'react-redux'
import { cannedQueries } from "../../Data/cannedqueries";
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Button from "../FormFields/Button";
import QueryTemplate from "../QueryComponents/QueryTemplate";
import QueryItemButton from "../QueryComponents/QueryItemButton";
import QueryItem from "../QueryComponents/QueryItem";
import { incrementHistory } from "../../Redux/historySlice";
import { setCurrentQuery, currentQuery} from "../../Redux/querySlice";
import { currentQueryResultsID, setCurrentQueryResultsID, setCurrentResults } from "../../Redux/resultsSlice";

const Query2 = ({template, results, handleAdd, handleRemove, loading}) => {

  // Utilities for navigation and application state dispatch
  const navigate = useNavigate();
  const dispatch = useDispatch();

  loading = (loading) ? true : false;

  // Bool, pro mode toggle
  const [proMode, setProMode] = useState(false);
  // Bool, are we on the templated queries page
  const [isTemplate, setIsTemplate] = useState(template);
  // Bool, are we on the results page
  const [isResults, setIsResults] = useState(results);
  // Bool, are results active
  const [resultsActive, setResultsActive] = useState(false);
  // Bool, are the results loading
  const [isLoading, setIsLoading] = useState(loading);
  // Bool, is the submitted query valid, determined by validateSubmission 
  const [isValidSubmission, setIsValidSubmission] = useState(false);
  // Bool, controls whether nodes or predicates are active on BYO query 
  const [NodesActive, setNodesActive] = useState(true);
  // Int, active mock ARS ID
  const [activeMockID, setActiveMockID] = useState(-1);

  // 
  let startingResultsID = useSelector(currentQueryResultsID);
  startingResultsID = (startingResultsID === undefined) ? '' : startingResultsID; 
  const [currentResultsID, setCurrentResultsID] = useState(startingResultsID);

  // Get the current query from the application state
  let startingQuery = useSelector(currentQuery);
  startingQuery = (startingQuery === undefined) ? [] : startingQuery; 
  // Array, currently selected query items
  const [queryItems, setQueryItems] = useState(startingQuery);

  // Event handler called when a node's input is updated by the user 
  const handleQueryItemChange = (e) => {
    let updatedValue = e.target.value;
    let itemKey = e.target.dataset.inputkey;
    if(queryItems[itemKey].type === 'node') {
      let items = JSON.parse(JSON.stringify(queryItems));
      items[itemKey].value = updatedValue;
      setQueryItems(items);
    }
  }
 
  // Event handler for form submission
  const handleSubmission = (e) => {
    e.preventDefault();
    validateSubmission(e);
  }

  // Validation function for submission
  const validateSubmission = (e) => {
    if(queryItems.length > 0) {
      setIsValidSubmission(true);
    }
  }

  // When the query items change, update the current query in the app state
  useEffect(() => {
    dispatch(setCurrentQuery(queryItems));
  }, [dispatch, queryItems]);

  /* 
    When the starting query is changed (on page reload), update the query items to match
    Then check the canned queries list for a match in order to assign the proper mock ID
  */
  useEffect(() => {
    if(!startingQuery)
      return;
    setQueryItems(startingQuery);
    cannedQueries.forEach(element => {
      if(element.query === startingQuery && activeMockID !== element.id) {
        setActiveMockID(element.id);
      }
    });
  }, [startingQuery, activeMockID]);


  // When isValidSubmission changes
  useEffect(() => {
    // If the submission is valid
    if(isValidSubmission) {
      let timestamp = new Date();
      // Update the query history in the application state
      dispatch(incrementHistory({ items: queryItems, time: timestamp.toDateString()}));
      // Reset the current results in the application state
      dispatch(setCurrentResults({}));
      // Reset isValidSubmission
      setIsValidSubmission(false);
      // Set isLoading to true
      setIsLoading(true);

      let testJson = '';
      
      // If the activeMockID has been set, prep the json to be sent to /query
      if(activeMockID != -1) {
        let mockJson = { id: activeMockID} 
        testJson = JSON.stringify(mockJson);
      }

      // submit query to /query
      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: testJson
      };
      fetch('/query', requestOptions)
        .then(response => response.json())
        .then(data => {
          console.log(data)
          if(data.data && data.status === 'success') {
            // Update the currentQueryResultsID 
            setCurrentResultsID(data.data);
            // Update the currentQueryResultsID in the application state
            dispatch(setCurrentQueryResultsID(data.data.id));
            setResultsActive(true);
          }
        });
    }

  }, [isValidSubmission, dispatch, queryItems, activeMockID])

  // Reset isResults on rerender when resultsActive  
  useEffect(() => {
    if(resultsActive) {
      setIsResults(true);
    }
  }, [resultsActive]);

  // If isResults is true and we aren't already, send us to the results page and set loading to true
  useEffect(() => {
    if(isResults && !window.location.href.includes("results")) {
      navigate('/results?loading=true');
    }
  }, [isResults, navigate]);

  // Event handler for dragging individual query items
  const handleOnDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(queryItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setQueryItems(items);
  }

  // Click handler for query items 
  const addQueryItem = (item) => {
    const items = Array.from(queryItems);
    items.push(item);
    setQueryItems(items);
  }

  // Click handler to remove a query item from the list
  const removeQueryItem = (indexToRemove) => {
    let needsChange = false;
    let newItems = Array.from(queryItems);
    queryItems.map(({name}, index) => {
      if(index === indexToRemove) {
        newItems.splice(index, 1);
        needsChange = true;
      }
      return name;
    });

    if(needsChange)
      setQueryItems(newItems);
  } 

  // Alternate active query item type (nodes/predicates)
  useEffect(() => {
    if(queryItems.length === 0) {
      setNodesActive(true);
      return;
    }
    let areNodesActive = (queryItems[queryItems.length - 1].type !== 'node') ? true : false;
    setNodesActive(areNodesActive);
  }, [queryItems])
  

  // Query Button items
  const gene = {name: 'Gene', type: 'node', category: 'gene', value: '', selected: false};
  const phenotype = {name: 'Phenotype', type: 'node', category: 'phenotype', value: '', selected: false};
  const chemical = {name: 'Chemical', type: 'node', category: 'chemical', value: '', selected: false};
  const disease = {name: 'Disease', type: 'node', category: 'disease', value: '', selected: false};
  const concept = {name: 'Concept', type: 'node', category: 'concept', value: '', selected: false};

  const regulates = {name: 'Regulates', type: 'action', category: 'regulation'};
  const downregulates = {name: 'Downregulates', type: 'action', category: 'regulation'};
  const upregulates = {name: 'Upregulates', type: 'action', category: 'regulation'};
  const treats = {name: 'Treats', type: 'action', category: 'treats'};
  const associated = {name: 'Associated With', type: 'action', category: 'associated'};
  const nodes = {name: 'Node(s)', type: 'action', category: 'nodes'};

  return (
    <>
      <div className={`query-window two`} >
        <div className="header">

        </div>
        {!proMode &&  
          <form onSubmit={handleSubmission}>
            <DragDropContext onDragEnd={handleOnDragEnd}>
              <Droppable droppableId="query-item" direction="horizontal">
                {(provided) => (
                  <ul className="query-box" {...provided.droppableProps} ref={provided.innerRef}>
                    {queryItems.map((item, index) => {
                      let itemIsNode = (item.type === "node") ? true : false;
                      return (
                        <Draggable key={index} draggableId={index.toString()} index={index} >
                          {(provided) => (
                            <li 
                              ref={provided.innerRef} 
                              {...provided.draggableProps} 
                              {...provided.dragHandleProps} 
                              className="query-list-item">
                              <QueryItem 
                                item={item} 
                                handleClose={()=>removeQueryItem(index)} 
                                handleChange={handleQueryItemChange}
                                hasInput={itemIsNode}
                                name={item.name}
                                inputKey={index}
                                isSelected={item.selected}
                                inputActive>
                              </QueryItem>
                            </li>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
            <Button type="submit" size="s" disabled={isLoading}>
              <span>Submit Query</span>
            </Button>
          </form>
          
        }
        <div className="query-items">
          <div className="panels">
            {!isTemplate && 
             !isResults &&
              <div className="build">
                <h6>Nodes</h6>
                <div className="panel subjects nodes">
                  <QueryItemButton 
                    disabled={!NodesActive}
                    item={gene}
                    handleClick={() => addQueryItem(gene)}
                    >Gene</QueryItemButton>
                  <QueryItemButton 
                    disabled={!NodesActive}
                    item={phenotype}
                    handleClick={() => addQueryItem(phenotype)}
                    >Phenotype</QueryItemButton>
                  <QueryItemButton 
                    disabled={!NodesActive}
                    item={chemical}
                    handleClick={() => addQueryItem(chemical)}
                    >Chemical</QueryItemButton>
                  <QueryItemButton 
                    disabled={!NodesActive}
                    item={disease}
                    handleClick={() => addQueryItem(disease)}
                    >Disease</QueryItemButton>
                  <QueryItemButton 
                    disabled={!NodesActive}
                    item={concept}
                    handleClick={() => addQueryItem(concept)}
                    >Concept</QueryItemButton>
                </div>
                <h6>Actions</h6>
                <div className="panel actions">
                  <QueryItemButton 
                  disabled={NodesActive}
                  item={regulates}
                  handleClick={() => addQueryItem(regulates)}
                  >Regulate</QueryItemButton>
                  <QueryItemButton 
                    disabled={NodesActive}
                    item={downregulates}
                    handleClick={() => addQueryItem(downregulates)}
                    >Downregulate</QueryItemButton>
                  <QueryItemButton 
                    disabled={NodesActive}
                    item={upregulates}
                    handleClick={() => addQueryItem(upregulates)}
                    >Upregulate</QueryItemButton>
                  <QueryItemButton 
                    disabled={NodesActive}
                    item={treats}
                    handleClick={() => addQueryItem(treats)}
                    >Treats</QueryItemButton>
                  <QueryItemButton 
                    disabled={NodesActive}
                    item={associated}
                    handleClick={() => addQueryItem(associated)}
                    >Associated With</QueryItemButton>
                  <QueryItemButton 
                    disabled={NodesActive}
                    item={nodes}
                    handleClick={() => addQueryItem(nodes)}
                    >Node(s)</QueryItemButton>
                </div>
              </div>
            }
            {isTemplate && 
             !isResults &&
              <div className="templates">
                <div className="panel subjects nodes">
                  {
                    cannedQueries.map((item, i)=> {
                      return (
                        <QueryTemplate 
                          handleClick={() => {
                            setQueryItems(item.query);
                            setActiveMockID(item.id);
                          }}
                          items={item.query} 
                          key={i}
                        />
                      )
                    })
                  }
                </div>
              </div>
            }
            {isResults && 
             isLoading &&
              <div className="loading-results">
              </div>
            }
          </div>
          {!isResults && 
            <div className="how-to">
              <p className="sub-one">How To Use Translator</p>
              <ol>
                <li>Click or drag in a template or  component to begin building a query.</li>
                <li>If needed, remove component fields by hovering over them and clicking the “x.”</li>
                <li>Select a component and type in your desired target node.</li>
                <li>Submit Query!</li>
              </ol>
            </div>
          }
        </div>
        {proMode &&  
          <>
          <h2>Pro Mode Interface TBD</h2>
          </>
        }
      </div>
    </>
  );
}


export default Query2;