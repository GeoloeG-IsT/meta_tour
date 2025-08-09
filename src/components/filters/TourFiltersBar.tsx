import { PER_PAGE_OPTIONS, DIFFICULTY_OPTIONS, SORT_OPTIONS } from '@/constants/tours'
import { useState } from 'react'
import { useI18n } from '@/contexts/I18nContext'
import { t } from '@/i18n'

type Filters = {
  startDate: string
  endDate: string
  countries: string[]
  difficulty: string
  perPage: number
  sort: string
}

interface TourFiltersBarProps {
  value: { query: string; filters: Filters }
  onChange: (next: Partial<{ query: string; filters: Partial<Filters> }>) => void
  onSearch: () => Promise<void> | void
  isSearching: boolean
  onClear: () => void
}

export default function TourFiltersBar({ value, onChange, onSearch, isSearching, onClear }: TourFiltersBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { locale } = useI18n()
  const { query, filters } = value

  return (
    <div className="card p-4 mb-6 sticky top-16 z-30">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <div className="flex-1">
          <input
            className="form-input rounded-full"
            placeholder={t(locale, 'filters_search_placeholder')}
            value={query}
            onChange={(e) => onChange({ query: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void onSearch()
              }
            }}
            aria-label="Search"
          />
        </div>
        <div>
          <button className="btn-primary" disabled={isSearching || !query.trim()} onClick={() => void onSearch()}>
            {isSearching ? t(locale, 'filters_analyzing') : t(locale, 'filters_search')}
          </button>
        </div>
        <div className="md:ml-auto">
          <button
            className="btn-secondary p-2 h-10 w-10 flex items-center justify-center"
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-expanded={filtersOpen}
            aria-controls="filters-panel"
            aria-label="Toggle filters"
            title={filtersOpen ? t(locale, 'filters_hide') : t(locale, 'filters_show')}
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
            <label className="form-label">{t(locale, 'filters_per_page')}</label>
            <select className="form-input" value={filters.perPage} onChange={(e) => onChange({ filters: { perPage: Number(e.target.value) } })} aria-label="Per page">
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        <div>
          <label className="form-label">{t(locale, 'filters_sort')}</label>
          <select className="form-input" value={filters.sort} onChange={(e) => onChange({ filters: { sort: e.target.value } })}>
            <option value="newest">{t(locale, 'sort_newest')}</option>
            <option value="price_asc">{t(locale, 'sort_price_asc')}</option>
            <option value="price_desc">{t(locale, 'sort_price_desc')}</option>
            <option value="country_asc">{t(locale, 'sort_country_asc')}</option>
            <option value="country_desc">{t(locale, 'sort_country_desc')}</option>
            <option value="start_date_asc">{t(locale, 'sort_start_date_asc')}</option>
            <option value="start_date_desc">{t(locale, 'sort_start_date_desc')}</option>
          </select>
        </div>
          <div>
            <label className="form-label">{t(locale, 'filters_start_after')}</label>
            <input type="date" className="form-input" value={filters.startDate} onChange={(e) => onChange({ filters: { startDate: e.target.value } })} />
          </div>
          <div>
            <label className="form-label">{t(locale, 'filters_end_before')}</label>
            <input type="date" className="form-input" value={filters.endDate} onChange={(e) => onChange({ filters: { endDate: e.target.value } })} />
          </div>
          <div>
            <label className="form-label">{t(locale, 'filters_countries')}</label>
            {filters.countries.length === 0 ? (
              <div className="text-sm text-secondary-600">{t(locale, 'filters_prompt_hint')}</div>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {filters.countries.map((c) => (
                  <span key={c} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {c}
                    <button
                      className="ml-1 text-gray-500 hover:text-gray-700"
                      onClick={() => onChange({ filters: { countries: filters.countries.filter((x) => x !== c) } })}
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
            <label className="form-label">{t(locale, 'filters_difficulty')}</label>
            <select className="form-input" value={filters.difficulty} onChange={(e) => onChange({ filters: { difficulty: e.target.value } })}>
              <option value="">{t(locale, 'filters_difficulty_any')}</option>
              <option value="easy">{t(locale, 'difficulty_easy')}</option>
              <option value="moderate">{t(locale, 'difficulty_moderate')}</option>
              <option value="challenging">{t(locale, 'difficulty_challenging')}</option>
              <option value="intense">{t(locale, 'difficulty_intense')}</option>
            </select>
          </div>
          <div className="flex items-end justify-end">
            <button className="btn-secondary" onClick={onClear}>{t(locale, 'filters_clear')}</button>
          </div>
        </div>
      )}
    </div>
  )
}


