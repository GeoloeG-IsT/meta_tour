export const DIFFICULTY_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'easy', label: 'Easy' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'challenging', label: 'Challenging' },
  { value: 'intense', label: 'Intense' },
]

export const PER_PAGE_OPTIONS = [6, 9, 12, 18]

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest', column: 'created_at', ascending: false },
  { value: 'price_asc', label: 'Price (low → high)', column: 'price', ascending: true },
  { value: 'price_desc', label: 'Price (high → low)', column: 'price', ascending: false },
  { value: 'country_asc', label: 'Country (A → Z)', column: 'country', ascending: true },
  { value: 'country_desc', label: 'Country (Z → A)', column: 'country', ascending: false },
  { value: 'start_date_asc', label: 'Start date (soonest)', column: 'start_date', ascending: true },
  { value: 'start_date_desc', label: 'Start date (latest)', column: 'start_date', ascending: false },
]


