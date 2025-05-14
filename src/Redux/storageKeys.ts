export const STORAGE_VERSION = 'v1';

export const SEEN_STATUS_STORAGE_KEY = `seenStatusStore_${STORAGE_VERSION}`;
export const QUERY_HISTORY_STORAGE_KEY = `queryHistoryState_${STORAGE_VERSION}`;

// Optional cleanup keys for deprecated versions
export const DEPRECATED_KEYS = [
  'seenStatusStore_v0',
  'queryHistoryState_v0',
];