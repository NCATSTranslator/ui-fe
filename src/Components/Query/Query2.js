import React, {useState, useEffect} from "react";
import TextInput from "../FormFields/TextInput";
import Select from "../FormFields/Select";
import Toggle from "../Toggle/Toggle";
import Button from "../FormFields/Button";
import AnimateHeight from "react-animate-height";
import {ReactComponent as Undo} from '../../Icons/Directional/Undo.svg';
import {ReactComponent as Redo} from '../../Icons/Directional/Redo.svg';
import {ReactComponent as Bookmark} from '../../Icons/Navigation/Bookmark.svg';
import {ReactComponent as History} from '../../Icons/Navigation/History.svg';
import {ReactComponent as Export} from '../../Icons/Buttons/Export.svg';
import {ReactComponent as Warning} from '../../Icons/Alerts/Warning.svg';
import {ReactComponent as Close} from '../../Icons/Buttons/Close.svg';

import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";


const Query = ({newQuery, handleAdd, handleRemove}) => {


  const search = window.location.search;
  const curieOne = new URLSearchParams(search).get('curieOne');
  const subjectOne = new URLSearchParams(search).get('subjectOne');
  const predicate = new URLSearchParams(search).get('predicate');
  const curieTwo = new URLSearchParams(search).get('curieTwo');
  const subjectTwo = new URLSearchParams(search).get('subjectTwo');

  const [proMode, setProMode] = useState(false);
  const [currentSubjectOne, setCurrentSubjectOne] = useState(subjectOne);
  const [currentCurieOne, setCurrentCurieOne] = useState(curieOne);
  const [currentPredicate, setCurrentPredicate] = useState(predicate);
  const [currentSubjectTwo, setCurrentSubjectTwo] = useState(subjectTwo);
  const [currentCurieTwo, setCurrentCurieTwo] = useState(curieTwo);
  const [isNewQuery, setIsNewQuery] = useState(newQuery);
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

  const removeQueryItem = (idToRemove) => {
    let needsChange = false;
    let newItems = Array.from(queryItems);
    queryItems.map(({id, name}, index) => {
      console.log(id===idToRemove);
      if(id === idToRemove) {
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
    if(!newQuery) {
      // console.log(fields);
    }
  }, [fields, newQuery])

  useEffect(() => {
    if(queryOpen === false)
      setHeight(0);
    else
      setHeight('auto');
  }, [queryOpen])

  const testArray = [
    {
      id: '1',
      name: 'What Chemical',
    },
    {
      id: '2',
      name: 'Downregulates',
    },
    {
      id: '3',
      name: 'a Gene that',
    },
    {
      id: '4',
      name: 'Upregulates',
    },
    {
      id: '5',
      name: 'RHOBTB2',
    }
  ];
  const [queryItems, setQueryItems] = useState(testArray); 
  const handleOnDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(queryItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setQueryItems(items);
  }

  return (
    <>
      <div className={`query-window two`} >
        <div className="header">
          <span className="current-query">
            { 
              // currentSubjectOne && 
              // currentPredicate && 
              // currentSubjectTwo && 
              // `${currentSubjectOne} : ${currentPredicate} in ${currentSubjectTwo}`
            }
            </span>
        </div>
        {!proMode &&  
          <form onSubmit={handleSubmission}>
            <DragDropContext onDragEnd={handleOnDragEnd}>
              <Droppable droppableId="query-item" direction="horizontal">
                {(provided) => (
                  <ul className="query-box" {...provided.droppableProps} ref={provided.innerRef}>
                    {queryItems.map(({id, name}, index) => {
                      return (
                        <Draggable key={id} draggableId={id} index={index} >
                          {(provided) => (
                            <li ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="query-item">
                              <div className="query-item-container"><p>{name}</p></div>
                              <div onClick={()=>removeQueryItem(id)} className="remove"><Close/></div>
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
            {/* <Select 
              label="Subject" 
              size="m" 
              handleChange={(value)=>{
                setCurrentSubjectOne(value);
                handleChange(value);
              }}
              error={subjectOneError}
              errorText={subjectOneErrorText}
              value={currentSubjectOne}
            >
              <option value="Chemical" key="0">Chemical</option>
              <option value="Subject2" key="1">Subject2</option>
              <option value="Subject3" key="2">Subject3</option>
            </Select>
            <TextInput 
              label="CURIE" 
              size="m" 
              placeholder="" 
              handleChange={(value)=>{
                setCurrentCurieOne(value);
                handleChange(value);
              }}
              error={curieOneError}
              errorText={curieOneErrorText}
              value={currentCurieOne}
            />
            <Select 
              label="Predicate" 
              size="l" 
              handleChange={(value)=>{
                setCurrentPredicate(value);
                handleChange(value);
              }}
              error={predicateError}
              errorText={predicateErrorText}
              value={currentPredicate}
            >
              <option value="Predicate1" key="0">Predicate1</option>
              <option value="Predicate2" key="1">Predicate2</option>
              <option value="Predicate3" key="2">Predicate3</option>
            </Select>
            <Select 
              label="Subject" 
              size="m" 
              handleChange={(value)=>{
                setCurrentSubjectTwo(value);
                handleChange(value);
              }}
              error={subjectTwoError}
              errorText={subjectTwoErrorText}
              value={currentSubjectTwo}
            >
              <option value="Gene" key="0">Gene</option>
              <option value="Protein" key="1">Protein</option>
              <option value="Subject3" key="2">Subject3</option>
            </Select>
            <TextInput 
              label="CURIE" 
              size="m" 
              placeholder="" 
              handleChange={(value)=>{
                setCurrentCurieTwo(value);
                handleChange(value);
              }}
              error={curieTwoError}
              errorText={curieTwoErrorText}
              value={currentCurieTwo}
            /> */}
            <Button type="submit" size="s">Submit Query</Button>
          </form>
        }
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