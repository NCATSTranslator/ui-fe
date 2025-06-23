import { FC } from 'react';
import Chemical from '@/Icons/Queries/Chemical.svg?react';
import Gene from '@/Icons/Queries/Gene.svg?react';
import Disease from '@/Icons/Queries/Disease.svg?react';
import Drug from '@/Icons/Queries/Drug.svg?react';
import ChemUp from '@/Icons/Queries/Chemical.svg?react';
import ChemDown from '@/Icons/Queries/Chemical.svg?react';
import GeneUp from '@/Icons/Queries/Gene.svg?react';
import GeneDown from '@/Icons/Queries/Gene.svg?react';

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