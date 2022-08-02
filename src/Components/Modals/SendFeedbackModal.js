import React, {useState} from "react";
import styles from "./SendFeedbackModal.module.scss";
import Modal from "./Modal";
import Button from '../FormFields/Button';
import TextInput from "../FormFields/TextInput";
import Checkbox from "../FormFields/Checkbox";
import Select from "../FormFields/Select";
import { validateEmail } from "../../Utilities/utilities";
import {ReactComponent as Warning} from '../../Icons/information.svg'

const ReportIssueModal = ({children, isOpen, onClose}) => {

  const [currentOrganization, setCurrentOrganization] = useState('');
  const [currentName, setCurrentName] = useState('');
  const [nameError, setNameError] = useState(false);
  const nameErrorText = "Please enter a name";
  const [currentIssue, setCurrentIssue] = useState('');
  const [currentSubject, setCurrentSubject] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const emailErrorText = "Please enter a valid email";
  const [currentComments, setCurrentComments] = useState('');

  const [errorActive, setErrorActive] = useState(false);

  const startOpen = (isOpen === undefined) ? false : isOpen;
  var modalIsOpen = startOpen;

  const handleError = (error) => {
    switch (error) {
      case 'name':
        setNameError(true);
        break;
      case 'email':
        setEmailError(true);
        break;
    
      default:
        break;
    }
    setErrorActive(true);
  }

  const handleSubmission = (e) => {
    e.preventDefault();
    console.log(e);
    if(!currentName) {
      handleError('name');
      return;
    }
    if(!currentEmail || !validateEmail(currentEmail)) {
      handleError('email');
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
      <p>Enjoying Translator? Having an issue? Either way, we want to know - use this form to let us know your comments and we'll get back to you as soon as possible.</p>
      <p className={styles.disclaimer}><Warning/>In the mean time, please check out our Help page for Translator tips, tricks, and tutorials.</p>
      <form onSubmit={(e)=>handleSubmission(e)}>
        <TextInput 
          label="Name" 
          size="m" 
          handleChange={(e) => {
            setCurrentName(e); 
            setErrorActive(false);
          }}
          value={currentName}
          error={nameError}
          errorText={nameErrorText}
        />
        <TextInput 
          label="University or Organization Affiliation" 
          size="m" 
          handleChange={(e) => {
            setCurrentOrganization(e); 
            setErrorActive(false);
          }}
          value={currentOrganization}
        />
        <Select 
          label="Category" 
          name="Select One"
          size="m" 
          handleChange={(value)=>{
            setCurrentIssue(value);
            setErrorActive(false);
          }}
          value={currentIssue}
          noanimate
        >
          <option value="General" key="0">General Question or Comment</option>
          <option value="Disease Selection" key="1">Disease Selection</option>
          <option value="Results" key="2">Results</option>
          <option value="Evidence" key="3">Evidence</option>
          <option value="Search History" key="4">Search History</option>
        </Select>
        <TextInput 
          label="Subject" 
          size="m" 
          handleChange={(e) => {
            setCurrentSubject(e); 
            setErrorActive(false);
          }}
          value={currentSubject}
        />
        <TextInput 
          label="Email Address" 
          size="l" 
          handleChange={(value)=>{
            setCurrentEmail(value);
            setErrorActive(false);
          }}
          value={currentEmail}
          error={emailError}
          errorText={emailErrorText}
        />
        <Checkbox>Check this box to request a follow-up email</Checkbox> 
        <TextInput 
          label="Comments" 
          size="l" 
          rows={8}
          handleChange={(value)=>{
            setCurrentComments(value);
            setErrorActive(false);
          }}
          value={currentComments}
        />
        <Button type="submit" size="l" disabled={errorActive}>Send</Button>
      </form>
    </Modal>
  );
}


export default ReportIssueModal;

