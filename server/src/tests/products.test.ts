import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput, type UpdateProductInput } from '../schema';
import { 
  getProducts, 
  getProductById, 
  getProductsByCategory, 
  searchProducts, 
  createProduct, 
  updateProduct 
} from '../handlers/products';
import { eq } from 'drizzle-orm';

// Test input data
const testProduct: CreateProductInput = {
  name: 'Test Product',
  description: 'A product for testing purposes',
  price: 19.99,
  category: 'Electronics',
  image_url: 'https://example.com/image.jpg',
  stock_quantity: 100
};

const testProduct2: CreateProductInput = {
  name: 'Another Test Product',
  description: 'Another product for search testing',
  price: 29.99,
  category: 'Books',
  image_url: 'https://example.com/image2.jpg',
  stock_quantity: 50
};

const testProduct3: CreateProductInput = {
  name: 'Gaming Mouse',
  description: 'High precision gaming mouse with RGB lighting',
  price: 49.99,
  category: 'Electronics',
  image_url: 'https://example.com/mouse.jpg',
  stock_quantity: 25
};

describe('Product Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const result = await createProduct(testProduct);

      expect(result.name).toBe('Test Product');
      expect(result.description).toBe(testProduct.description);
      expect(result.price).toBe(19.99);
      expect(typeof result.price).toBe('number');
      expect(result.category).toBe('Electronics');
      expect(result.image_url).toBe(testProduct.image_url);
      expect(result.stock_quantity).toBe(100);
      expect(result.is_active).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save product to database', async () => {
      const result = await createProduct(testProduct);

      const products = await db.select()
        .from(productsTable)
        .where(eq(productsTable.id, result.id))
        .execute();

      expect(products).toHaveLength(1);
      expect(products[0].name).toBe('Test Product');
      expect(parseFloat(products[0].price)).toBe(19.99);
      expect(products[0].is_active).toBe(true);
    });
  });

  describe('getProducts', () => {
    it('should return empty array when no products exist', async () => {
      const result = await getProducts();
      expect(result).toEqual([]);
    });

    it('should return all active products', async () => {
      await createProduct(testProduct);
      await createProduct(testProduct2);

      const result = await getProducts();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Test Product');
      expect(result[1].name).toBe('Another Test Product');
      expect(typeof result[0].price).toBe('number');
      expect(typeof result[1].price).toBe('number');
    });

    it('should only return active products', async () => {
      const product1 = await createProduct(testProduct);
      await createProduct(testProduct2);

      // Deactivate first product
      await db.update(productsTable)
        .set({ is_active: false })
        .where(eq(productsTable.id, product1.id))
        .execute();

      const result = await getProducts();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Another Test Product');
    });
  });

  describe('getProductById', () => {
    it('should return null for non-existent product', async () => {
      const result = await getProductById(999);
      expect(result).toBeNull();
    });

    it('should return product by ID', async () => {
      const created = await createProduct(testProduct);
      const result = await getProductById(created.id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(created.id);
      expect(result!.name).toBe('Test Product');
      expect(result!.price).toBe(19.99);
      expect(typeof result!.price).toBe('number');
    });

    it('should return null for inactive product', async () => {
      const created = await createProduct(testProduct);
      
      // Deactivate product
      await db.update(productsTable)
        .set({ is_active: false })
        .where(eq(productsTable.id, created.id))
        .execute();

      const result = await getProductById(created.id);
      expect(result).toBeNull();
    });
  });

  describe('getProductsByCategory', () => {
    it('should return empty array for non-existent category', async () => {
      const result = await getProductsByCategory('NonExistent');
      expect(result).toEqual([]);
    });

    it('should return products filtered by category', async () => {
      await createProduct(testProduct); // Electronics
      await createProduct(testProduct2); // Books
      await createProduct(testProduct3); // Electronics

      const electronicsProducts = await getProductsByCategory('Electronics');
      const bookProducts = await getProductsByCategory('Books');

      expect(electronicsProducts).toHaveLength(2);
      expect(bookProducts).toHaveLength(1);
      
      expect(electronicsProducts[0].category).toBe('Electronics');
      expect(electronicsProducts[1].category).toBe('Electronics');
      expect(bookProducts[0].category).toBe('Books');
      
      expect(typeof electronicsProducts[0].price).toBe('number');
      expect(typeof bookProducts[0].price).toBe('number');
    });

    it('should only return active products in category', async () => {
      const product1 = await createProduct(testProduct); // Electronics
      await createProduct(testProduct3); // Electronics

      // Deactivate first electronics product
      await db.update(productsTable)
        .set({ is_active: false })
        .where(eq(productsTable.id, product1.id))
        .execute();

      const result = await getProductsByCategory('Electronics');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Gaming Mouse');
    });
  });

  describe('searchProducts', () => {
    it('should return empty array when no matches found', async () => {
      await createProduct(testProduct);
      const result = await searchProducts('nonexistent');
      expect(result).toEqual([]);
    });

    it('should search products by name (case insensitive)', async () => {
      await createProduct(testProduct);
      await createProduct(testProduct2);
      await createProduct(testProduct3);

      const result = await searchProducts('gaming');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Gaming Mouse');
      expect(typeof result[0].price).toBe('number');
    });

    it('should search products by description (case insensitive)', async () => {
      await createProduct(testProduct);
      await createProduct(testProduct2);
      await createProduct(testProduct3);

      const result = await searchProducts('RGB');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Gaming Mouse');
    });

    it('should search products by partial matches', async () => {
      await createProduct(testProduct);
      await createProduct(testProduct2);

      const result = await searchProducts('test');

      expect(result).toHaveLength(2);
      expect(result.map(p => p.name)).toContain('Test Product');
      expect(result.map(p => p.name)).toContain('Another Test Product');
    });

    it('should only return active products in search', async () => {
      const product1 = await createProduct(testProduct);
      await createProduct(testProduct2);

      // Deactivate first product
      await db.update(productsTable)
        .set({ is_active: false })
        .where(eq(productsTable.id, product1.id))
        .execute();

      const result = await searchProducts('test');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Another Test Product');
    });
  });

  describe('updateProduct', () => {
    it('should return null for non-existent product', async () => {
      const updateInput: UpdateProductInput = {
        id: 999,
        name: 'Updated Name'
      };

      const result = await updateProduct(updateInput);
      expect(result).toBeNull();
    });

    it('should update product name only', async () => {
      const created = await createProduct(testProduct);
      const updateInput: UpdateProductInput = {
        id: created.id,
        name: 'Updated Product Name'
      };

      const result = await updateProduct(updateInput);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(created.id);
      expect(result!.name).toBe('Updated Product Name');
      expect(result!.description).toBe(testProduct.description); // Should remain unchanged
      expect(result!.price).toBe(19.99);
      expect(typeof result!.price).toBe('number');
    });

    it('should update multiple fields', async () => {
      const created = await createProduct(testProduct);
      const updateInput: UpdateProductInput = {
        id: created.id,
        name: 'Updated Name',
        price: 25.99,
        stock_quantity: 200,
        is_active: false
      };

      const result = await updateProduct(updateInput);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Updated Name');
      expect(result!.price).toBe(25.99);
      expect(typeof result!.price).toBe('number');
      expect(result!.stock_quantity).toBe(200);
      expect(result!.is_active).toBe(false);
      expect(result!.description).toBe(testProduct.description); // Should remain unchanged
    });

    it('should update product in database', async () => {
      const created = await createProduct(testProduct);
      const updateInput: UpdateProductInput = {
        id: created.id,
        name: 'Database Updated Name',
        price: 35.99
      };

      await updateProduct(updateInput);

      const products = await db.select()
        .from(productsTable)
        .where(eq(productsTable.id, created.id))
        .execute();

      expect(products).toHaveLength(1);
      expect(products[0].name).toBe('Database Updated Name');
      expect(parseFloat(products[0].price)).toBe(35.99);
    });

    it('should update the updated_at timestamp', async () => {
      const created = await createProduct(testProduct);
      const originalUpdatedAt = created.updated_at;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const updateInput: UpdateProductInput = {
        id: created.id,
        name: 'Updated Name'
      };

      const result = await updateProduct(updateInput);

      expect(result).not.toBeNull();
      expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});