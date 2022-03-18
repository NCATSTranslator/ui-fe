import React, {useState, useEffect} from "react";
import AnimateHeight from "react-animate-height";

const Accordion = ({title, children, expanded, className}) => {

  expanded = (expanded) ? true : false;
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [height, setHeight] = useState(0);

  let expandedClass = (isExpanded) ? 'open' : 'closed';

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  }

  useEffect(() => {
    if(isExpanded === false)
      setHeight(0);
    else
      setHeight('auto');
  }, [isExpanded])

  return (
    <div className={`accordion ${expandedClass} ${className}`}>
      <button className="accordion-button" onClick={handleToggle}>
        {title}
      </button>
      <AnimateHeight className={`accordion-panel ${expandedClass}`}
          duration={250}
          height={height}
        > 
        {children}
      </AnimateHeight>
    </div>
  );

}

export default Accordion;