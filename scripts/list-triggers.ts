#!/usr/bin/env tsx

/**
 * List all available workflow trigger types with descriptions and config requirements
 */

interface TriggerInfo {
  type: string;
  description: string;
  configRequirements: string[];
  example: {
    type: string;
    config: Record<string, unknown>;
  };
}

const triggers: TriggerInfo[] = [
  {
    type: 'manual',
    description: 'Run on demand via UI or API',
    configRequirements: [],
    example: {
      type: 'manual',
      config: {}
    }
  },
  {
    type: 'chat',
    description: 'Interactive conversation trigger (for chatbots)',
    configRequirements: ['inputVariable - Variable name to store user message'],
    example: {
      type: 'chat',
      config: {
        inputVariable: 'userMessage'
      }
    }
  },
  {
    type: 'cron',
    description: 'Scheduled execution (cron syntax)',
    configRequirements: ['schedule - Cron expression (e.g., "0 9 * * *" for daily at 9 AM)'],
    example: {
      type: 'cron',
      config: {
        schedule: '0 9 * * *',
        timezone: 'America/New_York'
      }
    }
  },
  {
    type: 'webhook',
    description: 'HTTP endpoint trigger (POST requests)',
    configRequirements: [],
    example: {
      type: 'webhook',
      config: {
        method: 'POST'
      }
    }
  },
  {
    type: 'telegram',
    description: 'Telegram bot message trigger',
    configRequirements: ['botToken - Telegram bot token from @BotFather'],
    example: {
      type: 'telegram',
      config: {
        botToken: '{{credential.telegram_bot_token}}',
        inputVariable: 'telegramMessage'
      }
    }
  },
  {
    type: 'discord',
    description: 'Discord bot message trigger',
    configRequirements: ['botToken - Discord bot token', 'channelId - Discord channel ID'],
    example: {
      type: 'discord',
      config: {
        botToken: '{{credential.discord_bot_token}}',
        channelId: 'YOUR_CHANNEL_ID',
        inputVariable: 'discordMessage'
      }
    }
  }
];

function main() {
  console.log('\n📋 Available Workflow Triggers\n');
  console.log('='.repeat(80));

  triggers.forEach((trigger, index) => {
    console.log(`\n${index + 1}. ${trigger.type.toUpperCase()}`);
    console.log(`   ${trigger.description}`);

    if (trigger.configRequirements.length > 0) {
      console.log(`\n   Required config:`);
      trigger.configRequirements.forEach(req => {
        console.log(`   • ${req}`);
      });
    }

    console.log(`\n   Example:`);
    console.log(`   ${JSON.stringify(trigger.example, null, 2).split('\n').join('\n   ')}`);

    if (index < triggers.length - 1) {
      console.log('\n' + '-'.repeat(80));
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('\n💡 Tip: Use these trigger configurations in your workflow JSON');
  console.log('   Trigger goes at TOP LEVEL (same level as config, NOT inside it)\n');
}

main();
