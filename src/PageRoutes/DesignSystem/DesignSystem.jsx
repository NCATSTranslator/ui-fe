import Button from "../../Components/Core/Button";
import Checkbox from "../../Components/Core/Checkbox";
import Radio from "../../Components/Core/Radio";
import Select from "../../Components/Core/Select";
import TextInput from "../../Components/Core/TextInput";
import Toggle from "../../Components/Core/Toggle";
import Icon from '../../Icons/Buttons/Edit.svg?react';

const DesignSystem = () => {
  return (
    <div className={`container design-system`}>
      <Button handleClick={() => {alert('clicked!')}}>Click Me</Button>
      <Button handleClick={() => {alert('clicked!')}} isSecondary>Click Me</Button>
      <Button handleClick={() => {alert('clicked!')}} isTertiary>Click Me</Button>
      <Button handleClick={() => {alert('clicked!')}} isTertiary smallFont>Tag</Button>
      <Button handleClick={() => {alert('clicked!')}} className="button-with-icon" ><Icon/>Button</Button>
      <Button handleClick={() => {alert('clicked!')}} className="button-with-icon" iconOnly ><Icon/></Button>
      <Toggle />
      <Toggle labelOne="Off" labelTwo="On"/>
      <div className="input-row four">
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
      </div>
      <div className="input-row">
        <Select 
          label="Example Label" 
          subtitle="Example Subtitle"
          name="Example"
          handleChange={(value)=>{
            alert(`new value: ${value}`);
          }}
          noanimate
          >
          <option value="5" key="0">5</option>
          <option value="10" key="1">10</option>
          <option value="20" key="2">20</option>
        </Select>
        <Select 
          label="Example Label" 
          name="Example"
          handleChange={(value)=>{
            alert(`new value: ${value}`);
          }}
          noanimate
          >
          <option value="5" key="0">5</option>
          <option value="10" key="1">10</option>
          <option value="20" key="2">20</option>
        </Select>
      </div>
      <div className="input-row six">
        <Select 
          label="Smaller one" 
          name="Example"
          handleChange={(value)=>{
            alert(`new value: ${value}`);
          }}
          noanimate
          >
          <option value="5" key="0">5</option>
          <option value="10" key="1">10</option>
          <option value="20" key="2">20</option>
        </Select>
        <Select 
          label="Bigger one" 
          name="Example"
          handleChange={(value)=>{
            alert(`new value: ${value}`);
          }}
          noanimate
          >
          <option value="5" key="0">5</option>
          <option value="10" key="1">10</option>
          <option value="20" key="2">20</option>
        </Select>
      </div>
      <div className="input-row four">
        <TextInput label="Example Label" placeholder="Placeholder text" />
        <TextInput label="Example Label" placeholder="Placeholder text" rows={5}/>
      </div>
    </div>
  );
}

export default DesignSystem;