# Navigation Feature

The Navigation feature provides URL-driven routing, breadcrumb navigation, and view transition infrastructure for the results section of the application. It replaces the previous modal-based navigation pattern with a hierarchical route structure where each view (result detail, node info, evidence, path) has its own URL.

## Route Structure

The results area uses nested routes defined in `src/index.tsx`:

```
/results                        → ResultsLayout (list view)
/results/:resultId              → ResultDetailView
/results/:resultId/node/:nodeId → NodeInformationView
/results/:resultId/path/:pathId → PathRedirect → redirects to first edge
/results/:resultId/path/:pathId/evidence/:edgeId → EvidenceView (within path context)
```

Each route segment declares a `handle.breadcrumb` property (a string or React component) that the `Breadcrumbs` component uses to build the breadcrumb trail automatically via React Router's `useMatches()`.

## Directory Structure

```
Navigation/
├── components/
│   ├── BreadcrumbLabels/       # Dynamic label components for each route segment
│   │   ├── EvidenceBreadcrumbLabel.tsx
│   │   ├── NodeBreadcrumbLabel.tsx
│   │   ├── PathBreadcrumbLabel.tsx
│   │   ├── QueryBreadcrumbLabel.tsx
│   │   └── ResultBreadcrumbLabel.tsx
│   ├── BreadcrumbLink/         # Individual breadcrumb link (active vs. current)
│   ├── Breadcrumbs/            # Top-level breadcrumb bar assembled from route matches
│   ├── PathRedirect/           # Auto-redirects bare /path/:pathId to its first edge
│   ├── ViewNotFound/           # Generic "not found" fallback for missing entities
│   ├── ViewSkeleton/           # Shimmer/loading placeholder while data loads
│   └── ViewTransition/         # Fade wrapper keyed to pathname for smooth transitions
├── hooks/
│   └── useResultsNavigate.ts   # Navigate within results while preserving query params
├── types/
│   └── navigation.d.ts         # BreadcrumbHandle type definition
└── utils/
    └── navigationUtils.ts      # Route loader, path key derivation, edge resolution
```

## Key Concepts

### Breadcrumbs

The breadcrumb system works through React Router's `handle` mechanism:

1. Each route in `index.tsx` can set `handle: { breadcrumb: ... }` — either a static string (e.g. `"Query Results"`) or a React component that dynamically resolves a label.
2. `Breadcrumbs` calls `useMatches()` to collect all matched routes, filters for those with a `breadcrumb` handle, and renders them as an ordered list.
3. `BreadcrumbLink` renders each crumb — intermediate crumbs are `<Link>` elements that preserve the current search params; the final crumb is a static `<span>` with `aria-current="page"`.

The four label components pull data from the Redux store to display contextual names:

- **ResultBreadcrumbLabel** — shows the result's drug name or gene name.
- **QueryBreadcrumbLabel** — generates a descriptive query title from URL params (query type, node labels, and constraint) using `generateQueryTitle`. Supports both standard and pathfinder query types.
- **NodeBreadcrumbLabel** — shows the node's display name, falling back to a network fetch via `react-query` if the result set hasn't loaded yet.
- **PathBreadcrumbLabel** — derives a human-readable key like "Path 1" or "Path 1.a.ii" using `derivePathKey`.
- **EvidenceBreadcrumbLabel** — renders the static label "Evidence".

### useResultsNavigate

A hook that wraps React Router's `useNavigate` to automatically carry forward the current URL search params (e.g. `?q=...`) when navigating between results views. It accepts an optional `extraParams` map to merge additional params and an `options` object for `replace` behavior. Uses a ref internally to avoid unnecessary re-renders.

### PathRedirect

When a user navigates to `/results/:resultId/path/:pathId` (with no edge specified), `PathRedirect` looks up the path data, finds the first edge in its subgraph (preferring `compressedSubgraph` when available), and redirects to that edge's evidence view. While the data is loading it renders `ViewSkeleton`; if the path isn't found it renders `ViewNotFound`.

### Route Loader & Legacy URL Migration

`resultsLoader` is attached to the `/results` route and runs before the route renders. It handles two legacy URL formats where the result ID was passed as a query parameter (`?r=...`) instead of a path segment:

1. **Plain query param** — `?r=abc123` → redirects to `/results/abc123`.
2. **Base64-encoded param** — the `r` param was embedded inside a base64-encoded query segment (from old shared links). The loader decodes each segment, extracts `r`, and redirects.

### Utility Functions

- **`derivePathKey`** — walks a result's path hierarchy (including nested support chains) to produce a display key like `"2"`, `"1.a"`, or `"1.a.i"` matching the depth-based numbering convention used in the UI.
- **`resolveEdgeFromPath`** — resolves an edge ID within a path's subgraph, handling compressed edge groups by merging them via `getCompressedEdge`.

### View Helpers

- **`ViewSkeleton`** — a shimmer loading placeholder with optional status message text, used during data fetches.
- **`ViewNotFound`** — a user-friendly "not found" message with a back button, parameterized by entity type and ID.
- **`ViewTransition`** — wraps child content in a fade animation (via `react-awesome-reveal`) keyed to `location.pathname` so transitions play on route changes. Can be disabled with `effect="none"`.
