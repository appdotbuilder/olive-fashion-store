import { db } from '../db';
import { cartItemsTable, productsTable, usersTable } from '../db/schema';
import { type CartItem, type AddToCartInput, type UpdateCartItemInput, type CartWithProducts } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getCartByUserId(userId: number): Promise<CartWithProducts> {
  try {
    // Query cart items with product details using join
    const results = await db.select()
      .from(cartItemsTable)
      .innerJoin(productsTable, eq(cartItemsTable.product_id, productsTable.id))
      .where(eq(cartItemsTable.user_id, userId))
      .execute();

    // Transform joined results to match expected structure
    const items = results.map(result => ({
      id: result.cart_items.id,
      user_id: result.cart_items.user_id,
      product_id: result.cart_items.product_id,
      quantity: result.cart_items.quantity,
      created_at: result.cart_items.created_at,
      updated_at: result.cart_items.updated_at,
      product: {
        ...result.products,
        price: parseFloat(result.products.price) // Convert numeric field
      }
    }));

    // Calculate total amount
    const total_amount = items.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);

    return {
      items,
      total_amount
    };
  } catch (error) {
    console.error('Get cart failed:', error);
    throw error;
  }
}

export async function addToCart(input: AddToCartInput): Promise<CartItem> {
  try {
    // Verify user exists
    const userExists = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (userExists.length === 0) {
      throw new Error('User not found');
    }

    // Verify product exists and is active
    const productExists = await db.select()
      .from(productsTable)
      .where(and(
        eq(productsTable.id, input.product_id),
        eq(productsTable.is_active, true)
      ))
      .execute();

    if (productExists.length === 0) {
      throw new Error('Product not found or inactive');
    }

    // Check if item already exists in cart
    const existingItem = await db.select()
      .from(cartItemsTable)
      .where(and(
        eq(cartItemsTable.user_id, input.user_id),
        eq(cartItemsTable.product_id, input.product_id)
      ))
      .execute();

    if (existingItem.length > 0) {
      // Update existing item quantity
      const updatedItems = await db.update(cartItemsTable)
        .set({
          quantity: existingItem[0].quantity + input.quantity,
          updated_at: new Date()
        })
        .where(eq(cartItemsTable.id, existingItem[0].id))
        .returning()
        .execute();

      return updatedItems[0];
    } else {
      // Insert new cart item
      const newItems = await db.insert(cartItemsTable)
        .values({
          user_id: input.user_id,
          product_id: input.product_id,
          quantity: input.quantity
        })
        .returning()
        .execute();

      return newItems[0];
    }
  } catch (error) {
    console.error('Add to cart failed:', error);
    throw error;
  }
}

export async function updateCartItem(input: UpdateCartItemInput): Promise<CartItem | null> {
  try {
    const updatedItems = await db.update(cartItemsTable)
      .set({
        quantity: input.quantity,
        updated_at: new Date()
      })
      .where(eq(cartItemsTable.id, input.id))
      .returning()
      .execute();

    return updatedItems.length > 0 ? updatedItems[0] : null;
  } catch (error) {
    console.error('Update cart item failed:', error);
    throw error;
  }
}

export async function removeFromCart(cartItemId: number, userId: number): Promise<boolean> {
  try {
    const deletedItems = await db.delete(cartItemsTable)
      .where(and(
        eq(cartItemsTable.id, cartItemId),
        eq(cartItemsTable.user_id, userId)
      ))
      .returning()
      .execute();

    return deletedItems.length > 0;
  } catch (error) {
    console.error('Remove from cart failed:', error);
    throw error;
  }
}

export async function clearCart(userId: number): Promise<boolean> {
  try {
    const deletedItems = await db.delete(cartItemsTable)
      .where(eq(cartItemsTable.user_id, userId))
      .returning()
      .execute();

    return deletedItems.length > 0;
  } catch (error) {
    console.error('Clear cart failed:', error);
    throw error;
  }
}