import { db } from '../db';
import { usersTable, productsTable, cartItemsTable, ordersTable, orderItemsTable } from '../db/schema';
import { type Order, type CreateOrderInput, type CheckoutInput, type OrderWithItems, type OrderStatus } from '../schema';
import { eq, and, sql, gte } from 'drizzle-orm';

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  try {
    // Validate that user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Validate cart items and calculate total
    let totalAmount = 0;
    const orderItemsData: Array<{
      product_id: number;
      quantity: number;
      price: number;
    }> = [];

    for (const cartItem of input.cart_items) {
      // Get product details and validate availability
      const product = await db.select()
        .from(productsTable)
        .where(and(
          eq(productsTable.id, cartItem.product_id),
          eq(productsTable.is_active, true)
        ))
        .execute();

      if (product.length === 0) {
        throw new Error(`Product ${cartItem.product_id} not found or inactive`);
      }

      const productData = product[0];
      if (productData.stock_quantity < cartItem.quantity) {
        throw new Error(`Insufficient stock for product ${productData.name}. Available: ${productData.stock_quantity}, Requested: ${cartItem.quantity}`);
      }

      const itemPrice = parseFloat(productData.price);
      const itemTotal = itemPrice * cartItem.quantity;
      totalAmount += itemTotal;

      orderItemsData.push({
        product_id: cartItem.product_id,
        quantity: cartItem.quantity,
        price: itemPrice
      });
    }

    // Execute transaction to create order and order items, update stock
    const result = await db.transaction(async (tx) => {
      // Create order
      const orderResult = await tx.insert(ordersTable)
        .values({
          user_id: input.user_id,
          total_amount: totalAmount.toString(),
          status: 'pending',
          shipping_address: input.shipping_address,
          billing_address: input.billing_address
        })
        .returning()
        .execute();

      const order = orderResult[0];

      // Create order items and update product stock
      for (let i = 0; i < orderItemsData.length; i++) {
        const orderItemData = orderItemsData[i];
        const cartItem = input.cart_items[i];

        // Create order item
        await tx.insert(orderItemsTable)
          .values({
            order_id: order.id,
            product_id: orderItemData.product_id,
            quantity: orderItemData.quantity,
            price: orderItemData.price.toString()
          })
          .execute();

        // Update product stock
        await tx.update(productsTable)
          .set({
            stock_quantity: sql`${productsTable.stock_quantity} - ${cartItem.quantity}`,
            updated_at: new Date()
          })
          .where(eq(productsTable.id, orderItemData.product_id))
          .execute();
      }

      return order;
    });

    return {
      ...result,
      total_amount: parseFloat(result.total_amount)
    };
  } catch (error) {
    console.error('Order creation failed:', error);
    throw error;
  }
}

export async function processCheckout(input: CheckoutInput): Promise<Order> {
  try {
    // Get user's cart items
    const cartItems = await db.select()
      .from(cartItemsTable)
      .innerJoin(productsTable, eq(cartItemsTable.product_id, productsTable.id))
      .where(eq(cartItemsTable.user_id, input.user_id))
      .execute();

    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    // Transform cart items to create order input format
    const cartItemsForOrder = cartItems.map(item => ({
      product_id: item.cart_items.product_id,
      quantity: item.cart_items.quantity
    }));

    const createOrderInput: CreateOrderInput = {
      user_id: input.user_id,
      shipping_address: input.shipping_address,
      billing_address: input.billing_address,
      cart_items: cartItemsForOrder
    };

    // Create the order
    const order = await createOrder(createOrderInput);

    // Clear user's cart after successful order creation
    await db.delete(cartItemsTable)
      .where(eq(cartItemsTable.user_id, input.user_id))
      .execute();

    return order;
  } catch (error) {
    console.error('Checkout processing failed:', error);
    throw error;
  }
}

export async function getOrdersByUserId(userId: number): Promise<OrderWithItems[]> {
  try {
    // Get orders for the user
    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.user_id, userId))
      .orderBy(sql`${ordersTable.created_at} DESC`)
      .execute();

    const ordersWithItems: OrderWithItems[] = [];

    for (const order of orders) {
      // Get order items with product details
      const orderItems = await db.select()
        .from(orderItemsTable)
        .innerJoin(productsTable, eq(orderItemsTable.product_id, productsTable.id))
        .where(eq(orderItemsTable.order_id, order.id))
        .execute();

      const items = orderItems.map(item => ({
        id: item.order_items.id,
        order_id: item.order_items.order_id,
        product_id: item.order_items.product_id,
        quantity: item.order_items.quantity,
        price: parseFloat(item.order_items.price),
        created_at: item.order_items.created_at,
        product: {
          ...item.products,
          price: parseFloat(item.products.price)
        }
      }));

      ordersWithItems.push({
        order: {
          ...order,
          total_amount: parseFloat(order.total_amount)
        },
        items
      });
    }

    return ordersWithItems;
  } catch (error) {
    console.error('Failed to get orders by user ID:', error);
    throw error;
  }
}

export async function getOrderById(orderId: number, userId: number): Promise<OrderWithItems | null> {
  try {
    // Get the order and validate it belongs to the user
    const orderResult = await db.select()
      .from(ordersTable)
      .where(and(
        eq(ordersTable.id, orderId),
        eq(ordersTable.user_id, userId)
      ))
      .execute();

    if (orderResult.length === 0) {
      return null;
    }

    const order = orderResult[0];

    // Get order items with product details
    const orderItems = await db.select()
      .from(orderItemsTable)
      .innerJoin(productsTable, eq(orderItemsTable.product_id, productsTable.id))
      .where(eq(orderItemsTable.order_id, orderId))
      .execute();

    const items = orderItems.map(item => ({
      id: item.order_items.id,
      order_id: item.order_items.order_id,
      product_id: item.order_items.product_id,
      quantity: item.order_items.quantity,
      price: parseFloat(item.order_items.price),
      created_at: item.order_items.created_at,
      product: {
        ...item.products,
        price: parseFloat(item.products.price)
      }
    }));

    return {
      order: {
        ...order,
        total_amount: parseFloat(order.total_amount)
      },
      items
    };
  } catch (error) {
    console.error('Failed to get order by ID:', error);
    throw error;
  }
}

export async function updateOrderStatus(orderId: number, status: OrderStatus): Promise<Order | null> {
  try {
    // Check if order exists
    const existingOrder = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .execute();

    if (existingOrder.length === 0) {
      return null;
    }

    // Update order status
    const result = await db.update(ordersTable)
      .set({
        status,
        updated_at: new Date()
      })
      .where(eq(ordersTable.id, orderId))
      .returning()
      .execute();

    return {
      ...result[0],
      total_amount: parseFloat(result[0].total_amount)
    };
  } catch (error) {
    console.error('Failed to update order status:', error);
    throw error;
  }
}