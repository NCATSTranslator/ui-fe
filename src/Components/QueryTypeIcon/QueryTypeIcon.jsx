import Chemical from '../../Icons/Queries/Chemical.svg?react';
import Gene from '../../Icons/Queries/Gene.svg?react';
import Disease from '../../Icons/disease2.svg?react';
import Drug from '../../Icons/drug.svg?react';
import ChemUp from '../../Icons/Queries/chem-up.svg?react';
import ChemDown from '../../Icons/Queries/chem-down.svg?react';
import GeneUp from '../../Icons/Queries/gene-up.svg?react';
import GeneDown from '../../Icons/Queries/gene-down.svg?react';

const QueryTypeIcon = ({type}) => {
  let icon = null;
  switch (type.toLowerCase()) {
    case 'disease':
      icon = <Disease />
      break;
    case 'chemical':
      icon = <Chemical />
      break;
    case 'gene':
      icon = <Gene />
      break;
    case 'drug':
      icon = <Drug />
      break;
    case 'chemup':
      icon = <ChemUp />
      break;
    case 'chemdown':
      icon = <ChemDown />
      break;
    case 'geneup':
      icon = <GeneUp />
      break;
    case 'genedown':
      icon = <GeneDown />
      break;    
    default:
      break;
  }
  return icon;
}

export default QueryTypeIcon;