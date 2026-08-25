import { FC } from 'react';
import type { CanvasTagFiltersState } from '@/features/Canvas/hooks/useCanvasSourceFilters';

interface CanvasSourceFiltersPanelProps {
  tagFilters: CanvasTagFiltersState;
}

const CanvasSourceFiltersPanel: FC<CanvasSourceFiltersPanelProps> = ({ tagFilters }) => {
  const { tags, hiddenTagIds, toggleTag, showAll } = tagFilters;
  const tagEntries = Object.entries(tags);

  if (tagEntries.length === 0) return null;

  return (
    <div>
      <div>
        <span>Source Filters</span>
        {hiddenTagIds.size > 0 && (
          <button type="button" onClick={showAll}>
            Clear
          </button>
        )}
      </div>
      <div>
        {tagEntries.map(([id, tag]) => (
          <label key={id}>
            <input
              type="checkbox"
              checked={!hiddenTagIds.has(id)}
              onChange={() => toggleTag(id)}
            />
            <span>{tag.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default CanvasSourceFiltersPanel;
