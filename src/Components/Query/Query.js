import React, {useState, useEffect} from "react";
import TextInput from "../FormFields/TextInput";
import Select from "../FormFields/Select";
import Toggle from "../Toggle/Toggle";
import Button from "../FormFields/Button";
import {ReactComponent as CircleAdd} from '../../Icons/Buttons/Circle Add.svg'
import {ReactComponent as CircleClose} from '../../Icons/Buttons/Circle Close.svg'
import {ReactComponent as CircleUp} from '../../Icons/Directional/Property 1=Up-1.svg'
import AnimateHeight from "react-animate-height";

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

  var queryOpenClass = (queryOpen) ? 'open' : 'closed';

  handleAdd = (handleAdd) ? handleAdd : () => {}
  handleRemove = (handleRemove) ? handleRemove : () => {}

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

  return (
    <>
      {
        !isNewQuery && 
        <div className={`${queryOpenClass} query-window`} >
          <div className="header">
            <h3 className="h5 heading">Query</h3>
            <div className="buttons">
              <button onClick={()=>{setQueryOpen(!queryOpen);}} className="open-toggle"><CircleUp/></button>
              <button onClick={handleRemove}><CircleClose/></button>
            </div>

            <span className="current-query">
              { 
                // currentSubjectOne && 
                // currentPredicate && 
                // currentSubjectTwo && 
                // `${currentSubjectOne} : ${currentPredicate} in ${currentSubjectTwo}`
              }
              </span>
          </div>
          <AnimateHeight 
            className={``}
            duration={250}
            height={height}
          >
            {!proMode &&  
              <form onSubmit={handleSubmission}>
                <Select 
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
                />
                <div className="form-footer">
                  <Button type="submit" size="m">Submit Query</Button>
                </div>
              </form>
            }
            {proMode &&  
              <>
              <h2>Pro Mode Interface TBD</h2>
              </>
            }
            
            <Toggle labelInternal={false} labelOne="Lite" labelTwo="Pro" checked onClick={()=>{setProMode(!proMode)}} />

          </AnimateHeight>
        </div>
      }
      {
        isNewQuery && 
        <div className="new query-window">
          <div className="header">
            <h5 className="heading">New Query</h5>
            <div className="buttons">
              <button onClick={()=>{handleAdd();}}><CircleAdd/></button>
            </div>
          </div>
        </div>
      }
    </>
  );
}


export default Query;