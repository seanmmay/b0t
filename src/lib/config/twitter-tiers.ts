/**
 * Twitter API Subscription Tiers and Rate Limits
 *
 * This file defines all Twitter API subscription tiers with their rate limits
 * and provides utilities for tracking and validating usage against limits.
 *
 * Documentation: https://developer.x.com/en/docs/x-api/rate-limits
 */

export type TwitterTier = 'free' | 'basic' | 'pro' | 'enterprise';

export interface RateLimit {
  /** Requests per 15-minute window */
  per15Minutes?: number;
  /** Requests per hour */
  perHour?: number;
  /** Requests per 24-hour window */
  per24Hours?: number;
  /** Requests per month */
  perMonth?: number;
}

export interface TierLimits {
  /** Tier identifier */
  tier: TwitterTier;
  /** Display name for UI */
  name: string;
  /** Monthly cost in USD */
  cost: number;
  /** Tweet/Post creation limits */
  postLimits: RateLimit;
  /** Tweet read/search limits */
  readLimits: RateLimit;
  /** Maximum tweets retrievable per request */
  maxResultsPerRequest: number;
  /** Whether tier supports elevated access */
  elevatedAccess: boolean;
}

/**
 * Twitter API Tier Definitions
 *
 * Based on official Twitter/X API documentation (as of 2025)
 * Source: https://developer.x.com/en/docs/x-api
 */
export const TWITTER_TIERS: Record<TwitterTier, TierLimits> = {
  free: {
    tier: 'free',
    name: 'Free',
    cost: 0,
    postLimits: {
      perMonth: 1500, // App-level limit
    },
    readLimits: {
      perMonth: 0, // Write-only tier, no reads allowed
    },
    maxResultsPerRequest: 10,
    elevatedAccess: false,
  },
  basic: {
    tier: 'basic',
    name: 'Basic',
    cost: 100,
    postLimits: {
      perMonth: 3000, // Per-user limit (50,000 app-level)
    },
    readLimits: {
      perMonth: 10000, // App-level limit
    },
    maxResultsPerRequest: 100,
    elevatedAccess: true,
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    cost: 5000,
    postLimits: {
      perMonth: 300000,
    },
    readLimits: {
      perMonth: 1000000,
    },
    maxResultsPerRequest: 100,
    elevatedAccess: true,
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    cost: 42000, // Starting price (ranges from $42k-$210k/month)
    postLimits: {
      perMonth: 999999999, // Effectively unlimited (custom)
    },
    readLimits: {
      perMonth: 999999999, // Effectively unlimited (custom)
    },
    maxResultsPerRequest: 500,
    elevatedAccess: true,
  },
};

/**
 * Usage tracking for a specific time window
 */
export interface UsageData {
  /** Number of requests made in this window */
  count: number;
  /** Window start timestamp */
  windowStart: Date;
  /** Window duration in milliseconds */
  windowDuration: number;
}

/**
 * Complete usage tracking across all time windows
 */
export interface TwitterUsageTracking {
  /** 15-minute window usage */
  last15Minutes: UsageData;
  /** Hourly window usage */
  lastHour: UsageData;
  /** 24-hour window usage */
  last24Hours: UsageData;
  /** Monthly window usage */
  lastMonth: UsageData;
  /** Last updated timestamp */
  lastUpdated: Date;
}

/**
 * Result of checking usage against limits
 */
export interface LimitCheckResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Which limit was hit (if any) */
  limitType?: '15min' | 'hour' | '24hour' | 'month';
  /** Current usage count for the violated limit */
  currentUsage?: number;
  /** Maximum allowed for the violated limit */
  maxAllowed?: number;
  /** Time until limit resets (milliseconds) */
  resetIn?: number;
  /** Percentage of limit used (0-100) */
  percentUsed?: number;
}

/**
 * Get tier configuration by tier name
 */
export function getTierConfig(tier: TwitterTier): TierLimits {
  return TWITTER_TIERS[tier];
}

/**
 * Get all available tiers (for UI dropdowns)
 */
export function getAllTiers(): TierLimits[] {
  return Object.values(TWITTER_TIERS);
}

/**
 * Check if current usage exceeds tier limits
 *
 * @param tier - User's subscription tier
 * @param usage - Current usage tracking data
 * @param type - Type of operation ('post' or 'read')
 * @returns Result indicating if operation is allowed
 */
export function checkLimit(
  tier: TwitterTier,
  usage: TwitterUsageTracking,
  type: 'post' | 'read'
): LimitCheckResult {
  const config = getTierConfig(tier);
  const limits = type === 'post' ? config.postLimits : config.readLimits;

  // Check 15-minute limit
  if (limits.per15Minutes !== undefined) {
    const usage15Min = usage.last15Minutes;
    if (usage15Min.count >= limits.per15Minutes) {
      const resetIn = usage15Min.windowDuration - (Date.now() - usage15Min.windowStart.getTime());
      return {
        allowed: false,
        limitType: '15min',
        currentUsage: usage15Min.count,
        maxAllowed: limits.per15Minutes,
        resetIn: Math.max(0, resetIn),
        percentUsed: (usage15Min.count / limits.per15Minutes) * 100,
      };
    }
  }

  // Check hourly limit
  if (limits.perHour !== undefined) {
    const usageHour = usage.lastHour;
    if (usageHour.count >= limits.perHour) {
      const resetIn = usageHour.windowDuration - (Date.now() - usageHour.windowStart.getTime());
      return {
        allowed: false,
        limitType: 'hour',
        currentUsage: usageHour.count,
        maxAllowed: limits.perHour,
        resetIn: Math.max(0, resetIn),
        percentUsed: (usageHour.count / limits.perHour) * 100,
      };
    }
  }

  // Check 24-hour limit
  if (limits.per24Hours !== undefined) {
    const usage24Hour = usage.last24Hours;
    if (usage24Hour.count >= limits.per24Hours) {
      const resetIn = usage24Hour.windowDuration - (Date.now() - usage24Hour.windowStart.getTime());
      return {
        allowed: false,
        limitType: '24hour',
        currentUsage: usage24Hour.count,
        maxAllowed: limits.per24Hours,
        resetIn: Math.max(0, resetIn),
        percentUsed: (usage24Hour.count / limits.per24Hours) * 100,
      };
    }
  }

  // Check monthly limit
  if (limits.perMonth !== undefined) {
    const usageMonth = usage.lastMonth;
    if (usageMonth.count >= limits.perMonth) {
      const resetIn = usageMonth.windowDuration - (Date.now() - usageMonth.windowStart.getTime());
      return {
        allowed: false,
        limitType: 'month',
        currentUsage: usageMonth.count,
        maxAllowed: limits.perMonth,
        resetIn: Math.max(0, resetIn),
        percentUsed: (usageMonth.count / limits.perMonth) * 100,
      };
    }
  }

  // All checks passed
  return {
    allowed: true,
  };
}

/**
 * Get warning level based on usage percentage
 *
 * @param percentUsed - Percentage of limit used (0-100)
 * @returns Warning level: 'safe' | 'warning' | 'critical'
 */
export function getWarningLevel(percentUsed: number): 'safe' | 'warning' | 'critical' {
  if (percentUsed >= 90) return 'critical';
  if (percentUsed >= 75) return 'warning';
  return 'safe';
}

/**
 * Format time until reset as human-readable string
 *
 * @param milliseconds - Time in milliseconds
 * @returns Formatted string (e.g., "5m 30s", "2h 15m", "1d 3h")
 */
export function formatResetTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Calculate percentage of limit used
 *
 * @param current - Current usage count
 * @param max - Maximum allowed
 * @returns Percentage (0-100)
 */
export function calculatePercentUsed(current: number, max: number): number {
  if (max === 0) return 0;
  return Math.min(100, (current / max) * 100);
}

/**
 * Initialize empty usage tracking data
 */
export function createEmptyUsage(): TwitterUsageTracking {
  const now = new Date();
  return {
    last15Minutes: {
      count: 0,
      windowStart: now,
      windowDuration: 15 * 60 * 1000, // 15 minutes
    },
    lastHour: {
      count: 0,
      windowStart: now,
      windowDuration: 60 * 60 * 1000, // 1 hour
    },
    last24Hours: {
      count: 0,
      windowStart: now,
      windowDuration: 24 * 60 * 60 * 1000, // 24 hours
    },
    lastMonth: {
      count: 0,
      windowStart: now,
      windowDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
    lastUpdated: now,
  };
}

/**
 * Reset expired windows in usage tracking
 *
 * @param usage - Current usage tracking data
 * @returns Updated usage with expired windows reset
 */
export function resetExpiredWindows(usage: TwitterUsageTracking): TwitterUsageTracking {
  const now = Date.now();
  const updated = { ...usage };

  // Check and reset each window
  if (now - usage.last15Minutes.windowStart.getTime() >= usage.last15Minutes.windowDuration) {
    updated.last15Minutes = {
      count: 0,
      windowStart: new Date(),
      windowDuration: usage.last15Minutes.windowDuration,
    };
  }

  if (now - usage.lastHour.windowStart.getTime() >= usage.lastHour.windowDuration) {
    updated.lastHour = {
      count: 0,
      windowStart: new Date(),
      windowDuration: usage.lastHour.windowDuration,
    };
  }

  if (now - usage.last24Hours.windowStart.getTime() >= usage.last24Hours.windowDuration) {
    updated.last24Hours = {
      count: 0,
      windowStart: new Date(),
      windowDuration: usage.last24Hours.windowDuration,
    };
  }

  if (now - usage.lastMonth.windowStart.getTime() >= usage.lastMonth.windowDuration) {
    updated.lastMonth = {
      count: 0,
      windowStart: new Date(),
      windowDuration: usage.lastMonth.windowDuration,
    };
  }

  return updated;
}
