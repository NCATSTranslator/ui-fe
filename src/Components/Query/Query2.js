import React, {useState, useEffect} from "react";
import Button from "../FormFields/Button";
import QueryTemplate from "../QueryComponents/QueryTemplate";
import QueryItemButton from "../QueryComponents/QueryItemButton";
import {ReactComponent as Close} from '../../Icons/Buttons/Close.svg';

import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import { incrementHistory, queryState } from "../../Redux/store";
import { useSelector, useDispatch } from 'react-redux'

const Query2 = ({template, handleAdd, handleRemove}) => {


  const search = window.location.search;
  const curieOne = new URLSearchParams(search).get('curieOne');
  const subjectOne = new URLSearchParams(search).get('subjectOne');
  const predicate = new URLSearchParams(search).get('predicate');
  const curieTwo = new URLSearchParams(search).get('curieTwo');
  const subjectTwo = new URLSearchParams(search).get('subjectTwo');

  const [proMode, setProMode] = useState(false);
  const [isTemplate, setIsTemplate] = useState(template);
  const [isValidSubmission, setIsValidSubmission] = useState(false);
  const [subjectsActive, setSubjectsActive] = useState(true);

  const [queryItems, setQueryItems] = useState([]); 

  const dispatch = useDispatch();
  var queryHistoryState = useSelector(queryState);

  const handleSubmission = (e) => {
    e.preventDefault();
    console.log(e);
    validateSubmission(e);
  }

  const validateSubmission = (e) => {
    // console.log(queryItems);
    setIsValidSubmission(true);
  }

  useEffect(() => {
    if(isValidSubmission) {
      dispatch(incrementHistory(queryItems));
      setIsValidSubmission(false);
      setQueryItems([]);
    }

  }, [isValidSubmission, dispatch, queryItems])



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

  const changeQueryItems = (items) => {
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

  useEffect(() => {
    if(queryItems.length === 0) {
      setSubjectsActive(true);
      return;
    }
    setSubjectsActive(s=>!s);
  }, [queryItems])
  
  const testOne = [
    {
      name: 'What Chemical',
      type: 'subject',
      category: 'chemical'
    },
    {
      name: 'Regulates a',
      type: 'action'
    },
    {
      name: 'Gene',
      type: 'subject',
      category: 'gene'
    }
  ]

  const testTwo = [
    {
      name: 'What Chemical',
      type: 'subject',
      category: 'chemical'
    },
    {
      name: 'Downregulates a',
      type: 'action'
    },
    {
      name: 'Gene that',
      type: 'subject',
      category: 'gene'
    },
    {
      name: 'Upregulates a',
      type: 'action'
    },
    {
      name: 'Gene',
      type: 'subject',
      category: 'gene'
    },
  ]

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
                    {queryItems.map(({id, name}, index) => {
                      return (
                        <Draggable key={index} draggableId={index.toString()} index={index} >
                          {(provided) => (
                            <li ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="query-item">
                              <div className="query-item-container"><p>{name}</p></div>
                              <div onClick={()=>removeQueryItem(index)} className="remove"><Close/></div>
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
            <Button type="submit" size="s">Submit Query</Button>
          </form>
          
        }
        <div className="query-items">
          <div className="panels">
            {!isTemplate && 
              <div className="build">
                <h6>Subjects</h6>
                <div className="panel subjects">
                  <QueryItemButton 
                    disabled={!subjectsActive}
                    handleClick={() => addQueryItem({name: 'Gene', type: 'subject', category: 'gene'})}
                    >Gene</QueryItemButton>
                  <QueryItemButton 
                    disabled={!subjectsActive}
                    handleClick={() => addQueryItem({name: 'Phenotype', type: 'subject', category: 'phenotype'})}
                    >Phenotype</QueryItemButton>
                  <QueryItemButton 
                    disabled={!subjectsActive}
                    handleClick={() => addQueryItem({name: 'Chemical', type: 'subject', category: 'chemical'})}
                    >Chemical</QueryItemButton>
                  <QueryItemButton 
                    disabled={!subjectsActive}
                    handleClick={() => addQueryItem({name: 'Disease', type: 'subject', category: 'disease'})}
                    >Disease</QueryItemButton>
                  <QueryItemButton 
                    disabled={!subjectsActive}
                    handleClick={() => addQueryItem({name: 'Concept', type: 'subject', category: 'concept'})}
                    >Concept</QueryItemButton>
                </div>
                <h6>Actions</h6>
                <div className="panel actions">
                  <QueryItemButton 
                  disabled={subjectsActive}
                  handleClick={() => addQueryItem({name: 'Regulates', type: 'action'})}
                  >Regulate</QueryItemButton>
                  <QueryItemButton 
                    disabled={subjectsActive}
                    handleClick={() => addQueryItem({name: 'Downregulates', type: 'action'})}
                    >Downregulate</QueryItemButton>
                  <QueryItemButton 
                    disabled={subjectsActive}
                    handleClick={() => addQueryItem({name: 'Upregulate', type: 'action'})}
                    >Upregulate</QueryItemButton>
                  <QueryItemButton 
                    disabled={subjectsActive}
                    handleClick={() => addQueryItem({name: 'Treats', type: 'action'})}
                    >Treats</QueryItemButton>
                  <QueryItemButton 
                    disabled={subjectsActive}
                    handleClick={() => addQueryItem({name: 'Associated With', type: 'action'})}
                    >Associated With</QueryItemButton>
                  <QueryItemButton 
                    disabled={subjectsActive}
                    handleClick={() => addQueryItem({name: 'Node(s)', type: 'action'})}
                    >Node(s)</QueryItemButton>
                </div>
              </div>
            }
            {isTemplate && 
              <div className="templates">
                <div className="panel subjects">
                  <QueryTemplate handleClick={() => changeQueryItems(testOne)} items={testOne}/>
                  <QueryTemplate handleClick={() => changeQueryItems(testTwo)} items={testTwo}/>
                </div>
              </div>
            }
          </div>
          <div className="how-to">
            <p className="sub-one">How To Use Translator</p>
            <ol>
              <li>Click or drag in a template or  component to begin building a query.</li>
              <li>If needed, remove component fields by hovering over them and clicking the “x.”</li>
              <li>Select a component and type in your desired target subject.</li>
              <li>Submit Query!</li>
            </ol>
          </div>
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