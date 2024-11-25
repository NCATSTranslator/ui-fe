import Chemical from '../Icons/Queries/Chemical.svg?react';
import Disease from '../Icons/Queries/Disease.svg?react';
import Gene from '../Icons/Queries/Gene.svg?react';
import Phenotype from '../Icons/Queries/Phenotype.svg?react';
import Protein from '../Icons/Queries/Gene.svg?react';
import Drug from '../Icons/Queries/Drug.svg?react';
import SmallMolecule from '../Icons/Queries/Small Molecule.svg?react';
import Taxon from '../Icons/Queries/Taxon.svg?react';
import PathologicalProcess from '../Icons/Queries/Pathological Process.svg?react';
import PhysiologicalProcess from '../Icons/Queries/Physiological Process.svg?react';
import BiologicalEntity from '../Icons/Queries/Biological Entity.svg?react';
import AnatomicalEntity from '../Icons/Queries/Anatomical Entity.svg?react';
import ExternalLink from '../Icons/Buttons/External Link.svg?react';
import { QueryType } from '../Types/querySubmission';
import { cloneDeep } from 'lodash';
import { PreferencesContainer, PrefObject } from '../Types/global';
import { FormattedEdgeObject, FormattedNodeObject, isResultEdge, Path, ResultSet, ResultEdge, RawPathObject, RawEdge } from '../Types/results.d';
import { PublicationObject, PublicationsList } from '../Types/evidence';
import { Location } from 'react-router-dom';
import { getEdgeById, getPathById } from '../Redux/resultsSlice';

export const getIcon = (category: string): JSX.Element => {
  var icon = <Chemical/>;
  switch(category) {
    case 'biolink:Gene':
      icon = <Gene/>;
      break;
    case 'phenotype': case 'biolink:PhenotypicFeature':
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
    case 'biolink:SmallMolecule': case 'biolink:Small_Molecule': case 'biolink:MolecularEntity': case 'biolink:MolecularActivity':
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

export const getDifferenceInDays = (date2: Date, date1: Date) => {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;

  // Discard the time and time-zone information.
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

  return Math.round(Math.abs((utc2 - utc1) / _MS_PER_DAY));
}

export const validateEmail = (email: string): RegExpMatchArray | null => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

export const formatBiolinkEntity = (string: string): string => {
  if(!string)
    return "";
  // remove 'biolink:' from the type, then add spaces before each capital letter
  // then trim the leading space and replace any underlines with spaces
  return(string.replace('biolink:', '')
    .replace(/([A-Z])/g, ' $1')
    .replaceAll('_', ' ')
    .replaceAll('entity', '')
    .replaceAll('condition', '')
    .replaceAll('gene ', '').trim());
}

export const capitalizeFirstLetter = (string: string): string => {
  if(!string)
    return '';

  let newString = string.toLowerCase();
  return newString.charAt(0).toUpperCase() + newString.slice(1);
}

const isRomanNumeral = (word: string): boolean => {
  const romanNumeralPattern = /^(?=[MDCLXVI])M*(C[MD]|D?C{0,3})(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})$/i;
  return romanNumeralPattern.test(word);
}

export const capitalizeWord = (word: string): string => {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export const capitalizeAllWords = (str: string): string => {
  return str.split(' ').map(word => {
    if (isRomanNumeral(word)) {
      return word.toUpperCase();
    } else {
      return capitalizeWord(word);
    }
  }).join(' ');
}

export const formatBiolinkNode = (string: string, type: string | null = null, species: string | null): string => {
  let newString = string;
  if(type !== null) {
    const formattedType = type.replaceAll("biolink:", "").toLowerCase();
    switch (formattedType) {
      case "gene":
      case "protein":
        newString = newString.toUpperCase();
        if (species !== null) {
          newString += ` (${species})`;
        }
        break;
      default:
        newString = capitalizeAllWords(newString);
        break;
    }
  }

  return newString;
}

export const truncateStringIfTooLong = (string: string, maxLength: number = 20): string => {
  if(string.length > maxLength)
    return string.substring(0, maxLength) + '...';
  return string;
}

export const getUrlAndOrg = (id: string): (string | null)[] => {
  let url = null;
  let org = null;
  const formattedID = id.toUpperCase();
  if(formattedID.includes('CHEBI')) {
    url = `https://www.ebi.ac.uk/chebi/searchId.do?chebiId=${id}`;
    org = 'Chemical Entities of Biological Interest';
  } else if(formattedID.includes('CHEMBL')) {
    url = `https://www.ebi.ac.uk/chembl/compound_report_card/${id.replace(':', '')}/`;
    org = 'ChEMBL';
  } else if(formattedID.includes('MONDO')){
    // id = id.replace(":", "_");
    url = `https://monarchinitiative.org/${id}`;
    org = 'Monarch Initiative';
  } else if(formattedID.includes('HP')) {
    url = `https://hpo.jax.org/app/browse/term/${id}`;
    org = 'Human Phenotype Ontology';
  } else if(formattedID.includes('UMLS')) {
    url = `https://uts.nlm.nih.gov/uts/umls/concept/${id.replace('UMLS:', '')}`;
    org = 'UMLS Terminology Services';
  } else if(formattedID.includes('OMIM')) {
    url = `https://bioportal.bioontology.org/search?q=${id.replace('OMIM:', '')}`;
    org = 'BioPortal';
  } else if (formattedID.includes('SNOMED')) {
    url = `https://browser.ihtsdotools.org/?perspective=full&conceptId1=${id.replace('SNOMEDCT:', '')}`;
    org = 'the SNOMED CT Browser';
  } else if(formattedID.includes('MEDDRA')) {
    url = `https://bioportal.bioontology.org/ontologies/MEDDRA?p=classes&conceptid=${id.replace('MEDDRA:', '')}`
    org = 'BioPortal';
  } else if(formattedID.includes('KEGG')) {
    url = `https://www.kegg.jp/kegg-bin/search?q=${id.replace('KEGG.DISEASE:', '')}&display=disease&from=disease`;
    org = 'Kyoto Encyclopedia of Genes and Genomes';
  } else if(formattedID.includes('NCIT')) {
    url = `https://ncithesaurus.nci.nih.gov/ncitbrowser/ConceptReport.jsp?dictionary=NCI_Thesaurus&ns=ncit&code=${id.replace('NCIT:', '')}`;
    org = 'NCI Thesaurus';
  } else if(formattedID.includes('NCBIGENE')) {
    url = `https://www.ncbi.nlm.nih.gov/gene/${id.replace('NCBIGene:', '')}`;
    org = 'NCBI Gene';
  } else if(formattedID.includes('PUBCHEM')) {
    url = `https://pubchem.ncbi.nlm.nih.gov/compound/${id.replace('PUBCHEM.COMPOUND:', '')}`;
    org = 'PubChem';
  } else if(formattedID.includes('HMDB')) {
  url = `https://hmdb.ca/metabolites/${id.replace('HMDB:', '')}`;
  org = 'HMDB';
}

  return [url, org];
}

export const getEntityLink = (id: string, className: string, queryType: QueryType): JSX.Element | null => {
  return generateEntityLink(id, className, (org) => {
    let linkType = (queryType !== undefined && queryType.filterType) ? queryType.filterType.toLowerCase() : 'term';
    if(linkType === "smallmolecule")
      linkType = "small molecule";
    if(linkType === "diseaseorphenotypicfeature")
      linkType = (id.includes("MONDO")) ? "disease" : "phenotype";
    return `View this ${linkType} on ${org}`;
  });
}

export const getMoreInfoLink = (id: string, className: string): JSX.Element | null => {
  return generateEntityLink(id, className, (org) => { return ' '});
}

export const handleFetchErrors = (
    response: Response,
    onErrorCallback: (res: Response) => void = () => console.log('No error callback function specified.')
  ): Response => {
    if(!response.ok) {
      onErrorCallback(response);
      throw Error(response.statusText);
    }
    return response
}

export const getRandomIntInclusive = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Remove duplicate objects from an array and keep the relative ordering based on a supplied property
export const removeDuplicateObjects = (arr: any[], propName: string): any[] => {
  const unique: any[] = [];
  const seenValues = new Set();

  arr.forEach(item => {
    if (!seenValues.has(item[propName])) {
      unique.push(item);
      seenValues.add(item[propName]);
    }
  });

  return unique;
}

export const generateEntityLink = (id: string, className: string, linkTextGenerator: (org: string | null) => string, useIcon = true): JSX.Element | null => {
  const [url, org] = getUrlAndOrg(id);
  const linkText = linkTextGenerator(org);

  if(url && linkText)
    return(
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={className}
        >{linkText}{useIcon && <ExternalLink/>}
      </a>
    );

  return null;
}

export const getLastItemInArray = (arr: any[]) => {
  return arr.at(-1);
}

export const getDataFromQueryVar = (varID: string) => {
  const dataValue = new URLSearchParams(window.location.search).get(varID);
  const valueToReturn = (dataValue) ? dataValue : null;
  return valueToReturn;
}

export const isValidDate = (date: string | number | Date): boolean => {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

export const getFormattedDate = (date: Date): string | boolean => {
  if (!isValidDate(date))
    return false;

  const dateFormatOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  const timeFormatOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true, timeZoneName: 'short' };
  const formattedDate = new Intl.DateTimeFormat('en-US', dateFormatOptions).format(date);
  const formattedTime = new Intl.DateTimeFormat('en-US', timeFormatOptions).format(date);

  return `${formattedDate} (${formattedTime})`;
};

export const getGeneratedSendFeedbackLink = (openDefault: boolean = true): string => {
  let link = encodeURIComponent(window.location.href);
  return `/?fm=${openDefault}&link=${link}`;
}

export const mergeObjectArrays = <T extends { [key: string]: any }>(array1: T[], array2: T[], uniqueProp: keyof T): T[] => {
  const mergedMap = new Map<any, T>();

  [...array1, ...array2].forEach(item => {
    const uniqueValue = item[uniqueProp];
    if (!mergedMap.has(uniqueValue)) {
      mergedMap.set(uniqueValue, item);
    }
  });

  return Array.from(mergedMap.values());
};

export const combineObjectArrays = (arr1: any[] | undefined | null, arr2: any[] | undefined | null, duplicateRemovalProperty?: string): any[] => {
  let combinedArray: any[] = [];
  if(!!arr1)
    combinedArray = combinedArray.concat(cloneDeep(arr1));

  if(!!arr2)
    combinedArray = combinedArray.concat(cloneDeep(arr2));

  if(!!duplicateRemovalProperty)
    return removeDuplicateObjects(combinedArray, duplicateRemovalProperty);

  return combinedArray;
}

export const isClinicalTrial = (publication: PublicationObject) => {
  if(publication.type === "NCT")
    return true;

  return false
}
export const isPublication = (publication: PublicationObject) => {
  if(publication.type === "PMID" || publication.type === "PMC")
    return true;

  return false
}
export const isMiscPublication = (publication: PublicationObject) => {
  if(publication.type !== "PMID" && publication.type !== "PMC" && publication.type !== "NCT")
    return true;

  return false
}

export const isFormattedEdgeObject = (pathItem: any): pathItem is FormattedEdgeObject => {
  return !!pathItem && 'edges' in pathItem;
}
export const isFormattedNodeObject = (pathItem: any): pathItem is FormattedNodeObject => {
  return !!pathItem && 'type' in pathItem && 'name' in pathItem;
}

export const isPublicationObjectArray = (publications: any): publications is PublicationObject[] => {
  return Array.isArray(publications) && publications.every(pub => typeof pub === 'object' && 'type' in pub);
}

export const isPublicationDictionary = (publications: any): publications is {[key: string]: string[]} => {
  return typeof publications === 'object' && !Array.isArray(publications) && Object.values(publications).every(value => Array.isArray(value) && value.every(item => typeof item === 'string'));
}

export const checkPublicationsType = (edgeObject: FormattedEdgeObject): string => {
  if (isPublicationObjectArray(edgeObject.publications)) {
    return "PublicationObject[]";
  } else if (isPublicationDictionary(edgeObject.publications)) {
    return "{[key: string]: string[]}";
  } else {
    return "Unknown type";
  }
}

/**
 * Type guard to check if an object is a PublicationObject.
 *
 * @param obj - The object to check.
 * @returns {boolean} True if the object is a PublicationObject, otherwise false.
 */
const isPublicationObject = (obj: any): obj is PublicationObject => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.journal === 'string' &&
    typeof obj.knowledgeLevel === 'string' &&
    typeof obj.source === 'object' &&
    (typeof obj.support === 'object' || obj.support === null) &&
    typeof obj.title === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.url === 'string'
  );
}

/**
 * Type guard to check if an object is a PublicationsList.
 *
 * @param obj - The object to check.
 * @returns {boolean} True if the object is a PublicationsList, otherwise false.
 */
export const isPublicationsList = (obj: any): obj is PublicationsList => {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  return Object.values(obj).every(value =>
    Array.isArray(value) &&
    value.every(item => isPublicationObject(item))
  );
}

/**
 * Type guard to check if an object is a PrefObject.
 *
 * @param obj - The object to check.
 * @returns {boolean} True if the object is a PrefObject, otherwise false.
 */
const isPrefObject = (obj: any): obj is PrefObject => {
  const isAPrefObject =
    (
      typeof obj === 'object' &&
      obj !== null &&
      ('pref_value' in obj) &&
      (typeof obj.pref_value === 'string' || typeof obj.pref_value === 'number')
    );
  if(!isAPrefObject)
    console.warn(`The following object does not match the typing for PrefObject:`, obj);

  return isAPrefObject;
};

/**
 * Type guard to check if an object is a PreferencesContainer.
 *
 * @param obj - The object to check.
 * @returns {boolean} True if the object is a PreferencesContainer, otherwise false.
 */
export const isPreferencesContainer = (obj: any): obj is PreferencesContainer => {
  let isPrefContainer;
  if (typeof obj !== 'object' || obj === null) {
    isPrefContainer = false;
  } else {
    const requiredKeys: Array<keyof PreferencesContainer> = [
      'result_sort',
      'result_per_screen',
      'graph_visibility',
      'graph_layout',
      'path_show_count',
      'evidence_sort',
      'evidence_per_screen',
    ];

    isPrefContainer = requiredKeys.every(key => key in obj && isPrefObject(obj[key])) && Object.values(obj).every(isPrefObject);
  }
  if(!isPrefContainer)
    console.warn(`The following object does not match the typing for a PreferencesContainer:`, obj);

  return isPrefContainer;
};

/**
 * Utility function that returns a full pathname plus any search and hash params.
 *
 * @param location - The Location object to check.
 * @returns {string} String containing the full pathname.
 */
export const getFullPathname = (location: Location): string => {
  let fullPath = location.pathname;
  if(!!location.search)
    fullPath += location.search;

  if(!!location.hash)
    fullPath += location.hash;

  return fullPath;
}

/**
 * Converts a number between 0 and 19 into its English word equivalent.
 *
 * @param {number} num - The number to be converted. It must be within the range 0-19.
 * @returns {string} - The English word equivalent of the provided number.
 *
 * @throws {Error} - Throws an error if the input number is outside the range 0-19.
 *
 */
export const numberToWords = (num: number): string => {
  const words = [
      "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
      "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"
  ];

  return num >= 0 && num < 20 ? words[num] : (() => { throw new Error("Number out of supported range"); })();
}

/**
 * Converts an integer into its corresponding alphabetical character(s).
 *
 * @param {number} num - The integer to convert (1 = a, 2 = b, ..., 26 = z, 27 = aa, ...).
 * @returns {string} - The corresponding alphabetical character(s).
 *
 */
export const intToChar = (num: number): string => {
  if (num < 1 || num > 1000) {
    console.warn("Number supplied to intToChar function out of range, must be between 1 & 1000. Number provided:", num);
    return "--";
  }

  let result = '';
  while (num > 0) {
      num--;
      result = String.fromCharCode(97 + (num % 26)) + result;
      num = Math.floor(num / 26);
  }
  return result;
}

/**
 * Calculates the total number of paths for a provided array of PathObjectContainer objects.
 *
 * @param {string[]} paths - An array of paths to count.
 * @returns {number} - The total number of paths, including support paths.
 *
 */
export const getPathsCount = (resultSet: ResultSet, paths: string[]): number => {
  let count = paths.length;
  for(const pathID of paths) {
    const path = getPathById(resultSet, pathID);
    if(!path)
      continue;
    for(const subgraphItem of path.subgraph) {
      if(isResultEdge(subgraphItem) && subgraphItem.support.length > 0) {
        count += getPathsCount(resultSet, subgraphItem.support);
      }
    }
  }
  return count;
}

export const isPathInferred = (resultSet: ResultSet, path: Path) => {
  if(!path || path == null)
    return false;

  for(const [i, itemID] of path.subgraph.entries()) {
    if(i % 2 === 0) 
      continue;

    const edge = getEdgeById(resultSet, itemID);
    if(!isResultEdge(edge))
      continue;
    
    if(edge.support.length > 0)
      return true;
  }
  return false;
}

export const hasSupport = (item: ResultEdge | RawPathObject | FormattedEdgeObject | RawEdge | null): boolean => {
  return !!item && Array.isArray(item.support) && item.support.length > 0;
};

export const getPathsWithSelectionsSet = (paths: Path[] | undefined, selectedPaths: Set<Path> | null) => {
  if(!paths) 
    return [];
  
  if(selectedPaths!== null && selectedPaths.size > 0) {
    let newPaths = cloneDeep(paths);
    for(const path of newPaths) {
      for(const selPath of selectedPaths) {
        if(selPath?.id && path?.id && selPath.id === path.id)
          path.highlighted = true;
      }
    }
    return newPaths.sort((a: Path, b: Path) => (b.highlighted === a.highlighted ? 0 : b.highlighted ? -1 : 1));
  } else {
    return paths;
  }
}