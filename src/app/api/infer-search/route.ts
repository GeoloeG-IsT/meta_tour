import { NextResponse } from 'next/server'

type Filters = {
  startDate?: string | null
  endDate?: string | null
  countries?: string[] | null
  difficulty?: 'easy' | 'moderate' | 'challenging' | 'intense' | null
}

function titleCase(input: string): string {
  return input
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

function simpleInfer(query: string): Filters {
  const q = query.toLowerCase()
  const filters: Filters = {}

  // Difficulty detection
  if (/\b(easy|beginner|gentle|relaxed)\b/.test(q)) filters.difficulty = 'easy'
  else if (/\b(moderate|medium|intermediate)\b/.test(q)) filters.difficulty = 'moderate'
  else if (/\b(challenging|hard|difficult|tough)\b/.test(q)) filters.difficulty = 'challenging'
  else if (/\b(intense|extreme)\b/.test(q)) filters.difficulty = 'intense'

  // Date detection: ISO-like dates (avoid matchAll for older targets)
  const dateRegex = /(\d{4}-\d{2}-\d{2})/g
  const dates = (q.match(dateRegex) || []) as string[]
  if (dates.length > 0) filters.startDate = dates[0]
  if (dates.length > 1) filters.endDate = dates[1]

  // Region detection → country list
  const regions: Record<string, string[]> = {
    asia: [
      'China','India','Japan','Indonesia','Pakistan','Bangladesh','Vietnam','Philippines','Thailand','Myanmar','South Korea','Nepal','Sri Lanka','Malaysia','Cambodia','Laos','Mongolia','Bhutan','Singapore','Brunei','Timor-Leste','Maldives'
    ],
    'southeast asia': ['Indonesia','Thailand','Vietnam','Philippines','Malaysia','Singapore','Cambodia','Laos','Myanmar','Brunei','Timor-Leste'],
    'south asia': ['India','Pakistan','Bangladesh','Sri Lanka','Nepal','Bhutan','Maldives'],
    'east asia': ['China','Japan','South Korea','Mongolia','Taiwan'],
    europe: [
      'United Kingdom','Ireland','France','Spain','Portugal','Italy','Germany','Netherlands','Belgium','Switzerland','Austria','Greece','Norway','Sweden','Finland','Denmark','Poland','Czech Republic','Hungary','Croatia','Slovenia','Slovakia','Romania','Bulgaria'
    ],
    'western europe': ['France','Spain','Portugal','Italy','Germany','Netherlands','Belgium','Switzerland','Austria'],
    africa: ['Morocco','Egypt','South Africa','Kenya','Tanzania','Ethiopia','Ghana','Nigeria','Rwanda','Uganda','Namibia','Botswana'],
    'north america': ['United States','Canada','Mexico'],
    'central america': ['Guatemala','Belize','Honduras','El Salvador','Nicaragua','Costa Rica','Panama'],
    'south america': ['Brazil','Argentina','Chile','Peru','Colombia','Ecuador','Bolivia','Paraguay','Uruguay','Venezuela'],
    oceania: ['Australia','New Zealand','Fiji','Samoa','Papua New Guinea','Vanuatu']
  }
  for (const regionKey of Object.keys(regions)) {
    if (q.includes(regionKey)) {
      filters.countries = regions[regionKey].map((n) => n.toLowerCase())
      break
    }
  }

  // Country detection: naive list
  const countryList = [
    'nepal','india','peru','spain','italy','france','portugal','greece','japan','thailand','indonesia','morocco',
    'united states','usa','canada','mexico','brazil','argentina','chile','australia','new zealand','egypt','turkey'
  ]
  for (const c of countryList) {
    if (q.includes(c)) {
      const finalLower = c === 'usa' ? 'united states' : c
      if (filters.countries) {
        if (!filters.countries.includes(finalLower)) filters.countries.push(finalLower)
      } else if (!filters.countries) {
        filters.countries = [finalLower]
      }
    }
  }

  return filters
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json()
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY

    // If no API key, return heuristic inference
    if (!apiKey) {
      return NextResponse.json({ filters: simpleInfer(query) })
    }

    const system = `You are an assistant that extracts search filters from a brief trip description.
Return a STRICT JSON object with keys: startDate, endDate, countries, difficulty.
Rules:
- Dates must be in YYYY-MM-DD when you can infer a concrete date; otherwise null.
- Difficulty must be one of: easy | moderate | challenging | intense | null.
- Countries should be an array of country names in Title Case mentioned in the description directly or indirectly (e.g. if a continent is mentioned, include the top 10 countries in that continent).
- If you cannot infer a field, set it to null. Do not guess beyond common sense.`

    const user = `Description: ${query}`

    const callStart = Date.now()
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
      }),
    })
    const callEnd = Date.now()
    console.log('[Infer Search] LLM call ms:', callEnd - callStart)

    if (!res.ok) {
      // Fallback to heuristic if LLM call fails
      return NextResponse.json({ filters: simpleInfer(query) })
    }

    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content
    console.log('content', content)
    if (!content) {
      return NextResponse.json({ filters: simpleInfer(query) })
    }

    let parsed: Filters = {}
    try {
      parsed = JSON.parse(content)
    } catch {
      parsed = simpleInfer(query)
    }

    // Sanitize outputs
    // Normalize countries list
    let countriesList: string[] | null = null
    if (Array.isArray(parsed.countries)) {
      countriesList = parsed.countries
        .map((c) => (typeof c === 'string' ? c.trim().toLowerCase() : ''))
        .filter(Boolean)
    }

    const out: Filters = {
      startDate: parsed.startDate || null,
      endDate: parsed.endDate || null,
      countries: countriesList && countriesList.length > 0 ? countriesList : null,
      difficulty: (['easy','moderate','challenging','intense'] as const).includes((parsed.difficulty as any))
        ? (parsed.difficulty as any)
        : null,
    }

    return NextResponse.json({ filters: out })
  } catch (e) {
    return NextResponse.json({ filters: {} }, { status: 200 })
  }
}


