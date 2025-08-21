import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, 
  Search, 
  User, 
  Menu, 
  X,
  LogOut,
  Package,
  Heart
} from 'lucide-react';
import { useState } from 'react';
import type { AuthResponse } from '../../../server/src/schema';

interface HeaderProps {
  user: AuthResponse['user'] | null;
  cartItemsCount: number;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onLogout: () => void;
  onCartClick: () => void;
  onOrdersClick: () => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
}

export function Header({
  user,
  cartItemsCount,
  onLoginClick,
  onRegisterClick,
  onLogout,
  onCartClick,
  onOrdersClick,
  onSearchChange,
  searchQuery
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-gray-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 olive-gradient rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <h1 className="text-2xl font-bold text-gradient">Olive</h1>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search fashion apparel..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
                className="pl-10 bg-gray-800/50 border-gray-700 focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2 text-gray-300">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{user.first_name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOrdersClick}
                  className="text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Orders
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLoginClick}
                  className="text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={onRegisterClick}
                  className="btn-olive"
                >
                  Sign Up
                </Button>
              </>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onCartClick}
              className="relative text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs min-w-[1.25rem] h-5 flex items-center justify-center p-0">
                  {cartItemsCount}
                </Badge>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <Heart className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCartClick}
              className="relative text-gray-300"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs min-w-[1.25rem] h-5">
                  {cartItemsCount}
                </Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search fashion apparel..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
              className="pl-10 bg-gray-800/50 border-gray-700 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-800 pt-4 animate-fade-in">
            <div className="flex flex-col space-y-3">
              {user ? (
                <>
                  <div className="flex items-center space-x-2 text-gray-300 px-2">
                    <User className="h-4 w-4" />
                    <span>{user.first_name} {user.last_name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={onOrdersClick}
                    className="justify-start text-gray-300 hover:text-white"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    My Orders
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={onLogout}
                    className="justify-start text-gray-300 hover:text-white"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={onLoginClick}
                    className="justify-start text-gray-300 hover:text-white"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={onRegisterClick}
                    className="btn-olive justify-start"
                  >
                    Sign Up
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                className="justify-start text-gray-300 hover:text-white"
              >
                <Heart className="h-4 w-4 mr-2" />
                Wishlist
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}