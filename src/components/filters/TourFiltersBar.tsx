import { PER_PAGE_OPTIONS, DIFFICULTY_OPTIONS } from '@/constants/tours'

interface TourFiltersBarProps {
  // Search
  query: string
  setQuery: (v: string) => void
  runInference: () => Promise<void> | void
  isInferring: boolean

  // Filters
  startDate: string
  endDate: string
  setStartDate: (v: string) => void
  setEndDate: (v: string) => void
  countries: string[]
  setCountries: (v: string[]) => void
  difficulty: string
  setDifficulty: (v: string) => void

  // Per page
  perPage: number
  setPerPage: (n: number) => void

  // Dropdown
  filtersOpen: boolean
  setFiltersOpen: (b: boolean) => void

  // Clear
  onClear: () => void
}

export default function TourFiltersBar(props: TourFiltersBarProps) {
  const {
    query,
    setQuery,
    runInference,
    isInferring,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    countries,
    setCountries,
    difficulty,
    setDifficulty,
    perPage,
    setPerPage,
    filtersOpen,
    setFiltersOpen,
    onClear,
  } = props

  return (
    <div className="card p-4 mb-6 sticky top-16 z-30">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <div className="flex-1">
          <input
            className="form-input rounded-full"
            placeholder="Search tours with a prompt..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void runInference()
              }
            }}
            aria-label="Search"
          />
        </div>
        <div>
          <button className="btn-primary" disabled={isInferring || !query.trim()} onClick={() => void runInference()}>
            {isInferring ? 'Analyzing…' : 'Search'}
          </button>
        </div>
        <div className="md:ml-auto">
          <button
            className="btn-secondary p-2 h-10 w-10 flex items-center justify-center"
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-expanded={filtersOpen}
            aria-controls="filters-panel"
            aria-label="Toggle filters"
            title={filtersOpen ? 'Hide filters' : 'Show filters'}
          >
            {filtersOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M11.47 7.72a.75.75 0 0 1 1.06 0l6 6a.75.75 0 1 1-1.06 1.06L12 9.31l-5.47 5.47a.75.75 0 0 1-1.06-1.06l6-6z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 0 1-1.06 0l-6-6a.75.75 0 1 1 1.06-1.06L12 14.69l5.47-5.47a.75.75 0 0 1 1.06 1.06l-6 6z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {filtersOpen && (
        <div id="filters-panel" className="mt-4 border-t pt-4 grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="form-label">Per Page</label>
            <select className="form-input" value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} aria-label="Per page">
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Start After</label>
            <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label">End Before</label>
            <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Countries</label>
            {countries.length === 0 ? (
              <div className="text-sm text-secondary-600">Use the search prompt to infer countries (e.g., &quot;in Asia&quot;)</div>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {countries.map((c) => (
                  <span key={c} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {c}
                    <button
                      className="ml-1 text-gray-500 hover:text-gray-700"
                      onClick={() => setCountries(countries.filter((x) => x !== c))}
                      aria-label={`Remove ${c}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="form-label">Difficulty</label>
            <select className="form-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              {DIFFICULTY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end justify-end">
            <button className="btn-secondary" onClick={onClear}>Clear Filters</button>
          </div>
        </div>
      )}
    </div>
  )
}


