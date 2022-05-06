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
export const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export const getLastPubYear = (pubDate) => {
  let dateString = pubDate;
  let date = null;
  if(dateString !== null && dateString.includes('/')) {
    let splitDate = dateString.split('/');
    let month = splitDate[1] - 1; //Javascript months are 0-11
    date = (splitDate.length === 2) 
      ? new Date('1/' + dateString) 
      : new Date(splitDate[2], month, splitDate[0]);
  }
  
  let lastPubYear = (date !== null)
    ? date.getFullYear()
    : date;

  return lastPubYear;
}