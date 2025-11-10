#!/usr/bin/env tsx
import { db } from '@/lib/db';
import { workflowsTable } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';

async function main() {
  const workflowName = "Reply to Tweets (Production)";
  const workflowFile = process.argv[2] || "/Users/kenkai/Documents/UnstableMind/social-cat/workflow/reply-to-tweets-real.json";

  console.log(`🔍 Looking for workflow: ${workflowName}`);

  // Get existing workflow
  const workflows = await db
    .select()
    .from(workflowsTable)
    .where(eq(workflowsTable.name, workflowName))
    .limit(1);

  if (workflows.length > 0) {
    const workflow = workflows[0];
    console.log(`🗑️  Deleting existing workflow: ${workflowName} (${workflow.id})`);

    await db
      .delete(workflowsTable)
      .where(eq(workflowsTable.id, workflow.id));

    console.log('✅ Workflow deleted');
  } else {
    console.log('ℹ️  No existing workflow found');
  }

  // Now import via API
  console.log(`\n📥 Importing workflow from: ${workflowFile}`);
  const workflowJson = readFileSync(workflowFile, 'utf-8');

  const response = await fetch('http://localhost:3000/api/workflows/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: workflowJson,
  });

  if (response.ok) {
    const result = await response.json();
    console.log('✅ Workflow imported successfully!');
    console.log(`   ID: ${result.workflowId}`);
    console.log(`   Name: ${result.name}`);
  } else {
    const error = await response.text();
    console.error('❌ Import failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
