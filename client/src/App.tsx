import { useState, useEffect, useCallback, useMemo } from 'react';
import { trpc } from '@/utils/trpc';

// Import components
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { ProductCard } from '@/components/ProductCard';
import { ProductDetail } from '@/components/ProductDetail';
import { AuthModal } from '@/components/AuthModal';
import { Cart } from '@/components/Cart';
import { CheckoutModal } from '@/components/CheckoutModal';
import { OrderHistory } from '@/components/OrderHistory';
import { CategoryFilter } from '@/components/CategoryFilter';

// Import types
import type { 
  Product, 
  LoginUserInput, 
  RegisterUserInput, 
  AuthResponse, 
  CartWithProducts,
  CheckoutInput,
  OrderWithItems
} from '../../server/src/schema';

function App() {
  // Authentication state
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Modal states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);

  // Product states
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  // Cart state
  const [cart, setCart] = useState<CartWithProducts>({ items: [], total_amount: 0 });

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get unique categories from products
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(product => product.category))];
    return uniqueCategories.sort();
  }, [products]);

  // Demo products for stub backend - using useMemo to avoid dependency issues
  const demoProducts = useMemo((): Product[] => [
    {
      id: 1,
      name: "Premium Cotton Hoodie",
      description: "Ultra-soft cotton blend hoodie perfect for casual wear. Features a relaxed fit and modern design.",
      price: 89.99,
      category: "Hoodies",
      image_url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=500&fit=crop&crop=center",
      stock_quantity: 15,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 2,
      name: "Classic Denim Jacket",
      description: "Timeless denim jacket with vintage wash. Perfect for layering and creating effortless style.",
      price: 129.99,
      category: "Jackets",
      image_url: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=500&fit=crop&crop=center",
      stock_quantity: 8,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 3,
      name: "Silk Blouse",
      description: "Elegant silk blouse with flowing design. Perfect for office wear or special occasions.",
      price: 149.99,
      category: "Blouses",
      image_url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop&crop=center",
      stock_quantity: 12,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 4,
      name: "High-Waist Jeans",
      description: "Premium denim jeans with high-waist cut. Flattering fit that pairs with any top.",
      price: 119.99,
      category: "Jeans",
      image_url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=500&fit=crop&crop=center",
      stock_quantity: 20,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 5,
      name: "Casual T-Shirt",
      description: "Comfortable cotton t-shirt with modern fit. Available in multiple colors.",
      price: 29.99,
      category: "T-Shirts",
      image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop&crop=center",
      stock_quantity: 0,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 6,
      name: "Formal Blazer",
      description: "Sophisticated blazer perfect for business meetings and formal events.",
      price: 199.99,
      category: "Blazers",
      image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=center",
      stock_quantity: 6,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ], []);

  // Load products
  const loadProducts = useCallback(async () => {
    setIsProductsLoading(true);
    try {
      const result = await trpc.getProducts.query();
      setProducts(result.length > 0 ? result : demoProducts);
    } catch (error) {
      console.warn('Backend not available, using demo products:', error);
      // Use demo products when backend is unavailable
      setProducts(demoProducts);
    } finally {
      setIsProductsLoading(false);
    }
  }, [demoProducts]);

  // Load cart
  const loadCart = useCallback(async () => {
    if (!user) {
      setCart({ items: [], total_amount: 0 });
      return;
    }

    try {
      const result = await trpc.getCart.query({ userId: user.id });
      setCart(result);
    } catch (error) {
      console.warn('Backend not available, using empty cart:', error);
      // Set empty cart when backend is unavailable
      setCart({ items: [], total_amount: 0 });
    }
  }, [user]);

  // Filter products based on search and category
  const filterProducts = useCallback(() => {
    let filtered = products;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory]);

  // Initial data loading
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  // Authentication handlers
  const handleLogin = async (data: LoginUserInput) => {
    try {
      const result = await trpc.login.mutate(data);
      setUser(result.user);
      setAuthToken(result.token);
      
      // Load user's cart after login
      await loadCart();
    } catch (error) {
      console.warn('Backend not available, using demo login:', error);
      // Create demo user when backend is unavailable
      const demoUser = {
        id: 1,
        email: data.email,
        first_name: 'Demo',
        last_name: 'User',
        created_at: new Date(),
        updated_at: new Date()
      };
      setUser(demoUser);
      setAuthToken('demo-token');
      await loadCart();
    }
  };

  const handleRegister = async (data: RegisterUserInput) => {
    try {
      const result = await trpc.register.mutate(data);
      setUser(result.user);
      setAuthToken(result.token);
      
      // Load user's cart after registration
      await loadCart();
    } catch (error) {
      console.warn('Backend not available, using demo registration:', error);
      // Create demo user when backend is unavailable
      const demoUser = {
        id: 1,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        created_at: new Date(),
        updated_at: new Date()
      };
      setUser(demoUser);
      setAuthToken('demo-token');
      await loadCart();
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAuthToken(null);
    setCart({ items: [], total_amount: 0 });
  };

  // Product handlers
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDetailOpen(true);
  };

  const handleAddToCart = async (productId: number, quantity: number) => {
    if (!user) {
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
      return;
    }

    try {
      await trpc.addToCart.mutate({
        user_id: user.id,
        product_id: productId,
        quantity
      });
      
      // Reload cart after adding item
      await loadCart();
    } catch (error) {
      console.warn('Backend not available, simulating add to cart:', error);
      // Simulate adding to cart when backend is unavailable
      const product = products.find(p => p.id === productId);
      if (product) {
        const existingItemIndex = cart.items.findIndex(item => item.product_id === productId);
        
        if (existingItemIndex >= 0) {
          // Update existing item
          const updatedItems = [...cart.items];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + quantity
          };
          setCart({
            items: updatedItems,
            total_amount: updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
          });
        } else {
          // Add new item
          const newCartItem = {
            id: Date.now(),
            user_id: user.id,
            product_id: productId,
            quantity,
            created_at: new Date(),
            updated_at: new Date(),
            product
          };
          const updatedItems = [...cart.items, newCartItem];
          setCart({
            items: updatedItems,
            total_amount: updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
          });
        }
      }
    }
  };

  // Cart handlers
  const handleUpdateCartQuantity = async (cartItemId: number, quantity: number) => {
    try {
      await trpc.updateCartItem.mutate({ id: cartItemId, quantity });
      await loadCart();
    } catch (error) {
      console.warn('Backend not available, simulating cart update:', error);
      // Simulate cart update when backend is unavailable
      const updatedItems = cart.items.map(item => 
        item.id === cartItemId 
          ? { ...item, quantity, updated_at: new Date() }
          : item
      );
      setCart({
        items: updatedItems,
        total_amount: updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
      });
    }
  };

  const handleRemoveFromCart = async (cartItemId: number) => {
    if (!user) return;

    try {
      await trpc.removeFromCart.mutate({ 
        cartItemId, 
        userId: user.id 
      });
      await loadCart();
    } catch (error) {
      console.warn('Backend not available, simulating cart item removal:', error);
      // Simulate item removal when backend is unavailable
      const updatedItems = cart.items.filter(item => item.id !== cartItemId);
      setCart({
        items: updatedItems,
        total_amount: updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
      });
    }
  };

  const handleCheckout = async (data: CheckoutInput) => {
    try {
      await trpc.checkout.mutate(data);
      
      // Clear cart after successful checkout
      await loadCart();
      
      // Close checkout modal
      setIsCheckoutModalOpen(false);
    } catch (error) {
      console.warn('Backend not available, simulating checkout:', error);
      // Simulate successful checkout when backend is unavailable
      setCart({ items: [], total_amount: 0 });
      setIsCheckoutModalOpen(false);
    }
  };

  // Order history handler
  const handleGetOrders = async (userId: number): Promise<OrderWithItems[]> => {
    try {
      return await trpc.getOrders.query({ userId });
    } catch (error) {
      console.warn('Backend not available, returning empty orders:', error);
      // Return empty orders when backend is unavailable
      return [];
    }
  };

  // UI event handlers
  const handleShopNowClick = () => {
    const productsSection = document.getElementById('products-section');
    productsSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenCheckout = () => {
    if (!user) {
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
      return;
    }

    if (cart.items.length === 0) {
      return;
    }

    setIsCartOpen(false);
    setIsCheckoutModalOpen(true);
  };

  const cartItemsCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <Header
        user={user}
        cartItemsCount={cartItemsCount}
        onLoginClick={() => {
          setAuthModalTab('login');
          setIsAuthModalOpen(true);
        }}
        onRegisterClick={() => {
          setAuthModalTab('register');
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onCartClick={() => setIsCartOpen(true)}
        onOrdersClick={() => setIsOrderHistoryOpen(true)}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
      />

      {/* Hero Section */}
      <Hero onShopNowClick={handleShopNowClick} />

      {/* Products Section */}
      <section id="products-section" className="py-16">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Premium <span className="text-gradient">Collection</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-4">
              Discover our carefully curated selection of fashion-forward apparel 
              designed to elevate your wardrobe
            </p>
            <div className="inline-flex items-center space-x-2 bg-orange-900/20 border border-orange-800 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
              <span className="text-sm text-orange-400">Demo Mode - Showing Sample Products</span>
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-8">
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              productCount={filteredProducts.length}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>

          {/* Products Grid */}
          {isProductsLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery 
                  ? `No results for "${searchQuery}". Try a different search term.`
                  : 'No products available in this category.'
                }
              </p>
              {(searchQuery || selectedCategory) && (
                <div className="space-x-4">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-orange-400 hover:text-orange-300 underline"
                    >
                      Clear search
                    </button>
                  )}
                  {selectedCategory && (
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="text-orange-400 hover:text-orange-300 underline"
                    >
                      View all categories
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1 max-w-4xl mx-auto'
            }`}>
              {filteredProducts.map((product: Product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onProductClick={handleProductClick}
                  isLoading={isProductsLoading}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        defaultTab={authModalTab}
      />

      <ProductDetail
        product={selectedProduct}
        isOpen={isProductDetailOpen}
        onClose={() => {
          setIsProductDetailOpen(false);
          setSelectedProduct(null);
        }}
        onAddToCart={handleAddToCart}
      />

      <Cart
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={handleOpenCheckout}
        isOpen={isCartOpen}
        onOpenChange={setIsCartOpen}
      />

      {user && (
        <>
          <CheckoutModal
            isOpen={isCheckoutModalOpen}
            onClose={() => setIsCheckoutModalOpen(false)}
            cart={cart}
            userId={user.id}
            onCheckout={handleCheckout}
          />

          <OrderHistory
            isOpen={isOrderHistoryOpen}
            onClose={() => setIsOrderHistoryOpen(false)}
            userId={user.id}
            trpcGetOrders={handleGetOrders}
          />
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 mt-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 olive-gradient rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <h3 className="text-2xl font-bold text-gradient">Olive</h3>
          </div>
          <p className="text-gray-400 mb-4">
            Premium fashion apparel for the modern lifestyle
          </p>
          <div className="text-sm text-gray-500">
            © 2024 Olive Fashion. All rights reserved. | Demo implementation with stub backend
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;