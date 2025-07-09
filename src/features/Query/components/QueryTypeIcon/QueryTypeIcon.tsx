import { FC, ReactElement } from 'react';
import Chemical from '@/assets/icons/queries/Chemical.svg?react';
import Gene from '@/assets/icons/queries/Gene.svg?react';
import Disease from '@/assets/icons/queries/Disease.svg?react';
import Drug from '@/assets/icons/queries/Drug.svg?react';
import ChemUp from '@/assets/icons/queries/Chemical.svg?react';
import ChemDown from '@/assets/icons/queries/Chemical.svg?react';
import GeneUp from '@/assets/icons/queries/Gene.svg?react';
import GeneDown from '@/assets/icons/queries/Gene.svg?react';

interface QueryTypeIconProps {
  type: string;
}

export const QueryTypeIcon: FC<QueryTypeIconProps> = ({ type }) => {
  let icon: ReactElement | null = null;
  
  switch (type.toLowerCase()) {
    case 'disease':
      icon = <Disease />;
      break;
    case 'chemical':
      icon = <Chemical />;
      break;
    case 'gene':
      icon = <Gene />;
      break;
    case 'drug':
      icon = <Drug />;
      break;
    case 'chemup':
      icon = <ChemUp />;
      break;
    case 'chemdown':
      icon = <ChemDown />;
      break;
    case 'geneup':
      icon = <GeneUp />;
      break;
    case 'genedown':
      icon = <GeneDown />;
      break;    
    default:
      break;
  }
  
  return icon;
};

export default QueryTypeIcon; 