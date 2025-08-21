import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterUserInput, type LoginUserInput } from '../schema';
import { registerUser, loginUser, getUserById } from '../handlers/auth';
import { eq } from 'drizzle-orm';


// Test input data
const testRegisterInput: RegisterUserInput = {
  email: 'test@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe'
};

const testLoginInput: LoginUserInput = {
  email: 'test@example.com',
  password: 'password123'
};

describe('Authentication Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const result = await registerUser(testRegisterInput);

      // Validate response structure
      expect(result.user.email).toEqual('test@example.com');
      expect(result.user.first_name).toEqual('John');
      expect(result.user.last_name).toEqual('Doe');
      expect(result.user.id).toBeDefined();
      expect(result.user.created_at).toBeInstanceOf(Date);
      expect(result.user.updated_at).toBeInstanceOf(Date);
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');

      // Verify token is properly formatted (base64.hash format)
      expect(result.token.split('.')).toHaveLength(2);
      const [payloadPart, hashPart] = result.token.split('.');
      expect(payloadPart.length).toBeGreaterThan(0);
      expect(hashPart.length).toBe(32);
      
      // Verify payload contains user ID
      const payload = JSON.parse(Buffer.from(payloadPart, 'base64').toString());
      expect(payload.userId).toEqual(result.user.id);
      expect(payload.exp).toBeDefined();
      expect(payload.exp).toBeGreaterThan(Date.now());
    });

    it('should save user to database with hashed password', async () => {
      const result = await registerUser(testRegisterInput);

      // Query database directly
      const users = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, result.user.id))
        .execute();

      expect(users).toHaveLength(1);
      const savedUser = users[0];

      expect(savedUser.email).toEqual('test@example.com');
      expect(savedUser.first_name).toEqual('John');
      expect(savedUser.last_name).toEqual('Doe');
      expect(savedUser.password_hash).toBeDefined();
      expect(savedUser.password_hash).not.toEqual('password123'); // Should be hashed
      expect(savedUser.created_at).toBeInstanceOf(Date);
      expect(savedUser.updated_at).toBeInstanceOf(Date);
    });

    it('should throw error when registering with existing email', async () => {
      // Register first user
      await registerUser(testRegisterInput);

      // Try to register another user with same email
      await expect(registerUser(testRegisterInput)).rejects.toThrow(/already exists/i);
    });

    it('should handle different user data correctly', async () => {
      const differentUser: RegisterUserInput = {
        email: 'jane@example.com',
        password: 'differentpass456',
        first_name: 'Jane',
        last_name: 'Smith'
      };

      const result = await registerUser(differentUser);

      expect(result.user.email).toEqual('jane@example.com');
      expect(result.user.first_name).toEqual('Jane');
      expect(result.user.last_name).toEqual('Smith');
      expect(result.token).toBeDefined();
    });
  });

  describe('loginUser', () => {
    beforeEach(async () => {
      // Register a user for login tests
      await registerUser(testRegisterInput);
    });

    it('should login user with correct credentials', async () => {
      const result = await loginUser(testLoginInput);

      expect(result.user.email).toEqual('test@example.com');
      expect(result.user.first_name).toEqual('John');
      expect(result.user.last_name).toEqual('Doe');
      expect(result.user.id).toBeDefined();
      expect(result.user.created_at).toBeInstanceOf(Date);
      expect(result.user.updated_at).toBeInstanceOf(Date);
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');

      // Verify token is properly formatted (base64.hash format)
      expect(result.token.split('.')).toHaveLength(2);
      const [payloadPart, hashPart] = result.token.split('.');
      expect(payloadPart.length).toBeGreaterThan(0);
      expect(hashPart.length).toBe(32);
      
      // Verify payload contains user ID
      const payload = JSON.parse(Buffer.from(payloadPart, 'base64').toString());
      expect(payload.userId).toEqual(result.user.id);
      expect(payload.exp).toBeDefined();
      expect(payload.exp).toBeGreaterThan(Date.now());
    });

    it('should throw error for non-existent email', async () => {
      const invalidLogin: LoginUserInput = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      await expect(loginUser(invalidLogin)).rejects.toThrow(/invalid email or password/i);
    });

    it('should throw error for incorrect password', async () => {
      const wrongPassword: LoginUserInput = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      await expect(loginUser(wrongPassword)).rejects.toThrow(/invalid email or password/i);
    });

    it('should generate different tokens for different login sessions', async () => {
      const result1 = await loginUser(testLoginInput);
      
      // Wait a moment to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const result2 = await loginUser(testLoginInput);

      expect(result1.token).toBeDefined();
      expect(result2.token).toBeDefined();
      expect(result1.token).not.toEqual(result2.token);
      expect(result1.user.id).toEqual(result2.user.id);
    });
  });

  describe('getUserById', () => {
    let userId: number;

    beforeEach(async () => {
      // Register a user and get their ID
      const result = await registerUser(testRegisterInput);
      userId = result.user.id;
    });

    it('should return user by ID', async () => {
      const result = await getUserById(userId);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(userId);
      expect(result!.email).toEqual('test@example.com');
      expect(result!.first_name).toEqual('John');
      expect(result!.last_name).toEqual('Doe');
      expect(result!.password_hash).toBeDefined();
      expect(result!.created_at).toBeInstanceOf(Date);
      expect(result!.updated_at).toBeInstanceOf(Date);
    });

    it('should return null for non-existent user ID', async () => {
      const result = await getUserById(99999);
      expect(result).toBeNull();
    });

    it('should include password hash in User type', async () => {
      const result = await getUserById(userId);

      expect(result).not.toBeNull();
      expect(result!.password_hash).toBeDefined();
      expect(typeof result!.password_hash).toBe('string');
      expect(result!.password_hash.length).toBeGreaterThan(0);
    });

    it('should handle invalid user ID gracefully', async () => {
      const result = await getUserById(-1);
      expect(result).toBeNull();
    });
  });

  describe('Password Security', () => {
    it('should hash passwords differently for same input', async () => {
      const user1 = await registerUser({
        email: 'user1@example.com',
        password: 'samepassword',
        first_name: 'User',
        last_name: 'One'
      });

      const user2 = await registerUser({
        email: 'user2@example.com',
        password: 'samepassword',
        first_name: 'User',
        last_name: 'Two'
      });

      // Get users from database to check password hashes
      const savedUser1 = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, user1.user.id))
        .execute();

      const savedUser2 = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, user2.user.id))
        .execute();

      expect(savedUser1[0].password_hash).toBeDefined();
      expect(savedUser2[0].password_hash).toBeDefined();
      expect(savedUser1[0].password_hash).not.toEqual(savedUser2[0].password_hash);
    });

    it('should verify correct password after registration', async () => {
      await registerUser(testRegisterInput);

      // Should be able to login with the same password
      const loginResult = await loginUser(testLoginInput);
      expect(loginResult.user.email).toEqual(testRegisterInput.email);
    });
  });
});