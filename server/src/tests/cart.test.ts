import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, cartItemsTable } from '../db/schema';
import { type AddToCartInput, type UpdateCartItemInput } from '../schema';
import { 
  getCartByUserId, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart 
} from '../handlers/cart';
import { eq } from 'drizzle-orm';

describe('Cart Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test user
  const createTestUser = async () => {
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();
    return users[0];
  };

  // Helper function to create test product
  const createTestProduct = async (overrides = {}) => {
    const products = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        price: '29.99',
        category: 'Electronics',
        image_url: 'https://example.com/image.jpg',
        stock_quantity: 10,
        is_active: true,
        ...overrides
      })
      .returning()
      .execute();
    return products[0];
  };

  describe('getCartByUserId', () => {
    it('should return empty cart for user with no items', async () => {
      const user = await createTestUser();
      
      const result = await getCartByUserId(user.id);

      expect(result.items).toHaveLength(0);
      expect(result.total_amount).toBe(0);
    });

    it('should return cart with items and correct total', async () => {
      const user = await createTestUser();
      const product1 = await createTestProduct({ price: '10.50' });
      const product2 = await createTestProduct({ 
        name: 'Another Product',
        price: '25.75'
      });

      // Add items to cart directly
      await db.insert(cartItemsTable)
        .values([
          {
            user_id: user.id,
            product_id: product1.id,
            quantity: 2
          },
          {
            user_id: user.id,
            product_id: product2.id,
            quantity: 1
          }
        ])
        .execute();

      const result = await getCartByUserId(user.id);

      expect(result.items).toHaveLength(2);
      expect(result.items[0].product.price).toBe(10.50);
      expect(result.items[0].quantity).toBe(2);
      expect(result.items[1].product.price).toBe(25.75);
      expect(result.items[1].quantity).toBe(1);
      
      // Total: (10.50 * 2) + (25.75 * 1) = 46.75
      expect(result.total_amount).toBe(46.75);
    });

    it('should include product details in cart items', async () => {
      const user = await createTestUser();
      const product = await createTestProduct();

      await db.insert(cartItemsTable)
        .values({
          user_id: user.id,
          product_id: product.id,
          quantity: 1
        })
        .execute();

      const result = await getCartByUserId(user.id);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].product.name).toBe('Test Product');
      expect(result.items[0].product.category).toBe('Electronics');
      expect(result.items[0].product.is_active).toBe(true);
      expect(typeof result.items[0].product.price).toBe('number');
    });
  });

  describe('addToCart', () => {
    it('should add new item to cart', async () => {
      const user = await createTestUser();
      const product = await createTestProduct();

      const input: AddToCartInput = {
        user_id: user.id,
        product_id: product.id,
        quantity: 3
      };

      const result = await addToCart(input);

      expect(result.user_id).toBe(user.id);
      expect(result.product_id).toBe(product.id);
      expect(result.quantity).toBe(3);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should update quantity if product already in cart', async () => {
      const user = await createTestUser();
      const product = await createTestProduct();

      // Add initial item
      await db.insert(cartItemsTable)
        .values({
          user_id: user.id,
          product_id: product.id,
          quantity: 2
        })
        .execute();

      const input: AddToCartInput = {
        user_id: user.id,
        product_id: product.id,
        quantity: 3
      };

      const result = await addToCart(input);

      expect(result.quantity).toBe(5); // 2 + 3
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should throw error for non-existent user', async () => {
      const product = await createTestProduct();

      const input: AddToCartInput = {
        user_id: 999,
        product_id: product.id,
        quantity: 1
      };

      expect(addToCart(input)).rejects.toThrow(/user not found/i);
    });

    it('should throw error for non-existent product', async () => {
      const user = await createTestUser();

      const input: AddToCartInput = {
        user_id: user.id,
        product_id: 999,
        quantity: 1
      };

      expect(addToCart(input)).rejects.toThrow(/product not found/i);
    });

    it('should throw error for inactive product', async () => {
      const user = await createTestUser();
      const product = await createTestProduct({ is_active: false });

      const input: AddToCartInput = {
        user_id: user.id,
        product_id: product.id,
        quantity: 1
      };

      expect(addToCart(input)).rejects.toThrow(/product not found or inactive/i);
    });
  });

  describe('updateCartItem', () => {
    it('should update cart item quantity', async () => {
      const user = await createTestUser();
      const product = await createTestProduct();

      // Create initial cart item
      const cartItems = await db.insert(cartItemsTable)
        .values({
          user_id: user.id,
          product_id: product.id,
          quantity: 2
        })
        .returning()
        .execute();

      const input: UpdateCartItemInput = {
        id: cartItems[0].id,
        quantity: 5
      };

      const result = await updateCartItem(input);

      expect(result).not.toBeNull();
      expect(result!.quantity).toBe(5);
      expect(result!.updated_at).toBeInstanceOf(Date);
    });

    it('should return null for non-existent cart item', async () => {
      const input: UpdateCartItemInput = {
        id: 999,
        quantity: 5
      };

      const result = await updateCartItem(input);

      expect(result).toBeNull();
    });

    it('should save updated quantity to database', async () => {
      const user = await createTestUser();
      const product = await createTestProduct();

      const cartItems = await db.insert(cartItemsTable)
        .values({
          user_id: user.id,
          product_id: product.id,
          quantity: 2
        })
        .returning()
        .execute();

      const input: UpdateCartItemInput = {
        id: cartItems[0].id,
        quantity: 8
      };

      await updateCartItem(input);

      // Verify in database
      const updatedItem = await db.select()
        .from(cartItemsTable)
        .where(eq(cartItemsTable.id, cartItems[0].id))
        .execute();

      expect(updatedItem).toHaveLength(1);
      expect(updatedItem[0].quantity).toBe(8);
    });
  });

  describe('removeFromCart', () => {
    it('should remove cart item for correct user', async () => {
      const user = await createTestUser();
      const product = await createTestProduct();

      const cartItems = await db.insert(cartItemsTable)
        .values({
          user_id: user.id,
          product_id: product.id,
          quantity: 2
        })
        .returning()
        .execute();

      const result = await removeFromCart(cartItems[0].id, user.id);

      expect(result).toBe(true);

      // Verify item is removed from database
      const remainingItems = await db.select()
        .from(cartItemsTable)
        .where(eq(cartItemsTable.id, cartItems[0].id))
        .execute();

      expect(remainingItems).toHaveLength(0);
    });

    it('should return false for non-existent cart item', async () => {
      const user = await createTestUser();

      const result = await removeFromCart(999, user.id);

      expect(result).toBe(false);
    });

    it('should return false when user does not own cart item', async () => {
      const user1 = await createTestUser();
      const user2 = await db.insert(usersTable)
        .values({
          email: 'user2@example.com',
          password_hash: 'hashed_password',
          first_name: 'User',
          last_name: 'Two'
        })
        .returning()
        .execute();
      
      const product = await createTestProduct();

      const cartItems = await db.insert(cartItemsTable)
        .values({
          user_id: user1.id,
          product_id: product.id,
          quantity: 2
        })
        .returning()
        .execute();

      // Try to remove user1's cart item as user2
      const result = await removeFromCart(cartItems[0].id, user2[0].id);

      expect(result).toBe(false);

      // Verify item still exists
      const remainingItems = await db.select()
        .from(cartItemsTable)
        .where(eq(cartItemsTable.id, cartItems[0].id))
        .execute();

      expect(remainingItems).toHaveLength(1);
    });
  });

  describe('clearCart', () => {
    it('should remove all cart items for user', async () => {
      const user = await createTestUser();
      const product1 = await createTestProduct();
      const product2 = await createTestProduct({ name: 'Product 2' });

      // Add multiple items to cart
      await db.insert(cartItemsTable)
        .values([
          {
            user_id: user.id,
            product_id: product1.id,
            quantity: 2
          },
          {
            user_id: user.id,
            product_id: product2.id,
            quantity: 1
          }
        ])
        .execute();

      const result = await clearCart(user.id);

      expect(result).toBe(true);

      // Verify all items are removed
      const remainingItems = await db.select()
        .from(cartItemsTable)
        .where(eq(cartItemsTable.user_id, user.id))
        .execute();

      expect(remainingItems).toHaveLength(0);
    });

    it('should return false for user with empty cart', async () => {
      const user = await createTestUser();

      const result = await clearCart(user.id);

      expect(result).toBe(false);
    });

    it('should not affect other users carts', async () => {
      const user1 = await createTestUser();
      const user2 = await db.insert(usersTable)
        .values({
          email: 'user2@example.com',
          password_hash: 'hashed_password',
          first_name: 'User',
          last_name: 'Two'
        })
        .returning()
        .execute();
      
      const product = await createTestProduct();

      // Add items to both users' carts
      await db.insert(cartItemsTable)
        .values([
          {
            user_id: user1.id,
            product_id: product.id,
            quantity: 2
          },
          {
            user_id: user2[0].id,
            product_id: product.id,
            quantity: 3
          }
        ])
        .execute();

      // Clear user1's cart
      await clearCart(user1.id);

      // Verify user1's cart is empty
      const user1Items = await db.select()
        .from(cartItemsTable)
        .where(eq(cartItemsTable.user_id, user1.id))
        .execute();

      expect(user1Items).toHaveLength(0);

      // Verify user2's cart is intact
      const user2Items = await db.select()
        .from(cartItemsTable)
        .where(eq(cartItemsTable.user_id, user2[0].id))
        .execute();

      expect(user2Items).toHaveLength(1);
      expect(user2Items[0].quantity).toBe(3);
    });
  });
});