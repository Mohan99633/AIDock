import { QueryClient } from '@tanstack/react-query';

/**
 * Creates a stable query client instance for extension surfaces.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false
      }
    }
  });
}
