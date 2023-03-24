// Build the correct filter based on the biolink type
export const defaultQueryFilterFactory = (type) => {
  // Ensure the autocomplete item matches the biolink type and has a label
  return (item) => {
    return item && item.type && item.type.includes(`biolink:${type}`) && item.id.label;
  };
}
