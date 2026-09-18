# Analytics

Product event tracking for the Translator UI. Events are pushed to the
`dataLayer`, and reach GA4 through whichever transport the backend config
selects.

```
component / hook  ──▶  trackEvent(name, params)  ──▶  window.dataLayer
                                                          │
                                        ┌─────────────────┴─────────────────┐
                                        │                                   │
                                  GTM container                     gtag.js bridge
                                  (if gtmID set)                    (if only gaID set)
                                        │                                   │
                                        └─────────────────┬─────────────────┘
                                                          │
                                                         GA4
```

Today all three environments supply a `gaID` and no container, so the gtag
bridge is the live path. See [Transport](#transport).

## Contents

| Path | What it is |
| --- | --- |
| `types/analytics.d.ts` | **Source of truth.** Event names, parameter shapes, dimension/metric split. |
| `utils/dataLayer.ts` | `trackEvent`, `trackPageView`, `trackEvidenceLink`, param sanitizing. |
| `utils/linkTracking.ts` | `getEvidenceLinkTrackingProps`: click and middle-click handlers for outbound evidence links. |
| `hooks/usePageViewTracking.ts` | Page view on mount and on every route change. |
| `hooks/useAnalyticsTransport.ts` | Resolves GTM vs gtag once the backend config lands. |
| `../../../scripts/generate-gtm-container.mjs` | Generates `analytics/gtm-container.json` from the taxonomy. |
| `../../../scripts/ga4-admin-setup.mjs` | Creates GA4 custom dimensions, metrics, and key events. |

## Adding an event

1. Declare it in `types/analytics.d.ts` (`AnalyticsEventMap`, plus any new
   parameter in `AnalyticsDimension` for strings or `AnalyticsMetric` for numbers).
2. Call `trackEvent('your_event', { ... })` at the call site, or
   `trackEvent('your_event')` for an event with no parameters. Wrong parameter
   names are a compile error, not a silently missing dimension in GA4.
3. `npm run analytics:gtm`, then re-import the container in GTM.
4. `npm run analytics:ga4` to register any new parameter.

GA4 has no way to pre-register a custom event name — it appears once the first
hit arrives, and can take up to 24 hours to show in reports.

---

## Tracked events

Every event below is fired from the file listed (paths relative to
`src/features`). `spa_page_view` is transport plumbing; GTM converts it into a
GA4 `page_view`.

### Page views

| Event | Parameters | Fires when | Source |
| --- | --- | --- | --- |
| `spa_page_view` | `page_path`, `page_title`, `page_location` | Mount and every React Router navigation | `Analytics/hooks/usePageViewTracking.ts` |

### Query & results

| Event | Parameters | Fires when | Source |
| --- | --- | --- | --- |
| `query_submitted` | `query_type`, `query_template_id`, `query_template_label`, `subject_category`, `object_category`, `constraint_category`, `project_attached` | A single, pathfinder, or lookup query is accepted by the backend (pk returned with status `complete`) | `Query/hooks/customQueryHooks.ts` |
| `query_submission_failed` | `query_type`, `error_message` | Submission throws | `Query/hooks/customQueryHooks.ts` |
| `example_query_selected` | `query_template_id`, `query_template_label` | An example query chip is clicked | `Query/components/ExampleQueryList/ExampleQueryList.tsx` |
| `results_loaded` | `query_type`, `query_status`, `result_count`, `load_ms` | First settled result set for a query. Once per query ID | `ResultList/hooks/useResultsData.ts` |
| `results_sorted` | `sort_field`, `sort_direction` | A column header is clicked | `ResultList/components/ResultListTableHead/ResultListTableHead.tsx` |
| `results_paginated` | `page_number`, `items_per_page` | User changes page. Resets and shared-result page jumps excluded | `ResultList/hooks/useResultPagination.ts` |
| `result_opened` | `result_curie`, `result_rank`, `path_count` | A result row is opened | `ResultItem/components/ResultItem/ResultItem.tsx` |
| `result_bookmarked` | `result_curie` | Bookmark save succeeds | `ResultItem/hooks/useBookmarkItem.ts` |
| `result_unbookmarked` | `result_curie` | Bookmark delete succeeds, after confirmation | `ResultItem/hooks/useBookmarkItem.ts` |
| `result_note_saved` | — | Notes modal closes after at least one save | `ResultItem/components/NotesModal/NotesModal.tsx` |
| `share_link_copied` | `share_scope` | "Copy Link" in the share modal | `ResultList/components/ShareModal/ShareModal.tsx` |

### Evidence & graph

| Event | Parameters | Fires when | Source |
| --- | --- | --- | --- |
| `evidence_opened` | `evidence_source`, `path_rank`, `path_length` | A path (`path`), graph edge (`graph_edge`), or predicate (`graph_predicate`) opens the evidence view | `ResultItem/components/PathContainer/PathContainer.tsx`, `ResultGraphView/components/GraphView/GraphView.tsx` |
| `evidence_tab_changed` | `tab_name`, `item_count` | User clicks a tab. Programmatic resets excluded | `Evidence/components/EvidenceTabs/EvidenceTabs.tsx` |
| `evidence_link_clicked` | `link_type`, `link_domain` | An outbound publication, source, or trial link is clicked or middle-clicked | `Evidence/components/PublicationRow/PublicationRow.tsx`, `Evidence/components/KnowledgeSourcesTable/KnowledgeSourcesTable.tsx`, `NodeInformationView/components/ClinicalTrialTitleLink/ClinicalTrialTitleLink.tsx` |
| `evidence_paginated` | `tab_name`, `page_number` | Paging within an evidence table. `tab_name` uses the same names as `evidence_tab_changed` | `Evidence/components/TablePaginationControls/TablePaginationControls.tsx` |
| `graph_view_opened` | `node_count`, `edge_count` | Graph tab becomes visible with data. Once per opening | `ResultGraphView/components/GraphView/GraphView.tsx` |
| `graph_node_selected` | `node_curie`, `node_category` | A graph node is clicked | `ResultGraphView/components/GraphView/GraphView.tsx` |
| `graph_layout_changed` | `layout_name` | A layout button is clicked | `ResultGraphView/components/GraphLayoutButtons/GraphLayoutButtons.tsx` |
| `node_info_opened` | `node_curie`, `node_category` | Node information view resolves a node. Once per node | `NodeInformationView/hooks/useNodeInformationView.tsx` |

### Canvas

| Event | Parameters | Fires when | Source |
| --- | --- | --- | --- |
| `canvas_created` | — | A canvas is created on the server | `Canvas/hooks/useCreateCanvas.ts` |
| `canvas_renamed` | — | Rename submitted with a changed title, from the canvas list or the canvas toolbar | `Canvas/hooks/useCanvasList.ts`, `Canvas/hooks/useCanvas.ts` |
| `canvas_deleted` | — | The server confirms the deletion | `Canvas/components/CanvasDeleteConfirmationProvider/CanvasDeleteConfirmationProvider.tsx` |
| `canvas_pane_toggled` | `pane_state` (`open`/`closed`/`maximized`/`restored`) | Pane opened, closed, maximized, or restored | `Canvas/hooks/useCanvasPane.ts` |
| `canvas_node_added` | `add_method` (`drag`/`menu`), `entity_type` (`result`/`path`/`node`/`edge`), `element_count` | Result, path, node, or edge merged into a canvas | `Canvas/utils/addResultEntityToCanvas.ts` |
| `canvas_edge_added` | `add_method` | Same merge, when it brought edges | `Canvas/utils/addResultEntityToCanvas.ts` |
| `canvas_element_deleted` | `element_type` (`node`/`edge`/`mixed`), `element_count` | Selection deleted. Counts what was picked, not cascaded edges | `Canvas/hooks/useCanvasSelectionDelete.ts` |
| `canvas_history_action` | `history_action` (`undo`/`redo`) | Undo or redo actually applies. No-ops excluded | `Canvas/hooks/useCanvasHistory.ts` |
| `canvas_annotation_edited` | `annotation_type` (`added`/`removed`) | Annotation added or removed | `Canvas/hooks/useCanvasPaneAnnotationHandlers.ts` |
| `canvas_layout_applied` | `layout_name` | Layout change applied, directly or after the warning | `Canvas/hooks/useCanvasLayoutActions.ts` |
| `canvas_exported` | `export_format` (`csv`/`png`) | The export file is produced | `Canvas/utils/canvasExportUtils.ts`, `Canvas/utils/canvasImageExportUtils.ts` |

### Projects, filters & export

| Event | Parameters | Fires when | Source |
| --- | --- | --- | --- |
| `project_created` | — | Project creation succeeds | `Projects/hooks/customHooks.ts` |
| `project_renamed` | — | Rename committed with a changed title | `Projects/hooks/useRenameProject.ts` |
| `project_deleted` | `element_count` | Projects are moved to trash successfully | `Projects/hooks/customHooks.ts` |
| `query_moved_to_project` | `move_method` (`drag`/`menu`) | The project update succeeds after a query is dragged onto a project, or a project is picked in add-to-project mode | `Projects/utils/dragDropUtils.ts`, `Sidebar/components/SidebarProjectCard/SidebarProjectCard.tsx` |
| `filter_applied` | `filter_type`, `filter_value`, `filter_count` | A facet or filter is turned on. String (search term) filters report `filter_value` as `string filter`, never the typed text | `ResultList/hooks/useResultFiltering.ts` |
| `filter_cleared` | `filter_type` (or `all`), `filter_count` | A filter is toggled off, or all are cleared | `ResultList/hooks/useResultFiltering.ts` |
| `results_downloaded` | `export_format` (`csv`/`json`), `download_scope`, `result_count` | A file is actually produced | `ResultDownload/utils/downloadUtils.ts` |

### Auth

| Event | Parameters | Fires when | Source |
| --- | --- | --- | --- |
| `auth_logout` | `auth_provider` (`idp`/`local`) | User signs out | `Sidebar/components/Panels/SettingsPanel/SettingsPanel.tsx` |

There is deliberately **no `auth_login`**. Sign-in is an external OIDC redirect
with no in-app callback, so the only client-side signal available is "a session
exists", which is true on every page load. That would measure returning visits,
not logins.

---

## Parameter reference

String parameters become GA4 **custom dimensions**, numeric ones become
**custom metrics**. GA4 allows 50 of each; this taxonomy uses 32 and 13.

**Dimensions** — `query_type`, `query_template_id`, `query_template_label`,
`subject_category`, `object_category`, `constraint_category`, `project_attached`,
`error_message`, `query_status`, `sort_field`, `sort_direction`, `result_curie`,
`share_scope`, `evidence_source`, `tab_name`, `link_type`,
`link_domain`, `layout_name`, `node_category`, `node_curie`, `entity_type`,
`pane_state`, `add_method`, `element_type`, `history_action`, `annotation_type`,
`export_format`, `download_scope`, `move_method`, `filter_type`, `filter_value`,
`auth_provider`

**Metrics** — `result_count`, `load_ms`, `page_number`, `items_per_page`,
`result_rank`, `path_count`, `path_rank`, `path_length`, `item_count`, `node_count`,
`edge_count`, `element_count`, `filter_count`

`load_ms` is registered with `MILLISECONDS` as its measurement unit; the rest are
`STANDARD` counts.

Each dimension holds one kind of value. `node_category` is always a biolink
category; what kind of thing was added to a canvas goes in `entity_type` instead,
so the two never mix in one report.

### Key events (GA4 conversions)

`query_submitted`, `results_downloaded`, `canvas_created`, `share_link_copied`,
`project_created`. Edit `KEY_EVENTS` in `scripts/ga4-admin-setup.mjs` to change
the list.

---

## Conventions

- **Fire on outcome, not intent.** Events go after the operation succeeds, so a
  failed save is not counted as a save.
- **Once per thing.** Streaming result sets, debounced autosaves, and re-renders
  are collapsed with a ref guard rather than emitted per tick.
- **User actions only.** Programmatic sorts, page resets, and tab resets are
  deliberately excluded, which is why several events sit at the click handler
  rather than in the state hook underneath it.
- **CURIEs over internal IDs.** Internal result and node IDs mean nothing outside
  one session.
- **Domains over URLs.** Outbound links report `link_domain`, not the full URL.
- **No free text.** Nothing user-typed is sent — no query strings, note bodies,
  or search terms. Where a free-text feature is tracked, only its use is recorded.

## No IDs, no events

With neither ID configured the transport stays `pending`, the dataLayer simply
accumulates, and nothing leaves the browser. Tracking calls are inert rather
than broken, so local development and tests need no analytics setup.

## Transport

Two paths, chosen at runtime from the backend `/config` response by
`useAnalyticsTransport`. Both IDs are validated in `App.tsx` first, so a
malformed ID is treated as absent rather than selecting a transport that never
loads.

**gtag bridge** (current setup). `gaID` is present, no `gtmID`. `gtag.js` loads
with that measurement ID and `trackEvent` forwards each event as
`gtag('event', name, params)`. Nothing to configure outside this repo — a new
environment works as soon as its backend returns a `gaID`.

**GTM container.** `gtmID` is present, from `VITE_GTM_ID` or `gtmID` on the
config response. The container owns the GA4 tag and reads events off the
dataLayer, `useGoogleAnalytics` skips injecting `gtag.js`, and the bridge stays
silent — sending both ways would double count everything. This path buys
retuning events in the GTM UI without a deploy.

Both paths push the same plain `{ event, ...params }` object to the dataLayer
first. That is what GTM consumes, and it is also what makes the two
interchangeable.

### Why events are buffered

`gtag.js` and GTM share the `dataLayer` array but read it differently. GTM
replays whatever is already in the array when it loads, so a plain object
pushed during bootstrap is never lost. `gtag.js` does not: it only processes the
`arguments` objects the `gtag()` shim pushes, and ignores plain objects.

The config fetch is async, so events can fire before the transport is known —
the first page view always does. Those are held in a bounded buffer (50 events)
and flushed the moment the transport resolves to `gtag`. If it resolves to GTM
instead, the buffer is discarded, because the dataLayer pushes already made will
be replayed by the container.

### Page views

Exactly one thing sends page views: `usePageViewTracking`. GA4's own automatic
page view is disabled on both paths — `send_page_view: false` on the `gtag`
`config` call, and on the Google tag in the GTM container. Without that the
landing page counts twice, and the duplicate is attributed before React has
committed the route's title.

## Environments

CI, Test, and Prod each have their own `gaID` and therefore their own GA4
property. The build is identical; only the config response differs.

`scripts/ga4-admin-setup.mjs` configures **one property per run**, so register
the dimensions and metrics separately for each:

```bash
export GA4_ACCESS_TOKEN="$(gcloud auth print-access-token \
  --scopes=https://www.googleapis.com/auth/analytics.edit)"

GA4_PROPERTY_ID=<ci-property>   npm run analytics:ga4
GA4_PROPERTY_ID=<test-property> npm run analytics:ga4
GA4_PROPERTY_ID=<prod-property> npm run analytics:ga4
```

Note this takes the **numeric property ID** (GA4 Admin → Property Settings), not
the `G-` measurement ID the config returns. The script is idempotent, so re-run
it after adding a parameter to the taxonomy.

`npm run analytics:gtm` only rewrites `analytics/gtm-container.json` when the
container content changes; `exportTime` is carried forward otherwise, so an
unchanged taxonomy produces no diff.

## Debugging

In dev, every push is logged to the console with a `[analytics]` prefix (not
under Vitest, to keep test output clean). In a deployed build, enable it from
the console:

```js
window.__analyticsDebug(true)   // log every push
window.dataLayer                // inspect what has already been pushed
```

`window.dataLayer` holds both shapes: plain `{ event, ... }` objects, and the
array-like `arguments` objects the gtag bridge pushes. Seeing an event only in
the first shape means the transport has not resolved to `gtag` yet.

For end-to-end verification use the GA4 DebugView, or GTM Preview mode if a
container is configured.
