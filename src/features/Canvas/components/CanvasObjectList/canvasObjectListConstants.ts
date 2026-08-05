import type { AnnotationSortMode, ObjectSortMode } from '@/features/Canvas/utils/canvasFunctions';

export type CanvasObjectListTab = 'objects' | 'annotations';

export const OBJECT_SORT_OPTIONS: { key: ObjectSortMode; label: string }[] = [
  { key: 'relationships', label: '# of Relationships' },
  { key: 'alphabetical', label: 'Alphabetical' },
  { key: 'type', label: 'Type' },
];

export const ANNOTATION_SORT_OPTIONS: { key: AnnotationSortMode; label: string }[] = [
  { key: 'alphabetical', label: 'Alphabetical' },
  { key: 'date', label: 'Date Created' },
];
