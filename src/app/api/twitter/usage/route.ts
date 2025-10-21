import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appSettingsTable } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import {
  TwitterUsageTracking,
  createEmptyUsage,
  resetExpiredWindows,
} from '@/lib/config/twitter-tiers';

const POST_USAGE_KEY = 'twitter_post_usage';
const READ_USAGE_KEY = 'twitter_read_usage';

/**
 * GET /api/twitter/usage
 * Get current Twitter API usage data for both posts and reads
 */
export async function GET() {
  try {
    // Fetch post usage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const postUsageResult = await (db as any)
      .select()
      .from(appSettingsTable)
      .where(eq(appSettingsTable.key, POST_USAGE_KEY))
      .limit(1);

    let postUsage: TwitterUsageTracking;
    if (postUsageResult.length > 0) {
      postUsage = JSON.parse(postUsageResult[0].value);
      // Convert date strings back to Date objects
      postUsage.last15Minutes.windowStart = new Date(postUsage.last15Minutes.windowStart);
      postUsage.lastHour.windowStart = new Date(postUsage.lastHour.windowStart);
      postUsage.last24Hours.windowStart = new Date(postUsage.last24Hours.windowStart);
      postUsage.lastMonth.windowStart = new Date(postUsage.lastMonth.windowStart);
      postUsage.lastUpdated = new Date(postUsage.lastUpdated);
      // Reset expired windows
      postUsage = resetExpiredWindows(postUsage);
    } else {
      postUsage = createEmptyUsage();
    }

    // Fetch read usage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const readUsageResult = await (db as any)
      .select()
      .from(appSettingsTable)
      .where(eq(appSettingsTable.key, READ_USAGE_KEY))
      .limit(1);

    let readUsage: TwitterUsageTracking;
    if (readUsageResult.length > 0) {
      readUsage = JSON.parse(readUsageResult[0].value);
      // Convert date strings back to Date objects
      readUsage.last15Minutes.windowStart = new Date(readUsage.last15Minutes.windowStart);
      readUsage.lastHour.windowStart = new Date(readUsage.lastHour.windowStart);
      readUsage.last24Hours.windowStart = new Date(readUsage.last24Hours.windowStart);
      readUsage.lastMonth.windowStart = new Date(readUsage.lastMonth.windowStart);
      readUsage.lastUpdated = new Date(readUsage.lastUpdated);
      // Reset expired windows
      readUsage = resetExpiredWindows(readUsage);
    } else {
      readUsage = createEmptyUsage();
    }

    return NextResponse.json({
      postUsage,
      readUsage,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch Twitter usage data');

    // Return empty usage on error
    return NextResponse.json({
      postUsage: createEmptyUsage(),
      readUsage: createEmptyUsage(),
    });
  }
}

/**
 * POST /api/twitter/usage
 * Increment usage counter for a specific operation type
 *
 * Body: { type: 'post' | 'read' }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type } = body;

    if (type !== 'post' && type !== 'read') {
      return NextResponse.json(
        { error: 'Invalid type. Must be "post" or "read"' },
        { status: 400 }
      );
    }

    const usageKey = type === 'post' ? POST_USAGE_KEY : READ_USAGE_KEY;

    // Fetch current usage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (db as any)
      .select()
      .from(appSettingsTable)
      .where(eq(appSettingsTable.key, usageKey))
      .limit(1);

    let usage: TwitterUsageTracking;
    if (result.length > 0) {
      usage = JSON.parse(result[0].value);
      // Convert date strings back to Date objects
      usage.last15Minutes.windowStart = new Date(usage.last15Minutes.windowStart);
      usage.lastHour.windowStart = new Date(usage.lastHour.windowStart);
      usage.last24Hours.windowStart = new Date(usage.last24Hours.windowStart);
      usage.lastMonth.windowStart = new Date(usage.lastMonth.windowStart);
      usage.lastUpdated = new Date(usage.lastUpdated);
      // Reset expired windows
      usage = resetExpiredWindows(usage);
    } else {
      usage = createEmptyUsage();
    }

    // Increment all counters
    usage.last15Minutes.count += 1;
    usage.lastHour.count += 1;
    usage.last24Hours.count += 1;
    usage.lastMonth.count += 1;
    usage.lastUpdated = new Date();

    // Save back to database
    const usageJson = JSON.stringify(usage);

    if (result.length > 0) {
      // Update existing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any)
        .update(appSettingsTable)
        .set({
          value: usageJson,
          updatedAt: new Date(),
        })
        .where(eq(appSettingsTable.key, usageKey));
    } else {
      // Insert new
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any).insert(appSettingsTable).values({
        key: usageKey,
        value: usageJson,
        updatedAt: new Date(),
      });
    }

    logger.debug({ type, usage: usage.last15Minutes.count }, 'Incremented Twitter API usage');

    return NextResponse.json({
      success: true,
      usage,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to increment Twitter usage');
    return NextResponse.json(
      { error: 'Failed to increment usage' },
      { status: 500 }
    );
  }
}
