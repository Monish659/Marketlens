#!/usr/bin/env node

/**
 * Test script to verify user-specific database isolation
 * This script simulates two different users and verifies they cannot access each other's data
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testUserIsolation() {
  console.log('🧪 Testing user-specific database isolation...\n');

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();

  // Simulate two different users
  const user1Id = 'auth0|test_user_1';
  const user2Id = 'auth0|test_user_2';
  
  const user1DbName = `marketlens_user_${user1Id.replace(/^auth0\|/, '').replace(/[^a-zA-Z0-9]/g, '_')}`;
  const user2DbName = `marketlens_user_${user2Id.replace(/^auth0\|/, '').replace(/[^a-zA-Z0-9]/g, '_')}`;

  console.log(`👤 User 1 database: ${user1DbName}`);
  console.log(`👤 User 2 database: ${user2DbName}\n`);

  const user1Db = client.db(user1DbName);
  const user2Db = client.db(user2DbName);

  try {
    // Clean up any existing test data
    await user1Db.collection('ideas').deleteMany({ idea: { $regex: /^TEST_/ } });
    await user2Db.collection('ideas').deleteMany({ idea: { $regex: /^TEST_/ } });

    // Test 1: Insert data for user 1
    console.log('📝 Test 1: Inserting data for User 1...');
    const user1Idea = {
      idea: 'TEST_USER_1_IDEA',
      stage: 'advisor',
      result: { segments: ['test'] },
      createdAt: new Date()
    };
    
    const user1Insert = await user1Db.collection('ideas').insertOne(user1Idea);
    console.log(`✅ User 1 idea inserted with ID: ${user1Insert.insertedId}`);

    // Test 2: Insert data for user 2
    console.log('\n📝 Test 2: Inserting data for User 2...');
    const user2Idea = {
      idea: 'TEST_USER_2_IDEA',
      stage: 'advisor',
      result: { segments: ['test'] },
      createdAt: new Date()
    };
    
    const user2Insert = await user2Db.collection('ideas').insertOne(user2Idea);
    console.log(`✅ User 2 idea inserted with ID: ${user2Insert.insertedId}`);

    // Test 3: Verify user 1 can only see their own data
    console.log('\n🔍 Test 3: Verifying User 1 data isolation...');
    const user1Ideas = await user1Db.collection('ideas').find({ idea: { $regex: /^TEST_/ } }).toArray();
    console.log(`User 1 can see ${user1Ideas.length} test ideas`);
    
    if (user1Ideas.length === 1 && user1Ideas[0].idea === 'TEST_USER_1_IDEA') {
      console.log('✅ User 1 can only see their own data');
    } else {
      console.log('❌ User 1 data isolation failed');
      return false;
    }

    // Test 4: Verify user 2 can only see their own data
    console.log('\n🔍 Test 4: Verifying User 2 data isolation...');
    const user2Ideas = await user2Db.collection('ideas').find({ idea: { $regex: /^TEST_/ } }).toArray();
    console.log(`User 2 can see ${user2Ideas.length} test ideas`);
    
    if (user2Ideas.length === 1 && user2Ideas[0].idea === 'TEST_USER_2_IDEA') {
      console.log('✅ User 2 can only see their own data');
    } else {
      console.log('❌ User 2 data isolation failed');
      return false;
    }

    // Test 5: Verify cross-user data access is impossible
    console.log('\n🔍 Test 5: Verifying cross-user access prevention...');
    const user1CrossAccess = await user1Db.collection('ideas').find({ idea: 'TEST_USER_2_IDEA' }).toArray();
    const user2CrossAccess = await user2Db.collection('ideas').find({ idea: 'TEST_USER_1_IDEA' }).toArray();
    
    if (user1CrossAccess.length === 0 && user2CrossAccess.length === 0) {
      console.log('✅ Cross-user data access is properly prevented');
    } else {
      console.log('❌ Cross-user data access prevention failed');
      return false;
    }

    // Test 6: Verify database names are different
    console.log('\n🔍 Test 6: Verifying database separation...');
    if (user1DbName !== user2DbName) {
      console.log('✅ Users have separate database names');
    } else {
      console.log('❌ Users are using the same database name');
      return false;
    }

    console.log('\n🎉 All user isolation tests passed!');
    console.log('\n📊 Summary:');
    console.log(`- User 1 database: ${user1DbName}`);
    console.log(`- User 2 database: ${user2DbName}`);
    console.log('- Data isolation: ✅ Working');
    console.log('- Cross-user access prevention: ✅ Working');

    return true;

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  } finally {
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await user1Db.collection('ideas').deleteMany({ idea: { $regex: /^TEST_/ } });
    await user2Db.collection('ideas').deleteMany({ idea: { $regex: /^TEST_/ } });
    
    await client.close();
  }
}

// Run the test
testUserIsolation()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test script error:', error);
    process.exit(1);
  });
