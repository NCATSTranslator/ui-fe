import { ReactNode, RefObject } from 'react';
import Chemical from '@/assets/icons/queries/Chemical.svg?react';
import Disease from '@/assets/icons/queries/Disease.svg?react';
import Gene from '@/assets/icons/queries/Gene.svg?react';
import Phenotype from '@/assets/icons/queries/Phenotype.svg?react';
import Protein from '@/assets/icons/queries/Gene.svg?react';
import Drug from '@/assets/icons/queries/Drug.svg?react';
import SmallMolecule from '@/assets/icons/queries/Small Molecule.svg?react';
import Taxon from '@/assets/icons/queries/Taxon.svg?react';
import PathologicalProcess from '@/assets/icons/queries/Pathological Process.svg?react';
import PhysiologicalProcess from '@/assets/icons/queries/Physiological Process.svg?react';
import BiologicalEntity from '@/assets/icons/queries/Biological Entity.svg?react';
import AnatomicalEntity from '@/assets/icons/queries/Anatomical Entity.svg?react';
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';
import { QueryType } from '@/features/Query/types/querySubmission';
import { cloneDeep } from 'lodash';
import { isResultEdge, Path, ResultSet, ResultEdge, ResultNode } from '@/features/ResultList/types/results.d';
import { Location } from 'react-router-dom';
import { getEdgeById, getEdgesByIds, getNodeById, getPathById } from '@/features/ResultList/slices/resultsSlice';
import { isNodeIndex } from '@/features/ResultList/utils/resultsInteractionFunctions';

/**
 * Retrieves an icon based on a category.
 *
 * @param {string} category - The category to retrieve an icon for.
 * @returns {ReactNode} - The icon for the category.
 */
export const getIcon = (category: string): ReactNode => {
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

/**
 * Calculates the difference in days between two dates.
 *
 * @param {Date} date2 - The second date.
 * @param {Date} date1 - The first date.
 * @returns {number} - The difference in days between the two dates.
 */
export const getDifferenceInDays = (date2: Date, date1: Date) => {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;

  // Discard the time and time-zone information.
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

  return Math.round(Math.abs((utc2 - utc1) / _MS_PER_DAY));
}

/**
 * Validates an email address.
 *
 * @param {string} email - The email address to validate.
 * @returns {RegExpMatchArray | null} - The matched email address, or null if the email is invalid.
 */
export const validateEmail = (email: string): RegExpMatchArray | null => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

/**
 * Formats a string to be displayed as a biolink entity.
 *
 * @param {string} string - The string to format.
 * @returns {string} - The formatted string.
 */
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

/**
 * Capitalizes the first letter of a string.
 *
 * @param {string} string - The string to capitalize.
 * @returns {string} - The capitalized string.
 */
export const capitalizeFirstLetter = (string: string): string => {
  if(!string)
    return '';

  let newString = string.toLowerCase();
  return newString.charAt(0).toUpperCase() + newString.slice(1);
}

/**
 * Checks if a word is a Roman numeral.
 *
 * @param {string} word - The word to check.
 * @returns {boolean} - True if the word is a Roman numeral, otherwise false.
 */
const isRomanNumeral = (word: string): boolean => {
  const romanNumeralPattern = /^(?=[MDCLXVI])M*(C[MD]|D?C{0,3})(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})$/i;
  return romanNumeralPattern.test(word);
}

/**
 * Capitalizes the first letter of a word.
 *
 * @param {string} word - The word to capitalize.
 * @returns {string} - The capitalized word.
 */
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

/**
 * Formats a string to be displayed as a biolink node.
 *
 * @param {string} string - The string to format.
 * @param {string | null} type - The type of the node.
 * @param {string | null} species - The species of the node.
 * @returns {string} - The formatted string.
 */
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

/**
 * Truncates a string if it is too long.
 *
 * @param {string} string - The string to truncate.
 * @param {number} maxLength - The maximum length of the string.
 * @returns {string} - The truncated string.
 */
export const truncateStringIfTooLong = (string: string, maxLength: number = 20): string => {
  if(string.length > maxLength)
    return string.substring(0, maxLength) + '...';
  return string;
}

/**
 * Generates a link to more information about an entity.
 *
 * @param {string} id - The ID of the entity.
 * @returns {string | null} - The URL of the entity, or null if no link is generated.
 */
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

/**
 * Generates a link to more information about an entity.
 *
 * @param {string} id - The ID of the entity.
 * @param {string} className - The class name to apply to the link.
 * @param {QueryType} queryType - The type of query to use for the link.
 * @returns {ReactNode | null} - The generated link, or null if no link is generated.
 */
export const getEntityLink = (id: string, className: string, queryType: QueryType): ReactNode | null => {
  return generateEntityLink(id, className, (org) => {
    let linkType = (queryType !== undefined && queryType.filterType) ? queryType.filterType.toLowerCase() : 'term';
    if(linkType === "smallmolecule")
      linkType = "small molecule";
    if(linkType === "diseaseorphenotypicfeature")
      linkType = (id.includes("MONDO")) ? "disease" : "phenotype";
    return `View this ${linkType} on ${org}`;
  });
}

/**
 * Generates a link to more information about an entity.
 *
 * @param {string} id - The ID of the entity.
 * @param {string} className - The class name to apply to the link.
 * @returns {ReactNode | null} - The generated link, or null if no link is generated.
 */
export const getMoreInfoLink = (id: string, className: string): ReactNode | null => {
  return generateEntityLink(id, className, () => { return ' '});
}

/**
 * Handles HTTP response errors and provides a callback function for error handling.
 *
 * @param {Response} response - The HTTP response to check.
 * @param {function} onErrorCallback - A function to call if the response is not successful.
 * @returns {Response} - The response object.
 */
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

/**
 * Generates a random integer between a minimum and maximum value, inclusive.
 *
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} - A random integer between the minimum and maximum values.
 */
export const getRandomIntInclusive = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Removes duplicate objects from an array and keeps the relative ordering based on a supplied property.
 *
 * @param {T[]} arr - The array of objects to remove duplicates from.
 * @param {keyof T} propName - The property to use for deduplication.
 * @returns {T[]} - The array of objects with duplicates removed.
 */
export const removeDuplicateObjects = <T extends Record<string, unknown>,>(arr: T[], propName: keyof T): T[] => {
  const unique: T[] = [];
  const seenValues = new Set();

  arr.forEach(item => {
    if (!seenValues.has(item[propName])) {
      unique.push(item);
      seenValues.add(item[propName]);
    }
  });

  return unique;
}

/**
 * Generates a link to an entity with an optional icon.
 *
 * @param {string} id - The ID of the entity.
 * @param {string} className - The class name to apply to the link.
 * @param {function} linkTextGenerator - A function that generates the text for the link.
 * @param {boolean} useIcon - Whether to use an icon in the link.
 * @returns {ReactNode | null} - The generated link, or null if no link is generated.
 */
export const generateEntityLink = (id: string, className: string, linkTextGenerator: (org: string | null) => string, useIcon = true): ReactNode | null => {
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

/**
 * Retrieves the last item from an array.
 *
 * @param {T[]} arr - The array to retrieve the last item from.
 * @returns {T | undefined} - The last item in the array, or undefined if the array is empty.
 */
export const getLastItemInArray = <T,>(arr: T[]): T | undefined => {
  return arr.at(-1);
}

/**
 * Retrieves a data value from the query string.
 *
 * @param {string} varID - The ID of the query variable to retrieve.
 * @returns {string | null} - The value of the query variable, or null if the variable is not found.
 */
export const getDataFromQueryVar = (varID: string) => {
  const dataValue = new URLSearchParams(window.location.search).get(varID);
  const valueToReturn = (dataValue) ? dataValue : null;
  return valueToReturn;
}

/**
 * Checks if a provided date is valid.
 *
 * @param {string | number | Date} date - The date to check.
 * @returns {boolean} - True if the date is valid, otherwise false.
 */
export const isValidDate = (date: string | number | Date): boolean => {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

/**
 * Formats a date object into a string with the date and time.
 *
 * @param {Date} date - The date object to format.
 * @returns {string | boolean} - The formatted date string, or false if the date is invalid.
 */
export const getFormattedDate = (date: Date): string | boolean => {
  if (!isValidDate(date))
    return false;

  const dateFormatOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  const timeFormatOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true, timeZoneName: 'short' };
  const formattedDate = new Intl.DateTimeFormat('en-US', dateFormatOptions).format(date);
  const formattedTime = new Intl.DateTimeFormat('en-US', timeFormatOptions).format(date);

  return `${formattedDate} (${formattedTime})`;
};

/**
 * Generates a link to the feedback form with the current page URL encoded.
 *
 * @param {boolean} openDefault - Whether to open the feedback form by default.
 * @returns {string} - The generated feedback link.
 */
export const getGeneratedSendFeedbackLink = (openDefault: boolean = true): string => {
  let link = encodeURIComponent(window.location.href);
  return `/?fm=${openDefault}&link=${link}`;
}

/**
 * Merges two arrays of objects into a single array, removing duplicates based on a provided property.
 *
 * @param {T[]} array1 - The first array of objects to merge.
 * @param {T[]} array2 - The second array of objects to merge.
 * @param {keyof T} uniqueProp - The property to use for deduplication.
 * @returns {T[]} - The merged array of objects.
 */
export const mergeObjectArrays = <T extends { [key: string]: unknown },>(array1: T[], array2: T[], uniqueProp: keyof T): T[] => {
  const mergedMap = new Map<unknown, T>();

  [...array1, ...array2].forEach(item => {
    const uniqueValue = item[uniqueProp];
    if (!mergedMap.has(uniqueValue)) {
      mergedMap.set(uniqueValue, item);
    }
  });

  return Array.from(mergedMap.values());
};

export const combineObjectArrays = <T extends Record<string, unknown>,>(arr1: T[] | undefined | null, arr2: T[] | undefined | null, duplicateRemovalProperty?: keyof T): T[] => {
  let combinedArray: T[] = [];
  if(!!arr1)
    combinedArray = combinedArray.concat(cloneDeep(arr1));

  if(!!arr2)
    combinedArray = combinedArray.concat(cloneDeep(arr2));

  if(!!duplicateRemovalProperty)
    return removeDuplicateObjects(combinedArray, duplicateRemovalProperty);

  return combinedArray;
}

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
      if(isNodeIndex(i))
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
 * Takes a ResultEdge object and returns a boolean value based on whether the edge has any support paths.
 * 
 * @param {ResultEdge | null | undefined} item - ResultEdge Object.
 * @returns {boolean} - Does the edge have support paths attached. 
 */
export const hasSupport = (item: ResultEdge | null | undefined): boolean => {
  return !!item && Array.isArray(item.support) && item.support.length > 0;
};

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
  const mergeArrays = <T,>(arr1: T[], arr2: T[]): T[] => Array.from(new Set([...arr1, ...arr2]));

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
        // handle inferred edges that have different predicates 
        if(currentEdge.support.length > 0 && baseEdge.support.length > 0)
          mergeSupport(baseEdge, currentEdge);
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
    if(isNodeIndex(i)) {
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
 * Returns a formatted name for pathfinder results based on a provided string.
 *
 * @param {string} name - The pathfinder result name to format
 * @returns {string} - The formatted result name. 
 */
export const getFormattedPathfinderName = (name: string) => {
  const formattedName = name.replace(/([A-Z])/g, '$1').trim()
  return formattedName;
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
    if(isNodeIndex(i)) {
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
 * @param {unknown} value - Arbitrary value.
 * @returns {boolean} - True if the value is a string array, otherwise false. 
 *
 */
export const isStringArray = (value: unknown): value is string[] => {
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
  metadata: edge?.metadata || {
    edge_bindings: [],
    inverted_id: null,
    is_root: false,
  },
  object: edge?.object || "",
  predicate: edge?.predicate || "",
  predicate_url: edge?.predicate_url || "",
  provenance: edge?.provenance || [],
  publications: edge?.publications || {},
  subject: edge?.subject || "",
  support: edge?.support || [],
  trials: edge?.trials || [],
});

/**
 * Returns a space-separated string of class names, filtering out any falsy values such as
 * false, null, undefined, or an empty string. Useful for conditionally applying CSS classes.
 *
 * @param {(string | false | null | undefined)[]} classes - A list of class names or falsy values.
 * @returns {string} - A single string of valid class names joined by spaces.
 */
export const joinClasses = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');



/**
 * Scrolls to a provided element reference.
 *
 * @param {RefObject<HTMLElement | null>} elementRef - The element reference to scroll to.
 */ 
export const scrollToRef = (elementRef: RefObject<HTMLElement | null>) => {
  if (elementRef.current)
    elementRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  else
    console.warn("Could not scroll to element, element ref is not set");
};