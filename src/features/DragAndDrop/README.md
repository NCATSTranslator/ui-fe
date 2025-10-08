# DragAndDrop Feature

Simple, React-idiomatic drag and drop components built on `@dnd-kit/core`.

## Overview

This feature provides reusable drag-and-drop functionality for the application, currently used for dragging queries into projects. The implementation is built on dnd-kit and follows React best practices with full TypeScript support.

## Components

### DraggableCard

Located in: `components/DraggableCard/DraggableCard.tsx`

Makes any content draggable using dnd-kit's `useDraggable` hook.

**Props:**
- `id` (string, required): Unique identifier for the draggable item
- `data` (DraggableData, optional): Typed data object to pass to drop handlers
- `children` (ReactNode | RenderFunction): Content to render (can be ReactNode or render function)
- `className` (string, optional): Additional CSS classes
- `disabled` (boolean, optional): Disable dragging (default: false)
- `style` (CSSProperties, optional): Additional inline styles
- `data-testid` (string, optional): Test identifier

**Styling:**
- Applies `cursor: grab` by default
- Applies `cursor: grabbing` when active
- Applies `opacity: 0.5` when dragging
- Disabled state shows `cursor: not-allowed` and prevents interaction

**Simple Usage:**
```tsx
<DraggableCard id="query-1" data={{ type: 'query', data: queryData }}>
  <QueryCard />
</DraggableCard>
```

**Advanced Usage with Render Function:**
```tsx
<DraggableCard id="query-1" data={{ type: 'query', data: queryData }}>
  {({ isDragging }) => (
    <QueryCard className={isDragging ? 'dragging' : ''} />
  )}
</DraggableCard>
```

### DroppableArea

Located in: `components/DroppableArea/DroppableArea.tsx`

Creates a drop zone for draggable items using dnd-kit's `useDroppable` hook with smart visual feedback.

**Props:**
- `id` (string, required): Unique identifier for the droppable area
- `data` (DroppableAreaData, optional): Typed data object to pass to drop handlers
- `children` (ReactNode | RenderFunction): Content to render (can be ReactNode or render function)
- `className` (string, optional): Additional CSS classes
- `disabled` (boolean, optional): Disable dropping (default: false)
- `style` (CSSProperties, optional): Additional inline styles
- `hideIndicator` (boolean, optional): Hide the drop indicator overlay (default: false, indicator is shown)
- `indicatorText` (string, optional): Custom text for the drop indicator (default: "Drop here")
- `canAccept` (function, optional): Filter function `(draggedData: DraggableData) => boolean` to determine if dragged item can be dropped
- `data-testid` (string, optional): Test identifier

**Behavior:**
- Shows visual feedback (overlay + dashed border) when hovering with a draggable item OR when dragging a compatible item
- Drop indicator overlay is shown by default; use `hideIndicator={true}` to hide it
- Uses `canAccept` filter to determine compatible items and show feedback only for acceptable drops
- Disabled state prevents dropping and removes visual feedback

**Styling:**
- Dashed border outline and background overlay appear when active
- Centered drop indicator text with customizable message
- Smooth transitions for all visual states

**Simple Usage:**
```tsx
<DroppableArea id="project-zone" data={{ type: 'project', id: '123' }}>
  <div>Drop queries here</div>
</DroppableArea>
```

**Advanced Usage with Render Function:**
```tsx
<DroppableArea id="project-zone" data={{ type: 'project', id: '123' }}>
  {({ isOver }) => (
    <div className={isOver ? 'active' : 'idle'}>
      {isOver ? 'Release to drop!' : 'Drag queries here'}
    </div>
  )}
</DroppableArea>
```

**With Custom Indicator Text:**
```tsx
<DroppableArea 
  id="project-zone" 
  data={{ type: 'project', id: '123' }}
  indicatorText="Release to add to project"
>
  <ProjectContent />
</DroppableArea>
```

**With Drop Filter (canAccept):**
```tsx
<DroppableArea 
  id="project-zone" 
  data={{ type: 'project', id: '123' }}
  canAccept={(draggedData) => draggedData.type === 'query'}
>
  <ProjectContent />
</DroppableArea>
```

**Without Indicator:**
```tsx
<DroppableArea 
  id="project-zone" 
  data={{ type: 'project', id: '123' }}
  hideIndicator
>
  <ProjectContent />
</DroppableArea>
```

## Types

### Shared Data Types

Located in: `types/types.ts`

#### DraggableData
```typescript
type DraggableData = {
  type: DraggableType;  // 'query' | 'project'
  data: any;
}
```
Data structure passed from draggable items to drop handlers.

#### DroppableAreaData
```typescript
type DroppableAreaData = {
  type: DroppableAreaType;  // 'project'
  id?: string;
  onDrop?: (draggedData: DraggableData) => void;
}
```
Data structure for droppable areas, including optional drop handler callback.

#### DraggableType
```typescript
type DraggableType = 'query' | 'project';
```

#### DroppableAreaType
```typescript
type DroppableAreaType = 'project';
```

### Component Prop Interfaces

These are defined in their respective component files and exported for use:

- **`DraggableCardProps`**: Exported from `components/DraggableCard/DraggableCard.tsx`
- **`DroppableAreaProps`**: Exported from `components/DroppableArea/DroppableArea.tsx`

## Setup

Both components must be used within a `DndContext` from `@dnd-kit/core`:

```tsx
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { DraggableCard } from '@/features/DragAndDrop/components/DraggableCard/DraggableCard';
import { DroppableArea } from '@/features/DragAndDrop/components/DroppableArea/DroppableArea';
import { DraggableData, DroppableAreaData } from '@/features/DragAndDrop/types/types';

function App() {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // Prevents accidental drags, allows clicks
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over) {
      // Access typed data
      const draggedData = active.data.current as DraggableData;
      const dropZoneData = over.data.current as DroppableAreaData;
      
      // Handle the drop
      console.log('Dropped', draggedData, 'into', over.id);
      
      // Call optional onDrop handler
      dropZoneData?.onDrop?.(draggedData);
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <DraggableCard id="query-1" data={{ type: 'query', data: queryObj }}>
        <QueryCard />
      </DraggableCard>
      
      <DroppableArea id="project-1" data={{ type: 'project', id: '1' }}>
        <ProjectContent />
      </DroppableArea>
    </DndContext>
  );
}
```

## Directory Structure

```
DragAndDrop/
├── components/
│   ├── DraggableCard/
│   │   ├── DraggableCard.tsx
│   │   └── DraggableCard.module.scss
│   └── DroppableArea/
│       ├── DroppableArea.tsx
│       └── DroppableArea.module.scss
├── types/
│   └── types.ts
├── hooks/          # Currently empty - reserved for future hooks
├── utils/          # Currently empty - reserved for future utilities
└── README.md
```

## Design Decisions

- **No index.ts exports**: Components are imported directly from their component files to maintain explicit imports
- **CSS Modules**: Scoped styles using CSS modules with variables from `_variables.scss` for consistency
- **joinClasses utility**: Uses the existing codebase utility (`@/features/Common/utils/utilities`) for className combination
- **React idioms**: Leverages children composition and render props (documented React patterns)
- **Type safety**: Full TypeScript support with exported interfaces and type guards
- **Minimal abstraction**: Thin wrappers around dnd-kit hooks, maintaining flexibility
- **Smart visual feedback**: DroppableArea shows active state when dragging compatible items (not just on hover), providing better UX
- **Flexible filtering**: `canAccept` prop allows fine-grained control over what can be dropped where
- **Indicator by default**: Drop indicator is shown by default to provide clear visual feedback; can be hidden with `hideIndicator`
- **Data attributes**: Components expose data attributes (`data-draggable-id`, `data-is-dragging`, `data-disabled`, `data-droppable-id`, `data-is-over`) for testing and debugging
- **Disabled state**: Proper handling of disabled state prevents interaction and provides visual feedback
- **Performance optimizations**: Uses `useMemo` to prevent unnecessary re-renders of classNames and computed values