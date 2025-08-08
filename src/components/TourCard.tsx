import Link from 'next/link'
import Image from 'next/image'

interface TourCardProps {
  tour: {
    id: string
    title: string
    start_date: string
    end_date: string
    price: number
    currency: string
    tour_images?: {
      image_url: string
      alt_text?: string
    }[]
  }
}

export default function TourCard({ tour }: TourCardProps) {
  // Get the first image as thumbnail or use a placeholder
  const thumbnailImage = tour.tour_images?.[0]
  const thumbnailUrl = thumbnailImage?.image_url || '/placeholder-tour.jpg'
  const altText = thumbnailImage?.alt_text || `${tour.title} tour image`

  // Format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Format price
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(price)
  }

  return (
    <Link href={`/tours/${tour.id}`} className="group">
      <div className="card overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="relative h-48 bg-secondary-200">
          <Image
            src={thumbnailUrl}
            alt={altText}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              const target = e.target as HTMLImageElement
              target.src = '/placeholder-tour.jpg'
            }}
          />
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-semibold text-secondary-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
            {tour.title}
          </h3>
          
          <div className="flex items-center justify-between text-sm text-secondary-600 mb-3">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {formatDate(tour.start_date)} - {formatDate(tour.end_date)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-primary-600">
              {formatPrice(tour.price, tour.currency)}
            </div>
            <div className="text-sm text-secondary-500">
              per person
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}