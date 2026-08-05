import { get, post, put, fetchWithErrorHandling, ErrorHandler } from '@/features/Core/utils/web';
import type {
  BackendUserCanvas,
  BackendCanvasGraph,
  BackendCanvasNode,
  BackendCanvasAnnotation,
  GraphSubmission,
  GraphSelection,
  GraphGeometry,
  CreateCanvasAnnotationRequest,
  UpdateCanvasAnnotationTextRequest,
  UpdateCanvasElementRequest,
  CanvasLayout,
  CanvasNodeDetail,
  CanvasEdgeDetail,
} from '@/features/Canvas/types/canvas';
import {
  isBackendUserCanvas,
  isBackendUserCanvasArray,
  isBackendCanvasGraph,
  isBackendCanvasAnnotation,
  isCanvasNodeDetail,
  isCanvasEdgeDetail,
} from '@/features/Canvas/types/checkers';

const BASE = '/api/v1/users/me/canvas';

// ---------------------------------------------------------------------------
// Canvas CRUD
// ---------------------------------------------------------------------------

export const listCanvases = async (
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler,
): Promise<BackendUserCanvas[]> =>
  fetchWithErrorHandling<BackendUserCanvas[]>(
    () => get(BASE),
    httpErrorHandler,
    fetchErrorHandler,
    isBackendUserCanvasArray,
  );

export const createCanvas = async (
  label: string,
  layout: CanvasLayout,
  graph?: GraphSubmission,
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler,
): Promise<BackendUserCanvas> =>
  fetchWithErrorHandling<BackendUserCanvas>(
    () => post(BASE, { label, layout, graph }),
    httpErrorHandler,
    fetchErrorHandler,
    isBackendUserCanvas,
  );

export const updateCanvasMetadata = async (
  saveId: number,
  update: { label?: string; layout?: CanvasLayout },
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler,
): Promise<BackendUserCanvas> =>
  fetchWithErrorHandling<BackendUserCanvas>(
    () => put(`${BASE}/${saveId}`, update),
    httpErrorHandler,
    fetchErrorHandler,
    isBackendUserCanvas,
  );

export const trashCanvases = async (
  ids: number[],
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler,
): Promise<void> => {
  await fetchWithErrorHandling<unknown>(
    () => put(`${BASE}/trash`, ids),
    httpErrorHandler,
    fetchErrorHandler,
  );
};

export const restoreCanvases = async (
  ids: number[],
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler,
): Promise<void> => {
  await fetchWithErrorHandling<unknown>(
    () => put(`${BASE}/restore`, ids),
    httpErrorHandler,
    fetchErrorHandler,
  );
};

// ---------------------------------------------------------------------------
// Graph operations
// ---------------------------------------------------------------------------

export const getCanvasGraph = async (
  saveId: number,
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler,
): Promise<BackendCanvasGraph> =>
  fetchWithErrorHandling<BackendCanvasGraph>(
    () => get(`${BASE}/${saveId}/graph`),
    httpErrorHandler,
    fetchErrorHandler,
    isBackendCanvasGraph,
  );

export const mergeCanvasGraph = async (
  saveId: number,
  submission: GraphSubmission,
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler,
): Promise<BackendCanvasGraph> =>
  fetchWithErrorHandling<BackendCanvasGraph>(
    () => post(`${BASE}/${saveId}/graph`, submission),
    httpErrorHandler,
    fetchErrorHandler,
    isBackendCanvasGraph,
  );

export const updateCanvasGeometry = async (
  saveId: number,
  geometry: GraphGeometry,
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler,
): Promise<void> => {
  await fetchWithErrorHandling<unknown>(
    () => put(`${BASE}/${saveId}/graph/geometry`, geometry),
    httpErrorHandler,
    fetchErrorHandler,
  );
};

/** @deprecated Use updateCanvasGeometry */
export const moveCanvasNodes = updateCanvasGeometry;

export const trashCanvasElements = async (
  saveId: number,
  selection: GraphSelection,
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler,
): Promise<BackendCanvasGraph> =>
  fetchWithErrorHandling<BackendCanvasGraph>(
    () => put(`${BASE}/${saveId}/graph/trash`, selection),
    httpErrorHandler,
    fetchErrorHandler,
    isBackendCanvasGraph,
  );

export const restoreCanvasElements = async (
  saveId: number,
  selection: GraphSelection,
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler,
): Promise<BackendCanvasGraph> =>
  fetchWithErrorHandling<BackendCanvasGraph>(
    () => put(`${BASE}/${saveId}/graph/restore`, selection),
    httpErrorHandler,
    fetchErrorHandler,
    isBackendCanvasGraph,
  );

// ---------------------------------------------------------------------------
// Annotations
// ---------------------------------------------------------------------------

export const createCanvasAnnotation = async (
  saveId: number,
  request: CreateCanvasAnnotationRequest,
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler,
): Promise<BackendCanvasAnnotation> =>
  fetchWithErrorHandling<BackendCanvasAnnotation>(
    () => post(`${BASE}/${saveId}/annotation`, request),
    httpErrorHandler,
    fetchErrorHandler,
    isBackendCanvasAnnotation,
  );

export const updateCanvasAnnotationText = async (
  saveId: number,
  annotationId: number,
  request: UpdateCanvasAnnotationTextRequest,
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler,
): Promise<BackendCanvasAnnotation> =>
  fetchWithErrorHandling<BackendCanvasAnnotation>(
    () => put(`${BASE}/${saveId}/annotation/${annotationId}`, request),
    httpErrorHandler,
    fetchErrorHandler,
    isBackendCanvasAnnotation,
  );

// ---------------------------------------------------------------------------
// Node / Edge detail
// ---------------------------------------------------------------------------

export const getNodeDetail = async (
  saveId: number,
  dataId: number,
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler,
): Promise<CanvasNodeDetail> =>
  fetchWithErrorHandling<CanvasNodeDetail>(
    () => get(`${BASE}/${saveId}/node/${dataId}`),
    httpErrorHandler,
    fetchErrorHandler,
    isCanvasNodeDetail,
  );

export const updateNodeDisplay = async (
  saveId: number,
  dataId: number,
  update: UpdateCanvasElementRequest,
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler,
): Promise<BackendCanvasNode> =>
  fetchWithErrorHandling<BackendCanvasNode>(
    () => put(`${BASE}/${saveId}/node/${dataId}`, update),
    httpErrorHandler,
    fetchErrorHandler,
  );

export const getEdgeDetail = async (
  saveId: number,
  dataId: number,
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler,
): Promise<CanvasEdgeDetail> =>
  fetchWithErrorHandling<CanvasEdgeDetail>(
    () => get(`${BASE}/${saveId}/edge/${dataId}`),
    httpErrorHandler,
    fetchErrorHandler,
    isCanvasEdgeDetail,
  );

export const updateEdgeDisplay = async (
  saveId: number,
  dataId: number,
  update: UpdateCanvasElementRequest,
  httpErrorHandler?: ErrorHandler,
  fetchErrorHandler?: ErrorHandler,
): Promise<BackendCanvasNode> =>
  fetchWithErrorHandling<BackendCanvasNode>(
    () => put(`${BASE}/${saveId}/edge/${dataId}`, update),
    httpErrorHandler,
    fetchErrorHandler,
  );
