import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, Grid, List } from 'lucide-react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  productCount: number;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onCategorySelect,
  productCount,
  viewMode,
  onViewModeChange
}: CategoryFilterProps) {
  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Left Side - Categories and Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Filter Icon */}
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-orange-400" />
              <span className="font-medium text-white">Filter by:</span>
            </div>

            {/* Category Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => onCategorySelect(null)}
                className={
                  selectedCategory === null
                    ? "btn-olive"
                    : "border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
                }
              >
                All Categories
              </Button>
              
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => onCategorySelect(category)}
                  className={
                    selectedCategory === category
                      ? "btn-olive"
                      : "border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
                  }
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Right Side - View Mode and Product Count */}
          <div className="flex items-center justify-between sm:space-x-6">
            {/* Product Count */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">
                Showing
              </span>
              <Badge variant="outline" className="border-gray-700 text-gray-300">
                {productCount} items
              </Badge>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 bg-gray-800/50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className={`h-8 w-8 p-0 ${
                  viewMode === 'grid'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange('list')}
                className={`h-8 w-8 p-0 ${
                  viewMode === 'list'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filter Display */}
        {selectedCategory && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Active filter:</span>
              <Badge className="bg-orange-500 text-white">
                {selectedCategory}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCategorySelect(null)}
                  className="ml-2 h-4 w-4 p-0 hover:bg-orange-600 text-white"
                >
                  ×
                </Button>
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}