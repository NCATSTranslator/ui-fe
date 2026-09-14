import { describe, it, expect } from 'vitest';
import { BIOLINK_TYPE_REGISTRY } from './biolinkTypeRegistry';
import { getNodeColorBucket } from './nodeColors';
import { getNodeIconComponent } from './entityLinks';

describe('BIOLINK_TYPE_REGISTRY', () => {
  it('keeps color buckets aligned with nodeColors lookups', () => {
    for (const [type, { colorBucket }] of Object.entries(BIOLINK_TYPE_REGISTRY)) {
      expect(getNodeColorBucket(type)).toBe(colorBucket);
    }
  });

  it('keeps icon keys aligned with entityLinks lookups', () => {
    for (const type of Object.keys(BIOLINK_TYPE_REGISTRY)) {
      expect(getNodeIconComponent(type)).not.toBeNull();
    }
  });

  it('assigns the same color bucket to every type that shares an icon key', () => {
    const bucketByIcon = new Map<string, Set<string>>();

    for (const { icon, colorBucket } of Object.values(BIOLINK_TYPE_REGISTRY)) {
      const buckets = bucketByIcon.get(icon) ?? new Set<string>();
      buckets.add(colorBucket);
      bucketByIcon.set(icon, buckets);
    }

    for (const [icon, buckets] of bucketByIcon) {
      expect(buckets.size, `icon "${icon}" maps to multiple color buckets`).toBe(1);
    }
  });
});
