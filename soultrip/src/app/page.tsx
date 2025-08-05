import { Button } from '@/components/ui/button'
import { Compass, Heart, Users, Star, ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-display font-bold text-gray-900 mb-6">
              Transform Your Journey,{' '}
              <span className="soultrip-gradient-text">Transform Your Soul</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Discover meaningful travel experiences that nurture your spirit, connect you with like-minded souls, 
              and create lasting transformation. Join the conscious travel revolution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="soultrip-button-primary">
                <Compass className="mr-2 h-5 w-5" />
                Discover Journeys
              </Button>
              <Button variant="outline" size="lg" className="soultrip-button-secondary">
                Create Your Tour
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Floating elements for visual appeal */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary-200 rounded-full opacity-20 animate-pulse-slow"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-accent-200 rounded-full opacity-20 animate-pulse-slow" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-spiritual-200 rounded-full opacity-20 animate-pulse-slow" style={{animationDelay: '2s'}}></div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-4">
              Why Choose SoulTrip?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're not just another booking platform. We're a community-first ecosystem designed 
              specifically for transformational travel experiences.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors">
                <Heart className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Conscious Community</h3>
              <p className="text-gray-600">
                Connect with like-minded travelers who share your values and spiritual journey.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-accent-200 transition-colors">
                <Users className="h-8 w-8 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert Guides</h3>
              <p className="text-gray-600">
                Learn from verified spiritual teachers, wellness experts, and transformational guides.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-spiritual-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-spiritual-200 transition-colors">
                <Star className="h-8 w-8 text-spiritual-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Curated Experiences</h3>
              <p className="text-gray-600">
                Every journey is carefully crafted to ensure authentic, meaningful transformational experiences.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-earth-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-earth-200 transition-colors">
                <Compass className="h-8 w-8 text-earth-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sustainable Travel</h3>
              <p className="text-gray-600">
                Support local communities and practice responsible tourism that benefits everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-4">
              Your Journey Starts Here
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Three simple steps to begin your transformational travel experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Discover</h3>
              <p className="text-gray-600">
                Browse our curated collection of transformational tours, retreats, and spiritual journeys 
                from verified organizers worldwide.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-accent-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect</h3>
              <p className="text-gray-600">
                Join pre-journey communities, meet fellow travelers, and prepare for your 
                transformational experience together.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-spiritual-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Transform</h3>
              <p className="text-gray-600">
                Embark on your journey and continue growing in our post-experience communities 
                that support your ongoing transformation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Organizers Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-6">
                For Transformational Tour Organizers
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Everything you need to create, manage, and grow your transformational travel business 
                in one comprehensive platform.
              </p>
              
              <div className="space-y-4 mb-8">
                {[
                  'Journey Builder with beautiful landing pages',
                  'Participant management and CRM tools',
                  'Flexible payment processing and installment plans',
                  'Community building features',
                  'AI-powered content assistance',
                  'Analytics and business insights'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-primary-500 mr-3" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
              
              <Button size="lg" className="soultrip-button-primary">
                Start Creating Tours
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl p-8 shadow-2xl">
                <div className="bg-white rounded-xl p-6 shadow-lg mb-4">
                  <div className="h-4 bg-primary-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-accent-200 rounded-full mr-3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-600 to-accent-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-6">
            Ready to Begin Your Transformation?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of conscious travelers who have discovered meaningful journeys through SoulTrip.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-primary-600 hover:bg-primary-50">
              Browse Tours
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary-600">
              Become an Organizer
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-display font-bold mb-4">SoulTrip</h3>
              <p className="text-gray-400 mb-4">
                Transforming travel, transforming lives through conscious journeys and meaningful connections.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Travelers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/tours" className="hover:text-white transition-colors">Browse Tours</Link></li>
                <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="/community" className="hover:text-white transition-colors">Community</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Organizers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/organizers" className="hover:text-white transition-colors">Start Creating</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/resources" className="hover:text-white transition-colors">Resources</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 SoulTrip. All rights reserved. Built with ❤️ for conscious travelers.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}