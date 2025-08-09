/* eslint-disable no-console */
// Seed script: creates 10 organizer users and 5 tours each with images
// Also (by default) adds 100 participants and books 3 tours each
// Optional --reset will delete previously seeded organizers/tours first
// Optional --no-participants skips participant creation
// Requirements:
// - Environment variables set: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   (service role key is sensitive; do NOT expose it client-side)
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.js [--reset] [--no-participants]

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const ARG_RESET = process.argv.includes('--reset')
const ARG_NO_PARTICIPANTS = process.argv.includes('--no-participants')

const COUNTRIES = [
  'india',
  'costa rica',
  'berlin',
  'ukraine',
  'france',
]

// Generate robust image URLs that always return a valid image
function candidateImageUrls(country, i = 0) {
  const slug = slugify(country)
  const seed = `${slug}-${Date.now()}-${i}`
  return [
    // picsum always returns a valid image
    `https://picsum.photos/seed/${seed}/1600/900`,
    `https://picsum.photos/seed/${seed}-alt/1600/900`,
    // fallback placeholder
    `https://placehold.co/1600x900?text=${encodeURIComponent(country)}`,
  ]
}

const DIFFICULTIES = ['easy', 'moderate', 'challenging', 'intense']
const CURRENCIES = ['USD', 'EUR', 'UAH']

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function slugify(str) { return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') }

async function ensureBucket() {
  try {
    // Try to create bucket (idempotent)
    await supabase.storage.createBucket('tour-images', { public: true })
    console.log('Created bucket tour-images')
  } catch (e) {
    // Ignore if exists
  }
}

async function createOrganizer(index) {
  const fullName = `Organizer ${index + 1}`
  const email = `organizer${index + 1}-${Date.now()}@example.com`
  const password = `Password${randInt(100000, 999999)}!`
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: 'organizer',
    },
  })
  if (error) throw error
  const userId = data.user?.id
  if (!userId) throw new Error('No user id created')

  // Ensure role is organizer in public.users (trigger should do this, but update just in case)
  await supabase.from('users').update({ full_name: fullName, role: 'organizer' }).eq('id', userId)
  return { userId, fullName, email, password }
}

function generateTour(i, organizerName) {
  const country = randomFrom(COUNTRIES)
  const difficulty = randomFrom(DIFFICULTIES)
  const start = new Date()
  start.setDate(start.getDate() + randInt(7, 120))
  const end = new Date(start)
  end.setDate(start.getDate() + randInt(5, 12))
  const title = `${country.toUpperCase()} Spiritual Journey #${i + 1}`
  const description = `A transformative retreat in ${country}, guided by ${organizerName}.`
  const itinerary = {
    days: randInt(5, 10),
    highlights: [
      'Opening ceremony',
      'Daily meditation',
      'Sacred site visits',
      'Integration circle',
    ],
    seed: true,
  }
  const price = randInt(300, 2500)
  const currency = randomFrom(CURRENCIES)
  const max_participants = randInt(3, 10)
  return {
    title,
    description,
    itinerary,
    start_date: start.toISOString().slice(0, 10),
    end_date: end.toISOString().slice(0, 10),
    price,
    currency,
    max_participants,
    status: 'published',
    country,
    difficulty,
  }
}

async function fetchImageBuffer(country) {
  const urls = candidateImageUrls(country)
  let lastErr
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    try {
      const ctrl = new AbortController()
      const timeout = setTimeout(() => ctrl.abort(), 10000)
      const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'User-Agent': 'seed-script/1.0' } })
      clearTimeout(timeout)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length > 0) return buf
      throw new Error('empty body')
    } catch (e) {
      lastErr = e
    }
  }
  throw new Error(`Failed to fetch any candidate image: ${lastErr?.message || lastErr}`)
}

async function uploadImage(tourId, country) {
  const arrayBuf = await fetchImageBuffer(country)
  const filePath = `${tourId}/${slugify(country)}.jpg`
  const { error: upErr } = await supabase.storage.from('tour-images').upload(filePath, Buffer.from(arrayBuf), {
    contentType: 'image/jpeg',
    upsert: true,
  })
  if (upErr) throw upErr
  const { data: pub } = supabase.storage.from('tour-images').getPublicUrl(filePath)
  return { filePath, publicUrl: pub.publicUrl }
}

async function createToursForOrganizer(organizerId, organizerName) {
  for (let i = 0; i < 5; i++) {
    const t = generateTour(i, organizerName)
    const { data, error } = await supabase
      .from('tours')
      .insert({
        organizer_id: organizerId,
        title: t.title,
        description: t.description,
        itinerary: t.itinerary,
        start_date: t.start_date,
        end_date: t.end_date,
        price: t.price,
        currency: t.currency,
        max_participants: t.max_participants,
        status: t.status,
        country: t.country,
        difficulty: t.difficulty,
      })
      .select('id')
      .single()

    if (error) throw error
    const tourId = data.id
    try {
      const img = await uploadImage(tourId, t.country)
      await supabase.from('tour_images').insert({
        tour_id: tourId,
        image_url: img.publicUrl,
        alt_text: `${t.title} main image`,
      })
    } catch (e) {
      console.warn('Image upload failed for tour', tourId, e?.message || e)
    }
  }
}

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

async function addParticipantsAndBookings() {
  const NUM_PARTICIPANTS = 1000
  console.log(`Creating ${NUM_PARTICIPANTS} participants and booking tours ...`)
  const { data: tours, error } = await supabase
    .from('tours')
    .select('id')
    .order('created_at', { ascending: false })
  if (error) throw error
  if (!tours?.length) { console.log('No tours found to book'); return }

  let created = 0
  for (let i = 0; i < NUM_PARTICIPANTS; i++) {
    const email = `participant${i + 1}-${Date.now()}@example.com`
    const password = `Password${randInt(100000, 999999)}!`
    const full_name = `Participant ${i + 1}`
    const { data: au, error: aerr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: 'participant' },
    })
    if (aerr) { console.warn('Create user failed', aerr.message); continue }
    const pid = au.user?.id
    if (!pid) continue
    await supabase.from('users').update({ full_name: full_name, role: 'participant' }).eq('id', pid)

    const shuffled = [...tours].sort(() => Math.random() - 0.5)
    let booked = 0
    for (const t of shuffled) {
      if (booked >= 3) break
      try {
        const { error: berr } = await supabase
          .from('bookings')
          .insert({ tour_id: t.id, participant_id: pid, status: 'pending', payment_status: 'unpaid' })
        if (!berr) booked++
      } catch {}
    }
    created++
  }
  console.log(`Created ${created} participants with bookings`)
}

async function deleteSeedTours() {
  console.log('Deleting previous seed tours (itinerary.seed = true) ...')
  const { data: seedTours } = await supabase
    .from('tours')
    .select('id')
    .contains('itinerary', { seed: true })
  if (seedTours && seedTours.length) {
    const ids = seedTours.map((t) => t.id)
    await supabase.from('tour_images').delete().in('tour_id', ids)
    await supabase.from('bookings').delete().in('tour_id', ids)
    await supabase.from('tours').delete().in('id', ids)
    console.log(`Deleted ${ids.length} tours and related rows`)
  } else {
    console.log('No previous seed tours found')
  }
}

async function deleteSeedOrganizers() {
  console.log('Deleting previous seed organizers (organizer*-[timestamp]@example.com) ...')
  const { data: list } = await supabase.auth.admin.listUsers()
  const toDelete = list?.users?.filter((u) => /organizer\d+-\d+@example\.com$/.test(u.email || '')) || []
  for (const u of toDelete) {
    try { await supabase.auth.admin.deleteUser(u.id) } catch {}
  }
  console.log(`Deleted ${toDelete.length} organizer auth users`)
}

async function deleteSeedParticipants() {
  console.log('Deleting previous seed participants (participant*-[timestamp]@example.com) ...')
  const { data: list } = await supabase.auth.admin.listUsers()
  const toDelete = list?.users?.filter((u) => /participant\d+-\d+@example\.com$/.test(u.email || '')) || []
  for (const u of toDelete) {
    try { await supabase.auth.admin.deleteUser(u.id) } catch {}
  }
  console.log(`Deleted ${toDelete.length} participant auth users`)
}

async function main() {
  console.log('Seeding starting...')
  await ensureBucket()
  if (ARG_RESET) {
    await deleteSeedTours()
    await deleteSeedOrganizers()
    await deleteSeedParticipants()
  }
  const NUM_ORGANIZERS = 100
  for (let i = 0; i < NUM_ORGANIZERS; i++) {
    try {
      const org = await createOrganizer(i)
      console.log(`Created organizer: ${org.email}`)
      await createToursForOrganizer(org.userId, org.fullName)
      console.log(`Created tours for ${org.email}`)
    } catch (e) {
      console.error('Error for organizer', i + 1, e?.message || e)
    }
  }
  if (!ARG_NO_PARTICIPANTS) {
    // After tours exist, add participants and book 3 tours each
    await addParticipantsAndBookings()
  }
  console.log('Seeding completed.')
}

main().catch((e) => {
  console.error('Fatal error', e)
  process.exit(1)
})


