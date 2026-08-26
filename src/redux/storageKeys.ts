export const STORAGE_VERSION = 'v1';

export const SEEN_STATUS_STORAGE_KEY = `seenStatusStore_${STORAGE_VERSION}`;

// Optional cleanup keys for deprecated versions
export const DEPRECATED_KEYS = [
  'seenStatusStore_v0',
  'queryHistoryState',
  'queryHistoryState_v0',
];
