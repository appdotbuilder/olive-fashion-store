import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product, type CreateProductInput, type UpdateProductInput } from '../schema';
import { eq, and, like, or, ilike } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export async function getProducts(): Promise<Product[]> {
  try {
    const results = await db.select()
      .from(productsTable)
      .where(eq(productsTable.is_active, true))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(product => ({
      ...product,
      price: parseFloat(product.price)
    }));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
}

export async function getProductById(productId: number): Promise<Product | null> {
  try {
    const results = await db.select()
      .from(productsTable)
      .where(and(
        eq(productsTable.id, productId),
        eq(productsTable.is_active, true)
      ))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const product = results[0];
    return {
      ...product,
      price: parseFloat(product.price)
    };
  } catch (error) {
    console.error('Failed to fetch product by ID:', error);
    throw error;
  }
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  try {
    const results = await db.select()
      .from(productsTable)
      .where(and(
        eq(productsTable.category, category),
        eq(productsTable.is_active, true)
      ))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(product => ({
      ...product,
      price: parseFloat(product.price)
    }));
  } catch (error) {
    console.error('Failed to fetch products by category:', error);
    throw error;
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  try {
    const searchTerm = `%${query}%`;
    const results = await db.select()
      .from(productsTable)
      .where(and(
        or(
          ilike(productsTable.name, searchTerm),
          ilike(productsTable.description, searchTerm)
        ),
        eq(productsTable.is_active, true)
      ))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(product => ({
      ...product,
      price: parseFloat(product.price)
    }));
  } catch (error) {
    console.error('Failed to search products:', error);
    throw error;
  }
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  try {
    const result = await db.insert(productsTable)
      .values({
        name: input.name,
        description: input.description,
        price: input.price.toString(), // Convert number to string for numeric column
        category: input.category,
        image_url: input.image_url,
        stock_quantity: input.stock_quantity,
        is_active: true
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const product = result[0];
    return {
      ...product,
      price: parseFloat(product.price)
    };
  } catch (error) {
    console.error('Product creation failed:', error);
    throw error;
  }
}

export async function updateProduct(input: UpdateProductInput): Promise<Product | null> {
  try {
    // Build update values dynamically, only including provided fields
    const updateValues: any = {};
    
    if (input.name !== undefined) updateValues.name = input.name;
    if (input.description !== undefined) updateValues.description = input.description;
    if (input.price !== undefined) updateValues.price = input.price.toString();
    if (input.category !== undefined) updateValues.category = input.category;
    if (input.image_url !== undefined) updateValues.image_url = input.image_url;
    if (input.stock_quantity !== undefined) updateValues.stock_quantity = input.stock_quantity;
    if (input.is_active !== undefined) updateValues.is_active = input.is_active;
    
    // Always update the updated_at timestamp
    updateValues.updated_at = new Date();

    const result = await db.update(productsTable)
      .set(updateValues)
      .where(eq(productsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const product = result[0];
    return {
      ...product,
      price: parseFloat(product.price)
    };
  } catch (error) {
    console.error('Product update failed:', error);
    throw error;
  }
}