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

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Query Variables from URL
  // const search = window.location.search;
  // const curieOne = new URLSearchParams(search).get('curieOne');
  // const subjectOne = new URLSearchParams(search).get('subjectOne');
  // const predicate = new URLSearchParams(search).get('predicate');
  // const curieTwo = new URLSearchParams(search).get('curieTwo');
  // const subjectTwo = new URLSearchParams(search).get('subjectTwo');
  loading = (loading) ? true : false;

  const [proMode, setProMode] = useState(false);
  const [isTemplate, setIsTemplate] = useState(template);
  const [isResults, setIsResults] = useState(results);
  const [resultsActive, setResultsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(loading);
  const [isValidSubmission, setIsValidSubmission] = useState(false);
  const [subjectsActive, setSubjectsActive] = useState(true);

  const [activeMockID, setActiveMockID] = useState(-1);

  let startingResultsID = useSelector(currentQueryResultsID);
  startingResultsID = (startingResultsID === undefined) ? '' : startingResultsID; 
  const [currentResultsID, setCurrentResultsID] = useState(startingResultsID);

  let startingQuery = useSelector(currentQuery);
  startingQuery = (startingQuery === undefined) ? [] : startingQuery; 
  const [queryItems, setQueryItems] = useState(startingQuery);
  
  var testJson = 
    {
      nodes:
      [
        {
          name: '',
          type: 'ChemicalEntity'
        },
        // {
        //   name: '',
        //   type: 'Gene'
        // },
        {
          name: 'RHOBTB2',
          type: 'Gene'
        },
      ],
      edges:
      [
        {
          source: 0,
          target: 1,
          type: "entity_negatively_regulates_entity"
        }, 
        // {
        //   source: 1,
        //   target: 2,
        //   type: "entity_positively_regulates_entity"
        // }
      ]
    }
  testJson = JSON.stringify(testJson);


  const handleQueryItemChange = (e) => {
    let updatedValue = e.target.value;
    let itemKey = e.target.dataset.inputkey;
    if(queryItems[itemKey].type === 'subject') {
      let items = JSON.parse(JSON.stringify(queryItems));
      items[itemKey].value = updatedValue;
      setQueryItems(items);
    }
  }
 
  const handleSubmission = (e) => {
    e.preventDefault();
    // console.log(e);
    validateSubmission(e);
  }

  const validateSubmission = (e) => {
    if(queryItems.length > 0) {
      setIsValidSubmission(true);
    }
  }

  useEffect(() => {
    dispatch(setCurrentQuery(queryItems));
  }, [dispatch, queryItems]);

  useEffect(() => {
    setQueryItems(startingQuery);
    cannedQueries.forEach(element => {
      if(element.query === startingQuery && activeMockID !== element.id) {
        setActiveMockID(element.id);
      }
    });
  }, [startingQuery]);

  useEffect(() => {
    if(isValidSubmission) {
      let timestamp = new Date();
      dispatch(incrementHistory({ items: queryItems, time: timestamp.toDateString()}));
      dispatch(setCurrentResults({}));
      setIsValidSubmission(false);
      setIsLoading(true);
      
      if(activeMockID != -1) {
        let mockJson = { id: activeMockID} 
        testJson = JSON.stringify(mockJson);
      }
      // setQueryItems([]);

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
            setCurrentResultsID(data.data);
            dispatch(setCurrentQueryResultsID(data.data.id));
            setResultsActive(true);
          }
        });
    }

  }, [isValidSubmission, dispatch, queryItems])

  useEffect(() => {
    if(resultsActive) {
      setIsResults(true);
    }
  }, [resultsActive]);

  useEffect(() => {
    if(isResults && !window.location.href.includes("results")) {
      navigate('/results?loading=true');
    }
  }, [isResults]);

  const handleOnDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(queryItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setQueryItems(items);
  }

  const addQueryItem = (item) => {
    const items = Array.from(queryItems);
    items.push(item);
    setQueryItems(items);
  }

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

  const updateQueryItems = (items) => {
    setQueryItems(items);
  }

  // Determine active type
  useEffect(() => {
    if(queryItems.length === 0) {
      setSubjectsActive(true);
      return;
    }
    let areSubjectsActive = (queryItems[queryItems.length - 1].type !== 'subject') ? true : false;
    setSubjectsActive(areSubjectsActive);
  }, [queryItems])
  

  // Query Button items
  const gene = {name: 'Gene', type: 'subject', category: 'gene', value: '', selected: false};
  const phenotype = {name: 'Phenotype', type: 'subject', category: 'phenotype', value: '', selected: false};
  const chemical = {name: 'Chemical', type: 'subject', category: 'chemical', value: '', selected: false};
  const disease = {name: 'Disease', type: 'subject', category: 'disease', value: '', selected: false};
  const concept = {name: 'Concept', type: 'subject', category: 'concept', value: '', selected: false};

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
                      let itemIsSubject = (item.type === "subject") ? true : false;
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
                                hasInput={itemIsSubject}
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
                <h6>Subjects</h6>
                <div className="panel subjects">
                  <QueryItemButton 
                    disabled={!subjectsActive}
                    item={gene}
                    handleClick={() => addQueryItem(gene)}
                    >Gene</QueryItemButton>
                  <QueryItemButton 
                    disabled={!subjectsActive}
                    item={phenotype}
                    handleClick={() => addQueryItem(phenotype)}
                    >Phenotype</QueryItemButton>
                  <QueryItemButton 
                    disabled={!subjectsActive}
                    item={chemical}
                    handleClick={() => addQueryItem(chemical)}
                    >Chemical</QueryItemButton>
                  <QueryItemButton 
                    disabled={!subjectsActive}
                    item={disease}
                    handleClick={() => addQueryItem(disease)}
                    >Disease</QueryItemButton>
                  <QueryItemButton 
                    disabled={!subjectsActive}
                    item={concept}
                    handleClick={() => addQueryItem(concept)}
                    >Concept</QueryItemButton>
                </div>
                <h6>Actions</h6>
                <div className="panel actions">
                  <QueryItemButton 
                  disabled={subjectsActive}
                  item={regulates}
                  handleClick={() => addQueryItem(regulates)}
                  >Regulate</QueryItemButton>
                  <QueryItemButton 
                    disabled={subjectsActive}
                    item={downregulates}
                    handleClick={() => addQueryItem(downregulates)}
                    >Downregulate</QueryItemButton>
                  <QueryItemButton 
                    disabled={subjectsActive}
                    item={upregulates}
                    handleClick={() => addQueryItem(upregulates)}
                    >Upregulate</QueryItemButton>
                  <QueryItemButton 
                    disabled={subjectsActive}
                    item={treats}
                    handleClick={() => addQueryItem(treats)}
                    >Treats</QueryItemButton>
                  <QueryItemButton 
                    disabled={subjectsActive}
                    item={associated}
                    handleClick={() => addQueryItem(associated)}
                    >Associated With</QueryItemButton>
                  <QueryItemButton 
                    disabled={subjectsActive}
                    item={nodes}
                    handleClick={() => addQueryItem(nodes)}
                    >Node(s)</QueryItemButton>
                </div>
              </div>
            }
            {isTemplate && 
             !isResults &&
              <div className="templates">
                <div className="panel subjects">
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
                <li>Select a component and type in your desired target subject.</li>
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