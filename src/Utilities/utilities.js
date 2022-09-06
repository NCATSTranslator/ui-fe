import React from 'react';
import {ReactComponent as Chemical} from '../Icons/Queries/chemical.svg';
import {ReactComponent as Disease} from '../Icons/disease2.svg';
import {ReactComponent as Gene} from '../Icons/Queries/Gene.svg';
import {ReactComponent as Phenotype} from '../Icons/Queries/Phenotype.svg';
import {ReactComponent as Protein} from '../Icons/protein.svg';
import {ReactComponent as Drug} from '../Icons/drug.svg';
import {ReactComponent as SmallMolecule} from '../Icons/small-molecule.svg';
import {ReactComponent as Taxon} from '../Icons/taxon.svg';
import {ReactComponent as PathologicalProcess} from '../Icons/pathological-process.svg';
import {ReactComponent as PhysiologicalProcess} from '../Icons/physiological-process.svg';
import {ReactComponent as BiologicalEntity} from '../Icons/biological-entity.svg';
import {ReactComponent as AnatomicalEntity} from '../Icons/anatomical-entity.svg';

export const getIcon = (category) => {
  var icon = <Chemical/>;
  switch(category) {
    case 'biolink:Gene':
      icon = <Gene/>;
      break;
    case 'phenotype':
      icon = <Phenotype/>;
      break;
    case 'biolink:Protein': case 'biolink:Polypeptide':
      icon = <Protein/>;
      break;
    case 'biolink:Drug':
      icon = <Drug/>;
      break;
    case 'biolink:Disease':
      icon = <Disease/>;
      break;
    case 'biolink:SmallMolecule': case 'biolink:MolecularEntity':
      icon = <SmallMolecule/>;
      break;
    case 'biolink:OrganismTaxon':
      icon = <Taxon/>;
      break;
    case 'biolink:PathologicalProcess':
      icon = <PathologicalProcess/>;
      break;
    case 'biolink:PhysiologicalProcess': case 'biolink:BiologicalProcess': case 'biolink:BiologicalProcessOrActivity':
      icon = <PhysiologicalProcess/>;
      break;
    case 'biolink:BiologicalEntity':
      icon = <BiologicalEntity/>;
      break;
    case 'biolink:AnatomicalEntity':
      icon = <AnatomicalEntity/>;
      break;
    default:
      break;
  }
  return icon;
}
export const capitalizeFirstLetter = (string) => {
  if(!string)
    return ''; 

  let newString = string.toLowerCase();
  return newString.charAt(0).toUpperCase() + newString.slice(1);
}

export const capitalizeAllWords = (string) => {
  if(!string)
    return ''; 

  if(string.toUpperCase() === string)
    return string;

  let newString = string.toLowerCase();
  return newString.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
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

export const formatBiolinkPredicate = (string) => {
  // remove 'biolink:' from the type, then add spaces before each capital letter
  // then trim the leading space and replace any underlines with spaces
  return(string.replace('biolink:', '').replace(/([A-Z])/g, ' $1').trim()).replaceAll('_', ' ');
}