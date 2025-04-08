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
import { isResultEdge, Path, ResultSet, ResultEdge, Result, PathFilterState, Tags, ResultNode } from '../Types/results.d';
import { EvidenceCountsContainer, PublicationObject, PublicationsList, RawPublicationObject } from '../Types/evidence';
import { Location } from 'react-router-dom';
import { getEdgeById, getEdgesByIds, getNodeById, getPathById, getPubById } from '../Redux/resultsSlice';
import { SaveGroup } from './userApi';

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
    case 'biolink:AnatomicalEntity': case 'biolink:GrossAnatomicalStructure':
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
  } else if(formattedID.includes('UNII')) {
    url = `https://precision.fda.gov/uniisearch/srs/unii/${id.replace('UNII:', '')}`;
    org = 'UNII';
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

  return <span className={className}>{linkText}</span>;
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

/**
 * Returns a boolean based on if the provided PublicationObject or RawPublicationObject is categorized as a publication
 *
 * @param {PublicationObject | RawPublicationObject} publication - The object to check.
 * @returns {boolean} True if the object is a publication, false otherwise
 */
export const isPublication = (publication: PublicationObject | RawPublicationObject) => {
  if(isPublicationObject(publication) && (publication.type === "PMID" || publication.type === "PMC"))
    return true;
  else if(publication.id?.includes("PMID") || publication.id?.includes("PMC"))  {
    console.log(publication.id, publication.id?.includes("PMID") || publication.id?.includes("PMC"));
    return true;
  }

  return false
}

/**
 * Returns a boolean indicating whether an edge has any publications attached
 *
 * @param {ResultEdge} edge - The edge in question
 * @returns {boolean} - Returns true if the edge has any publications, otherwise false.  
 */
export const checkEdgesForPubs = (edges: ResultEdge[]): boolean => {
  for(const edge of edges) {
    if(Object.values(edge.publications).length > 0)
      return true;
  }
  return false;
}

/**
 * Returns a boolean indicating whether an edge has any clinical trials attached
 *
 * @param {ResultEdge} edge - The edge in question
 * @returns {boolean} - Returns true if the edge has any clinical trials, otherwise false. 
 */
export const checkEdgesForClinicalTrials = (edges: ResultEdge[]): boolean => {
  for(const edge of edges) {
    if(edge.trials.length > 0)
      return true;
  }
  return false;
}

/**
 * Type guard to check if an object is a PublicationDictionary.
 *
 * @param obj - The object to check.
 * @returns {boolean} True if the object is a PublicationDictionary, otherwise false.
 */
export const isPublicationDictionary = (publications: any): publications is {[key: string]: string[]} => {
  return typeof publications === 'object' && !Array.isArray(publications) && Object.values(publications).every(value => Array.isArray(value) && value.every(item => typeof item === 'string'));
}

export const checkPublicationsType = (edgeObject: ResultEdge): string => {
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
export const isPublicationObject = (obj: any): obj is PublicationObject => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.source === 'object' &&
    typeof obj.type === 'string' &&
    typeof obj.url === 'string'
  );
}

/**
 * Type guard to check if an object is an array of PublicationObjects.
 *
 * @param obj - The object to check.
 * @returns {boolean} True if the object is a PublicationsList, otherwise false.
 */
export const isPublicationObjectArray = (arr: any): arr is PublicationObject[] => {

  return Array.isArray(arr) && 
    arr.every(item => isPublicationObject(item));
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
 * Converts an integer into its corresponding Roman numeral representation.
 *
 * @param {number} num - The integer to convert (1 = I, 2 = II, ..., 1000 = M).
 * @returns {string} - The corresponding Roman numeral.
 */
export const intToNumeral = (num: number): string => {
  if (num < 1 || num > 1000) {
    console.warn("Number supplied to intToNumeral function out of range, must be between 1 & 1000. Number provided:", num);
    return "--";
  }

  const romanMap: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
  ];

  let result = "";
  for (const [value, numeral] of romanMap) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  
  return result.toLowerCase();
};

/**
 * Calculates the total number of paths for a provided array of PathObjectContainer objects.
 *
 * @param {string[]} paths - An array of paths to count.
 * @returns {number} - The total number of paths, including support paths.
 *
 */
export const getPathCount = (resultSet: ResultSet, paths: (string | Path)[]): number => {
  let count = paths.length;
  for(const p of paths) {
    const path = (typeof p === "string") ? getPathById(resultSet, p) : p;
    if(!path)
      continue;
    for(const [i, subgraphItemID] of path.subgraph.entries()) {
      if(i % 2 === 0)
        continue;
      const edge = getEdgeById(resultSet, subgraphItemID);
      if(isResultEdge(edge) && edge.support.length > 0) {
        count += getPathCount(resultSet, edge.support);
      }
    }
  }
  return count;
}

/**
 * Takes a Path object and returns a boolean value based on whether any of its edges have support paths.
 * 
 * @param {ResultSet} resultSet - ResultSet Object.
 * @param {Path} path - Path Object.
 * @returns {boolean} - Does the path have any edges with support paths attached. 
 */
export const isPathInferred = (resultSet: ResultSet, path: Path) => {
  if(!path || path == null)
    return false;

  for(const [i, itemID] of path.subgraph.entries()) {
    if(i % 2 === 0) 
      continue;

    const edge = getEdgeById(resultSet, itemID);
    if(!isResultEdge(edge))
      continue;
    
    if(hasSupport(edge))
      return true;
  }
  return false;
}

/**
 * Takes a ResultEdge object and returns a boolean value based on whether the edge has any support paths.
 * 
 * @param {ResultEdge | null | undefined} item - ResultEdge Object.
 * @returns {boolean} - Does the edge have support paths attached. 
 */
export const hasSupport = (item: ResultEdge | null | undefined): boolean => {
  return !!item && Array.isArray(item.support) && item.support.length > 0;
};

/**
 * Takes a list of paths/path IDs and compresses them if any paths have the same nodes and their edges have 
 * the same support status (provided by the extractPathSequence helper function).
 * 
 * @param {ResultSet} resultSet - ResultSet Object.
 * @param {(string|Path)[]} paths - An array of paths or path IDs
 * @returns {Path[]} - The array of compressed paths. 
 */
export const getCompressedPaths = (resultSet: ResultSet, paths: (string | Path)[]): Path[] => {
  // Helper function to extract the path sequence from a subgraph
  const extractPathSequence = (resultSet: ResultSet, subgraph: string[]): string[] => {
    return subgraph.map((item, i) => {
      if(i % 2 === 0) {
        // even indexed items are nodes
        return item;
      } else {
        const edge = getEdgeById(resultSet, item);
        // edges return 'indirect' or 'direct' based on presence of support 
        return (hasSupport(edge)) ? "indirect" : "direct";
      }
    })
  };

  const mergeTags = (tags1: Tags, tags2: Tags): Tags => {
    const mergedTags: Tags = { ...tags1 };
  
    for (const key in tags2) {
      const tag1 = tags1[key];
      const tag2 = tags2[key];
  
      // If the tag exists in both tags1 and tags2, ensure no duplicates
      if (tag1 && tag2) {
        // Check if the tag is the same by comparing name and value
        if (tag1.name === tag2.name && tag1.value === tag2.value) {
          // Use the existing tag
          mergedTags[key] = tag1;
        } else {
          // If different, prioritize tag2 or handle conflicts as needed
          mergedTags[key] = tag2;
        }
      } else {
        // Add the tag from tags2 if it doesn't exist in tags1
        mergedTags[key] = tag2;
      }
    }
  
    return mergedTags;
  };

  // Map to group paths by their node sequences
  const groupedPaths = new Map<string, Path>();

  for (const path of paths) {
    const checkedPath = (typeof path === "string") ? getPathById(resultSet, path) : path;
    if(!checkedPath)
      continue;
    // Use the path sequence as the key
    const pathSequence = extractPathSequence(resultSet, checkedPath.subgraph).join(",");
    const existingPath = groupedPaths.get(pathSequence);

    // check for existing path in groupedPaths
    if (existingPath) {
      // Create a compressedSubgraph if it doesn't exist yet
      if (!existingPath.compressedSubgraph) {
        existingPath.compressedSubgraph = existingPath.subgraph.map((id, index) => {
          // Convert edge to array
          if (index % 2 === 1) 
            return [id];
          // Keep node as is
          return id;
        }) as (string | string[])[];
      }

      // Merge subgraphs into compressedSubgraph
      for (let i = 1; i < checkedPath.subgraph.length; i += 2) {
        const edgeID = checkedPath.subgraph[i];
        const compressedEdgeArray = existingPath.compressedSubgraph[i] as string[];

        if (Array.isArray(compressedEdgeArray) && !compressedEdgeArray.includes(edgeID)) {
          // Add edge to existing array
          compressedEdgeArray.push(edgeID);
        }
      }

      // Merge tags
      existingPath.tags = mergeTags(existingPath.tags, checkedPath.tags);

      // Merge aras
      existingPath.aras = Array.from(new Set([...existingPath.aras, ...checkedPath.aras]));

      // Update compressedIDs with all IDs
      existingPath.compressedIDs = Array.from(
        new Set(
          [
            ...(existingPath.compressedIDs || []), 
            existingPath.id, 
            checkedPath.id
          ].filter((id): id is string => id !== undefined)
        )
      );

      // Merge highlighted
      if (checkedPath.highlighted) {
        existingPath.highlighted = true;
      }
    } else {
      // Add the current path to the map
      groupedPaths.set(pathSequence, {
        ...checkedPath,
        // Initially no compressed subgraph
        compressedSubgraph: null,
        // Start with the current ID
        compressedIDs: checkedPath.id ? [checkedPath.id] : [],
      });
    }
  }

  // Return the compressed paths as an array
  return Array.from(groupedPaths.values());
}

/**
 * Takes a list of paths along with a PathFilterState object and calculates and returns the total number of filtered paths.
 * 
 * @param {Path[]} paths - An array of Path objects
 * @param {PathFilterState} pathFilterState - The current Path Filter State
 * @returns {number} - The number of filtered paths.
 */
export const getFilteredPathCount = (paths: Path[], pathFilterState: PathFilterState) => {
  let count = 0;
  for(const path of paths) {
    const isPathFiltered = (path?.id) ? pathFilterState[path.id] : false;
    if(isPathFiltered) {
      count++;
    }
  }
  return count;
}

/**
 * Takes a path along with a PathFilterState object and determines if that path is filtered or not based on its compressed IDs (if any)
 * and the provided PathFilter State
 * 
 * @param {Path} paths - A Path object
 * @param {PathFilterState} pathFilterState - The current Path Filter State
 * @returns {boolean} - Is the path filtered
 */
export const getIsPathFiltered = (path: Path, pathFilterState: PathFilterState) => {
  let isPathFiltered = false;
  if(!!path?.compressedIDs && path.compressedIDs.length > 1) {
    let filteredStatus: boolean[] = [];
    for(const id of path.compressedIDs)
      filteredStatus.push(pathFilterState[id]);
    if(filteredStatus.every(status => !!status))
      isPathFiltered = true;
  } else {
    isPathFiltered = (!!pathFilterState && path?.id) ? pathFilterState[path.id] : false;
  }

  return isPathFiltered;
}

/**
 * Takes a ResultSet and an array of paths and sorts them by whether they contain any inferred edges.
 * Paths with inferred edges are sorted to the bottom of the array.
 * 
 * @param {ResultSet} resultSet - ResultSet Object.
 * @param {(Path)[]} paths - An array of paths or path IDs
 * @returns {Path[]} - The array of sorted paths. 
 */
export const sortArrayByIndirect = (resultSet: ResultSet | null, paths: Path[]) => {
  if(!resultSet)
    return paths;
  return cloneDeep(paths).sort((a, b) => {
      let inferredA = isPathInferred(resultSet, a) ? 1 : 0;
      let inferredB = isPathInferred(resultSet, b) ? 1 : 0;
      return inferredA - inferredB;
  });
}

/**
 * Takes a list of paths/path IDs along with a PathFilterState object and a set of selected paths, then compresses them. 
 * The compressed paths are sorted by the PathFilterState, then have their highlighted status set according to the active
 * selected paths. The paths are then sorted by highlighted status and returned. 
 * 
 * @param {ResultSet} resultSet - ResultSet Object.
 * @param {(string|Path)[]} paths - An array of paths or path IDs
 * @param {PathFilterState} pathFilterState - The current Path Filter State
 * @param {Set<Path> | null} selectedPaths - The currently selected paths
 * @returns {Path[]} - The array of properly formatted paths. 
 */
export const getPathsWithSelectionsSet = (resultSet: ResultSet | null, paths: (string | Path)[] | undefined, pathFilterState: PathFilterState, selectedPaths: Set<Path> | null, isTopLevel: boolean = false) => {
  if(!paths || !resultSet) 
    return [];

  let newPaths = getCompressedPaths(resultSet, paths);

  newPaths.sort((a: Path, b: Path) => {
    if(b?.id && pathFilterState[b.id] === true)
      return -1;
    else
      return 1;
  });

  if(selectedPaths!== null && selectedPaths.size > 0) {
    for(const selPath of selectedPaths) {
      for(const path of newPaths) {
        if(selPath?.id && path?.id && selPath.id === path.id)
          path.highlighted = true;
      }
    }
    newPaths.sort((a: Path, b: Path) => (b.highlighted === a.highlighted ? 0 : b.highlighted ? -1 : 1));
  } 

  if(isTopLevel)
    return sortArrayByIndirect(resultSet, newPaths);
  else
    return newPaths
}

/**
 * Generates a single compressed edge based on a provided list of edge IDs.
 * 
 * @param {ResultSet} resultSet - ResultSet Object.
 * @param {string[]} edgeIDs - An array of edge IDs.
 * @returns {ResultEdge} - A compressed edge. 
 */
export const getCompressedEdge = (resultSet: ResultSet, edgeIDs: string[]): ResultEdge => {
  const edges = edgeIDs.map(edgeID => getEdgeById(resultSet, edgeID)).filter(edge => !!edge);

  if (edges.length === 0 || !edges[0]) {
    console.warn("No valid edges found for the provided edgeIDs.", edges);
    return getDefaultEdge(undefined);
  }

  // Function to merge arrays while avoiding duplicates
  const mergeArrays = <T extends unknown>(arr1: T[], arr2: T[]): T[] => Array.from(new Set([...arr1, ...arr2]));

  const mergeSupport = (baseEdge: ResultEdge, edge: ResultEdge) => {
    if (Array.isArray(baseEdge.support) && Array.isArray(edge.support))
      baseEdge.support = mergeArrays(baseEdge.support as string[], edge.support as string[]);
  };

  const emptyCompressedEdgesArray: ResultEdge[] = [];

  // Initialize the resulting edge based on the first edge in the list
  const baseEdge: ResultEdge = { ...getDefaultEdge(edges[0]), compressed_edges: emptyCompressedEdgesArray };

  for (const edge of edges.slice(1)) {
    if (!edge) continue;
    const currentEdge = getDefaultEdge(edge);

    if (currentEdge.predicate === baseEdge.predicate) {
      // Merge properties for edges with the same predicate
      baseEdge.aras = mergeArrays(baseEdge.aras, currentEdge.aras);
      baseEdge.provenance = mergeArrays(baseEdge.provenance, currentEdge.provenance);
      mergeSupport(baseEdge, currentEdge);

      // Merge publications by combining keys
      for (const [key, value] of Object.entries(currentEdge.publications)) {
        if (!baseEdge.publications[key]) {
          baseEdge.publications = {
            ...baseEdge.publications,
            [key]: value,
          };
        } else {
          baseEdge.publications = {
            ...baseEdge.publications,
            [key]: mergeArrays(baseEdge.publications[key], value),
          };
        }
      }
    } else {
      // Handle edges with different predicates
      const compressedEdge = baseEdge.compressed_edges?.find(e => e.predicate === currentEdge.predicate);
      if (compressedEdge) {
        // Merge into existing compressed_edge with the same predicate
        compressedEdge.aras = mergeArrays(compressedEdge.aras, currentEdge.aras);
        compressedEdge.provenance = mergeArrays(compressedEdge.provenance, currentEdge.provenance);
        mergeSupport(baseEdge, currentEdge);

        // Merge publications into the compressed edge
        for (const [key, value] of Object.entries(currentEdge.publications)) {
          if (!compressedEdge.publications[key]) {
            compressedEdge.publications = {
              ...compressedEdge.publications,
              [key]: value,
            };
          } else {
            compressedEdge.publications = {
              ...compressedEdge.publications,
              [key]: mergeArrays(compressedEdge.publications[key], value),
            };
          }
        }
      } else {
        // Add as a new compressed edge
        baseEdge.compressed_edges?.push({ ...currentEdge, compressed_edges: emptyCompressedEdgesArray });
      }
    }
  }

  return baseEdge;
};

/**
 * Generates an array of compressed edges based on a provided array of edges.
 * 
 * For use primarily in the evidence modal.
 *
 * @param {ResultSet} resultSet - ResultSet Object.
 * @param {ResultEdge[]} edges - An array of edges.
 * @returns {ResultEdge[]} - An array of compressed edges. 
 */
export const getCompressedEdges = (resultSet: ResultSet, edges: ResultEdge[]): ResultEdge[] => {
  const compressedEdges: ResultEdge[] = []; 
  // sort edges by predicate alphabetically
  edges.sort((a,b)=> a.predicate.localeCompare(b.predicate));
  let edgeIDsToCompress: Set<string> = new Set<string>([]);
  for(let i = 0; i < edges.length; i++) {
    let edge = edges[i];
    let nextEdge: undefined | ResultEdge = edges[i+1];
    // compress edges if predicates match and support status is the same
    if(!!nextEdge 
      && nextEdge.predicate === edge.predicate
      && hasSupport(nextEdge) === hasSupport(edge)
    ) {
      if(!edgeIDsToCompress.has(edge.id))
        edgeIDsToCompress.add(edge.id);
      edgeIDsToCompress.add(nextEdge.id);
    } else {
      // we've reached the end of a series of matching edges and we have some matching edges to add
      if(edgeIDsToCompress.size > 0) {
        let compressedEdge = getCompressedEdge(resultSet, Array.from(edgeIDsToCompress));
        edgeIDsToCompress.clear();
        compressedEdges.push(compressedEdge);
      // if there are no edges to compress, add the current edge to the list
      } else {
        compressedEdges.push(edge);
      }
    }
  }
  return compressedEdges;
}

/**
 * Generates a compressed subgraph based on a provided subgraph.
 * 
 * For use primarily in the evidence modal.
 *
 * @param {ResultSet} resultSet - ResultSet Object.
 * @param {(string | string)[]} subgraph - The initial subgraph (an array of node/edge ids).
 * @returns {(ResultNode | ResultEdge | ResultEdge[])[]} - The compressed subgraph with nodes and edges fetched from the ResultSet. 
 */
export const getCompressedSubgraph = (resultSet: ResultSet, subgraph: (string | string[])[]): (ResultNode | ResultEdge | ResultEdge[])[] => {
  const compressedSubgraph: (ResultNode | ResultEdge | ResultEdge[])[] = [];
  for(const [i, ID] of subgraph.entries()) {
    // handle nodes
    if(i % 2 === 0) {
      if(Array.isArray(ID))
        continue;
      const node = getNodeById(resultSet, ID);
      if(!!node)
        compressedSubgraph.push(node);
    // handle edges
    } else {
      // normal edges
      if(!Array.isArray(ID)) {
        const edge = getEdgeById(resultSet, ID);
        if(!!edge)
          compressedSubgraph.push(edge);
      // compressed edges
      } else {
        const edges: ResultEdge[] = getEdgesByIds(resultSet, ID); 
        const compressedEdges = getCompressedEdges(resultSet, edges);
        // add the compressed edges to the subgraph
        compressedSubgraph.push(compressedEdges);
      }
    }
  }
  return compressedSubgraph;
}

/**
 * Returns a string label that represents the provided ResultEdge object.  
 *
 * @param {ResultSet} resultSet - ResultSet object.
 * @param {ResultEdge} edge - The edge to generate a label for.
 * @returns {string} - A label containing the subject node name, predicate, and object node name
 * separated by pipe characters. 
 */
export const getFormattedEdgeLabel = (resultSet: ResultSet, edge: ResultEdge): string => {
  const subjectNode = getNodeById(resultSet, edge.subject);
  const subjectNodeName = (!!subjectNode) ? subjectNode.names[0] : "";
  const objectNode = getNodeById(resultSet, edge.object);
  const objectNodeName = (!!objectNode) ? objectNode.names[0] : "";

  return `${capitalizeAllWords(subjectNodeName)}|${edge.predicate.toLowerCase()}|${capitalizeAllWords(objectNodeName)}`;
}

/**
 * Returns url that based on the type of the provided publication ID. 
 *
 * @param {string} publicationID - The publication id.
 * @param {string} type - The publication's type.
 * @returns {string} - The formatted url (or the provided id if the type is not recognized). 
 */
export const getUrlByType = (publicationID: string, type: string): string => {
  let url;
  switch (type) {
    case "PMID":
      url = `http://www.ncbi.nlm.nih.gov/pubmed/${publicationID.replace("PMID:", "")}`;
      break;
    case "PMC":
      url = `https://www.ncbi.nlm.nih.gov/pmc/articles/${publicationID.replace(":", "")}`;
      break;
    case "NCT":
      url = `https://clinicaltrials.gov/ct2/show/${publicationID.replace("clinicaltrials", "").replace(":", "")}`
      break;
    default:
      url = publicationID;
      break;
  }
  return url;
}

/**
 * Returns a formatted string based on the type of the provided publication ID. 
 *
 * @param {string} publicationID - The publication id.
 * @returns {string} - The formatted type string. 
 */
export const getTypeFromPub = (publicationID: string): string => {
  if(publicationID.toLowerCase().includes("pmid"))
    return "PMID";
  if(publicationID.toLowerCase().includes("pmc"))
    return "PMC";
  if(publicationID.toLowerCase().includes("clinicaltrials"))
    return "NCT";
  return "other";
}

/**
 * Returns a formatted name for a publication source based on a provided string.
 *
 * @param {string} sourceName - The publication source name to format.
 * @returns {string} - The formatted source name. 
 */
export const formatPublicationSourceName = (sourceName: string): string => {
  let newSourceName = sourceName;
  if(typeof sourceName === 'string')
  switch (sourceName.toLowerCase()) {
    case "semantic medline database":
      newSourceName = "SemMedDB"
      break;

    default:
      break;
  }
  return newSourceName;
}

/**
 * Returns a formatted name for pathfinder results based on a provided string.
 *
 * @param {string} name - The pathfinder result name to format
 * @returns {string} - The formatted result name. 
 */
export const getFormattedPathfinderName = (name: string) => {
  const formattedName = name.replace(/([A-Z])/g, ' $1').trim()
  return formattedName;
}

/**
 * Checks if the given itemID exists in the bookmarks set and returns its ID if found.
 *
 * @param {string} itemID - The ID of the item to check.
 * @param {any} bookmarksSet - The set of bookmark objects to search in.
 * @returns {string|null} Returns the ID of the matching item if found in bookmarksSet, otherwise returns null.
 */
export const checkBookmarksForItem = (itemID: string, bookmarksSet: SaveGroup): string | null => {
  if(bookmarksSet && bookmarksSet.saves.size > 0) {
    for(let save of bookmarksSet.saves) {
      if(save.object_ref === itemID) {
        let bookmarkID = (typeof save.id === "string") ? save.id : (!!save.id) ? save.id.toString() : null;
        return bookmarkID;
      }
    }
  }
  return null;
}

/**
 * Checks if the given bookmarkID exists in the bookmarks set and if it has notes attached.
 *
 * @param {string | null} itemID - The ID of the item to check.
 * @param {SaveGroup | null} bookmarkSet - The set of bookmark objects to search in.
 * @returns {boolean} Returns true if the matching item is found in bookmarksSet and has notes, otherwise returns false.
 */
export const checkBookmarkForNotes = (bookmarkID: string | null, bookmarkSet: SaveGroup | null): boolean => {
  if(bookmarkID === null)
    return false;

  const findInSet = (set: Set<any>, predicate: (obj: any)=>boolean) => {
    for (const item of set) {
      if(predicate(item)) {
        return item;
      }
    }
    return undefined;
  }

  if(!!bookmarkSet && bookmarkSet.saves.size > 0) {
    let save = findInSet(bookmarkSet.saves, save => String(save.id) === bookmarkID);
    if(!!save)
      return (save.notes.length > 0) ? true : false;
  }
  return false;
}

/**
 * Generates evidence ids for a provided edge NOT INCLUDING any attached support edges 
 *
 * @param {ResultSet} resultSet - Result Set to fetch data from.
 * @param {ResultEdge | string} edge - Edge or edge ID to generate counts for.
 * @returns {void} Adds the ids to the provided Sets
 */
export const getEvidenceFromEdge = (resultSet: ResultSet, edge: ResultEdge, allPubs: Set<string>, allCTs: Set<string>, allSources?: Set<string>, allMisc?: Set<string>) => {
  // Process publications
  for(const key in edge.publications) {
    const pubArray = edge.publications[key];
    for(const pubData of pubArray) {
      const pub = getPubById(resultSet, pubData.id);
      if(!pub) 
        continue;
      const url = pub.url;
      if(isPublication(pub)) 
        allPubs.add(url);
      else if(!!allMisc)
        allMisc.add(url);
    }
  }

  for(const trial in edge.trials) 
    allCTs.add(trial);

  // Process sources
  if(edge.provenance && !!allSources) {
    for(const source of edge.provenance)
      allSources.add(source.name);
  }
  return {
    pubs: allPubs,
    cts: allCTs,
    sources: allSources,
    misc: allMisc
  }
}

/**
 * Generates evidence ids for a provided edge and any attached support edges 
 *
 * @param {ResultSet} resultSet - Result Set to fetch data from.
 * @param {ResultEdge | string} edge - Edge or edge ID to generate counts for.
 * @returns {{pubs: string[], cts: string[], sources: string[], misc: string[]}} Returns an object with the requested evidence IDs.
 */
export const getEvidenceFromEdgeRecursive = (resultSet: ResultSet, edge: ResultEdge | string ) => {
  const allPubs = new Set<string>();
  const allCTs = new Set<string>();
  const allSources = new Set<string>();
  const allMisc = new Set<string>();

  let resultEdge = (isResultEdge(edge)) ? edge : getEdgeById(resultSet, edge);
  if(!!resultEdge) {
    getEvidenceFromEdge(resultSet, resultEdge, allPubs, allCTs, allSources, allMisc);
    if(hasSupport(resultEdge) && resultEdge.support) {
      for(const sp of resultEdge.support) {
        const supportPath = (typeof sp === "string") ? getPathById(resultSet, sp): sp;
        if(!supportPath) 
          continue;
        for(let j = 1; j < supportPath.subgraph.length; j += 2) {
          const supportEdge = getEdgeById(resultSet, supportPath.subgraph[j]);
          if(isResultEdge(supportEdge)) 
            getEvidenceFromEdge(resultSet, supportEdge, allPubs, allCTs, allSources, allMisc);
        }
      }
    }
  }

  return {
    pubs: allPubs,
    cts: allCTs,
    sources: allSources,
    misc: allMisc
  }
};

/**
 * Generates evidence counts for a provided list of paths
 *
 * @param {ResultSet} resultSet - Result Set to fetch data from.
 * @param {Path[]} paths - Array of paths to generate counts for.
 * @returns {EvidenceCountsContainer} Returns an EvidenceCountsContainer object with the requested counts.
 */
const getEvidenceCountsFromPaths = (resultSet: ResultSet, paths: Path[]): EvidenceCountsContainer => {
  let allPubs = new Set<string>();
  let allCTs = new Set<string>();
  let allSources = new Set<string>();
  let allMisc = new Set<string>();

  const processPathEdges = (path: Path) => {
    for(let i = 1; i < path.subgraph.length; i += 2) {
      let edgeEvidence = getEvidenceFromEdgeRecursive(resultSet, path.subgraph[i]);
      if(edgeEvidence.pubs.size > 0)
        allPubs = allPubs.union(edgeEvidence.pubs);
      if(edgeEvidence.cts.size > 0)
        allCTs = allCTs.union(edgeEvidence.cts);
      if(edgeEvidence.sources.size > 0)
        allSources = allSources.union(edgeEvidence.sources);
      if(edgeEvidence.misc.size > 0)
        allMisc = allMisc.union(edgeEvidence.misc);
    }
  };

  // Process all paths
  for (const path of paths) {
    processPathEdges(path);
  }

  return {
    clinicalTrialCount: allCTs.size,
    miscCount: allMisc.size,
    publicationCount: allPubs.size,
    sourceCount: allSources.size,
  };
};

/**
 * Calculates the evidence counts from all paths on a single provided result.
 *
 * @param {ResultSet | null} resultSet - ResultSet object.
 * @param {Result | undefined} resultSet - Result object.
 * @returns {EvidenceCountsContainer} - EvidenceCountsContainer object. 
 *
 */
export const getEvidenceCounts = (resultSet: ResultSet | null, result: Result | undefined): EvidenceCountsContainer => {
  if (!resultSet || !result) {
    return { publicationCount: 0, sourceCount: 0, clinicalTrialCount: 0, miscCount: 0 };
  }

  const paths: Path[] = [];
  for (const p of result.paths) {
    const path = (typeof p === "string") ? getPathById(resultSet, p) : p;
    if (path) paths.push(path);
  }

  return getEvidenceCountsFromPaths(resultSet, paths);
};

/**
 * Sums the evidence counts from a provided EvidenceCountsContainer object.
 *
 * @param {EvidenceCountsContainer} countObj - EvidenceCountsContainer object.
 * @returns {number} - Sum of all evidence counts. 
 *
 */
export const calculateTotalEvidence = (countObj: EvidenceCountsContainer): number => {
  return (
    countObj.clinicalTrialCount +
    countObj.miscCount +
    countObj.publicationCount +
    countObj.sourceCount
  );
}

/**
 * Turns a provided path into a string value.
 *
 * @param {ResultSet} resultSet - ResultSet object.
 * @param {Path} path - Path object.
 * @returns {string} - Represents a user-readable version of the path. 
 *
 */
export const getStringNameFromPath = (resultSet: ResultSet, path: Path): string => {
  let stringName = "";
  for(const [i, id] of path.subgraph.entries()) {
    if(i % 2 !== 0) {
      const node = getNodeById(resultSet, id);
      stringName += node?.names[0];
    } else {
      const edge = getEdgeById(resultSet, id);
      stringName += edge?.predicate;
    }
  }
  return stringName.trimEnd();
}

/**
 * Type guard to check if a provided value is a string array
 *
 * @param {any} value - Arbitrary value.
 * @returns {boolean} - True if the value is a string array, otherwise false. 
 *
 */
export const isStringArray = (value: any): value is string[] => {
  return Array.isArray(value) && value.every(item => typeof item === "string");
}

/**
 * Returns a result edge object with either the properties of an optionally provided result edge object, or
 * a blank result edge object. 
 *
 * @param {ResultEdge | undefined} edge - An optional edge object used to fill out the returned default edge.
 * @returns {ResultEdge} - The default result edge object. 
 *
 */
export const getDefaultEdge = (edge: ResultEdge | undefined): ResultEdge => ({
  aras: edge?.aras || [],
  id: edge?.id || "",
  is_root: edge?.is_root || false,
  compressed_edges: edge?.compressed_edges || [],
  knowledge_level: edge?.knowledge_level || "unknown",
  object: edge?.object || "",
  predicate: edge?.predicate || "",
  predicate_url: edge?.predicate_url || "",
  provenance: edge?.provenance || [],
  publications: edge?.publications || {},
  subject: edge?.subject || "",
  support: edge?.support || [],
  trials: edge?.trials || [],
});