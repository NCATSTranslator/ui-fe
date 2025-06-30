import { FC } from 'react';
import Chemical from '@/assets/icons/Queries/Chemical.svg?react';
import Gene from '@/assets/icons/Queries/Gene.svg?react';
import Disease from '@/assets/icons/Queries/Disease.svg?react';
import Drug from '@/assets/icons/Queries/Drug.svg?react';
import ChemUp from '@/assets/icons/Queries/Chemical.svg?react';
import ChemDown from '@/assets/icons/Queries/Chemical.svg?react';
import GeneUp from '@/assets/icons/Queries/Gene.svg?react';
import GeneDown from '@/assets/icons/Queries/Gene.svg?react';

interface QueryTypeIconProps {
  type: string;
}

export const QueryTypeIcon: FC<QueryTypeIconProps> = ({ type }) => {
  let icon: React.ReactElement | null = null;
  
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