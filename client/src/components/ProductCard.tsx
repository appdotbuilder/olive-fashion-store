import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '../../../server/src/schema';

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: number, quantity: number) => void;
  onProductClick: (product: Product) => void;
  isLoading?: boolean;
}

export function ProductCard({ 
  product, 
  onAddToCart, 
  onProductClick,
  isLoading = false 
}: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdding(true);
    try {
      await onAddToCart(product.id, 1);
    } finally {
      setIsAdding(false);
    }
  };

  const handleProductClick = () => {
    onProductClick(product);
  };

  return (
    <Card className="group bg-gray-900/50 border-gray-800 card-hover cursor-pointer overflow-hidden animate-slide-up">
      <div className="relative" onClick={handleProductClick}>
        <div className="aspect-[4/5] overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              // Fallback to a placeholder when image fails to load
              e.currentTarget.src = `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=500&fit=crop&crop=center`;
            }}
          />
        </div>
        
        {/* Overlay with heart icon */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 border border-gray-700"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
          >
            <Heart 
              className={`h-4 w-4 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} 
            />
          </Button>
        </div>

        {/* Stock status badge */}
        <div className="absolute top-3 left-3">
          {product.stock_quantity === 0 ? (
            <Badge variant="destructive" className="bg-red-600 text-white">
              Out of Stock
            </Badge>
          ) : product.stock_quantity < 5 ? (
            <Badge variant="secondary" className="bg-yellow-600 text-white">
              Low Stock
            </Badge>
          ) : null}
        </div>
      </div>

      <CardContent className="p-4" onClick={handleProductClick}>
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-white truncate group-hover:text-orange-400 transition-colors">
              {product.name}
            </h3>
          </div>
          
          <p className="text-sm text-gray-400 line-clamp-2">
            {product.description}
          </p>
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-orange-400">
                ${product.price.toFixed(2)}
              </span>
              <Badge variant="outline" className="text-xs border-gray-700 text-gray-300">
                {product.category}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Add to Cart Button - Only visible on hover */}
      <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
        <Button
          className="w-full btn-olive"
          size="sm"
          onClick={handleAddToCart}
          disabled={product.stock_quantity === 0 || isAdding || isLoading}
        >
          {isAdding ? (
            'Adding...'
          ) : (
            <>
              <ShoppingCart className="h-4 w-4 mr-2" />
              {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}