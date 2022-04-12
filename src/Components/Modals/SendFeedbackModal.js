import React, {useState} from "react";
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
    <Modal isOpen={modalIsOpen} onClose={onClose}>
      <h5>Send Feedback</h5>
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
          label="University or Organization Affiliation (Optional)" 
          size="m" 
          // handleChange={}
          value={currentOrganization}
        />
        <Select 
          label="Issue Category" 
          size="m" 
          handleChange={(value)=>{
            setCurrentIssue(value);
            console.log(value);
          }}
          error={nameError}
          errorText={nameErrorText}
          value={currentIssue}
        >
          <option value="" key="0" >Select One</option>
          <option value="Bug" key="1">Bug</option>
          <option value="Suggestion" key="2">Suggestion</option>
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

