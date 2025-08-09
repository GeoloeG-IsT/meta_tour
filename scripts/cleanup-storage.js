/* eslint-disable no-console */
// Cleanup storage: remove files in 'tour-images' bucket not referenced in DB table 'tour_images'
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/cleanup-storage.js [--dry-run]

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
const DRY_RUN = process.argv.includes('--dry-run')
const BUCKET = 'tour-images'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

async function listFolder(prefix) {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
    limit: 1000,
    sortBy: { column: 'name', order: 'asc' },
  })
  if (error) throw error
  return data || []
}

async function listAllFiles(prefix = '') {
  const entries = await listFolder(prefix)
  const files = []
  for (const e of entries) {
    const key = prefix ? `${prefix}/${e.name}` : e.name
    // Heuristic: folders have no metadata.size; files usually do
    const isLikelyFile = e?.metadata && typeof e.metadata.size === 'number'
    if (isLikelyFile) {
      files.push(key)
    } else {
      // Try listing deeper; if it fails or returns 0, treat as file
      try {
        const children = await listFolder(key)
        if (!children || children.length === 0) {
          files.push(key)
        } else {
          const nested = await listAllFiles(key)
          files.push(...nested)
        }
      } catch {
        files.push(key)
      }
    }
  }
  return files
}

function extractKeyFromPublicUrl(imageUrl) {
  try {
    const u = new URL(imageUrl)
    const idx = u.pathname.indexOf(`/storage/v1/object/public/${BUCKET}/`)
    if (idx === -1) return null
    return u.pathname.substring(idx + `/storage/v1/object/public/${BUCKET}/`.length)
  } catch {
    return null
  }
}

async function getReferencedKeys() {
  const keys = new Set()
  let from = 0
  const pageSize = 1000
  while (true) {
    const { data, error } = await supabase
      .from('tour_images')
      .select('image_url')
      .range(from, from + pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    for (const row of data) {
      const key = extractKeyFromPublicUrl(row.image_url)
      if (key) keys.add(key)
    }
    if (data.length < pageSize) break
    from += pageSize
  }
  return keys
}

async function main() {
  console.log('Listing all files in bucket:', BUCKET)
  const allFiles = await listAllFiles('')
  console.log(`Found ${allFiles.length} objects in storage`)

  console.log('Loading referenced keys from DB ...')
  const referenced = await getReferencedKeys()
  console.log(`DB references ${referenced.size} storage objects`)

  const toDelete = allFiles.filter((k) => !referenced.has(k))
  if (toDelete.length === 0) {
    console.log('No unreferenced files to delete. All good!')
    return
  }
  console.log(`Unreferenced files to delete: ${toDelete.length}`)

  if (DRY_RUN) {
    console.log('[DRY RUN] First 20 keys:', toDelete.slice(0, 20))
    return
  }

  // Delete in batches of 100
  const batchSize = 100
  for (let i = 0; i < toDelete.length; i += batchSize) {
    const slice = toDelete.slice(i, i + batchSize)
    const { error } = await supabase.storage.from(BUCKET).remove(slice)
    if (error) {
      console.error('Delete error for batch starting at', i, error.message)
    } else {
      console.log(`Deleted ${slice.length} objects`)
    }
  }
  console.log('Cleanup done')
}

main().catch((e) => {
  console.error('Fatal error:', e?.message || e)
  process.exit(1)
})


