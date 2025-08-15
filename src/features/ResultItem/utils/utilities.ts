import { getEdgesByIds, getEdgeById, getPathById } from "@/features/ResultList/slices/resultsSlice";
import { Path, ResultSet, PathFilterState, isResultEdge, Tags } from "@/features/ResultList/types/results.d";
import { cloneDeep } from "lodash";
import { hasSupport } from "@/features/Common/utils/utilities";
import { isNodeIndex } from "@/features/ResultList/utils/resultsInteractionFunctions";

/**
 * Extracts ARA tag names from a ResultItem's tags object.
 *
 * @param {Tags} tags - The tags object from a ResultItem.
 * @returns {string[]} - An array of ARA names (the portion after "infores:").
 */
export const getARATagsFromResultTags = (tags: Tags): string[] => {
  const araTags: string[] = [];

  if (!tags) return araTags;

  for (const [tagKey] of Object.entries(tags)) {
    // Check if tagValue exists and has a value property

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
 * Extracts all edge IDs from a Path's subgraph.
 *
 * This function returns the edge IDs from a Path object, whether it uses
 * the compressed or standard subgraph format. Edges are assumed to reside
 * at the odd-numbered indices of the subgraph array.
 *
 * @param {Path} path - The path object from which to extract edge IDs.
 * @returns {string[]} - An array of edge ID strings.
 */
export const getEdgeIdsFromPath = (path: Path): string[] => {
  const graph = path.compressedSubgraph ?? path.subgraph;
  return graph.filter((_, i) => !isNodeIndex(i)).flat();
};

/**
 * Recursively collects all support path IDs from a list of initial paths.
 *
 * @param {Path[]} paths - The initial paths to analyze.
 * @param {ResultSet} resultSet - The result set used to resolve path and edge references.
 * @param {Set<string>} [visited=new Set()] - Used internally to track visited path IDs and avoid infinite loops.
 * @returns {string[]} - An array of all unique support path IDs reachable from the initial paths.
 */
export const getAllSupportPathIDs = (
  paths: Path[],
  resultSet: ResultSet,
  visited: Set<string> = new Set()
): string[] => {
  const supportPathIDs: Set<string> = new Set();

  const traverseSupportPaths = (edgeIds: string[]) => {
    const edges = getEdgesByIds(resultSet, edgeIds);

    for (const edge of edges) {
      if (!edge.support) continue;

      const supports = Array.isArray(edge.support)
        ? edge.support
        : [];

      for (const support of supports) {
        const pathID = typeof support === 'string'
          ? support
          : support.id;

        if (!pathID || visited.has(pathID)) continue;
        visited.add(pathID);
        supportPathIDs.add(pathID);

        const supportPath = typeof support === 'string'
          ? getPathById(resultSet, pathID)
          : support;

        if (!supportPath) continue;

        const nestedEdgeIds = getEdgeIdsFromPath(supportPath);
        traverseSupportPaths(nestedEdgeIds);
      }
    }
  };

  for (const path of paths) {
    if (!path?.id || visited.has(path.id)) continue;
    visited.add(path.id);

    const edgeIds = getEdgeIdsFromPath(path);
    traverseSupportPaths(edgeIds);
  }

  return Array.from(supportPathIDs);
};

/**
 * Returns a set of all path IDs from a list of paths, including their recursively supported paths if `full` is true and a resultSet is provided.
 *
 * @param {Path[]} paths - The initial list of paths to check.
 * @param {boolean} full - If true, includes all recursively supported paths via edges.
 * @param {ResultSet} [resultSet] - The result set used to resolve edge and path references when full is enabled.
 * @returns {Set<string>} - A set of all path IDs.
 */
export const getPathIdSet = (paths: Path[], full: boolean = false, resultSet?: ResultSet | null): Set<string> => {
  const allPathIDs = new Set<string>();
  if(full && !!resultSet) {
    const supportPathIDs = getAllSupportPathIDs(paths, resultSet);
    for (const id of supportPathIDs)
      allPathIDs.add(id);
  }
  for(const path of paths) {
    if(path.compressedIDs) {
      for(const id of path.compressedIDs) {
        allPathIDs.add(id);
      }
    } else if (path?.id) {
      allPathIDs.add(path.id);
    }
  }
  return allPathIDs;
}

/**
 * Counts how many of the provided paths are filtered, including their recursively supported paths if `full` is true.
 *
 * @param {Path[]} paths - The initial list of paths to check.
 * @param {PathFilterState} pathFilterState - A mapping of path IDs to their filtered status.
 * @param {boolean} full - If true, includes all recursively supported paths via edges.
 * @param {ResultSet} [resultSet] - The result set used to resolve edge and path references when full is enabled.
 * @returns {number} - The total count of filtered paths (initial + supported).
 */
export const getFilteredPathCount = (
  paths: Path[],
  pathFilterState: PathFilterState,
  full: boolean = false,
  resultSet?: ResultSet | null
): number => {
  const allPathIDs = getPathIdSet(paths, full, resultSet);

  let count = 0;
  for (const id of allPathIDs) {
    if (pathFilterState[id])
      count++;
  }

  return count;
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
    return newPaths;
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
      if(isNodeIndex(i)) {
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
    if(isNodeIndex(i))
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
 * Generates a unique identifier for a predicate based on the path and edge IDs.
 *
 * @param {Path} path - The path object.
 * @param {string[]} edgeIds - The edge IDs.
 * @returns {string} - The unique predicate ID.
 */
export const generatePredicateId = (path: Path, edgeIds: string[]) => {
    return `${path.id}-${edgeIds.join('-')}`;
}
