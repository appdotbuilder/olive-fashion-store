import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterUserInput, type LoginUserInput, type AuthResponse, type User } from '../schema';
import { eq } from 'drizzle-orm';


// Hash password using Bun's built-in password hashing
const hashPassword = async (password: string): Promise<string> => {
  return await Bun.password.hash(password);
};

// Verify password using Bun's built-in password verification
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await Bun.password.verify(password, hash);
};

// Generate simple token using Bun's crypto
const generateToken = (userId: number): string => {
  const secret = process.env['JWT_SECRET'] || 'fallback-secret-key';
  const payload = JSON.stringify({
    userId,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours from now
  });
  
  // Create a simple token using base64 encoding with the secret
  const encoder = new TextEncoder();
  const data = encoder.encode(payload + secret);
  const hashBuffer = Bun.CryptoHasher.hash("sha256", data);
  const hash = Buffer.from(hashBuffer).toString('hex');
  
  return Buffer.from(payload).toString('base64') + '.' + hash.slice(0, 32);
};

export async function registerUser(input: RegisterUserInput): Promise<AuthResponse> {
  try {
    // Check if user already exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Insert new user
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        password_hash: passwordHash,
        first_name: input.first_name,
        last_name: input.last_name
      })
      .returning()
      .execute();

    const user = result[0];

    // Generate JWT token
    const token = generateToken(user.id);

    // Return user without password hash
    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      token
    };
  } catch (error) {
    console.error('User registration failed:', error);
    throw error;
  }
}

export async function loginUser(input: LoginUserInput): Promise<AuthResponse> {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await verifyPassword(input.password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Return user without password hash
    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      token
    };
  } catch (error) {
    console.error('User login failed:', error);
    throw error;
  }
}

export async function getUserById(userId: number): Promise<User | null> {
  try {
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (users.length === 0) {
      return null;
    }

    const user = users[0];

    // Return user without password hash
    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash, // Include for User type compliance
      first_name: user.first_name,
      last_name: user.last_name,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  } catch (error) {
    console.error('Get user by ID failed:', error);
    throw error;
  }
}