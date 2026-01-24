#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Migration Script: Old Architecture → New Architecture
 *
 * This script:
 * 1. Deletes all existing data from the DynamoDB table
 * 2. Initializes HEAD pointers for a test user
 * 3. Creates an initial VALUES revision with sample drivers
 *
 * Usage:
 *   cd services/api
 *   AWS_PROFILE=dev-time-management TABLE_NAME=TimeManagementApp-Dev-data \
 *   USER_ID=<your-cognito-user-id> \
 *   npx tsx ../../scripts/migrate-to-new-architecture.ts
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  BatchWriteCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

// Configuration from environment
const TABLE_NAME = process.env.TABLE_NAME || 'TimeManagementApp-Dev-data';
const USER_ID = process.env.USER_ID;
const AWS_REGION = process.env.AWS_REGION || 'us-east-2';

if (!USER_ID) {
  console.error('❌ USER_ID environment variable is required');
  console.error('   Get your user ID from Cognito or by signing in and checking localStorage');
  process.exit(1);
}

const client = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

console.log('🚀 Database Migration: Old → New Architecture');
console.log('━'.repeat(60));
console.log(`📊 Table: ${TABLE_NAME}`);
console.log(`👤 User: ${USER_ID}`);
console.log(`🌍 Region: ${AWS_REGION}`);
console.log('━'.repeat(60));

// Key generation helpers (inlined to avoid import issues)
function getUserPK(userId: string): string {
  return `U#${userId}`;
}

function getValuesHeadSK(): string {
  return 'HEAD#VALUES';
}

function getValuesRevisionSK(timestamp: string, revId: string): string {
  return `REV#VALUES#${timestamp}#${revId}`;
}

function getValuesSnapshotPK(userId: string, revId: string): string {
  return `U#${userId}#VALUES#${revId}`;
}

function getNodeSK(nodeId: string): string {
  return `NODE#${nodeId}`;
}

function createRevisionIdentifier(): { revId: string; timestamp: string } {
  return {
    revId: randomUUID(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Step 1: Delete all existing data
 */
async function deleteAllData(): Promise<void> {
  console.log('\n📦 Step 1: Scanning existing data...');

  const scanResult = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
    })
  );

  const items = scanResult.Items || [];
  console.log(`   Found ${items.length} items to delete`);

  if (items.length === 0) {
    console.log('   ✓ Table is already empty');
    return;
  }

  // Delete in batches of 25 (DynamoDB limit)
  const batches: Array<Record<string, unknown>[]> = [];
  for (let i = 0; i < items.length; i += 25) {
    batches.push(items.slice(i, i + 25));
  }

  console.log(`   Deleting in ${batches.length} batch(es)...`);

  for (const [index, batch] of batches.entries()) {
    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: batch.map(item => ({
            DeleteRequest: {
              Key: {
                PK: item.PK,
                SK: item.SK,
              },
            },
          })),
        },
      })
    );
    console.log(`   ✓ Deleted batch ${index + 1}/${batches.length}`);
  }

  console.log('   ✅ All existing data deleted');
}

/**
 * Step 2: Initialize HEAD pointer
 */
async function initializeHead(revId: string, timestamp: string): Promise<void> {
  console.log('\n🎯 Step 2: Initializing HEAD pointer...');

  const head = {
    PK: getUserPK(USER_ID!),
    SK: getValuesHeadSK(),
    headRevId: revId,
    headRevTs: timestamp,
    updatedAt: timestamp,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: head,
    })
  );

  console.log(`   ✓ HEAD → ${revId}`);
  console.log('   ✅ HEAD pointer created');
}

/**
 * Step 3: Create initial revision record
 */
async function createInitialRevision(revId: string, timestamp: string): Promise<void> {
  console.log('\n📝 Step 3: Creating initial revision record...');

  const revision = {
    PK: getUserPK(USER_ID!),
    SK: getValuesRevisionSK(timestamp, revId),
    revId,
    revTs: timestamp,
    message: 'Initial migration to new architecture',
    source: 'weekly_review',
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: revision,
    })
  );

  console.log(`   ✓ Revision: ${revId}`);
  console.log('   ✅ Revision record created');
}

/**
 * Step 4: Create sample drivers in the snapshot
 */
async function createSampleDrivers(revId: string, timestamp: string): Promise<void> {
  console.log('\n🌱 Step 4: Creating sample drivers...');

  const snapshotPK = getValuesSnapshotPK(USER_ID!, revId);

  // Sample Driver 1: Be more productive
  const driver1Id = 'driver-productivity-001';
  const driver1 = {
    PK: snapshotPK,
    SK: getNodeSK(driver1Id),
    nodeType: 'DRIVER',
    id: driver1Id,
    userId: USER_ID,
    title: 'Be more productive',
    notes:
      'I want to learn to use time management to help prevent procrastination and work more effectively.',
    createdAt: timestamp,
    archived: false,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: driver1,
    })
  );
  console.log(`   ✓ Driver: ${driver1.title}`);

  // Sample Driver 2: Complete Sprint 6
  const driver2Id = 'driver-sprint6-001';
  const driver2 = {
    PK: snapshotPK,
    SK: getNodeSK(driver2Id),
    nodeType: 'DRIVER',
    id: driver2Id,
    userId: USER_ID,
    title: 'Complete Sprint 6 successfully',
    notes: 'Implement the new database architecture and get weekly reviews working.',
    createdAt: timestamp,
    archived: false,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: driver2,
    })
  );
  console.log(`   ✓ Driver: ${driver2.title}`);

  console.log('   ✅ Sample drivers created');
}

/**
 * Main migration function
 */
async function migrate(): Promise<void> {
  try {
    const { revId, timestamp } = createRevisionIdentifier();

    await deleteAllData();
    await initializeHead(revId, timestamp);
    await createInitialRevision(revId, timestamp);
    await createSampleDrivers(revId, timestamp);

    console.log('\n' + '━'.repeat(60));
    console.log('✅ Migration Complete!');
    console.log('━'.repeat(60));
    console.log('\n📋 Summary:');
    console.log(`   Revision ID: ${revId}`);
    console.log(`   Timestamp: ${timestamp}`);
    console.log(`   Sample Drivers: 2`);
    console.log('\n🎉 Database is ready for the new architecture!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate();
