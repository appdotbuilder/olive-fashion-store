import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingBag, CreditCard } from 'lucide-react';
import { useState } from 'react';
import type { CartWithProducts } from '../../../server/src/schema';

interface CartProps {
  cart: CartWithProducts;
  onUpdateQuantity: (cartItemId: number, quantity: number) => void;
  onRemoveItem: (cartItemId: number) => void;
  onCheckout: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Cart({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  isOpen,
  onOpenChange
}: CartProps) {
  const [updatingItems, setUpdatingItems] = useState<Record<number, boolean>>({});

  const handleQuantityChange = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setUpdatingItems((prev: Record<number, boolean>) => ({ ...prev, [cartItemId]: true }));
    try {
      await onUpdateQuantity(cartItemId, newQuantity);
    } finally {
      setUpdatingItems((prev: Record<number, boolean>) => ({ ...prev, [cartItemId]: false }));
    }
  };

  const handleRemoveItem = async (cartItemId: number) => {
    setUpdatingItems((prev: Record<number, boolean>) => ({ ...prev, [cartItemId]: true }));
    try {
      await onRemoveItem(cartItemId);
    } finally {
      setUpdatingItems((prev: Record<number, boolean>) => ({ ...prev, [cartItemId]: false }));
    }
  };

  const isEmpty = cart.items.length === 0;
  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <ShoppingBag className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs min-w-[1.25rem] h-5">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg bg-gray-900 border-gray-800 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2 text-white">
            <ShoppingBag className="h-5 w-5 text-orange-400" />
            <span>Shopping Cart</span>
            <Badge variant="outline" className="border-gray-700 text-gray-300">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="py-6">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingBag className="h-16 w-16 text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Your cart is empty</h3>
              <p className="text-gray-400 mb-6">Add some items to get started</p>
              <Button
                onClick={() => onOpenChange(false)}
                className="btn-olive"
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <Card key={item.id} className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex space-x-4">
                        <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden">
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                              e.currentTarget.src = `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop&crop=center`;
                            }}
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white truncate">
                            {item.product.name}
                          </h4>
                          <p className="text-sm text-gray-400 truncate">
                            {item.product.category}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-semibold text-orange-400">
                              ${item.product.price.toFixed(2)}
                            </span>
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-gray-600"
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1 || updatingItems[item.id]}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              
                              <span className="w-8 text-center text-sm font-medium text-white">
                                {item.quantity}
                              </span>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-gray-600"
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                disabled={updatingItems[item.id]}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={updatingItems[item.id]}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Item Subtotal */}
                          <div className="text-right mt-2">
                            <span className="text-sm font-medium text-white">
                              Subtotal: ${(item.product.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator className="bg-gray-700" />

              {/* Order Summary */}
              <div className="space-y-4 mt-6">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-white">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Subtotal ({totalItems} items)</span>
                      <span className="text-white">${cart.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Shipping</span>
                      <span className="text-white">Free</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Tax</span>
                      <span className="text-white">${(cart.total_amount * 0.08).toFixed(2)}</span>
                    </div>
                    <Separator className="bg-gray-700" />
                    <div className="flex justify-between text-base font-semibold">
                      <span className="text-white">Total</span>
                      <span className="text-orange-400">
                        ${(cart.total_amount * 1.08).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Checkout Button */}
                <Button
                  onClick={onCheckout}
                  className="w-full btn-olive h-12 text-base font-semibold"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Proceed to Checkout
                </Button>

                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="w-full border-gray-700 hover:bg-gray-800"
                >
                  Continue Shopping
                </Button>
              </div>

              {/* Note about stub functionality */}
              <div className="mt-4 p-3 bg-gray-800/30 rounded-md">
                <p className="text-xs text-gray-400 text-center">
                  Cart functionality is currently in demo mode with stub backend
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}