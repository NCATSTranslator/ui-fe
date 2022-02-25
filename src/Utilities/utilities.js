import {ReactComponent as Chemical} from '../Icons/Queries/Chemical.svg';
import {ReactComponent as Disease} from '../Icons/Queries/Disease.svg';
import {ReactComponent as Gene} from '../Icons/Queries/Gene.svg';
import {ReactComponent as Phenotype} from '../Icons/Queries/Phenotype.svg';
import {ReactComponent as Regulation} from '../Icons/Queries/Regulation.svg';
import {ReactComponent as Treats} from '../Icons/Queries/Treats.svg';
import {ReactComponent as Nodes} from '../Icons/Queries/Nodes.svg';
import {ReactComponent as Associated} from '../Icons/Queries/Associated With.svg';
import {ReactComponent as Concept} from '../Icons/Navigation/Question.svg';

export const getIcon = (category) => {
  var icon = <Chemical/>;
  switch(category) {
    case 'gene':
      icon = <Gene/>;
      break;
    case 'phenotype':
      icon = <Phenotype/>;
      break;
    case 'disease':
      icon = <Disease/>;
      break;
    case 'regulation':
      icon = <Regulation/>;
      break;
    case 'treats':
      icon = <Treats/>;
      break;
    case 'nodes':
      icon = <Nodes/>;
      break;
    case 'concept':
      icon = <Concept/>;
      break;
    case 'associated':
      icon = <Associated/>;
      break;
    default:
      break;
  }
  return icon;
}