import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Package, Calendar, MapPin, CreditCard, Eye } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import type { OrderWithItems } from '../../../server/src/schema';

interface OrderHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  trpcGetOrders: (userId: number) => Promise<OrderWithItems[]>;
}

export function OrderHistory({
  isOpen,
  onClose,
  userId,
  trpcGetOrders
}: OrderHistoryProps) {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpcGetOrders(userId);
      setOrders(result);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setOrders([]); // Set empty array on error since backend is stub
    } finally {
      setIsLoading(false);
    }
  }, [trpcGetOrders, userId]);

  useEffect(() => {
    if (isOpen && userId) {
      loadOrders();
    }
  }, [isOpen, userId, loadOrders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-600 text-white';
      case 'processing':
        return 'bg-blue-600 text-white';
      case 'shipped':
        return 'bg-purple-600 text-white';
      case 'delivered':
        return 'bg-green-600 text-white';
      case 'cancelled':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleOrderClick = (order: OrderWithItems) => {
    setSelectedOrder(order);
  };

  const handleCloseOrderDetail = () => {
    setSelectedOrder(null);
  };

  return (
    <>
      {/* Main Order History Modal */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl bg-gray-900 border-gray-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              <Package className="h-6 w-6 inline mr-2" />
              Order History
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading your orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No orders yet</h3>
                <p className="text-gray-400 mb-6">
                  Start shopping to see your order history here!
                </p>
                <Button onClick={onClose} className="btn-olive">
                  Start Shopping
                </Button>
                
                {/* Demo Notice */}
                <div className="mt-6 p-3 bg-gray-800/30 rounded-md">
                  <p className="text-xs text-gray-400">
                    Order history is currently in demo mode with stub backend
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card 
                    key={order.order.id} 
                    className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
                    onClick={() => handleOrderClick(order)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-white">
                          Order #OLV-{order.order.id.toString().padStart(6, '0')}
                        </CardTitle>
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(order.order.status)}>
                            {formatStatus(order.order.status)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300">
                            {order.order.created_at.toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300">
                            ${order.order.total_amount.toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                      </div>

                      {/* Order Items Preview */}
                      <div className="flex space-x-2">
                        {order.items.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex-shrink-0 w-10 h-10 rounded-md overflow-hidden">
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                e.currentTarget.src = `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=40&h=40&fit=crop&crop=center`;
                              }}
                            />
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="flex-shrink-0 w-10 h-10 rounded-md bg-gray-700 flex items-center justify-center">
                            <span className="text-xs text-gray-300">
                              +{order.items.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={handleCloseOrderDetail}>
          <DialogContent className="max-w-2xl bg-gray-900 border-gray-800 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">
                Order #OLV-{selectedOrder.order.id.toString().padStart(6, '0')}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Order Status */}
              <div className="flex items-center justify-between">
                <Badge className={`${getStatusColor(selectedOrder.order.status)} text-base px-3 py-1`}>
                  {formatStatus(selectedOrder.order.status)}
                </Badge>
                <div className="text-sm text-gray-400">
                  Placed on {selectedOrder.order.created_at.toLocaleDateString()}
                </div>
              </div>

              {/* Order Items */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Items Ordered</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex space-x-4">
                      <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden">
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            e.currentTarget.src = `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=64&h=64&fit=crop&crop=center`;
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-sm text-gray-400">
                          Qty: {item.quantity}
                        </p>
                        <p className="text-sm text-gray-400">
                          ${item.price.toFixed(2)} each
                        </p>
                      </div>
                      <div className="text-sm font-medium text-white">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  
                  <Separator className="bg-gray-700" />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-white">Total</span>
                    <span className="text-orange-400">
                      ${selectedOrder.order.total_amount.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Information */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <MapPin className="h-5 w-5 mr-2 text-orange-400" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-300 whitespace-pre-line">
                    {selectedOrder.order.shipping_address}
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}