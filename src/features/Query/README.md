# Query Feature

The Query feature provides Smart Query, Pathfinder, and Lookup interfaces via `CombinedQueryInterface`.

## Home query URL parameters

Canvas and other entry points navigate to the home page with search params defined in `utils/homeQueryParams.ts`:

| Param | Name | Description |
|-------|------|-------------|
| `tab` | Query tab | `smart`, `pathfinder`, or `lookup` |
| `i` | Node ID | Entity identifier to prefill (e.g. `NCBIGene:7157`) |
| `l` | Node label | Display label for the prefilled entity |
| `nc` | Node category | Biolink category used to pick Smart Query type and Lookup defaults |

Example:

```
/?tab=lookup&i=NCBIGene:7157&l=TP53&nc=biolink:Gene
```

## Category-aware behavior

### Smart Query

- When `nc` maps to a supported category, the matching Smart Query template is selected and the node is prefilled.
- Supported categories are grouped in `utils/biolinkCategories.ts` and mapped to query types in `utils/queryTypes.ts` via `getQueryTypeForCategory`.
- When `nc` is present but unmapped (e.g. `biolink:AnatomicalEntity`), Smart Query does **not** autofill the node and shows an error toast. The user can still choose a query type manually.
- When `nc` is omitted, Smart Query falls back to the default template (`queryTypes[0]`) while still honoring `i` / `l` when provided.

### Canvas query menu

- `getQueryActionsForNodeCategory` filters available canvas actions per node.
- Smart Query is hidden for categories with no Smart Query mapping.
- The graph and object-list query buttons read availability from `CanvasNodeChromeActionsContext`.

### Lookup

- `getDefaultLookupObjectCategory` picks the object-side category from the subject's `nc` value.
- Chemical/drug subjects default to `biolink:Disease`; other subjects default to `biolink:ChemicalEntity`.
- Lookup keeps its object-category select in sync with subject URL params via `useStateSyncedTo`.

## Shared utilities

- `toPrefixedBiolinkCategory` — normalizes bare or prefixed biolink categories.
- `BIOLINK_*_CATEGORIES` — shared category group constants used by query-type mapping and lookup defaults.
- `getCanvasNodePrimaryCategory` — returns a canvas node's primary biolink type (`types[0]`).

## Tests

Unit tests live alongside utilities and hooks:

- `utils/biolinkCategories.test.ts`
- `utils/homeQueryParams.test.ts`
- `utils/queryTypes.test.ts`
- `utils/queryInitState.test.ts`
- `hooks/useStateSyncedTo.test.ts`
