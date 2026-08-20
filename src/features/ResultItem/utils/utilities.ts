import { getPathById } from "@/features/ResultList/slices/resultsSlice";
import { Path, ResultSet, PathFilterState, EntityTags, ResultNode, ResultEdge } from "@/features/ResultList/types/results.d";
import cloneDeep from "lodash/cloneDeep";
import { isNodeIndex } from "@/features/ResultList/utils/resultsInteractionFunctions";
import { getPathSequenceKey } from "@/features/Core/utils/resultHelpers";
import { Filter } from "@/features/ResultFiltering/types/filters";
import { FILTERING_CONSTANTS, getTagFamily } from "@/features/ResultFiltering/utils/filterFunctions";
import { Preferences } from "@/features/UserAuth/types/user";

/**
 * Extracts ARA tag names from a ResultItem's tags object.
 *
 * @param {EntityTags} tags - The tags object from a ResultItem.
 * @returns {string[]} - An array of ARA names (the portion after "infores:").
 */
export const getARATagsFromResultTags = (tags: EntityTags): string[] => {
  const araTags: string[] = [];

  if (!tags) return araTags;

  for (const [tagKey] of Object.entries(tags)) {
    // Check if this is an ARA tag by looking for the 'ara' family in the tag key
    if (tagKey.includes('/ara/')) {
      // Extract the portion after "infores:" from the tag value
      const inforesMatch = tagKey.match(/infores:(.+)/);
      if (inforesMatch && inforesMatch[1]) {
        araTags.push(inforesMatch[1]);
      }
    }
  }

  return araTags;
};

/**
 * Returns an array of edge IDs extracted from a subgraph sequence, which consists of alternating
 * node and edge IDs, always starting and ending with a node ID.
 *
 * @param {string[]} subgraph - An array representing a path subgraph with alternating node and edge IDs.
 * @returns {string[]} - An array containing only the edge IDs from the subgraph.
 */
export const extractEdgeIDsFromSubgraph = (subgraph: string[]): string[] =>
  subgraph.filter((_, i) => !isNodeIndex(i));

/**
 * Compresses paths and sorts them.
 * Paths are sorted via sortArrayByIndirect (length, filter state).
 *
 * @param {ResultSet} resultSet - ResultSet Object.
 * @param {(string|Path)[]} paths - An array of paths or path IDs
 * @param {PathFilterState} pathFilterState - The current Path Filter State
 * @returns {Path[]} - The array of properly formatted paths.
 */
export const getFormattedPaths = (resultSet: ResultSet | null, paths: (string | Path)[] | undefined, pathFilterState: PathFilterState) => {
  if(!paths || !resultSet)
    return [];

  const newPaths = getCompressedPaths(resultSet, paths);

  return sortArrayByIndirect(resultSet, newPaths, pathFilterState);
}

/**
 * Sorts paths for top-level display. Priority order:
 * 1. Shorter subgraph (fewer hops) before longer
 * 2. Non-filtered before filtered
 *
 * @param {ResultSet} resultSet - ResultSet Object.
 * @param {Path[]} paths - An array of paths.
 * @param {PathFilterState} [pathFilterState] - Optional filter state for tiebreaking.
 * @returns {Path[]} - The sorted array of paths.
 */
export const sortArrayByIndirect = (resultSet: ResultSet | null, paths: Path[], pathFilterState?: PathFilterState) => {
  if(!resultSet)
    return paths;
  return cloneDeep(paths).sort((a, b) => {
      const lengthDiff = (a.subgraph?.length ?? 0) - (b.subgraph?.length ?? 0);
      if(lengthDiff !== 0)
        return lengthDiff;
      if(pathFilterState) {
        const aFiltered = (a?.id && pathFilterState[a.id] === true) ? 1 : 0;
        const bFiltered = (b?.id && pathFilterState[b.id] === true) ? 1 : 0;
        return aFiltered - bFiltered;
      }
      return 0;
  });
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
 * Determines whether a path ID should be treated as filtered out for display,
 * accounting for compressed path groups (a compressed path is hidden only when
 * all members are filtered).
 */
export const getIsPathIdFiltered = (
  resultSet: ResultSet | null | undefined,
  pathId: string,
  paths: (string | Path)[] | undefined,
  pathFilterState: PathFilterState | undefined,
): boolean => {
  if (!pathFilterState || !pathId) return false;

  if (!resultSet || !paths?.length) {
    return pathFilterState[pathId] === true;
  }

  const compressedPaths = getCompressedPaths(resultSet, paths);
  const displayPath = compressedPaths.find(
    (path) => path.id === pathId || path.compressedIDs?.includes(pathId),
  );

  if (!displayPath) {
    return pathFilterState[pathId] === true;
  }

  return getIsPathFiltered(displayPath, pathFilterState);
};

/**
 * Takes a list of paths/path IDs and compresses them if any paths share the same node
 * sequence (provided by the getPathSequenceKey helper function).
 *
 * @param {ResultSet} resultSet - ResultSet Object.
 * @param {(string|Path)[]} paths - An array of paths or path IDs
 * @returns {Path[]} - The array of compressed paths.
 */
export const getCompressedPaths = (resultSet: ResultSet, paths: (string | Path)[]): Path[] => {
  const mergeTags = (tags1: EntityTags, tags2: EntityTags): EntityTags => {
    const mergedTags: EntityTags = { ...tags1 };

    for (const key in tags2) {
      const tag1 = tags1[key];
      const tag2 = tags2[key];

      // If the tag exists in both tags1 and tags2, ensure no duplicates
      if (tag1 && tag2) {
        if (tag1.id === tag2.id) {
          mergedTags[key] = tag1;
        } else {
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
    const pathSequence = getPathSequenceKey(resultSet, checkedPath);
    if(!pathSequence)
      continue;
    const existingPath = groupedPaths.get(pathSequence);

    // check for existing path in groupedPaths
    if (existingPath) {
      // Create a compressedSubgraph if it doesn't exist yet
      if (!existingPath.compressedSubgraph) {
        existingPath.compressedSubgraph = existingPath.subgraph.map((id, index) => {
          // Convert edge to array
          if (!isNodeIndex(index))
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
 * Generates a path data string for a path in a graph visualization.
 *
 * @param {number} index - The index of the path in the graph.
 * @param {number} svgHeight - The height of the SVG container.
 * @param {number} svgWidth - The width of the SVG container.
 * @param {number} edgeHeight - The height of each edge.
 * @param {boolean} enter - Whether the path is entering the graph.
 * @param {number} curveOffset - The offset for the curve.
 * @param {number} straightSegment - The length of the straight segment.
 * @returns {string} - The path data string.
 */
export const generatePathD = (
  index: number,
  svgHeight: number,
  svgWidth: number,
  edgeHeight: number,
  enter: boolean,
  curveOffset = 50,
  straightSegment = 10
): string => {
  const startX = 0;
  const startY = svgHeight * 0.5;
  const endX = svgWidth;
  // Center of stacked edge
  const endY = index * (edgeHeight + 8) + edgeHeight / 2;
  // Adjust straight segment positions
  const midStartX = startX + straightSegment;
  const midEndX = endX - straightSegment;
  // Control points for smooth curves
  const controlX1 = midStartX + curveOffset;
  const controlX2 = midEndX - curveOffset;

  return enter
    ? `M ${startX} ${startY}
       L ${midStartX} ${startY}
       C ${controlX1} ${startY}, ${controlX2} ${endY}, ${midEndX} ${endY}
       L ${endX} ${endY}`
    : `M ${startX} ${endY}
       L ${midStartX} ${endY}
       C ${controlX1} ${endY}, ${controlX2} ${startY}, ${midEndX} ${startY}
       L ${endX} ${startY}`;
};

/**
 * Checks if the notes on a save are empty.
 *
 * @param {string | null} notes - The notes.
 * @returns {boolean} - Whether the notes are empty.
 */
export const isNotesEmpty = (notes?: string | null) => {
  const notesObj = JSON.parse(notes || "{}");

  if(Array.isArray(notesObj?.root?.children)) {
    if(notesObj?.root?.children.length > 1)
      return false;

    for(const child of notesObj.root.children) {
      if(Array.isArray(child?.children)) {
        if(child.children.length > 1 || (child.children[0]?.text && child.children[0]?.text.length > 0))
          return false;
      }
    }
  }

  return true;
}


/**
 * Sorts tags by whether they are selected or not.
 *
 * @param {string} a - The first tag ID.
 * @param {string} b - The second tag ID.
 * @param {[{id: string;}] | Filter[]} selected - The selected tags.
 * @returns {number} - The sorted tags.
 */
export const sortTagsBySelected = (
  a: string,
  b: string,
  selected: [{id: string;}] | Filter[]
): number => {
  const aExistsInSelected = selected.some((item) => item.id === a);
  const bExistsInSelected = selected.some((item) => item.id === b);

  if (aExistsInSelected && bExistsInSelected) return 0;
  if (aExistsInSelected) return -1;
  if (bExistsInSelected) return 1;

  return 0;
};

/**
 * Handles a tag click by creating a new filter object and applying it.
 *
 * @param {string} filterID - The ID of the filter.
 * @param {Filter} filter - The filter object.
 * @param {Function} handleFilter - The function to handle the filter.
 * @returns {void}
 */
export const handleTagClick = (filterID: string, filter: Filter, handleFilter: (filter: Filter) => void) => {
  let newObj: Filter = {
    name: filter.name,
    negated: false,
    id: filterID,
    value: filter.name
  };
  handleFilter(newObj);
}

/**
 * Gets the description of a node from its annotations or descriptions.
 * Prefers descriptions from annotations over descriptions attached to the node itself.
 *
 * @param {ResultNode} node - The node object.
 * @returns {string | null} - The description of the node.
 */
export const getNodeDescription = (node: ResultNode) => {
  for(const key in node.annotations) {
    const annotation = node.annotations[key as keyof typeof node.annotations];
    const descriptions = annotation.descriptions?.value;
    if(descriptions && descriptions.length > 0)
      return descriptions[0];
  }
  if(node.descriptions && node.descriptions.length > 0)
    return node.descriptions[0];
  return null;
}

/**
 * Checks if an edge is an accepted ontology edge.
 *
 * @param {ResultEdge} edge - The edge object.
 * @returns {boolean} - Whether the edge is an accepted ontology edge.
 */
export const isAcceptedOntologyEdge = (edge: ResultEdge) => {
  if(
    edge.predicate === "subclass of" ||
    edge.predicate === "superclass of"
  )
    return true;
  return false;
}

/**
 * Gets a string of role tags from a ResultItem's tags object.
 *
 * @param {EntityTags} tags - The tags object from a ResultItem.
 * @param {Filter[]} availableFilters - The available filters.
 * @returns {string} - A string of role tags, comma separated.
 */
export const getResultRoleTagsString = (tags: EntityTags, availableFilters: { [key: string]: Filter }) => {
  return Object.keys(tags).filter((fid) => availableFilters[fid] && getTagFamily(fid) === FILTERING_CONSTANTS.FAMILIES.ROLE).map((fid) => availableFilters[fid].name).join(', ');
}

/**
 * Gets the number of paths to show per page from the user preferences.
 *
 * @param {Preferences} prefs - The user preferences.
 * @returns {number} - The number of paths to show per page.
 */
export const getPathsPerPage = (prefs: Preferences) => {
  const value = prefs?.path_show_count?.pref_value || 10;
  return typeof value === "string" ? parseInt(value) : value;
}