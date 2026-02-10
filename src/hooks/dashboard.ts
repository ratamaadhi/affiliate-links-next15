import useSWR from 'swr';

export interface DashboardStats {
  totalClicks: number;
  totalLinks: number;
  totalPages: number;
  totalShortUrlClicks: number;
  healthStatus: {
    healthy: number;
    unhealthy: number;
    timeout: number;
    unknown: number;
  };
}

export interface TopLink {
  id: number;
  title: string;
  url: string;
  clickCount: number;
  pageId: number;
  pageTitle: string;
  healthStatus: string | null;
  lastCheckedAt: number | null;
}

export interface ClickTrendDataPoint {
  date: string;
  linkClicks: number;
  shortLinkClicks: number;
  totalClicks: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }
  const json = await res.json();
  return json.data;
};

export function useDashboardStats() {
  return useSWR<DashboardStats>('/api/dashboard/stats', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60000, // Refresh every minute
    dedupingInterval: 1000,
  });
}

export function useTopLinks(limit: number = 5) {
  return useSWR<TopLink[]>(`/api/dashboard/top-links?limit=${limit}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 1000,
  });
}

export function useClickTrends(days: 7 | 30 | 90 = 7) {
  return useSWR<ClickTrendDataPoint[]>(
    `/api/dashboard/click-trends?days=${days}`,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 300000, // Refresh every 5 minutes
      dedupingInterval: 1000,
    }
  );
}
