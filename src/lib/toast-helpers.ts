/**
 * Toast notification helpers for rate limit warnings and errors
 *
 * Uses sonner for toast notifications
 */

import { toast } from 'sonner';
import { formatResetTime } from '@/lib/config/twitter-tiers';

/**
 * Show a rate limit warning toast
 *
 * @param limitType - Type of limit that was hit
 * @param resetIn - Milliseconds until limit resets
 */
export function showRateLimitWarning(
  limitType: '15min' | 'hour' | '24hour' | 'month',
  resetIn: number
) {
  const limitLabels = {
    '15min': '15-minute',
    'hour': 'hourly',
    '24hour': '24-hour',
    'month': 'monthly',
  };

  const resetTime = formatResetTime(resetIn);

  toast.warning(`Approaching ${limitLabels[limitType]} rate limit`, {
    description: `Limit resets in ${resetTime}. Consider slowing down automation.`,
    duration: 8000,
    action: {
      label: 'View Limits',
      onClick: () => {
        window.location.href = '/dashboard/limits';
      },
    },
  });
}

/**
 * Show a rate limit exceeded error toast
 *
 * @param limitType - Type of limit that was exceeded
 * @param resetIn - Milliseconds until limit resets
 */
export function showRateLimitError(
  limitType: '15min' | 'hour' | '24hour' | 'month',
  resetIn: number
) {
  const limitLabels = {
    '15min': '15-minute',
    'hour': 'hourly',
    '24hour': '24-hour',
    'month': 'monthly',
  };

  const resetTime = formatResetTime(resetIn);

  toast.error(`${limitLabels[limitType]} rate limit exceeded`, {
    description: `Twitter API limit reached. Resets in ${resetTime}. Automation paused.`,
    duration: 10000,
    action: {
      label: 'View Limits',
      onClick: () => {
        window.location.href = '/dashboard/limits';
      },
    },
  });
}

/**
 * Show Twitter API 403 error toast
 *
 * @param details - Error details (optional)
 */
export function showTwitter403Error(details?: string) {
  toast.error('Twitter API access forbidden (403)', {
    description:
      details ||
      'You may have hit your daily rate limit. Check your usage on the Limits page.',
    duration: 10000,
    action: {
      label: 'View Limits',
      onClick: () => {
        window.location.href = '/dashboard/limits';
      },
    },
  });
}

/**
 * Show Twitter API 429 error toast (Too Many Requests)
 *
 * @param retryAfter - Seconds until retry (from retry-after header)
 */
export function showTwitter429Error(retryAfter?: number) {
  const resetTime = retryAfter ? formatResetTime(retryAfter * 1000) : 'a few minutes';

  toast.error('Twitter API rate limit exceeded (429)', {
    description: `Too many requests. Please wait ${resetTime} before trying again.`,
    duration: 10000,
    action: {
      label: 'View Limits',
      onClick: () => {
        window.location.href = '/dashboard/limits';
      },
    },
  });
}

/**
 * Show a generic API error toast
 *
 * @param error - Error message
 */
export function showApiError(error: string) {
  toast.error('API Error', {
    description: error,
    duration: 6000,
  });
}

/**
 * Show a success toast for Twitter actions
 *
 * @param message - Success message
 */
export function showTwitterSuccess(message: string) {
  toast.success('Success', {
    description: message,
    duration: 4000,
  });
}

/**
 * Show an info toast for limit status
 *
 * @param message - Info message
 * @param description - Additional details
 */
export function showLimitInfo(message: string, description?: string) {
  toast.info(message, {
    description,
    duration: 5000,
    action: {
      label: 'View Details',
      onClick: () => {
        window.location.href = '/dashboard/limits';
      },
    },
  });
}

/**
 * Check usage percentage and show warning if approaching limit
 *
 * @param percentUsed - Percentage of limit used (0-100)
 * @param limitType - Type of limit
 * @param resetIn - Milliseconds until reset
 */
export function checkAndWarnLimitUsage(
  percentUsed: number,
  limitType: '15min' | 'hour' | '24hour' | 'month',
  resetIn: number
) {
  if (percentUsed >= 90) {
    showRateLimitWarning(limitType, resetIn);
  } else if (percentUsed >= 100) {
    showRateLimitError(limitType, resetIn);
  }
}
