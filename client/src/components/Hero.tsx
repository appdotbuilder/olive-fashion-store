import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Users, ShoppingBag } from 'lucide-react';

interface HeroProps {
  onShopNowClick: () => void;
}

export function Hero({ onShopNowClick }: HeroProps) {
  return (
    <section className="relative hero-gradient border-b border-gray-800 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ff6b35' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container mx-auto px-4 py-20 lg:py-32 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-8 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-gray-800/50 border border-gray-700 rounded-full px-4 py-2">
              <Star className="h-4 w-4 text-orange-400 fill-orange-400" />
              <span className="text-sm text-gray-300">#1 Fashion Destination</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="text-white">Elevate Your</span>
                <br />
                <span className="text-gradient">Style Game</span>
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
                Discover premium fashion apparel that defines your unique style. 
                From casual elegance to bold statements.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={onShopNowClick}
                size="lg"
                className="btn-olive h-14 px-8 text-lg font-semibold group"
              >
                Shop Collection
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-8 text-lg border-gray-700 text-white hover:bg-gray-800"
              >
                View Lookbook
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center space-x-8 pt-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-orange-400" />
                <div>
                  <div className="text-white font-semibold">50K+</div>
                  <div className="text-sm text-gray-400">Happy Customers</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <ShoppingBag className="h-5 w-5 text-orange-400" />
                <div>
                  <div className="text-white font-semibold">1000+</div>
                  <div className="text-sm text-gray-400">Premium Items</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Hero Image */}
          <div className="relative animate-slide-up">
            {/* Main Hero Image */}
            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=750&fit=crop&crop=center"
                  alt="Fashion Model"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Floating Card 1 */}
              <div className="absolute -top-6 -left-6 bg-gray-900/90 border border-gray-700 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  <div>
                    <div className="text-white font-semibold text-sm">New Arrival</div>
                    <div className="text-gray-400 text-xs">Premium Collection</div>
                  </div>
                </div>
              </div>

              {/* Floating Card 2 */}
              <div className="absolute -bottom-6 -right-6 bg-gray-900/90 border border-gray-700 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 bg-orange-400 rounded-full border-2 border-gray-900" />
                    <div className="w-6 h-6 bg-blue-400 rounded-full border-2 border-gray-900" />
                    <div className="w-6 h-6 bg-purple-400 rounded-full border-2 border-gray-900" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">4.9★</div>
                    <div className="text-gray-400 text-xs">2.3k Reviews</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-1/4 right-0 w-32 h-32 bg-orange-400/10 rounded-full blur-3xl" />
              <div className="absolute bottom-1/4 left-0 w-24 h-24 bg-purple-400/10 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent" />
    </section>
  );
}