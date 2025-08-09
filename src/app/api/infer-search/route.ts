import { NextResponse } from 'next/server'

type Filters = {
  startDate?: string | null
  endDate?: string | null
  country?: string | null
  difficulty?: 'easy' | 'moderate' | 'challenging' | 'intense' | null
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

  // Country detection: naive list
  const countries = [
    'nepal','india','peru','spain','italy','france','portugal','greece','japan','thailand','indonesia','morocco',
    'united states','usa','canada','mexico','brazil','argentina','chile','australia','new zealand','egypt','turkey'
  ]
  for (const c of countries) {
    if (q.includes(c)) {
      // Capitalize nicely
      const normalized = c.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      filters.country = normalized === 'Usa' ? 'United States' : normalized
      break
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
Return a STRICT JSON object with keys: startDate, endDate, country, difficulty.
Rules:
- Dates must be in YYYY-MM-DD when you can infer a concrete date; otherwise null.
- Difficulty must be one of: easy | moderate | challenging | intense | null.
- Country should be a country name in Title Case if confidently inferred; otherwise null.
- If you cannot infer a field, set it to null. Do not guess beyond common sense.`

    const user = `Description: ${query}`

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

    if (!res.ok) {
      // Fallback to heuristic if LLM call fails
      return NextResponse.json({ filters: simpleInfer(query) })
    }

    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content
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
    const out: Filters = {
      startDate: parsed.startDate || null,
      endDate: parsed.endDate || null,
      country: parsed.country || null,
      difficulty: (['easy','moderate','challenging','intense'] as const).includes((parsed.difficulty as any))
        ? parsed.difficulty as any
        : null,
    }

    return NextResponse.json({ filters: out })
  } catch (e) {
    return NextResponse.json({ filters: {} }, { status: 200 })
  }
}


