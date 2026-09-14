/**
 * Analytics event taxonomy.
 *
 * Every event pushed to the GTM dataLayer is declared here. The GTM container
 * (analytics/gtm-container.json) has one trigger + one GA4 event tag per name
 * below, and the GA4 property registers each parameter as a custom dimension or
 * metric (see scripts/ga4-admin-setup.mjs).
 *
 * Constraints enforced by GA4 that this taxonomy respects:
 *  - event names: <= 40 chars, snake_case, must start with a letter
 *  - parameter names: <= 40 chars
 *  - parameter string values: <= 100 chars (truncated at push time)
 *  - <= 25 parameters per event
 */

import type { ResultEntityDragType } from '@/features/DragAndDrop/types/types';

/** String-valued parameters, registered in GA4 as event-scoped custom dimensions. */
export type AnalyticsDimension =
  | 'query_type'
  | 'query_template_id'
  | 'query_template_label'
  | 'subject_category'
  | 'object_category'
  | 'constraint_category'
  | 'project_attached'
  | 'error_message'
  | 'query_status'
  | 'sort_field'
  | 'sort_direction'
  | 'result_curie'
  | 'has_paths'
  | 'share_scope'
  | 'evidence_source'
  | 'tab_name'
  | 'link_type'
  | 'link_domain'
  | 'layout_name'
  | 'node_category'
  | 'node_curie'
  | 'entity_type'
  | 'pane_state'
  | 'add_method'
  | 'element_type'
  | 'history_action'
  | 'annotation_type'
  | 'export_format'
  | 'download_scope'
  | 'move_method'
  | 'filter_type'
  | 'filter_value'
  | 'auth_provider';

/** Number-valued parameters, registered in GA4 as event-scoped custom metrics. */
export type AnalyticsMetric =
  | 'result_count'
  | 'load_ms'
  | 'page_number'
  | 'items_per_page'
  | 'result_rank'
  | 'path_rank'
  | 'path_length'
  | 'item_count'
  | 'node_count'
  | 'edge_count'
  | 'element_count'
  | 'filter_count';

export type AnalyticsParamName = AnalyticsDimension | AnalyticsMetric;

export type AnalyticsParams = Partial<Record<AnalyticsDimension, string>> &
  Partial<Record<AnalyticsMetric, number>>;

export type QueryTypeName = 'single' | 'pathfinder' | 'lookup';
export type LinkType = 'publication' | 'clinical_trial' | 'source';
export type ExportFormat = 'csv' | 'json' | 'png' | 'svg';
export type PaneState = 'open' | 'closed' | 'maximized' | 'restored';
export type HistoryAction = 'undo' | 'redo';
export type AddMethod = 'drag' | 'menu' | 'paste' | 'shortcut';

/**
 * Event name -> allowed parameter shape. Adding an event here is step one;
 * step two is regenerating the GTM container so a tag actually forwards it.
 */
export interface AnalyticsEventMap {
  // --- Query & results core ---
  query_submitted: {
    query_type: QueryTypeName;
    query_template_id?: string;
    query_template_label?: string;
    subject_category?: string;
    object_category?: string;
    constraint_category?: string;
    project_attached?: 'true' | 'false';
  };
  query_submission_failed: {
    query_type: QueryTypeName;
    error_message?: string;
  };
  example_query_selected: {
    query_template_id?: string;
    query_template_label?: string;
  };
  results_loaded: {
    query_type?: QueryTypeName;
    query_status?: string;
    result_count?: number;
    load_ms?: number;
  };
  results_sorted: {
    sort_field: string;
    sort_direction: string;
  };
  results_paginated: {
    page_number: number;
    items_per_page?: number;
  };
  result_opened: {
    result_curie?: string;
    result_rank?: number;
    has_paths?: 'true' | 'false';
  };
  result_bookmarked: { result_curie?: string };
  result_unbookmarked: { result_curie?: string };
  result_note_saved: { result_curie?: string };
  share_link_copied: { share_scope: string };

  // --- Evidence & graph ---
  evidence_opened: {
    evidence_source?: string;
    path_rank?: number;
    path_length?: number;
  };
  evidence_tab_changed: {
    tab_name: string;
    item_count?: number;
  };
  evidence_link_clicked: {
    link_type: LinkType;
    link_domain?: string;
  };
  evidence_paginated: {
    tab_name?: string;
    page_number: number;
  };
  graph_view_opened: {
    node_count?: number;
    edge_count?: number;
  };
  graph_layout_changed: { layout_name: string };
  graph_node_selected: {
    node_category?: string;
    node_curie?: string;
  };
  node_info_opened: {
    node_curie?: string;
    node_category?: string;
  };

  // --- Canvas ---
  canvas_created: Record<string, never>;
  canvas_renamed: Record<string, never>;
  canvas_deleted: Record<string, never>;
  canvas_pane_toggled: { pane_state: PaneState };
  canvas_node_added: {
    add_method: AddMethod;
    // What was added (result, path, node, edge), not a biolink category:
    // node_category carries biolink types elsewhere and must not mix the two.
    entity_type: ResultEntityDragType;
    element_count?: number;
  };
  canvas_edge_added: { add_method: AddMethod };
  canvas_element_deleted: {
    element_type: string;
    element_count?: number;
  };
  canvas_history_action: { history_action: HistoryAction };
  canvas_annotation_edited: { annotation_type: string };
  canvas_layout_applied: { layout_name: string };
  canvas_exported: { export_format: ExportFormat };

  // --- Projects, filters & export ---
  project_created: Record<string, never>;
  project_renamed: Record<string, never>;
  project_deleted: { element_count?: number };
  query_moved_to_project: { move_method: string };
  filter_applied: {
    filter_type: string;
    filter_value?: string;
    filter_count?: number;
  };
  filter_cleared: {
    filter_type: string;
    filter_count?: number;
  };
  results_downloaded: {
    export_format: ExportFormat;
    download_scope?: string;
    result_count?: number;
  };

  // --- Auth ---
  // No auth_login: sign-in is an external OIDC redirect with no in-app
  // callback, so the only client-side signal is "a session exists", which
  // fires on every page load and would measure returning visits, not logins.
  auth_logout: { auth_provider?: string };
}

export type AnalyticsEventName = keyof AnalyticsEventMap;

/** The object shape actually pushed onto window.dataLayer. */
export type DataLayerPush = { event: AnalyticsEventName | 'spa_page_view' } & Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}
