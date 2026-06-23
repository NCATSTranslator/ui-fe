export const commonQueryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
};
