import { FC } from "react";
import Tooltip from "../Tooltip/Tooltip";

interface EmphasizeWordProps {
  objectName: string | boolean;
  subjectName: string | boolean;
  text: string;
  positions: [number, number][];
}

const EmphasizeWord: FC<EmphasizeWordProps> = ({ text, positions, subjectName, objectName }) => {
  let characters = Array.from(text);
  positions.sort((a, b) => a[0] - b[0]);

  for (let i = positions.length - 1; i >= 0; i--) {
    const position = positions[i];
    if (position.length !== 2) {
      console.warn("Invalid position ignored:", position);
      continue;
    }
    const [startPos, endPos] = position;

    if (startPos < 0 || endPos >= characters.length || startPos > endPos) {
      console.warn("Invalid range ignored:", position);
      continue;
    }

    characters.splice(endPos, 0, "</strong>"); 
    characters.splice(startPos - 1, 0, `<strong data-tooltip-id="${startPos}-${endPos}" class="cursor-default">`);
  }
  const emphasizedText = characters.join('');

  return (
    <>
      {
        subjectName && positions.length > 0 && positions[0].length > 0 &&
        <Tooltip id={`${positions[0][0]}-${positions[0][1]}`}><span>Matched on: {subjectName}</span></Tooltip>
      }
      {
        objectName && positions.length > 1 && positions[1].length > 0 &&
        <Tooltip id={`${positions[1][0]}-${positions[1][1]}`}><span>Matched on: {objectName}</span></Tooltip>
      }
      <span dangerouslySetInnerHTML={{ __html: emphasizedText }} />
    </>
  );
}

export default EmphasizeWord;
