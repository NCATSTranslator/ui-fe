
export const queryTypes = [
  {
    id: 0,
    label: 'What drugs may treat',  
    placeholder: 'Enter a Disease',
    targetType: 'drug',
    direction: null,
    filterType: 'Disease',
    pathString: 'may treat'
  },
  {
    id: 1,
    label: 'What chemical upregulates',  
    placeholder: 'Enter a Gene',
    targetType: 'chemical',
    direction: 'increased',
    filterType: 'Gene',
    pathString: 'may upregulate'
  },
  {
    id: 2,
    label: 'What chemical downregulates',  
    placeholder: 'Enter a Gene',
    targetType: 'chemical',
    direction: 'decreased',
    filterType: 'Gene',
    pathString: 'may downregulate'
  },
  {
    id: 3,
    label: 'What gene is upregulated by',  
    placeholder: 'Enter a Chemical',
    targetType: 'gene',
    direction: 'increased',
    filterType: 'ChemicalEntity',
    pathString: 'may be upregulated by'
  },
  {
    id: 4,
    label: 'What gene is downregulated by',  
    placeholder: 'Enter a Chemical',
    targetType: 'gene',
    direction: 'decreased',
    filterType: 'ChemicalEntity',
    pathString: 'may be downregulated by'
  }
]