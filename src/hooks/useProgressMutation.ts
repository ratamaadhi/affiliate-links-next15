import { useCallback } from 'react';
import NProgress from 'nprogress';

export const useProgressMutation = () => {
  const withProgress = useCallback(
    async <T, Args extends any[]>(
      mutationFn: (..._args: Args) => Promise<T>,
      ...args: Args
    ): Promise<T> => {
      NProgress.start();
      try {
        const result = await mutationFn(...args);
        NProgress.done();
        return result;
      } catch (error) {
        NProgress.done();
        throw error;
      }
    },
    []
  );

  return { withProgress };
};

export default useProgressMutation;
