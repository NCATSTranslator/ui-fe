// Build the correct filter based on the biolink type
export const defaultQueryFilterFactory = (type) => {
  if(type === false)
    return (item) => item;
  
  // Ensure the autocomplete item matches the biolink type and has a label
  return (item) => {
    return item && item.type && item.type.includes(`biolink:${type}`) && item.id.label;
  };
}

// Build the correct filter based on the biolink type
export const drugTreatsQueryFilterFactory = (type) => {
  // Ensure the autocomplete item matches the biolink type and has a label
  return (item) => {
    return item && item?.type.includes(`biolink:${type}`) && item?.id?.identifier.includes('MONDO') && item.id.label;
  };
}