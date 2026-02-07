export type HealthStatus = 'healthy' | 'unhealthy' | 'timeout' | 'unknown';

export type HealthCheckResult = {
  status: HealthStatus;
  statusCode: number | null;
  responseTime: number;
  error: string | null;
};

const HEALTH_CHECK_TIMEOUT = 10000; // 10 seconds

/**
 * Check the health of a URL by making an HTTP request
 * @param url - The URL to check
 * @returns HealthCheckResult with status, statusCode, responseTime, and error
 */
export async function checkUrlHealth(url: string): Promise<HealthCheckResult> {
  const startTime = Date.now();
  let controller: AbortController | null = null;

  try {
    // Validate URL format and protocol
    const parsedUrl = new URL(url);

    // Only HTTP/HTTPS protocols are allowed for affiliate links
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return {
        status: 'unhealthy',
        statusCode: null,
        responseTime: 0,
        error: `Unsupported protocol: ${parsedUrl.protocol}. Only HTTP/HTTPS URLs are supported for affiliate links.`,
      };
    }

    // Set up timeout
    controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller?.abort(),
      HEALTH_CHECK_TIMEOUT
    );

    // Make the fetch request
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual', // Handle redirects manually to follow them but count them
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; LinkHealthChecker/1.0; +https://github.com)',
      },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    // Handle redirects
    if (
      response.status >= 300 &&
      response.status < 400 &&
      response.headers.get('location')
    ) {
      // For redirects, we'll consider them healthy if they redirect to a valid location
      // A more sophisticated implementation would follow the redirect chain
      return {
        status: 'healthy',
        statusCode: response.status,
        responseTime,
        error: null,
      };
    }

    // Determine health based on status code
    const status = determineHealthStatus({
      statusCode: response.status,
      error: null,
    });

    return {
      status,
      statusCode: response.status,
      responseTime,
      error: null,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    // Check if it was a timeout
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        status: 'timeout',
        statusCode: null,
        responseTime,
        error: 'Request timeout',
      };
    }

    // Handle other errors
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return {
      status: determineHealthStatus({
        statusCode: null,
        error: errorMessage,
      }),
      statusCode: null,
      responseTime,
      error: errorMessage,
    };
  }
}

/**
 * Determine health status based on status code and error
 * @param result - Object with statusCode and error
 * @returns HealthStatus
 */
export function determineHealthStatus(result: {
  statusCode: number | null;
  error: string | null;
}): HealthStatus {
  if (result.error?.toLowerCase().includes('timeout')) {
    return 'timeout';
  }

  if (result.error) {
    return 'unhealthy';
  }

  if (result.statusCode) {
    // 2xx and 3xx are considered healthy
    if (result.statusCode >= 200 && result.statusCode < 400) {
      return 'healthy';
    }

    // 4xx and 5xx are unhealthy
    if (result.statusCode >= 400) {
      return 'unhealthy';
    }
  }

  return 'unknown';
}

/**
 * Format response time for display
 * @param ms - Response time in milliseconds
 * @returns Formatted string (e.g., "250ms", "1.2s")
 */
export function formatResponseTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Get relative time string for last checked date
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Relative time string (e.g., "2 hours ago", "Never")
 */
export function getRelativeTime(timestamp: number | null | undefined): string {
  if (!timestamp) {
    return 'Never';
  }

  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  if (seconds > 0) {
    return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
  }

  return 'Just now';
}

/**
 * Get display text for health status
 * @param status - Health status
 * @returns Display text
 */
export function getHealthStatusText(status: HealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'Healthy';
    case 'unhealthy':
      return 'Unhealthy';
    case 'timeout':
      return 'Timeout';
    case 'unknown':
      return 'Not checked';
    default:
      return 'Unknown';
  }
}

/**
 * Get icon for health status
 * @param status - Health status
 * @returns Icon string
 */
export function getHealthStatusIcon(status: HealthStatus): string {
  switch (status) {
    case 'healthy':
      return '✓';
    case 'unhealthy':
      return '✗';
    case 'timeout':
      return '⏱';
    case 'unknown':
      return '?';
    default:
      return '?';
  }
}
