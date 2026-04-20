import { Path } from "@/features/ResultList/types/results.d";

/**
 * Hard cap on support-path recursion depth. Real support chains are shallow,
 * so this is primarily a guardrail against malformed or cyclic data causing
 * runaway recursion.
 */
export const MAX_SUPPORT_DEPTH = 20;

/**
 * Derives a stable identity key for a Path for use in visited-set tracking
 * during recursive support-path traversal.
 *
 * Prefers `path.id` when present, falling back to a serialized form of the
 * subgraph (which uniquely identifies a path within a given ResultSet) since
 * embedded support Path objects may not have an `id` set.
 */
export const getPathKey = (path: Path): string =>
  path.id ?? path.subgraph.join('|');
