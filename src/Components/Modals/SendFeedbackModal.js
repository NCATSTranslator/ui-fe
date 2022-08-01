import React, {useState} from "react";
import styles from "./DisclaimerModal.module.scss";
import Modal from "./Modal";
import Button from '../FormFields/Button';
import TextInput from "../FormFields/TextInput";
import Checkbox from "../FormFields/Checkbox";
import Select from "../FormFields/Select";

const ReportIssueModal = ({children, isOpen, onClose}) => {

  const [currentOrganization, setCurrentOrganization] = useState('');
  const [currentName, setCurrentName] = useState('');
  const [nameError, setNameError] = useState(false);
  const nameErrorText = "Please enter a name";
  const [currentIssue, setCurrentIssue] = useState('');
  const [currentSubject, setCurrentSubject] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [currentComments, setCurrentComments] = useState('');

  const startOpen = (isOpen === undefined) ? false : isOpen;
  var modalIsOpen = startOpen;

  const handleSubmission = (e) => {
    e.preventDefault();
    console.log(e);
    onClose();
  }

  return (
    <Modal isOpen={modalIsOpen} onClose={onClose} className={styles.feedbackModal}>
      <h5>Send Feedback</h5>
      <p>Enjoying Translator? Having an issue? Either way, we want to know - use this form to let us know your comments and we'll get back to you as soon as possible.</p>
      <p className="disclaimer">In the mean time, please check out our Help page for Translator tips, tricks, and tutorials.</p>
      <form onSubmit={(e)=>handleSubmission(e)}>
        <TextInput 
          label="Name" 
          size="m" 
          // handleChange={}
          error={nameError}
          errorText={nameErrorText}
          value={currentName}
        />
        <TextInput 
          label="University or Organization Affiliation" 
          size="m" 
          // handleChange={}
          value={currentOrganization}
        />
        <Select 
          label="Category" 
          size="m" 
          handleChange={(value)=>{
            setCurrentIssue(value);
            console.log(value);
          }}
          error={nameError}
          errorText={nameErrorText}
          value={currentIssue}
          noanimate
        >
          <option value="" key="0"  >Select One</option>
          <option value="General" key="1">General Question or Comment</option>
          <option value="Disease Selection" key="2">Disease Selection</option>
          <option value="Results" key="3">Results</option>
          <option value="Evidence" key="4">Evidence</option>
          <option value="Search History" key="5">Search History</option>
        </Select>
        <TextInput 
          label="Subject" 
          size="m" 
          // handleChange={}
          value={currentSubject}
        />
        <TextInput 
          label="Email Address" 
          size="l" 
          // handleChange={}
          value={currentEmail}
        />
        <Checkbox>Check this box to request a follow-up email</Checkbox> 
        <TextInput 
          label="Comments" 
          size="l" 
          rows={8}
          // handleChange={}
          value={currentComments}
        />
        <Button type="submit" size="l">Submit</Button>
      </form>
    </Modal>
  );
}


export default ReportIssueModal;

