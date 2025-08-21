import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Heart, ShoppingCart, Star, Truck, Shield, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '../../../server/src/schema';

interface ProductDetailProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (productId: number, quantity: number) => void;
  isLoading?: boolean;
}

export function ProductDetail({
  product,
  isOpen,
  onClose,
  onAddToCart,
  isLoading = false
}: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  if (!product) return null;

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await onAddToCart(product.id, quantity);
    } finally {
      setIsAdding(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= product.stock_quantity) {
      setQuantity(newQuantity);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-gray-900 border-gray-800 p-0 overflow-hidden">
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-4 top-4 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 border border-gray-700"
          onClick={onClose}
        >
          <X className="h-4 w-4 text-white" />
        </Button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Product Image */}
          <div className="relative aspect-square md:aspect-auto">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.src = `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=600&fit=crop&crop=center`;
              }}
            />
            
            {/* Stock status badge */}
            <div className="absolute top-4 left-4">
              {product.stock_quantity === 0 ? (
                <Badge variant="destructive" className="bg-red-600 text-white">
                  Out of Stock
                </Badge>
              ) : product.stock_quantity < 5 ? (
                <Badge variant="secondary" className="bg-yellow-600 text-white">
                  Only {product.stock_quantity} left
                </Badge>
              ) : null}
            </div>
          </div>

          {/* Product Details */}
          <div className="p-6 space-y-6">
            <DialogHeader>
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <DialogTitle className="text-2xl font-bold text-white pr-4">
                    {product.name}
                  </DialogTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-800"
                    onClick={() => setIsLiked(!isLiked)}
                  >
                    <Heart 
                      className={`h-5 w-5 transition-colors ${
                        isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'
                      }`} 
                    />
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="border-gray-700 text-gray-300">
                    {product.category}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className="h-4 w-4 fill-orange-400 text-orange-400" 
                      />
                    ))}
                    <span className="text-sm text-gray-400 ml-2">(4.8)</span>
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Price */}
            <div className="space-y-2">
              <div className="text-3xl font-bold text-orange-400">
                ${product.price.toFixed(2)}
              </div>
              <p className="text-sm text-gray-400">
                Free shipping on orders over $50
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="font-semibold text-white">Description</h3>
              <p className="text-gray-300 leading-relaxed">
                {product.description}
              </p>
            </div>

            <Separator className="bg-gray-700" />

            {/* Quantity Selector */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="font-medium text-white">Quantity:</label>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-gray-600"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center font-medium text-white">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-gray-600"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= product.stock_quantity}
                  >
                    +
                  </Button>
                </div>
                <span className="text-sm text-gray-400">
                  ({product.stock_quantity} available)
                </span>
              </div>

              {/* Add to Cart Button */}
              <Button
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0 || isAdding || isLoading}
                className="w-full btn-olive h-12 text-base font-semibold"
              >
                {isAdding ? (
                  'Adding to Cart...'
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </>
                )}
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-3 text-center">
                  <Truck className="h-5 w-5 mx-auto mb-2 text-orange-400" />
                  <p className="text-xs text-gray-300">Free Shipping</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-3 text-center">
                  <RefreshCw className="h-5 w-5 mx-auto mb-2 text-orange-400" />
                  <p className="text-xs text-gray-300">30-Day Returns</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-3 text-center">
                  <Shield className="h-5 w-5 mx-auto mb-2 text-orange-400" />
                  <p className="text-xs text-gray-300">Secure Payment</p>
                </CardContent>
              </Card>
            </div>

            {/* Product Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">SKU:</span>
                <span className="text-white">OLV-{product.id.toString().padStart(6, '0')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Category:</span>
                <span className="text-white">{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Availability:</span>
                <span className={product.stock_quantity > 0 ? 'text-green-400' : 'text-red-400'}>
                  {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}