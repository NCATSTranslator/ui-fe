import React, {useState} from "react";
import styles from "./SendFeedbackModal.module.scss";
import Modal from "./Modal";
import Button from '../FormFields/Button';
import TextInput from "../FormFields/TextInput";
import FileInput from "../FormFields/FileInput";
import Select from "../FormFields/Select";
import { validateEmail } from "../../Utilities/utilities";
import {ReactComponent as Warning} from '../../Icons/information.svg'

const ReportIssueModal = ({children, isOpen, onClose}) => {

  const [currentOrganization, setCurrentOrganization] = useState('');
  const [currentName, setCurrentName] = useState('');
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
    
      default:
        break;
    }
    setErrorActive(true);
  }

  const handleSubmission = (e) => {
    e.preventDefault();
    console.log(e);
    if(!currentCategory) {
      handleError('category');
      return;
    }
    onClose();
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
          errorActive &&
          <p className={styles.errorText}>
            {categoryError && categoryErrorText}
            {commentsError && commentsErrorText}
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
            setErrorActive(false);
          }}
          value={currentCategory}
          noanimate
        >
          <option value="General" key="0">General Question or Comment</option>
          <option value="Disease Selection" key="1">Disease Selection</option>
          <option value="Results" key="2">Results</option>
          <option value="Evidence" key="3">Evidence</option>
          <option value="Search History" key="4">Search History</option>
        </Select>
        <TextInput 
          label="Comments *" 
          size="l" 
          rows={8}
          handleChange={(value)=>{
            setCurrentComments(value);
            setErrorActive(false);
          }}
          value={currentComments}
        />
        <FileInput
          buttonLabel="Browse Files"
          size="l"
        />
        <Button type="submit" size="l" disabled={errorActive}>Send</Button>
      </form>
    </Modal>
  );
}


export default ReportIssueModal;

