import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  registerUserInputSchema,
  loginUserInputSchema,
  createProductInputSchema,
  updateProductInputSchema,
  addToCartInputSchema,
  updateCartItemInputSchema,
  createOrderInputSchema,
  checkoutInputSchema,
  orderStatusSchema
} from './schema';

// Import handlers
import { registerUser, loginUser, getUserById } from './handlers/auth';
import { 
  getProducts, 
  getProductById, 
  getProductsByCategory, 
  searchProducts, 
  createProduct, 
  updateProduct 
} from './handlers/products';
import { 
  getCartByUserId, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart 
} from './handlers/cart';
import { 
  createOrder, 
  processCheckout, 
  getOrdersByUserId, 
  getOrderById, 
  updateOrderStatus 
} from './handlers/orders';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  register: publicProcedure
    .input(registerUserInputSchema)
    .mutation(({ input }) => registerUser(input)),

  login: publicProcedure
    .input(loginUserInputSchema)
    .mutation(({ input }) => loginUser(input)),

  getUser: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserById(input.userId)),

  // Product routes
  getProducts: publicProcedure
    .query(() => getProducts()),

  getProduct: publicProcedure
    .input(z.object({ productId: z.number() }))
    .query(({ input }) => getProductById(input.productId)),

  getProductsByCategory: publicProcedure
    .input(z.object({ category: z.string() }))
    .query(({ input }) => getProductsByCategory(input.category)),

  searchProducts: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(({ input }) => searchProducts(input.query)),

  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),

  updateProduct: publicProcedure
    .input(updateProductInputSchema)
    .mutation(({ input }) => updateProduct(input)),

  // Cart routes
  getCart: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getCartByUserId(input.userId)),

  addToCart: publicProcedure
    .input(addToCartInputSchema)
    .mutation(({ input }) => addToCart(input)),

  updateCartItem: publicProcedure
    .input(updateCartItemInputSchema)
    .mutation(({ input }) => updateCartItem(input)),

  removeFromCart: publicProcedure
    .input(z.object({ cartItemId: z.number(), userId: z.number() }))
    .mutation(({ input }) => removeFromCart(input.cartItemId, input.userId)),

  clearCart: publicProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(({ input }) => clearCart(input.userId)),

  // Order routes
  createOrder: publicProcedure
    .input(createOrderInputSchema)
    .mutation(({ input }) => createOrder(input)),

  checkout: publicProcedure
    .input(checkoutInputSchema)
    .mutation(({ input }) => processCheckout(input)),

  getOrders: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getOrdersByUserId(input.userId)),

  getOrder: publicProcedure
    .input(z.object({ orderId: z.number(), userId: z.number() }))
    .query(({ input }) => getOrderById(input.orderId, input.userId)),

  updateOrderStatus: publicProcedure
    .input(z.object({ orderId: z.number(), status: orderStatusSchema }))
    .mutation(({ input }) => updateOrderStatus(input.orderId, input.status)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Olive E-commerce TRPC server listening at port: ${port}`);
}

start();