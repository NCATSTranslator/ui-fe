import React, {useState} from "react";
import styles from "./SendFeedbackModal.module.scss";
import Modal from "./Modal";
import Button from '../FormFields/Button';
import TextInput from "../FormFields/TextInput";
import FileInput from "../FormFields/FileInput";
import Select from "../FormFields/Select";
// import { validateEmail } from "../../Utilities/utilities";
import {ReactComponent as Warning} from '../../Icons/information.svg'

const ReportIssueModal = ({isOpen, onClose}) => {

  const [currentCategory, setCurrentCategory] = useState('');
  const [categoryError, setCategoryError] = useState(false);
  const categoryErrorText = "Please select a category";
  const [commentsError, setCommentsError] = useState(false);
  const commentsErrorText = "Please provide a comment";
  const [currentComments, setCurrentComments] = useState('');

  const [errorActive, setErrorActive] = useState(false);

  const startOpen = (isOpen === undefined) ? false : isOpen;
  var modalIsOpen = startOpen;

  const handleError = (error) => {
    switch (error) {
      case 'category':
        setCategoryError(true);
        break;
      
      case 'comments':
        setCommentsError(true);
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
    if(!currentComments) {
      handleError('comments');
      return;
    }
    /*
      Hit endpoint here, once we've received information from SRI
    */
    resetFormFields();
    onClose();
  }

  const resetFormFields = () => {
    setCurrentCategory('');
    setCurrentComments('');
  }

  return (
    <Modal 
      isOpen={modalIsOpen} 
      onClose={onClose} 
      className={styles.feedbackModal}
      containerClass={styles.feedbackContainer}
      >
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
          errorActive && commentsError &&
          <p className={styles.errorText}>
            { commentsErrorText }
          </p>
        }
        {/* <TextInput 
          label="Name" 
          size="m" 
          handleChange={(e) => {
            setCurrentName(e); 
            setErrorActive(false);
          }}
          value={currentName}
          error={nameError}
          errorText={nameErrorText}
        /> */}
        <Select 
          label="Category *" 
          name="Select One"
          size="l" 
          handleChange={(value)=>{
            setCurrentCategory(value);
            setCategoryError(false);
            setErrorActive(false);
          }}
          value={currentCategory}
          noanimate
        >
          <option value="Suggestion" key="0">Suggestion</option>
          <option value="Bug Report" key="1">Bug Report</option>
          <option value="Other Comment" key="2">Other Comment</option>
        </Select>
        <TextInput 
          label="Comments *" 
          size="l" 
          rows={5}
          handleChange={(value)=>{
            setCurrentComments(value);
            setCommentsError(false);
            setErrorActive(false);
          }}
          value={currentComments}
        />
        <FileInput
          buttonLabel="Browse Files"
          size="l"
          fileTypes=".jpg,.png,.jpeg,.gif"
        />
        <Button type="submit" size="l" disabled={errorActive}>Send</Button>
      </form>
    </Modal>
  );
}


export default ReportIssueModal;

