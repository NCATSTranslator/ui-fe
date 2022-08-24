import React, {useEffect, useState, useCallback} from "react";
import styles from "./SendFeedbackModal.module.scss";
import Modal from "./Modal";
import Button from '../FormFields/Button';
import TextInput from "../FormFields/TextInput";
import FileInput from "../FormFields/FileInput";
import Select from "../FormFields/Select";
import {ReactComponent as Warning} from '../../Icons/information.svg'
import { currentQueryResultsID } from "../../Redux/resultsSlice";
import { useSelector } from 'react-redux'

const ReportIssueModal = ({isOpen, onClose}) => {

  const categoryErrorText = "Please select a category.";
  const [categoryError, setCategoryError] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('');

  const commentsErrorText = "Please provide a comment.";
  const [commentsError, setCommentsError] = useState(false);
  const [currentComments, setCurrentComments] = useState('');
  
  const stepsErrorText = "Please detail the steps you took to produce the error.";
  const [stepsError, setStepsError] = useState(false);
  const [currentSteps, setCurrentSteps] = useState('');

  const [currentScreenshots, setCurrentScreenshots] = useState([]);
  const [base64Screenshots, setBase64Screenshots] = useState([]);
  const currentARSpk = useSelector(currentQueryResultsID);
  
  const [submit, setSubmit] = useState(false);
  const [errorActive, setErrorActive] = useState(false);

  const [createdIssueURL, setCreatedIssueURL] = useState(null);

  const startOpen = (isOpen === undefined) ? false : isOpen;
  var modalIsOpen = startOpen;

  const getBase64 = async (file) => {
      let baseString = "";
      let reader = new FileReader();

      // Convert the file to a base64 string
      reader.readAsDataURL(file);

      // onload add the base64 string to the array of formatted screenshots...
      reader.onload = () => {
        baseString = reader.result.replace("data:image/jpeg;base64,", "");
        setBase64Screenshots((state) => [...state, baseString]);
      };
      return baseString;
  }

  const handleError = (error) => {
    switch (error) {
      case 'category':
        setCategoryError(true);
        break;
      
      case 'comments':
        setCommentsError(true);
        break;

      case 'steps':
        setStepsError(true);
        break;
    
      default:
        break;
    }
    setErrorActive(true);
  }

  const handleSubmission = (e) => {
    e.preventDefault();
    if(!currentCategory) {
      handleError('category');
      return;
    }
    if(currentCategory === 'Bug Report' && !currentSteps) {
      handleError('steps');
      return;
    }
    if(!currentComments) {
      handleError('comments');
      return;
    }
    
    setSubmit(true);
  }

  const resetFormFields = () => {
    setCurrentCategory('');
    setCurrentComments('');
    setCurrentSteps('');
    setCurrentScreenshots([]);
    setBase64Screenshots([]);
  }

  const resetErrors = () => {
    setCategoryError(false);
    setStepsError(false);
    setCommentsError(false);
    setErrorActive(false);
  }

  useEffect(() => {
    if(currentScreenshots.length) {
      // reset array of base64 screenshots
      setBase64Screenshots([]);
      // convert each screenshot into a base64 string
      for(const file of currentScreenshots) {
        getBase64(file);
      }
    }
  }, [currentScreenshots]);

  const submitForm = useCallback(() => {
    let url = window.location.href;
    let feedbackJson = JSON.stringify({
      url: url,
      ars_pk: currentARSpk,
      description: currentComments,
      reproduction_steps: currentSteps,
      type: currentCategory,
      screenshots: base64Screenshots,
    });
    // submit to IssueRouter
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: feedbackJson
    };
    fetch('https://issue-router.renci.org/create_issue', requestOptions)
      .then(response => response.json())
      .then((data) => {
        console.log(data);
        setCreatedIssueURL(data.url);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
    resetFormFields();
  }, [currentARSpk, currentComments, currentSteps, base64Screenshots, currentCategory]);

  useEffect(() => {
    if(submit) {
      submitForm();
      setSubmit(false);
    }
  }, [submit, submitForm]);

  return (
    <Modal 
      isOpen={modalIsOpen} 
      onClose={onClose} 
      className={styles.feedbackModal}
      containerClass={styles.feedbackContainer}
      >
      {
        createdIssueURL &&
        <div className={styles.issueCreatedContainer}>
          <p>Your feedback has been submitted.<br/>Please click the link below to view the status of your issue:</p>
          <Button href={createdIssueURL} _blank rel="noopener noreferrer">View Issue</Button>
        </div>
      }
      {
        !createdIssueURL && 
        <>
          <h5>Send Feedback</h5>
          <p>Enjoying Translator? Having an issue? Either way, we want to know - use this form to let us know your comments and we'll get back to you as soon as possible. All fields marked with * are required.</p>
          <p className={styles.disclaimer}><Warning/>In the mean time, please check out our Help page for Translator tips, tricks, and tutorials.</p>
          <form onSubmit={(e)=>handleSubmission(e)}>
            {
              errorActive && categoryError &&
              <p className={styles.errorText}>
                { categoryErrorText }
              </p>
            }
            {
              errorActive && stepsError &&
              <p className={styles.errorText}>
                { stepsErrorText }
              </p>
            }
            {
              errorActive && commentsError &&
              <p className={styles.errorText}>
                { commentsErrorText }
              </p>
            }
            <Select 
              label="Category *" 
              name="Select One"
              size="l" 
              handleChange={(value)=>{
                setCurrentCategory(value);
                resetErrors();
              }}
              value={currentCategory}
              noanimate
            >
              <option value="Suggestion" key="0">Suggestion</option>
              <option value="Bug Report" key="1">Bug Report</option>
              <option value="Other Comment" key="2">Other Comment</option>
            </Select>
            {
              currentCategory === 'Bug Report' &&
              <TextInput 
              label="Steps to Reproduce *" 
              size="l" 
              rows={3}
              maxLength={200}
              handleChange={(value)=>{
                setCurrentSteps(value);
                resetErrors();
              }}
              value={currentSteps}
            />
            }
            <TextInput 
              label="Comments *" 
              size="l" 
              rows={5}
              maxLength={275}
              handleChange={(value)=>{
                setCurrentComments(value);
                resetErrors();
              }}
              value={currentComments}
            />
            <FileInput
              buttonLabel="Browse Files"
              size="l"
              fileTypes=".jpg,.jpeg"
              handleChange={(files)=>{setCurrentScreenshots(files);}}
            />
            <Button type="submit" size="l" disabled={errorActive}>Send</Button>
          </form>
        </>
      }
    </Modal>
  );
}


export default ReportIssueModal;

