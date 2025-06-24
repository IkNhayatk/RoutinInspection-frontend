import { testUsers } from '../fixtures/test-users.js';

/**
 * Create test users via API for e2e testing
 * @param {string} baseURL - The base URL for the API (e.g., 'http://localhost:3001')
 */
export async function createTestUsers(baseURL = 'http://localhost:3001') {
  const apiUrl = `${baseURL}/api/register`;
  
  const usersToCreate = [
    {
      UserName: '測試管理員',
      UserID: testUsers.admin.username,
      Password: testUsers.admin.password,
      Email: testUsers.admin.email,
      PriorityLevel: testUsers.admin.priorityLevel,
      Position: '系統管理員',
      Department: '測試部門',
      isAtWork: true
    },
    {
      UserName: '測試督導',
      UserID: testUsers.supervisor.username,
      Password: testUsers.supervisor.password,
      Email: testUsers.supervisor.email,
      PriorityLevel: testUsers.supervisor.priorityLevel,
      Position: '督導',
      Department: '測試部門',
      isAtWork: true
    },
    {
      UserName: '測試用戶',
      UserID: testUsers.user.username,
      Password: testUsers.user.password,
      Email: testUsers.user.email,
      PriorityLevel: testUsers.user.priorityLevel,
      Position: '工程師',
      Department: '測試部門',
      isAtWork: true
    }
  ];

  const results = [];
  
  for (const userData of usersToCreate) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log(`✓ Created test user: ${userData.UserID}`);
        results.push({ success: true, user: userData.UserID });
      } else {
        // If user already exists, that's okay for testing
        if (result.message && result.message.includes('已被使用')) {
          console.log(`- Test user already exists: ${userData.UserID}`);
          results.push({ success: true, user: userData.UserID, exists: true });
        } else {
          console.error(`✗ Failed to create user ${userData.UserID}:`, result.message);
          results.push({ success: false, user: userData.UserID, error: result.message });
        }
      }
    } catch (error) {
      console.error(`✗ Error creating user ${userData.UserID}:`, error.message);
      results.push({ success: false, user: userData.UserID, error: error.message });
    }
  }
  
  return results;
}

/**
 * Setup function to be called before tests
 */
export async function setupTestEnvironment() {
  console.log('Setting up test environment...');
  const results = await createTestUsers();
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Test user setup complete: ${successful} successful, ${failed} failed`);
  
  if (failed > 0) {
    console.warn('Some test users could not be created. Tests may fail.');
  }
  
  return results;
}