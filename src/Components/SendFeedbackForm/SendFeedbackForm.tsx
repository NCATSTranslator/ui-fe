import { useEffect, useState, useCallback, FormEvent } from "react";
import styles from "./SendFeedbackForm.module.scss";
import Button from '../Core/Button';
import TextInput from "../Core/TextInput";
import FileInput from "../Core/FileInput";
import Select from "../Core/Select";
import { Fade } from "react-awesome-reveal";
import { currentQueryResultsID } from "../../Redux/resultsSlice";
import { useSelector } from 'react-redux';
import { getDataFromQueryVar } from "../../Utilities/utilities";
import { CustomFile } from '../../Types/global';

const SendFeedbackForm = () => {
  const categoryErrorText = "Please select a category.";
  const [categoryError, setCategoryError] = useState<boolean>(false);
  const [currentCategory, setCurrentCategory] = useState<string>('Suggestion');

  const commentsErrorText = "Please provide a comment.";
  const [commentsError, setCommentsError] = useState<boolean>(false);
  const [currentComments, setCurrentComments] = useState<string>('');
  
  const stepsErrorText = "Please detail the steps you took to produce the error.";
  const [stepsError, setStepsError] = useState<boolean>(false);
  const [currentSteps, setCurrentSteps] = useState<string>('');

  const [currentScreenshots, setCurrentScreenshots] = useState<CustomFile[]>([]);
  const [base64Screenshots, setBase64Screenshots] = useState<string[]>([]);
  const currentARSpk = useSelector(currentQueryResultsID);
  
  const [submit, setSubmit] = useState<boolean>(false);
  const [errorActive, setErrorActive] = useState<boolean>(false);

  const [createdIssueURL, setCreatedIssueURL] = useState<string | null>(null);

  const getBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = () => {
        if (reader.result) {
          let baseString = (reader.result as string).replace(/^data:image\/(jpeg|png);base64,/, "");
          setBase64Screenshots((state) => [...state, baseString]);
          resolve(baseString);
        } else {
          reject('Failed to convert file to base64');
        }
      };
      
      reader.onerror = (error) => reject(error);
    });
  }

  const handleError = (error: 'category' | 'comments' | 'steps') => {
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
    }
    setErrorActive(true);
  }

  const handleSubmission = (e: FormEvent) => {
    e.preventDefault();
    if (!currentCategory) {
      handleError('category');
      return;
    }
    if (currentCategory === 'Bug Report' && !currentSteps) {
      handleError('steps');
      return;
    }
    if (!currentComments) {
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
    if (currentScreenshots.length) {
      setBase64Screenshots([]);
      for (const file of currentScreenshots) {
        getBase64(file.file);
      }
    }
  }, [currentScreenshots]);

  const submitForm = useCallback(() => {
    const url = encodeURI(decodeURIComponent(getDataFromQueryVar("link") as string));
    const feedbackJson = JSON.stringify({
      url,
      ars_pk: currentARSpk,
      description: currentComments,
      reproduction_steps: currentSteps,
      type: currentCategory,
      screenshots: base64Screenshots,
    });

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: feedbackJson,
    };

    fetch('https://issue-router.renci.org/create_issue', requestOptions)
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setCreatedIssueURL(data.url);
        resetFormFields();
      })
      .catch((error) => {
        console.error('Error:', error);
      });

  }, [currentARSpk, currentComments, currentSteps, base64Screenshots, currentCategory]);

  useEffect(() => {
    if (submit) {
      submitForm();
      setSubmit(false);
    }
  }, [submit, submitForm]);

  return (
    <div className={styles.sendFeedbackFormContainer}>
      {createdIssueURL ? (
        <div className={styles.issueCreatedContainer}>
          <p>Your feedback has been submitted.<br/>Please click the link below to view the status of your issue:</p>
          <Button link href={createdIssueURL} _blank rel="noopener noreferrer" className={styles.viewIssue}>View Issue</Button>
          <Button isSecondary handleClick={() => setCreatedIssueURL(null)} className={styles.newIssue}>Submit More Feedback</Button>
        </div>
      ) : (
        <Fade>
          <form onSubmit={handleSubmission} name="send feedback form">
            {errorActive && categoryError && <p className={styles.errorText}>{categoryErrorText}</p>}
            {errorActive && stepsError && <p className={styles.errorText}>{stepsErrorText}</p>}
            {errorActive && commentsError && <p className={styles.errorText}>{commentsErrorText}</p>}
            <Select
              label="Category *"
              name="Select One"
              handleChange={(value) => {
                setCurrentCategory(value.toString());
                resetErrors();
              }}
              value={currentCategory}
              noanimate
              testId="category-select"
            >
              <option value="Suggestion" key="0">Suggestion</option>
              <option value="Bug Report" key="1">Bug Report</option>
              <option value="Other Comment" key="2">Other Comment</option>
            </Select>
            {currentCategory === 'Bug Report' && (
              <TextInput
                label="Steps to Reproduce *"
                rows={3}
                maxLength={1500}
                handleChange={(value) => {
                  setCurrentSteps(value);
                  resetErrors();
                }}
                value={currentSteps}
                testId="steps"
              />
            )}
            <TextInput
              label="Comments *"
              rows={5}
              maxLength={1500}
              handleChange={(value) => {
                setCurrentComments(value);
                resetErrors();
              }}
              value={currentComments}
              testId="comments"
            />
            <FileInput
              label={<>Add Files <span className="fw-normal">- Optional</span></>}
              buttonLabel="Browse Files"
              fileTypes=".png,.jpg,.jpeg"
              handleChange={(files: CustomFile[]) => setCurrentScreenshots(Array.from(files))}
              multiple
            />
            <Button type="submit" disabled={errorActive} className={styles.submitButton}>Submit</Button>
          </form>
        </Fade>
      )}
    </div>
  );
};

export default SendFeedbackForm;
