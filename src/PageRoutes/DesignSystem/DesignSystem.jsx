import Button from "../../Components/Core/Button";
import Checkbox from "../../Components/Core/Checkbox";
import Radio from "../../Components/Core/Radio";
import Select from "../../Components/Core/Select";
import TextInput from "../../Components/Core/TextInput";

const DesignSystem = () => {
  return (
    <div className={`container`}>
      <Button handleClick={() => {alert('clicked!')}}>Click Me</Button>
      <Button handleClick={() => {alert('clicked!')}} isSecondary>Click Me</Button>
      <Button handleClick={() => {alert('clicked!')}} isTertiary>Click Me</Button>
      <Button handleClick={() => {alert('clicked!')}} isTertiary smallFont>Tag</Button>
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