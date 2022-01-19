import React, {useState, useEffect} from "react";
import Button from "../FormFields/Button";
import {ReactComponent as Undo} from '../../Icons/Directional/Undo.svg';
import {ReactComponent as Redo} from '../../Icons/Directional/Redo.svg';
import {ReactComponent as Bookmark} from '../../Icons/Navigation/Bookmark.svg';
import {ReactComponent as History} from '../../Icons/Navigation/History.svg';
import {ReactComponent as Export} from '../../Icons/Buttons/Export.svg';
import {ReactComponent as Warning} from '../../Icons/Alerts/Warning.svg';
import {ReactComponent as Close} from '../../Icons/Buttons/Close.svg';

import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import { getHistory } from "../../data";
import { setHistory } from "../../data";


const Query = ({template, handleAdd, handleRemove}) => {


  const search = window.location.search;
  const curieOne = new URLSearchParams(search).get('curieOne');
  const subjectOne = new URLSearchParams(search).get('subjectOne');
  const predicate = new URLSearchParams(search).get('predicate');
  const curieTwo = new URLSearchParams(search).get('curieTwo');
  const subjectTwo = new URLSearchParams(search).get('subjectTwo');

  const [proMode, setProMode] = useState(false);
  const [isTemplate, setIsTemplate] = useState(template);
  const [currentSubjectOne, setCurrentSubjectOne] = useState(subjectOne);
  const [currentCurieOne, setCurrentCurieOne] = useState(curieOne);
  const [currentPredicate, setCurrentPredicate] = useState(predicate);
  const [currentSubjectTwo, setCurrentSubjectTwo] = useState(subjectTwo);
  const [currentCurieTwo, setCurrentCurieTwo] = useState(curieTwo);
  const [height, setHeight] = useState(0);
  const [queryOpen, setQueryOpen] = useState(true);
  const [isValidSubmission, setIsValidSubmission] = useState(false);
  // Remove after testing, use other state
  const [fields, setFields] = useState({}); // Initial object state established below in useEffect
  // const [fieldsNeedRefresh, setFieldsNeedRefresh] = useState(true);

  const [subjectOneError, setSubjectOneError] = useState(false);
  const subjectOneErrorText = "Please select a subject";
  const [curieOneError, setCurieOneError] = useState(false);
  const curieOneErrorText = "Please enter a valid CURIE";
  const [predicateError, setPredicateError] = useState(false);
  const predicateErrorText = "Please select a predicate";
  const [subjectTwoError, setSubjectTwoError] = useState(false);
  const subjectTwoErrorText = "Please select a subject";
  const [curieTwoError, setCurieTwoError] = useState(false);
  const curieTwoErrorText = "Please enter a valid CURIE";

  const testArray = [

  ];
  const [queryItems, setQueryItems] = useState(testArray); 

  const handleChange = (e) => {
    // console.log(e);
  }

  const handleSubmission = (e) => {
    e.preventDefault();
    console.log(e);
    validateSubmission(e);
  }

  const validateSubmission = (e) => {
    if(!fields.subjectOne) {
      setSubjectOneError(true);
    } else {
      setSubjectOneError(false);
    }

    if(!fields.predicate) {
      setPredicateError(true);
    } else {
      setPredicateError(false);
    }

    if(!fields.subjectTwo) {
      setSubjectTwoError(true);
    } else {
      setSubjectTwoError(false);
    }

    if(!fields.curieOne.includes(":")) {
      setCurieOneError(true);
    } else {
      setCurieOneError(false);
    }

    if(!fields.curieTwo.includes(":")) {
      setCurieTwoError(true);
    } else {
      setCurieTwoError(false);
    }
  }
 

  const removeQueryItem = (indexToRemove) => {
    let needsChange = false;
    let newItems = Array.from(queryItems);
    queryItems.map(({name}, index) => {
      if(index === indexToRemove) {
        newItems.splice(index, 1);
        needsChange = true;
      }
    });

    if(needsChange)
      setQueryItems(newItems);
  }

  useEffect(() => {
    let newFields = {
      subjectOne : currentSubjectOne,
      curieOne : currentCurieOne,
      predicate : currentPredicate,
      subjectTwo : currentSubjectTwo,
      curieTwo : currentCurieTwo,
    }
    setFields(newFields);
  }, [currentSubjectOne, currentCurieOne, currentPredicate, currentSubjectTwo, currentCurieTwo])

  useEffect(() => {
    // if(!queryItems)
    //   return;
    // let newHistory = getHistory();
    // newHistory.push(queryItems);
    // setHistory(newHistory);
    // console.log(getHistory());
  }, [queryItems])
  
  const handleOnDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(queryItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setQueryItems(items);
  }

  const addQueryItem = (name) => {
    const items = Array.from(queryItems);
    items.push({name});
    setQueryItems(items);
  }

  const updateQueryItems = (items) => {
    setQueryItems(items);
  }

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
          {!isTemplate && 
            <>
              <div className="subjects">
                <button onClick={() => addQueryItem('Gene')}>Gene</button>
                <button onClick={() => addQueryItem('Phenotype')}>Phenotype</button>
              </div>
              <div className="actions">
                <button onClick={() => addQueryItem('Regulates')}>Regulate</button>
                <button onClick={() => addQueryItem('Downregulates')}>Downregulate</button>
              </div>
            </>
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


export default Query;