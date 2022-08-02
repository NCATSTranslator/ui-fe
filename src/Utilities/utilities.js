import React from 'react';
import {ReactComponent as Chemical} from '../Icons/Queries/Chemical.svg';
import {ReactComponent as Disease} from '../Icons/disease2.svg';
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

export const capitalizeAllWords = (string) => {
  return string.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
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

export const getDifferenceInDays = (date2, date1) => {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;

  // Discard the time and time-zone information.
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

  return Math.round(Math.abs((utc2 - utc1) / _MS_PER_DAY));
}

export const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};
