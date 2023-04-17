import React from "react";
import Button from "../../Components/FormFields/Button";
import Checkbox from "../../Components/FormFields/Checkbox";
import Radio from "../../Components/FormFields/Radio";
import Select from "../../Components/FormFields/Select";
import TextInput from "../../Components/FormFields/TextInput";
const DesignSystem = () => {

  return (
    <div className={`container`}>
      <Button handleClick={() => {alert('clicked!')}}>Click Me</Button>
      <Checkbox handleClick={()=>alert('clicked!')} >
          checkbox
      </Checkbox>
      <Checkbox 
        handleClick={()=>alert('clicked!')} 
        checked={true}>
          starts checked
      </Checkbox>
      <Radio 
        handleClick={() => alert('radio clicked')} 
        >
        Radio Button
      </Radio>
      <Radio 
        handleClick={() => alert('radio clicked')} 
        checked={true}
        >
        Radio Button (starts clicked)
      </Radio>
      <Select 
        label="Example Label" 
        name="Example"
        size="m" 
        handleChange={(value)=>{
          alert(`new value: ${value}`);
        }}
        >
        <option value="5" key="0">5</option>
        <option value="10" key="1">10</option>
        <option value="20" key="2">20</option>
      </Select>
      <Select 
        label="Smaller one" 
        name="Example"
        size="s" 
        handleChange={(value)=>{
          alert(`new value: ${value}`);
        }}
        >
        <option value="5" key="0">5</option>
        <option value="10" key="1">10</option>
        <option value="20" key="2">20</option>
      </Select>
      <Select 
        label="Bigger one" 
        name="Example"
        size="l" 
        handleChange={(value)=>{
          alert(`new value: ${value}`);
        }}
        >
        <option value="5" key="0">5</option>
        <option value="10" key="1">10</option>
        <option value="20" key="2">20</option>
      </Select>

      <TextInput label="Example Label" placeholder="placeholder text" />
      <TextInput label="Example Label" placeholder="placeholder text" rows={5}/>
    </div>
  );
}

export default DesignSystem;