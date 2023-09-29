
const Circle = ({color, opacity}) => {

  const classString = (color.includes('#')) ? 'override' : color;
  const opacityString = (opacity) ? opacity : "100";
  return (
    (classString === 'override') 
    ?
      <div 
        className={`circle ${classString} op-${opacityString}`} 
        style={{backgroundColor: color}} >
      </div>
    :
      <div 
        className={`circle bg-${classString} op-${opacityString}`} 
         >
      </div>
  );
}


export default Circle;