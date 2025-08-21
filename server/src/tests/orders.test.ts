import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, cartItemsTable, ordersTable, orderItemsTable } from '../db/schema';
import { type CreateOrderInput, type CheckoutInput, type OrderStatus } from '../schema';
import { createOrder, processCheckout, getOrdersByUserId, getOrderById, updateOrderStatus } from '../handlers/orders';
import { eq } from 'drizzle-orm';

describe('Orders Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data setup
  let testUserId: number;
  let testProductId1: number;
  let testProductId2: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test products
    const product1Result = await db.insert(productsTable)
      .values({
        name: 'Test Product 1',
        description: 'Product for testing',
        price: '29.99',
        category: 'Electronics',
        image_url: 'https://example.com/product1.jpg',
        stock_quantity: 50,
        is_active: true
      })
      .returning()
      .execute();
    testProductId1 = product1Result[0].id;

    const product2Result = await db.insert(productsTable)
      .values({
        name: 'Test Product 2',
        description: 'Another test product',
        price: '19.99',
        category: 'Books',
        image_url: 'https://example.com/product2.jpg',
        stock_quantity: 25,
        is_active: true
      })
      .returning()
      .execute();
    testProductId2 = product2Result[0].id;
  });

  describe('createOrder', () => {
    const testCreateOrderInput: CreateOrderInput = {
      user_id: 0, // Will be set in test
      shipping_address: '123 Main St, City, State 12345',
      billing_address: '123 Main St, City, State 12345',
      cart_items: [
        { product_id: 0, quantity: 2 }, // Will be set in test
        { product_id: 0, quantity: 1 }  // Will be set in test
      ]
    };

    it('should create order with multiple items', async () => {
      const input = {
        ...testCreateOrderInput,
        user_id: testUserId,
        cart_items: [
          { product_id: testProductId1, quantity: 2 },
          { product_id: testProductId2, quantity: 1 }
        ]
      };

      const result = await createOrder(input);

      // Validate order fields
      expect(result.id).toBeDefined();
      expect(result.user_id).toEqual(testUserId);
      expect(result.total_amount).toEqual(79.97); // (29.99 * 2) + (19.99 * 1)
      expect(result.status).toEqual('pending');
      expect(result.shipping_address).toEqual(input.shipping_address);
      expect(result.billing_address).toEqual(input.billing_address);
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create order items in database', async () => {
      const input = {
        ...testCreateOrderInput,
        user_id: testUserId,
        cart_items: [
          { product_id: testProductId1, quantity: 2 },
          { product_id: testProductId2, quantity: 1 }
        ]
      };

      const order = await createOrder(input);

      // Check order items were created
      const orderItems = await db.select()
        .from(orderItemsTable)
        .where(eq(orderItemsTable.order_id, order.id))
        .execute();

      expect(orderItems).toHaveLength(2);
      
      const item1 = orderItems.find(item => item.product_id === testProductId1);
      const item2 = orderItems.find(item => item.product_id === testProductId2);

      expect(item1).toBeDefined();
      expect(item1!.quantity).toEqual(2);
      expect(parseFloat(item1!.price)).toEqual(29.99);

      expect(item2).toBeDefined();
      expect(item2!.quantity).toEqual(1);
      expect(parseFloat(item2!.price)).toEqual(19.99);
    });

    it('should update product stock quantities', async () => {
      const input = {
        ...testCreateOrderInput,
        user_id: testUserId,
        cart_items: [
          { product_id: testProductId1, quantity: 2 },
          { product_id: testProductId2, quantity: 1 }
        ]
      };

      await createOrder(input);

      // Check stock quantities were updated
      const products = await db.select()
        .from(productsTable)
        .where(eq(productsTable.id, testProductId1))
        .execute();

      expect(products[0].stock_quantity).toEqual(48); // 50 - 2

      const products2 = await db.select()
        .from(productsTable)
        .where(eq(productsTable.id, testProductId2))
        .execute();

      expect(products2[0].stock_quantity).toEqual(24); // 25 - 1
    });

    it('should throw error for non-existent user', async () => {
      const input = {
        ...testCreateOrderInput,
        user_id: 9999,
        cart_items: [{ product_id: testProductId1, quantity: 1 }]
      };

      await expect(createOrder(input)).rejects.toThrow(/user not found/i);
    });

    it('should throw error for non-existent product', async () => {
      const input = {
        ...testCreateOrderInput,
        user_id: testUserId,
        cart_items: [{ product_id: 9999, quantity: 1 }]
      };

      await expect(createOrder(input)).rejects.toThrow(/product.*not found/i);
    });

    it('should throw error for insufficient stock', async () => {
      const input = {
        ...testCreateOrderInput,
        user_id: testUserId,
        cart_items: [{ product_id: testProductId1, quantity: 100 }]
      };

      await expect(createOrder(input)).rejects.toThrow(/insufficient stock/i);
    });

    it('should throw error for inactive product', async () => {
      // Deactivate product
      await db.update(productsTable)
        .set({ is_active: false })
        .where(eq(productsTable.id, testProductId1))
        .execute();

      const input = {
        ...testCreateOrderInput,
        user_id: testUserId,
        cart_items: [{ product_id: testProductId1, quantity: 1 }]
      };

      await expect(createOrder(input)).rejects.toThrow(/product.*not found or inactive/i);
    });
  });

  describe('processCheckout', () => {
    const testCheckoutInput: CheckoutInput = {
      user_id: 0, // Will be set in test
      shipping_address: '123 Main St, City, State 12345',
      billing_address: '123 Main St, City, State 12345',
      payment_method: 'credit_card'
    };

    it('should process checkout from cart items', async () => {
      // Add items to cart
      await db.insert(cartItemsTable)
        .values([
          {
            user_id: testUserId,
            product_id: testProductId1,
            quantity: 2
          },
          {
            user_id: testUserId,
            product_id: testProductId2,
            quantity: 1
          }
        ])
        .execute();

      const input = {
        ...testCheckoutInput,
        user_id: testUserId
      };

      const result = await processCheckout(input);

      expect(result.id).toBeDefined();
      expect(result.user_id).toEqual(testUserId);
      expect(result.total_amount).toEqual(79.97);
      expect(result.status).toEqual('pending');
    });

    it('should clear cart after successful checkout', async () => {
      // Add items to cart
      await db.insert(cartItemsTable)
        .values([
          {
            user_id: testUserId,
            product_id: testProductId1,
            quantity: 1
          }
        ])
        .execute();

      const input = {
        ...testCheckoutInput,
        user_id: testUserId
      };

      await processCheckout(input);

      // Verify cart is empty
      const cartItems = await db.select()
        .from(cartItemsTable)
        .where(eq(cartItemsTable.user_id, testUserId))
        .execute();

      expect(cartItems).toHaveLength(0);
    });

    it('should throw error for empty cart', async () => {
      const input = {
        ...testCheckoutInput,
        user_id: testUserId
      };

      await expect(processCheckout(input)).rejects.toThrow(/cart is empty/i);
    });
  });

  describe('getOrdersByUserId', () => {
    it('should return orders with items for user', async () => {
      // Create an order first
      const createOrderInput: CreateOrderInput = {
        user_id: testUserId,
        shipping_address: '123 Main St',
        billing_address: '456 Oak Ave',
        cart_items: [
          { product_id: testProductId1, quantity: 2 }
        ]
      };

      const createdOrder = await createOrder(createOrderInput);

      const result = await getOrdersByUserId(testUserId);

      expect(result).toHaveLength(1);
      expect(result[0].order.id).toEqual(createdOrder.id);
      expect(result[0].order.user_id).toEqual(testUserId);
      expect(result[0].order.total_amount).toEqual(59.98);
      expect(result[0].items).toHaveLength(1);
      expect(result[0].items[0].product_id).toEqual(testProductId1);
      expect(result[0].items[0].quantity).toEqual(2);
      expect(result[0].items[0].product.name).toEqual('Test Product 1');
    });

    it('should return empty array for user with no orders', async () => {
      const result = await getOrdersByUserId(testUserId);
      expect(result).toHaveLength(0);
    });

    it('should return orders sorted by creation date descending', async () => {
      // Create multiple orders
      const order1Input: CreateOrderInput = {
        user_id: testUserId,
        shipping_address: '123 Main St',
        billing_address: '123 Main St',
        cart_items: [{ product_id: testProductId1, quantity: 1 }]
      };

      const order2Input: CreateOrderInput = {
        user_id: testUserId,
        shipping_address: '456 Oak Ave',
        billing_address: '456 Oak Ave',
        cart_items: [{ product_id: testProductId2, quantity: 1 }]
      };

      const createdOrder1 = await createOrder(order1Input);
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      const createdOrder2 = await createOrder(order2Input);

      const result = await getOrdersByUserId(testUserId);

      expect(result).toHaveLength(2);
      // Most recent order should be first
      expect(result[0].order.id).toEqual(createdOrder2.id);
      expect(result[1].order.id).toEqual(createdOrder1.id);
    });
  });

  describe('getOrderById', () => {
    it('should return order with items for valid order and user', async () => {
      // Create an order
      const createOrderInput: CreateOrderInput = {
        user_id: testUserId,
        shipping_address: '123 Main St',
        billing_address: '456 Oak Ave',
        cart_items: [
          { product_id: testProductId1, quantity: 2 },
          { product_id: testProductId2, quantity: 1 }
        ]
      };

      const createdOrder = await createOrder(createOrderInput);

      const result = await getOrderById(createdOrder.id, testUserId);

      expect(result).toBeDefined();
      expect(result!.order.id).toEqual(createdOrder.id);
      expect(result!.order.user_id).toEqual(testUserId);
      expect(result!.items).toHaveLength(2);
      
      const item1 = result!.items.find(item => item.product_id === testProductId1);
      const item2 = result!.items.find(item => item.product_id === testProductId2);

      expect(item1).toBeDefined();
      expect(item1!.quantity).toEqual(2);
      expect(item1!.product.name).toEqual('Test Product 1');

      expect(item2).toBeDefined();
      expect(item2!.quantity).toEqual(1);
      expect(item2!.product.name).toEqual('Test Product 2');
    });

    it('should return null for non-existent order', async () => {
      const result = await getOrderById(9999, testUserId);
      expect(result).toBeNull();
    });

    it('should return null for order belonging to different user', async () => {
      // Create another user
      const anotherUserResult = await db.insert(usersTable)
        .values({
          email: 'another@example.com',
          password_hash: 'hashed_password',
          first_name: 'Jane',
          last_name: 'Smith'
        })
        .returning()
        .execute();
      const anotherUserId = anotherUserResult[0].id;

      // Create order for another user
      const createOrderInput: CreateOrderInput = {
        user_id: anotherUserId,
        shipping_address: '123 Main St',
        billing_address: '123 Main St',
        cart_items: [{ product_id: testProductId1, quantity: 1 }]
      };

      const createdOrder = await createOrder(createOrderInput);

      // Try to access with different user
      const result = await getOrderById(createdOrder.id, testUserId);
      expect(result).toBeNull();
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      // Create an order
      const createOrderInput: CreateOrderInput = {
        user_id: testUserId,
        shipping_address: '123 Main St',
        billing_address: '123 Main St',
        cart_items: [{ product_id: testProductId1, quantity: 1 }]
      };

      const createdOrder = await createOrder(createOrderInput);
      const newStatus: OrderStatus = 'processing';

      const result = await updateOrderStatus(createdOrder.id, newStatus);

      expect(result).toBeDefined();
      expect(result!.id).toEqual(createdOrder.id);
      expect(result!.status).toEqual('processing');
      expect(result!.updated_at).toBeInstanceOf(Date);
      expect(result!.updated_at.getTime()).toBeGreaterThan(createdOrder.updated_at.getTime());
    });

    it('should return null for non-existent order', async () => {
      const result = await updateOrderStatus(9999, 'processing');
      expect(result).toBeNull();
    });

    it('should handle all valid order statuses', async () => {
      // Create an order
      const createOrderInput: CreateOrderInput = {
        user_id: testUserId,
        shipping_address: '123 Main St',
        billing_address: '123 Main St',
        cart_items: [{ product_id: testProductId1, quantity: 1 }]
      };

      const createdOrder = await createOrder(createOrderInput);

      const statuses: OrderStatus[] = ['processing', 'shipped', 'delivered', 'cancelled'];

      for (const status of statuses) {
        const result = await updateOrderStatus(createdOrder.id, status);
        expect(result!.status).toEqual(status);
      }
    });
  });
});