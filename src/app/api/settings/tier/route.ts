import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appSettingsTable } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { TwitterTier } from '@/lib/config/twitter-tiers';

const TIER_SETTING_KEY = 'twitter_api_tier';

/**
 * GET /api/settings/tier
 * Get the user's current Twitter API subscription tier
 */
export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (db as any)
      .select()
      .from(appSettingsTable)
      .where(eq(appSettingsTable.key, TIER_SETTING_KEY))
      .limit(1);

    const tier: TwitterTier = result[0]?.value as TwitterTier || 'free';

    return NextResponse.json({ tier });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch tier setting');
    return NextResponse.json(
      { error: 'Failed to fetch tier setting', tier: 'free' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/tier
 * Update the user's Twitter API subscription tier
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tier } = body;

    // Validate tier
    const validTiers: TwitterTier[] = ['free', 'basic', 'pro', 'enterprise'];
    if (!tier || !validTiers.includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be one of: free, basic, pro, enterprise' },
        { status: 400 }
      );
    }

    // Check if setting exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (db as any)
      .select()
      .from(appSettingsTable)
      .where(eq(appSettingsTable.key, TIER_SETTING_KEY))
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any)
        .update(appSettingsTable)
        .set({
          value: tier,
          updatedAt: new Date(),
        })
        .where(eq(appSettingsTable.key, TIER_SETTING_KEY));
    } else {
      // Insert new
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any).insert(appSettingsTable).values({
        key: TIER_SETTING_KEY,
        value: tier,
        updatedAt: new Date(),
      });
    }

    logger.info({ tier }, 'Updated Twitter API tier setting');

    return NextResponse.json({
      success: true,
      tier,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to update tier setting');
    return NextResponse.json(
      { error: 'Failed to update tier setting' },
      { status: 500 }
    );
  }
}
