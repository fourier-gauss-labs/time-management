/**
 * POST /user/onboarding/initialize
 *
 * Initializes onboarding for a new user by creating default content.
 * Idempotent: safe to call multiple times without creating duplicates.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  createDefaultEntities,
  validateOnboardingConfig,
  getOnboardingKey,
  getDriverKey,
  getMilestoneKey,
  getActionKey,
  type OnboardingConfig,
  type OnboardingStatus,
  type UserId,
} from '@time-management/shared';
import onboardingDefaults from '../../../infra/cdk/config/onboarding-defaults.json';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || '';

/**
 * Main handler for onboarding initialization
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract user ID from Cognito authorizer
    const userId = event.requestContext.authorizer?.claims?.sub as UserId;

    if (!userId) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized: Missing user ID' }),
      };
    }

    // Check if user is already onboarded (idempotency check)
    const onboardingKey = getOnboardingKey(userId);
    const existingStatus = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: onboardingKey,
      })
    );

    if (existingStatus.Item?.isOnboarded) {
      // User already onboarded - return existing status
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'User already onboarded',
          status: existingStatus.Item,
          alreadyOnboarded: true,
        }),
      };
    }

    // Validate onboarding configuration
    validateOnboardingConfig(onboardingDefaults);
    const config = onboardingDefaults as OnboardingConfig;

    // Create default entities
    const { drivers, milestones, actions, onboardingStatus } = createDefaultEntities(
      userId,
      config
    );

    // Prepare transactional write to ensure atomicity
    const transactItems = [];

    // Add onboarding status
    transactItems.push({
      Put: {
        TableName: TABLE_NAME,
        Item: {
          ...onboardingKey,
          ...onboardingStatus,
        },
        ConditionExpression: 'attribute_not_exists(PK)',
      },
    });

    // Add all drivers
    for (const driver of drivers) {
      const key = getDriverKey(userId, driver.id);
      transactItems.push({
        Put: {
          TableName: TABLE_NAME,
          Item: {
            ...key,
            ...driver,
          },
        },
      });
    }

    // Add all milestones
    for (const milestone of milestones) {
      const driver = drivers.find(d => d.id === milestone.driverId);
      if (!driver) continue;

      const key = getMilestoneKey(userId, milestone.driverId, milestone.id);
      transactItems.push({
        Put: {
          TableName: TABLE_NAME,
          Item: {
            ...key,
            ...milestone,
          },
        },
      });
    }

    // Add all actions
    for (const action of actions) {
      const key = getActionKey(userId, action.milestoneId, action.id);
      transactItems.push({
        Put: {
          TableName: TABLE_NAME,
          Item: {
            ...key,
            ...action,
          },
        },
      });
    }

    // Execute transaction (max 100 items - we should be well under this)
    if (transactItems.length > 100) {
      throw new Error(`Too many items to write in single transaction: ${transactItems.length}`);
    }

    await docClient.send(
      new TransactWriteCommand({
        TransactItems: transactItems,
      })
    );

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Onboarding completed successfully',
        status: onboardingStatus,
        created: {
          drivers: drivers.length,
          milestones: milestones.length,
          actions: actions.length,
        },
        driverIds: drivers.map(d => d.id),
        milestoneIds: milestones.map(m => m.id),
        actionIds: actions.map(a => a.id),
      }),
    };
  } catch (error) {
    console.error('Error during onboarding initialization:', error);

    // Check if it's a conditional check failure (race condition)
    if (error instanceof Error && error.name === 'TransactionCanceledException') {
      // Likely the user was onboarded by a concurrent request
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'User already onboarded (concurrent request detected)',
          alreadyOnboarded: true,
        }),
      };
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to initialize onboarding',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}
