import type { Canvas, CanvasNode } from '@/features/Canvas/types/canvas';
import { triggerDownload, sanitizeForFilename } from '@/features/Core/utils/fileDownloadUtils';
import { getCanvasNodeDisplayName } from '@/features/Canvas/utils/canvasFunctions';
import { escapeCSVValue, joinArrayForCSV } from '@/features/Core/utils/csvUtils';

export const buildCanvasExportFilename = (
  label: string,
  extension: string,
  date: Date = new Date(),
): string => {
  const datePart = date.toISOString().split('T')[0];
  return `${sanitizeForFilename(label)}_canvas_${datePart}.${extension}`;
};

type CanvasCSVRow = {
  record_type: 'edge' | 'node' | 'annotation';
  canvas_label: string;
  canvas_layout: string;
  source_node_id: string;
  source_node_name: string;
  source_node_types: string;
  source_node_curies: string;
  edge_id: string;
  edge_predicate: string;
  target_node_id: string;
  target_node_name: string;
  target_node_types: string;
  target_node_curies: string;
  annotation_text: string;
};

const CSV_HEADERS: (keyof CanvasCSVRow)[] = [
  'record_type',
  'canvas_label',
  'canvas_layout',
  'source_node_id',
  'source_node_name',
  'source_node_types',
  'source_node_curies',
  'edge_id',
  'edge_predicate',
  'target_node_id',
  'target_node_name',
  'target_node_types',
  'target_node_curies',
  'annotation_text',
];

const nodeFields = (node: CanvasNode | undefined) => {
  if (!node) {
    return { id: '', name: '', types: '', curies: '' };
  }
  return {
    id: node.id,
    name: getCanvasNodeDisplayName(node),
    types: joinArrayForCSV(node.types),
    curies: joinArrayForCSV(node.curies),
  };
};

const emptyRow = (canvas: Canvas, recordType: CanvasCSVRow['record_type']): CanvasCSVRow => ({
  record_type: recordType,
  canvas_label: canvas.label,
  canvas_layout: canvas.layout,
  source_node_id: '',
  source_node_name: '',
  source_node_types: '',
  source_node_curies: '',
  edge_id: '',
  edge_predicate: '',
  target_node_id: '',
  target_node_name: '',
  target_node_types: '',
  target_node_curies: '',
  annotation_text: '',
});

export const buildCanvasCSV = (canvas: Canvas): string => {
  const rows: CanvasCSVRow[] = [];
  const connectedNodeIds = new Set<string>();

  for (const edge of Object.values(canvas.edges)) {
    connectedNodeIds.add(edge.subject);
    connectedNodeIds.add(edge.object);

    const source = nodeFields(canvas.nodes[edge.subject]);
    const target = nodeFields(canvas.nodes[edge.object]);

    rows.push({
      ...emptyRow(canvas, 'edge'),
      source_node_id: source.id,
      source_node_name: source.name,
      source_node_types: source.types,
      source_node_curies: source.curies,
      edge_id: edge.id,
      edge_predicate: edge.predicate,
      target_node_id: target.id,
      target_node_name: target.name,
      target_node_types: target.types,
      target_node_curies: target.curies,
    });
  }

  for (const node of Object.values(canvas.nodes)) {
    if (connectedNodeIds.has(node.id)) continue;
    const fields = nodeFields(node);
    rows.push({
      ...emptyRow(canvas, 'node'),
      source_node_id: fields.id,
      source_node_name: fields.name,
      source_node_types: fields.types,
      source_node_curies: fields.curies,
    });
  }

  for (const annotation of canvas.annotations) {
    rows.push({
      ...emptyRow(canvas, 'annotation'),
      annotation_text: annotation.text,
    });
  }

  const lines = [
    CSV_HEADERS.join(','),
    ...rows.map(row => CSV_HEADERS.map(header => escapeCSVValue(row[header])).join(',')),
  ];

  return lines.join('\n');
};

export const exportCanvasToCSVFile = (canvas: Canvas): void => {
  const content = buildCanvasCSV(canvas);
  triggerDownload(content, buildCanvasExportFilename(canvas.label, 'csv'), 'text/csv');
};
