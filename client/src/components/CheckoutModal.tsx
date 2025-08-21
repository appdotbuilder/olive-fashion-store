import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Truck, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import type { CheckoutInput, CartWithProducts } from '../../../server/src/schema';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartWithProducts;
  userId: number;
  onCheckout: (data: CheckoutInput) => Promise<void>;
}

export function CheckoutModal({
  isOpen,
  onClose,
  cart,
  userId,
  onCheckout
}: CheckoutModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [checkoutData, setCheckoutData] = useState<CheckoutInput>({
    user_id: userId,
    shipping_address: '',
    billing_address: '',
    payment_method: 'card'
  });

  const [sameAsShipping, setSameAsShipping] = useState(true);

  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.total_amount;
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError('');

    try {
      const finalCheckoutData = {
        ...checkoutData,
        billing_address: sameAsShipping ? checkoutData.shipping_address : checkoutData.billing_address
      };

      await onCheckout(finalCheckoutData);
      setSuccess(true);
      
      // Close modal after success delay
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setCheckoutData({
          user_id: userId,
          shipping_address: '',
          billing_address: '',
          payment_method: 'card'
        });
      }, 2000);
    } catch (err) {
      setError('Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing && !success) {
      onClose();
      setError('');
    }
  };

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Order Confirmed!</h2>
            <p className="text-gray-400 mb-4">
              Thank you for your purchase. You'll receive an email confirmation shortly.
            </p>
            <Badge className="bg-green-600 text-white">
              Order #OLV-{Date.now().toString().slice(-6)}
            </Badge>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl bg-gray-900 border-gray-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            <CreditCard className="h-6 w-6 inline mr-2" />
            Secure Checkout
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert className="border-red-800 bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleCheckout}>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Forms */}
            <div className="space-y-6">
              {/* Shipping Address */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Truck className="h-5 w-5 mr-2 text-orange-400" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Enter your complete shipping address&#10;123 Main Street&#10;City, State, ZIP Code"
                    value={checkoutData.shipping_address}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setCheckoutData((prev: CheckoutInput) => ({
                        ...prev,
                        shipping_address: e.target.value
                      }))
                    }
                    className="bg-gray-800 border-gray-700 focus:border-orange-500 min-h-[100px]"
                    required
                  />
                </CardContent>
              </Card>

              {/* Billing Address */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <MapPin className="h-5 w-5 mr-2 text-orange-400" />
                    Billing Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="same-as-shipping"
                      checked={sameAsShipping}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSameAsShipping(e.target.checked)}
                      className="rounded border-gray-600 bg-gray-800 text-orange-500 focus:ring-orange-500"
                    />
                    <Label 
                      htmlFor="same-as-shipping" 
                      className="text-sm text-gray-300 cursor-pointer"
                    >
                      Same as shipping address
                    </Label>
                  </div>

                  {!sameAsShipping && (
                    <Textarea
                      placeholder="Enter your billing address&#10;123 Main Street&#10;City, State, ZIP Code"
                      value={checkoutData.billing_address}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCheckoutData((prev: CheckoutInput) => ({
                          ...prev,
                          billing_address: e.target.value
                        }))
                      }
                      className="bg-gray-800 border-gray-700 focus:border-orange-500 min-h-[100px]"
                      required
                    />
                  )}
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <CreditCard className="h-5 w-5 mr-2 text-orange-400" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={checkoutData.payment_method}
                    onValueChange={(value: string) =>
                      setCheckoutData((prev: CheckoutInput) => ({
                        ...prev,
                        payment_method: value
                      }))
                    }
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="text-gray-300 cursor-pointer">
                        Credit/Debit Card
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="paypal" id="paypal" />
                      <Label htmlFor="paypal" className="text-gray-300 cursor-pointer">
                        PayPal
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="apple_pay" id="apple_pay" />
                      <Label htmlFor="apple_pay" className="text-gray-300 cursor-pointer">
                        Apple Pay
                      </Label>
                    </div>
                  </RadioGroup>

                  {checkoutData.payment_method === 'card' && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="col-span-2">
                        <Label className="text-gray-300">Card Number</Label>
                        <Input
                          placeholder="1234 5678 9012 3456"
                          className="bg-gray-800 border-gray-700 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Expiry Date</Label>
                        <Input
                          placeholder="MM/YY"
                          className="bg-gray-800 border-gray-700 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">CVV</Label>
                        <Input
                          placeholder="123"
                          className="bg-gray-800 border-gray-700 focus:border-orange-500"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div className="space-y-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-3">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex space-x-3">
                        <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden">
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                              e.currentTarget.src = `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=50&h=50&fit=crop&crop=center`;
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <div className="text-sm font-medium text-white">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="bg-gray-700" />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Subtotal ({totalItems} items)</span>
                      <span className="text-white">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Shipping</span>
                      <span className="text-white">Free</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Tax</span>
                      <span className="text-white">${tax.toFixed(2)}</span>
                    </div>
                    <Separator className="bg-gray-700" />
                    <div className="flex justify-between text-base font-semibold">
                      <span className="text-white">Total</span>
                      <span className="text-orange-400">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Place Order Button */}
              <Button
                type="submit"
                disabled={isProcessing}
                className="w-full btn-olive h-12 text-base font-semibold"
              >
                {isProcessing ? 'Processing Payment...' : `Place Order - $${total.toFixed(2)}`}
              </Button>

              <div className="text-center">
                <p className="text-xs text-gray-400">
                  Your payment information is secure and encrypted
                </p>
              </div>

              {/* Demo Notice */}
              <Alert className="border-orange-800 bg-orange-900/20">
                <AlertCircle className="h-4 w-4 text-orange-400" />
                <AlertDescription className="text-orange-400 text-xs">
                  This is a demo checkout. No real payment will be processed.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}