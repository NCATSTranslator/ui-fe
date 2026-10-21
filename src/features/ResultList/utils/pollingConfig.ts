/** How often the ARA status endpoint is polled while a query is running. */
export const REFETCH_INTERVAL = 10000; // 10 seconds
/** Status checks before polling gives up: 20 minutes at the refetch interval. */
export const STATUS_CHECK_TIMEOUT = 120;
