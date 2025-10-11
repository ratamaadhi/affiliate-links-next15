import useSWR from 'swr';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch pages');
  }
  return response.json();
};

export function usePublicPages(username: string) {
  const { data, error, isLoading, mutate } = useSWR(
    username ? `/api/pages/public/${username}` : null,
    fetcher,
    {
      onError: (error) => {
        console.error('Error fetching public pages:', error);
      },
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    data: data?.data,
    isLoading,
    error,
    mutate,
  };
}

export type PublicPagesData = {
  user: {
    id: number;
    name: string;
    username: string;
    displayUsername: string | null;
    image: string | null;
  };
  pages: Array<{
    id: number;
    title: string;
    description: string | null;
    slug: string;
    createdAt: number;
    updatedAt: number;
  }>;
};
