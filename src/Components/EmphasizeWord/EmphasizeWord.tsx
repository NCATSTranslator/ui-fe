import { FC } from "react";
import Tooltip from "../Tooltip/Tooltip";

interface EmphasizeWordProps {
  objectName: string | boolean;
  subjectName: string | boolean;
  text: string;
  subjectPos: [number, number];
  objectPos: [number, number];
}

const EmphasizeWord: FC<EmphasizeWordProps> = ({ text, subjectPos, objectPos, subjectName, objectName }) => {
  const handleUpdateCharacters = (position: [number, number], characters: string): string => {
    if (position.length !== 2) {
      console.warn("Invalid position ignored:", position);
      return characters;
    }
    const [startPos, endPos] = position;
  
    if (startPos < 0 || endPos >= characters.length || startPos > endPos) {
      console.warn("Invalid range ignored:", position);
      return characters;
    }
  
    let newCharacters = [...characters];
  
    newCharacters.splice(endPos, 0, "</strong>"); 
    newCharacters.splice(startPos - 1, 0, `<strong data-tooltip-id="${startPos}-${endPos}" class="cursor-default">`);
    return newCharacters.join('');
  }
  
  const formatEmphasizedText = (text: string, positions: [number, number][]): string => {
    let newEmphasizedText = text;
  
    // Sort positions by start index descending
    positions.sort((a, b) => b[0] - a[0]);
    for (const position of positions) 
      newEmphasizedText = handleUpdateCharacters(position, newEmphasizedText);
  
    return newEmphasizedText;
  }
  
  let emphasizedText = formatEmphasizedText(text, [subjectPos, objectPos]);

  return (
    <>
      {
        subjectName && subjectPos.length > 0 &&
        <Tooltip id={`${subjectPos[0]}-${subjectPos[1]}`}><span>Matched on: {subjectName}</span></Tooltip>
      }
      {
        objectName && objectPos.length > 1 && 
        <Tooltip id={`${objectPos[0]}-${objectPos[1]}`}><span>Matched on: {objectName}</span></Tooltip>
      }
      <span dangerouslySetInnerHTML={{ __html: emphasizedText }} />
    </>
  );
}

export default EmphasizeWord;
