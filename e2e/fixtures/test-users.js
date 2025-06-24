// Test user fixtures for E2E tests
export const testUsers = {
  admin: {
    username: 'admin',
    password: 'admin123',
    priorityLevel: 3,
    email: 'admin@test.com'
  },
  supervisor: {
    username: 'supervisor',
    password: 'super123',
    priorityLevel: 2,
    email: 'supervisor@test.com'
  },
  user: {
    username: 'testuser',
    password: 'user123',
    priorityLevel: 1,
    email: 'user@test.com'
  }
};

export const invalidUser = {
  username: 'invalid',
  password: 'wrong123'
};