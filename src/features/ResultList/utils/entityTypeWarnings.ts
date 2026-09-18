import { isResultEdge, isResultNode } from '@/features/ResultList/types/checkers';

/**
 * The strict entity checkers walk the whole annotation tree and emit several
 * console entries for every failing property. Running them inside a render meant
 * that once an API payload drifted from these types, a single hover over one node
 * produced ~1k console writes — every path object re-renders on hover, and each
 * console write retains a live object reference. Checking each entity only once
 * keeps the diagnostic without putting it on the interaction path.
 */
const alreadyChecked = new Set<string>();

// A wholly mismatched payload would otherwise report every entity on screen at
// mount. A handful of examples is enough to identify the drift.
const MAX_REPORTED = 10;
let reportedCount = 0;

/**
 * Validates a node or edge against its front end type at most once per id,
 * warning if the payload does not match.
 *
 * @param kind - Whether the entity occupies a node or an edge slot.
 * @param id - The entity id, used to dedupe repeat checks.
 * @param entity - The entity to validate, or undefined when it is missing entirely.
 */
export const warnOnceOnEntityTypeMismatch = (
  kind: 'node' | 'edge',
  id: string,
  entity: unknown,
): void => {
  if (reportedCount >= MAX_REPORTED)
    return;

  const key = `${kind}:${id}`;
  if (alreadyChecked.has(key))
    return;
  alreadyChecked.add(key);

  if (!entity) {
    reportedCount++;
    console.warn(`Could not generate PathObject, missing ${kind} with id: ${id}`);
    return;
  }

  const isValid = (kind === 'node') ? isResultNode(entity, true) : isResultEdge(entity, true);
  if (isValid)
    return;

  reportedCount++;
  console.warn(`PathObject ${kind} "${id}" rendering with defaults after strict check failure.`);
  if (reportedCount === MAX_REPORTED)
    console.warn(`[entityTypeWarnings] Reported ${MAX_REPORTED} type mismatches; suppressing further checks.`);
};

/** Test seam: clears the dedupe cache and report budget so checks can be re-run. */
export const resetEntityTypeWarnings = (): void => {
  alreadyChecked.clear();
  reportedCount = 0;
};
