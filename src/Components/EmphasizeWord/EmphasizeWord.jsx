
const EmphasizeWord = ({ text, positions }) => {
  // Initial split text into array of characters for easier manipulation
  let characters = Array.from(text);
  // Sort positions by start index to avoid conflicts during replacement
  positions.sort((a, b) => a[0] - b[0]);

  // Iterate over positions backwards to avoid affecting indices of unprocessed tags
  for (let i = positions.length - 1; i >= 0; i--) {
    const position = positions[i];
    // Validate position array length
    if (position.length !== 2) {
      console.warn("Invalid position ignored:", position);
      continue; 
    }
    const [startPos, endPos] = position;
    // Ensure positions are within bounds
    if (startPos < 0 || endPos >= characters.length || startPos > endPos) {
      console.warn("Invalid range ignored:", position);
      continue;
    }
    // Insert tags 
    characters.splice(endPos, 0, "</strong>");
    characters.splice(startPos - 1, 0, "<strong>");
  }
  const emphasizedText = characters.join('');

  return (
    <span dangerouslySetInnerHTML={{ __html: emphasizedText }} />
  );
}

export default EmphasizeWord;