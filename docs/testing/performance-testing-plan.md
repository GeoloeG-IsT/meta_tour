# Performance Testing Plan for SoulTrip

## Overview

The SoulTrip platform must handle concurrent bookings, real-time updates, and high-quality media delivery while maintaining excellent user experience. This plan outlines comprehensive performance testing strategies.

## Performance Requirements

### Response Time Targets
- **Page Load Time**: <2 seconds (95th percentile)
- **API Response Time**: <500ms (95th percentile)
- **Search Results**: <1 second
- **Payment Processing**: <3 seconds end-to-end
- **Real-time Updates**: <100ms latency

### Throughput Targets
- **Concurrent Users**: 1,000 active users
- **Booking Transactions**: 100 bookings/minute peak
- **Search Queries**: 500 searches/minute
- **Media Delivery**: 10GB/hour peak bandwidth

### Availability Targets
- **Uptime**: 99.9% (8.76 hours downtime/year)
- **Recovery Time**: <5 minutes for critical services
- **Data Consistency**: 100% for payment transactions

## Load Testing Strategy

### User Journey Scenarios

#### Scenario 1: Peak Booking Period
```typescript
// Load test for high-demand tour launches
export const peakBookingScenario = {
  name: 'Peak Booking Load',
  duration: '30m',
  target: 500, // concurrent users
  
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% under 2s
    http_req_failed: ['rate<0.01'],    // <1% failure
    booking_success_rate: ['rate>0.99'] // >99% booking success
  },
  
  stages: [
    { duration: '5m', target: 100 },   // Ramp up
    { duration: '20m', target: 500 },  // Sustained load
    { duration: '5m', target: 0 }      // Ramp down
  ]
}

// Test implementation
export default function peakBookingTest() {
  group('Browse Tours', () => {
    const response = http.get(`${BASE_URL}/explore`)
    check(response, {
      'status is 200': (r) => r.status === 200,
      'load time <2s': (r) => r.timings.duration < 2000
    })
    sleep(randomBetween(2, 5))
  })

  group('Search Tours', () => {
    const searchResponse = http.get(`${BASE_URL}/api/tours/search?q=meditation&location=bali`)
    check(searchResponse, {
      'search results <1s': (r) => r.timings.duration < 1000,
      'results returned': (r) => JSON.parse(r.body).tours.length > 0
    })
    sleep(randomBetween(1, 3))
  })

  group('Tour Details', () => {
    const tourId = selectRandomTour()
    const detailResponse = http.get(`${BASE_URL}/tours/${tourId}`)
    check(detailResponse, {
      'tour details loaded': (r) => r.status === 200,
      'images loaded': (r) => r.body.includes('tour-gallery')
    })
    sleep(randomBetween(5, 10))
  })

  group('Booking Process', () => {
    const bookingData = generateBookingData()
    const bookingResponse = http.post(`${BASE_URL}/api/bookings`, bookingData, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    })
    
    check(bookingResponse, {
      'booking created': (r) => r.status === 201,
      'booking time <3s': (r) => r.timings.duration < 3000
    })
    
    // Verify real-time availability update
    const availabilityCheck = http.get(`${BASE_URL}/api/tours/${tourId}/availability`)
    check(availabilityCheck, {
      'availability updated': (r) => r.status === 200,
      'spots decreased': (r) => JSON.parse(r.body).available_spots < originalSpots
    })
  })
}
```

#### Scenario 2: Content Creator Peak
```typescript
// Load test for organizers creating/updating tours
export const contentCreatorScenario = {
  name: 'Content Creator Load',
  duration: '20m',
  target: 200, // concurrent organizers
  
  stages: [
    { duration: '3m', target: 50 },
    { duration: '14m', target: 200 },
    { duration: '3m', target: 0 }
  ]
}

export default function contentCreatorTest() {
  const organizerToken = authenticateAsOrganizer()
  
  group('Tour Management Dashboard', () => {
    const dashboard = http.get(`${BASE_URL}/organizer/dashboard`, {
      headers: { 'Authorization': `Bearer ${organizerToken}` }
    })
    check(dashboard, {
      'dashboard loads <2s': (r) => r.timings.duration < 2000,
      'tour list present': (r) => r.body.includes('tour-list')
    })
  })

  group('Create New Tour', () => {
    const tourData = generateTourData()
    const createResponse = http.post(`${BASE_URL}/api/tours`, tourData, {
      headers: { 'Authorization': `Bearer ${organizerToken}` }
    })
    
    check(createResponse, {
      'tour created': (r) => r.status === 201,
      'creation time <2s': (r) => r.timings.duration < 2000
    })
  })

  group('Upload Media', () => {
    const imageData = generateTestImage()
    const uploadResponse = http.post(`${BASE_URL}/api/media/upload`, imageData, {
      headers: { 
        'Authorization': `Bearer ${organizerToken}`,
        'Content-Type': 'multipart/form-data'
      }
    })
    
    check(uploadResponse, {
      'image uploaded': (r) => r.status === 200,
      'upload time <5s': (r) => r.timings.duration < 5000
    })
  })
}
```

### Database Performance Testing

#### Connection Pool Testing
```typescript
describe('Database Connection Pool', () => {
  it('should handle concurrent database queries efficiently', async () => {
    const concurrentQueries = Array(100).fill(null).map(() => 
      db.query('SELECT * FROM tours WHERE status = $1', ['published'])
    )
    
    const startTime = Date.now()
    const results = await Promise.all(concurrentQueries)
    const duration = Date.now() - startTime
    
    expect(duration).toBeLessThan(2000) // All queries under 2s
    expect(results.every(r => r.rows.length > 0)).toBe(true)
  })

  it('should maintain performance under high read load', async () => {
    const readOperations = Array(500).fill(null).map(() => ({
      query: 'SELECT * FROM tours WHERE location = $1',
      params: [getRandomLocation()]
    }))
    
    const executionTimes = []
    for (const operation of readOperations) {
      const start = Date.now()
      await db.query(operation.query, operation.params)
      executionTimes.push(Date.now() - start)
    }
    
    const p95Time = calculatePercentile(executionTimes, 95)
    expect(p95Time).toBeLessThan(100) // 95th percentile under 100ms
  })
})
```

#### Query Optimization Testing
```typescript
describe('Query Performance', () => {
  it('should execute complex search queries efficiently', async () => {
    const complexSearchQuery = `
      SELECT t.*, o.name as organizer_name, 
             COUNT(b.id) as booking_count,
             AVG(r.rating) as avg_rating
      FROM tours t
      JOIN organizers o ON t.organizer_id = o.id
      LEFT JOIN bookings b ON t.id = b.tour_id
      LEFT JOIN reviews r ON t.id = r.tour_id
      WHERE t.status = 'published'
        AND t.start_date >= NOW()
        AND ST_DWithin(t.location, ST_Point($1, $2), $3)
        AND ($4 IS NULL OR t.category = $4)
      GROUP BY t.id, o.name
      ORDER BY avg_rating DESC, booking_count DESC
      LIMIT 20
    `
    
    const startTime = Date.now()
    const results = await db.query(complexSearchQuery, [
      -8.5069, 115.2625,  // Bali coordinates
      50000,               // 50km radius
      'spiritual'          // category filter
    ])
    const queryTime = Date.now() - startTime
    
    expect(queryTime).toBeLessThan(500) // Complex query under 500ms
    expect(results.rows.length).toBeGreaterThan(0)
  })

  it('should handle real-time availability updates efficiently', async () => {
    const tourId = 'tour_123'
    const concurrentBookings = Array(10).fill(null).map(() => 
      processBooking(tourId, generateParticipantData())
    )
    
    const results = await Promise.allSettled(concurrentBookings)
    const successful = results.filter(r => r.status === 'fulfilled')
    
    // Should handle concurrent bookings with proper locking
    expect(successful.length).toBeGreaterThan(0)
    
    // Verify final availability is consistent
    const finalAvailability = await getTourAvailability(tourId)
    expect(finalAvailability.available_spots).toBeGreaterThanOrEqual(0)
  })
})
```

## Stress Testing

### System Breaking Points
```typescript
// Stress test to find system limits
export const stressTestScenario = {
  name: 'System Stress Test',
  duration: '15m',
  
  stages: [
    { duration: '2m', target: 100 },   // Normal load
    { duration: '3m', target: 500 },   // High load
    { duration: '5m', target: 1000 },  // Stress load
    { duration: '3m', target: 2000 },  // Break point
    { duration: '2m', target: 0 }      // Recovery
  ],
  
  thresholds: {
    http_req_duration: ['p(95)<5000'], // Degraded but functional
    http_req_failed: ['rate<0.1']      // <10% failure acceptable under stress
  }
}
```

### Resource Exhaustion Testing
```typescript
describe('Resource Limits', () => {
  it('should handle memory pressure gracefully', async () => {
    // Generate large dataset processing
    const largeDataset = generateLargeBookingDataset(10000)
    
    const startMemory = process.memoryUsage().heapUsed
    await processBookingBatch(largeDataset)
    const endMemory = process.memoryUsage().heapUsed
    
    const memoryIncrease = endMemory - startMemory
    expect(memoryIncrease).toBeLessThan(500 * 1024 * 1024) // <500MB increase
  })

  it('should handle CPU intensive operations', async () => {
    const cpuIntensiveTasks = Array(50).fill(null).map(() => 
      generateTourRecommendations(complexUserProfile)
    )
    
    const startTime = Date.now()
    await Promise.all(cpuIntensiveTasks)
    const duration = Date.now() - startTime
    
    expect(duration).toBeLessThan(10000) // All tasks under 10s
  })
})
```

## Performance Monitoring

### Real User Monitoring (RUM)
```typescript
// Client-side performance monitoring
class PerformanceMonitor {
  static trackPageLoad() {
    const navigation = performance.getEntriesByType('navigation')[0]
    const metrics = {
      dns_lookup: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp_connection: navigation.connectEnd - navigation.connectStart,
      tls_handshake: navigation.secureConnectionStart ? 
        navigation.connectEnd - navigation.secureConnectionStart : 0,
      request_response: navigation.responseEnd - navigation.requestStart,
      dom_processing: navigation.domContentLoadedEventEnd - navigation.responseEnd,
      resource_loading: navigation.loadEventEnd - navigation.domContentLoadedEventEnd,
      total_load_time: navigation.loadEventEnd - navigation.navigationStart
    }
    
    // Send metrics to monitoring service
    this.sendMetrics('page_load', metrics)
  }

  static trackUserInteractions() {
    // Track critical user actions
    document.addEventListener('click', (event) => {
      if (event.target.matches('[data-perf-track]')) {
        const startTime = performance.now()
        
        // Track time to response for critical actions
        const observer = new MutationObserver(() => {
          const responseTime = performance.now() - startTime
          this.sendMetrics('interaction_response', {
            action: event.target.dataset.perfTrack,
            response_time: responseTime
          })
          observer.disconnect()
        })
        
        observer.observe(document.body, { childList: true, subtree: true })
      }
    })
  }
}
```

### Application Performance Monitoring (APM)
```typescript
// Server-side performance tracking
class APMMonitor {
  static trackDatabaseQueries() {
    const originalQuery = db.query
    db.query = async function(text, params) {
      const startTime = Date.now()
      try {
        const result = await originalQuery.call(this, text, params)
        const duration = Date.now() - startTime
        
        APMMonitor.recordMetric('database_query', {
          query: text.substring(0, 100), // First 100 chars
          duration,
          success: true,
          rows_affected: result.rowCount
        })
        
        return result
      } catch (error) {
        const duration = Date.now() - startTime
        APMMonitor.recordMetric('database_query', {
          query: text.substring(0, 100),
          duration,
          success: false,
          error: error.message
        })
        throw error
      }
    }
  }

  static trackAPIEndpoints() {
    return (req, res, next) => {
      const startTime = Date.now()
      
      res.on('finish', () => {
        const duration = Date.now() - startTime
        APMMonitor.recordMetric('api_request', {
          method: req.method,
          endpoint: req.route?.path || req.path,
          status_code: res.statusCode,
          duration,
          user_type: req.user?.role || 'anonymous'
        })
      })
      
      next()
    }
  }
}
```

## Performance Optimization Testing

### Caching Strategy Validation
```typescript
describe('Caching Performance', () => {
  it('should cache tour search results effectively', async () => {
    const searchParams = { location: 'bali', category: 'spiritual' }
    
    // First request (cache miss)
    const startTime1 = Date.now()
    const response1 = await searchTours(searchParams)
    const duration1 = Date.now() - startTime1
    
    // Second request (cache hit)
    const startTime2 = Date.now()
    const response2 = await searchTours(searchParams)
    const duration2 = Date.now() - startTime2
    
    expect(duration2).toBeLessThan(duration1 * 0.5) // 50% faster with cache
    expect(response1.data).toEqual(response2.data)
  })

  it('should invalidate cache on data updates', async () => {
    const searchParams = { category: 'spiritual' }
    
    // Initial cached search
    await searchTours(searchParams)
    
    // Update tour that affects search results
    await updateTour('tour_123', { category: 'spiritual', featured: true })
    
    // Search again - should reflect updated data
    const updatedResults = await searchTours(searchParams)
    const featuredTour = updatedResults.data.find(t => t.id === 'tour_123')
    expect(featuredTour.featured).toBe(true)
  })
})
```

### CDN Performance Testing
```typescript
describe('Content Delivery', () => {
  it('should serve images from CDN with low latency', async () => {
    const imageUrls = [
      'https://cdn.soultrip.com/tours/meditation-bali-01.jpg',
      'https://cdn.soultrip.com/tours/yoga-retreat-02.jpg',
      'https://cdn.soultrip.com/organizers/profile-03.jpg'
    ]
    
    const loadTimes = await Promise.all(
      imageUrls.map(async (url) => {
        const startTime = Date.now()
        const response = await fetch(url)
        return {
          url,
          duration: Date.now() - startTime,
          size: parseInt(response.headers.get('content-length')),
          cached: response.headers.get('x-cache-status') === 'HIT'
        }
      })
    )
    
    loadTimes.forEach(result => {
      expect(result.duration).toBeLessThan(1000) // Images load under 1s
      if (result.cached) {
        expect(result.duration).toBeLessThan(200) // Cached images under 200ms
      }
    })
  })
})
```

## Mobile Performance Testing

### Mobile Network Simulation
```typescript
// Test performance under different network conditions
const networkProfiles = {
  '3G': { latency: 300, downloadThroughput: 1.6 * 1024, uploadThroughput: 0.768 * 1024 },
  '4G': { latency: 50, downloadThroughput: 9 * 1024, uploadThroughput: 9 * 1024 },
  'WiFi': { latency: 10, downloadThroughput: 50 * 1024, uploadThroughput: 50 * 1024 }
}

describe.each(Object.entries(networkProfiles))('Mobile Performance on %s', (networkType, profile) => {
  beforeAll(async () => {
    await page.emulateNetworkConditions(profile)
  })

  it('should load tour pages within acceptable time', async () => {
    const startTime = Date.now()
    await page.goto('/tours/meditation-retreat-bali')
    await page.waitForSelector('[data-testid="tour-details"]')
    const loadTime = Date.now() - startTime
    
    const acceptableTime = networkType === '3G' ? 5000 : 3000
    expect(loadTime).toBeLessThan(acceptableTime)
  })

  it('should handle image lazy loading effectively', async () => {
    await page.goto('/explore')
    
    // Count initial images loaded
    const initialImages = await page.$$eval('img[src]', imgs => imgs.length)
    
    // Scroll to load more images
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)
    
    const finalImages = await page.$$eval('img[src]', imgs => imgs.length)
    expect(finalImages).toBeGreaterThan(initialImages)
  })
})
```

## Performance Regression Testing

### Automated Performance Budgets
```typescript
// Performance budget monitoring
const performanceBudgets = {
  'tour-details': {
    loadTime: 2000,
    firstContentfulPaint: 1200,
    largestContentfulPaint: 2500,
    cumulativeLayoutShift: 0.1,
    firstInputDelay: 100
  },
  'booking-form': {
    loadTime: 1500,
    interactionTime: 200,
    formSubmissionTime: 3000
  },
  'search-results': {
    loadTime: 1000,
    searchResponseTime: 500,
    resultRenderTime: 800
  }
}

describe('Performance Budget Compliance', () => {
  Object.entries(performanceBudgets).forEach(([page, budgets]) => {
    describe(`${page} performance`, () => {
      it('should meet performance budgets', async () => {
        const metrics = await measurePagePerformance(page)
        
        Object.entries(budgets).forEach(([metric, budget]) => {
          expect(metrics[metric]).toBeLessThan(budget)
        })
      })
    })
  })
})
```

This comprehensive performance testing plan ensures the SoulTrip platform maintains excellent performance under various load conditions while providing a smooth user experience across all devices and network conditions.