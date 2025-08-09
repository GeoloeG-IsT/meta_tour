import Link from 'next/link'
import Image from 'next/image'
import type { TourSummary } from '@/types/tour'
import { formatShortDate, formatPrice } from '@/lib/format'

interface TourCardProps {
  tour: TourSummary
  status?: 'available' | 'sold_out'
  isBooked?: boolean
}

export default function TourCard({ tour, status = 'available', isBooked = false }: TourCardProps) {
  // Get the first image as thumbnail or use a placeholder
  const thumbnailImage = tour.tour_images?.[0]
  const thumbnailUrl = thumbnailImage?.image_url || '/placeholder-tour.jpg'
  const altText = thumbnailImage?.alt_text || `${tour.title} tour image`

  const formatDate = (dateString: string) => formatShortDate(dateString)

  return (
    <div className="group">
      <div className="card overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <Link href={`/tours/${tour.id}`} aria-label={`View tour ${tour.title}`}>
          <div className="relative h-48 bg-secondary-200">
          {/* Status badges */}
          <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
            <span
              className={
                `px-2 py-0.5 rounded text-xs font-medium ` +
                (status === 'sold_out' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800')
              }
            >
              {status === 'sold_out' ? 'Sold out' : 'Available'}
            </span>
            {isBooked && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">Booked</span>
            )}
          </div>
          <Image
            src={thumbnailUrl}
            alt={altText}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          </div>
        </Link>
        
        <div className="p-6">
          <Link href={`/tours/${tour.id}`} className="block group-hover:text-primary-600 transition-colors">
            <h3 className="text-xl font-semibold text-secondary-900 mb-2 line-clamp-2">
              {tour.title}
            </h3>
          </Link>

          <div className="mb-3 flex items-center gap-2 text-xs">
            {tour.country && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-secondary-100 text-secondary-800">
                {tour.country}
              </span>
            )}
            {tour.difficulty && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-secondary-100 text-secondary-800 capitalize">
                {tour.difficulty}
              </span>
            )}
          </div>

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

          {tour.organizer_id && (
            <div className="mb-3 text-sm">
              <span className="text-secondary-500 mr-1">Organizer:</span>
              <Link href={`/profile/${tour.organizer_id}`} className="text-indigo-600 hover:text-indigo-500">
                {tour.organizer_name || 'View profile'}
              </Link>
            </div>
          )}
          
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
    </div>
  )
}