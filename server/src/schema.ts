import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// User input schemas
export const registerUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().min(1)
});

export type RegisterUserInput = z.infer<typeof registerUserInputSchema>;

export const loginUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginUserInput = z.infer<typeof loginUserInputSchema>;

// Product schema
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  category: z.string(),
  image_url: z.string(),
  stock_quantity: z.number().int(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

// Product input schemas
export const createProductInputSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  price: z.number().positive(),
  category: z.string().min(1),
  image_url: z.string().url(),
  stock_quantity: z.number().int().nonnegative()
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const updateProductInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  image_url: z.string().url().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional()
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

// Cart schema
export const cartItemSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int().positive(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type CartItem = z.infer<typeof cartItemSchema>;

// Cart input schemas
export const addToCartInputSchema = z.object({
  user_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int().positive()
});

export type AddToCartInput = z.infer<typeof addToCartInputSchema>;

export const updateCartItemInputSchema = z.object({
  id: z.number(),
  quantity: z.number().int().positive()
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemInputSchema>;

// Order status enum
export const orderStatusSchema = z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

// Order schema
export const orderSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  total_amount: z.number(),
  status: orderStatusSchema,
  shipping_address: z.string(),
  billing_address: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Order = z.infer<typeof orderSchema>;

// Order item schema
export const orderItemSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int().positive(),
  price: z.number(),
  created_at: z.coerce.date()
});

export type OrderItem = z.infer<typeof orderItemSchema>;

// Order input schemas
export const createOrderInputSchema = z.object({
  user_id: z.number(),
  shipping_address: z.string().min(1),
  billing_address: z.string().min(1),
  cart_items: z.array(z.object({
    product_id: z.number(),
    quantity: z.number().int().positive()
  })).min(1)
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

// Checkout input schema
export const checkoutInputSchema = z.object({
  user_id: z.number(),
  shipping_address: z.string().min(1),
  billing_address: z.string().min(1),
  payment_method: z.string().min(1)
});

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;

// Response schemas
export const authResponseSchema = z.object({
  user: userSchema.omit({ password_hash: true }),
  token: z.string()
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

export const cartWithProductsSchema = z.object({
  items: z.array(cartItemSchema.extend({
    product: productSchema
  })),
  total_amount: z.number()
});

export type CartWithProducts = z.infer<typeof cartWithProductsSchema>;

export const orderWithItemsSchema = z.object({
  order: orderSchema,
  items: z.array(orderItemSchema.extend({
    product: productSchema
  }))
});

export type OrderWithItems = z.infer<typeof orderWithItemsSchema>;