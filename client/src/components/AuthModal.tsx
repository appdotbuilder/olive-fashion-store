import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import type { LoginUserInput, RegisterUserInput } from '../../../server/src/schema';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (data: LoginUserInput) => Promise<void>;
  onRegister: (data: RegisterUserInput) => Promise<void>;
  defaultTab?: 'login' | 'register';
}

export function AuthModal({ 
  isOpen, 
  onClose, 
  onLogin, 
  onRegister, 
  defaultTab = 'login' 
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form state
  const [loginData, setLoginData] = useState<LoginUserInput>({
    email: '',
    password: ''
  });

  // Register form state
  const [registerData, setRegisterData] = useState<RegisterUserInput>({
    email: '',
    password: '',
    first_name: '',
    last_name: ''
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as 'login' | 'register');
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await onLogin(loginData);
      onClose();
      // Reset form
      setLoginData({ email: '', password: '' });
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await onRegister(registerData);
      onClose();
      // Reset form
      setRegisterData({
        email: '',
        password: '',
        first_name: '',
        last_name: ''
      });
    } catch (err) {
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setError('');
    setLoginData({ email: '', password: '' });
    setRegisterData({
      email: '',
      password: '',
      first_name: '',
      last_name: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Welcome to <span className="text-gradient">Olive</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
            <TabsTrigger 
              value="login" 
              className="data-[state=active]:bg-gray-700 data-[state=active]:text-white"
            >
              Login
            </TabsTrigger>
            <TabsTrigger 
              value="register"
              className="data-[state=active]:bg-gray-700 data-[state=active]:text-white"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          {error && (
            <Alert className="border-red-800 bg-red-900/20">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-gray-300">
                  Email
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email"
                  value={loginData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLoginData((prev: LoginUserInput) => ({ ...prev, email: e.target.value }))
                  }
                  className="bg-gray-800 border-gray-700 focus:border-orange-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-gray-300">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLoginData((prev: LoginUserInput) => ({ ...prev, password: e.target.value }))
                    }
                    className="bg-gray-800 border-gray-700 focus:border-orange-500 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full btn-olive"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name" className="text-gray-300">
                    First Name
                  </Label>
                  <Input
                    id="first-name"
                    type="text"
                    placeholder="First name"
                    value={registerData.first_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRegisterData((prev: RegisterUserInput) => ({ ...prev, first_name: e.target.value }))
                    }
                    className="bg-gray-800 border-gray-700 focus:border-orange-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last-name" className="text-gray-300">
                    Last Name
                  </Label>
                  <Input
                    id="last-name"
                    type="text"
                    placeholder="Last name"
                    value={registerData.last_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRegisterData((prev: RegisterUserInput) => ({ ...prev, last_name: e.target.value }))
                    }
                    className="bg-gray-800 border-gray-700 focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-gray-300">
                  Email
                </Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="Enter your email"
                  value={registerData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterData((prev: RegisterUserInput) => ({ ...prev, email: e.target.value }))
                  }
                  className="bg-gray-800 border-gray-700 focus:border-orange-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-gray-300">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password (min. 8 characters)"
                    value={registerData.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRegisterData((prev: RegisterUserInput) => ({ ...prev, password: e.target.value }))
                    }
                    className="bg-gray-800 border-gray-700 focus:border-orange-500 pr-10"
                    minLength={8}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full btn-olive"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-gray-400 mt-4">
          {/* Note: Backend authentication is using stub implementation */}
          <p>Welcome! Authentication is currently in demo mode.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}