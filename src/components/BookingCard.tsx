import Link from 'next/link'

export interface BookingCardProps {
  booking: {
    id: string
    status: 'pending' | 'confirmed' | 'cancelled'
    payment_status: 'unpaid' | 'paid' | 'partial'
    created_at: string
    tour: { id: string; title: string; start_date: string; end_date: string }
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

export default function BookingCard({ booking }: BookingCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-secondary-900">{booking.tour.title}</div>
          <div className="text-sm text-secondary-600">
            {formatDate(booking.tour.start_date)} – {formatDate(booking.tour.end_date)}
          </div>
          <div className="mt-1 text-sm">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-200 text-secondary-800 mr-2">
              {booking.status}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-200 text-secondary-800">
              {booking.payment_status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/bookings/${booking.id}`} className="text-indigo-600 hover:text-indigo-500 text-sm">
            View Booking
          </Link>
          <Link href={`/tours/${booking.tour.id}`} className="text-secondary-700 hover:text-secondary-900 text-sm">
            View Tour
          </Link>
        </div>
      </div>
    </div>
  )
}


