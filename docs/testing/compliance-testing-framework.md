# Compliance Testing Framework for SoulTrip

## Overview

The SoulTrip platform must comply with multiple regulatory frameworks due to its global reach, payment processing, and personal data handling. This framework ensures systematic compliance validation.

## Regulatory Compliance Scope

### GDPR (General Data Protection Regulation)
**Applicability**: All EU users and data subjects
**Key Requirements**:
- Lawful basis for data processing
- Data subject rights implementation
- Privacy by design and default
- Data breach notification procedures
- Data Protection Impact Assessments (DPIA)

### PCI DSS (Payment Card Industry Data Security Standard)
**Applicability**: All payment card transactions
**Compliance Level**: Level 1 (processing >6M transactions annually)
**Key Requirements**:
- Secure network and systems
- Cardholder data protection
- Vulnerability management program
- Access control measures
- Regular monitoring and testing

### CCPA (California Consumer Privacy Act)
**Applicability**: California residents
**Key Requirements**:
- Consumer right to know
- Consumer right to delete
- Consumer right to opt-out
- Non-discrimination provisions

### Accessibility Standards (WCAG 2.1 AA)
**Applicability**: All users with disabilities
**Key Requirements**:
- Perceivable content
- Operable interface
- Understandable information
- Robust implementation

## GDPR Compliance Testing

### Data Processing Lawfulness Testing

#### Consent Management Testing
```typescript
describe('GDPR Consent Management', () => {
  describe('Consent Collection', () => {
    it('should obtain explicit consent for marketing communications', async () => {
      const registrationData = {
        email: 'user@example.com',
        name: 'Test User',
        marketing_consent: true,
        data_processing_consent: true
      }
      
      const response = await request.post('/api/auth/register').send(registrationData)
      expect(response.status).toBe(201)
      
      // Verify consent is recorded with timestamp and specificity
      const user = await getUserByEmail(registrationData.email)
      expect(user.consent_records).toContainEqual({
        type: 'marketing',
        purpose: 'email_marketing_communications',
        granted: true,
        timestamp: expect.any(String),
        ip_address: expect.any(String),
        consent_mechanism: 'explicit_checkbox'
      })
    })

    it('should allow granular consent choices', async () => {
      const consentChoices = {
        essential_cookies: true,      // Required, cannot be false
        analytics_cookies: false,
        marketing_cookies: true,
        email_marketing: false,
        sms_marketing: true,
        profile_enhancement: false
      }
      
      const response = await request.post('/api/consent/update').send(consentChoices)
      expect(response.status).toBe(200)
      
      // Verify each consent choice is recorded separately
      const consentRecords = await getConsentRecords(user.id)
      expect(consentRecords).toHaveLength(6)
      expect(consentRecords.find(r => r.type === 'analytics_cookies').granted).toBe(false)
      expect(consentRecords.find(r => r.type === 'sms_marketing').granted).toBe(true)
    })

    it('should provide clear consent withdrawal mechanism', async () => {
      const user = await createUserWithConsent()
      
      // User withdraws marketing consent
      const withdrawResponse = await request
        .post('/api/consent/withdraw')
        .send({ consent_type: 'marketing', user_id: user.id })
      
      expect(withdrawResponse.status).toBe(200)
      
      // Verify consent withdrawal is recorded
      const updatedConsent = await getConsentRecord(user.id, 'marketing')
      expect(updatedConsent.granted).toBe(false)
      expect(updatedConsent.withdrawal_timestamp).toBeDefined()
      
      // Verify user is removed from marketing lists
      const marketingList = await getMarketingListMembers()
      expect(marketingList).not.toContain(user.id)
    })
  })

  describe('Data Subject Rights', () => {
    it('should provide comprehensive data export (Right to Access)', async () => {
      const user = await createUserWithFullProfile()
      await createUserBookings(user.id, 3)
      await createUserReviews(user.id, 2)
      
      const exportRequest = await request
        .post('/api/gdpr/export')
        .set('Authorization', `Bearer ${user.token}`)
      
      expect(exportRequest.status).toBe(200)
      
      const exportData = exportRequest.body
      expect(exportData).toHaveProperty('personal_data')
      expect(exportData.personal_data).toContain(user.email)
      expect(exportData).toHaveProperty('bookings')
      expect(exportData.bookings).toHaveLength(3)
      expect(exportData).toHaveProperty('reviews')
      expect(exportData.reviews).toHaveLength(2)
      expect(exportData).toHaveProperty('consent_history')
      expect(exportData).toHaveProperty('data_processing_activities')
    })

    it('should handle data portability in machine-readable format', async () => {
      const user = await createUserWithFullProfile()
      
      const portabilityRequest = await request
        .post('/api/gdpr/portability')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ format: 'json' })
      
      expect(portabilityRequest.status).toBe(200)
      expect(portabilityRequest.headers['content-type']).toContain('application/json')
      
      const data = portabilityRequest.body
      expect(data.schema_version).toBeDefined()
      expect(data.export_timestamp).toBeDefined()
      expect(data.user_data).toBeDefined()
      
      // Verify data structure is standardized
      expect(data.user_data).toHaveProperty('profile')
      expect(data.user_data).toHaveProperty('preferences')
      expect(data.user_data).toHaveProperty('activity_history')
    })

    it('should process data deletion requests (Right to Erasure)', async () => {
      const user = await createUserWithFullProfile()
      const booking = await createPaidBooking(user.id)
      
      // Request account deletion
      const deleteRequest = await request
        .post('/api/gdpr/delete')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ 
          confirmation: 'DELETE_MY_ACCOUNT',
          reason: 'no_longer_needed' 
        })
      
      expect(deleteRequest.status).toBe(200)
      expect(deleteRequest.body.deletion_job_id).toBeDefined()
      
      // Verify personal data is anonymized
      const userCheck = await getUserById(user.id)
      expect(userCheck.email).toBe('[DELETED]')
      expect(userCheck.name).toBe('[DELETED]')
      expect(userCheck.phone).toBe('[DELETED]')
      
      // Verify financial records are preserved (legal requirement)
      const bookingCheck = await getBookingById(booking.id)
      expect(bookingCheck).toBeDefined()
      expect(bookingCheck.user_id).toBe(user.id) // Reference maintained
      expect(bookingCheck.amount).toBeDefined() // Financial data preserved
      
      // Verify deletion log is created
      const deletionLog = await getDeletionLog(user.id)
      expect(deletionLog.deletion_timestamp).toBeDefined()
      expect(deletionLog.reason).toBe('no_longer_needed')
      expect(deletionLog.data_categories_deleted).toContain('personal_identifiers')
    })

    it('should handle data rectification requests (Right to Rectification)', async () => {
      const user = await createUserWithFullProfile()
      
      const rectificationRequest = await request
        .post('/api/gdpr/rectify')
        .set('Authorization', `Bearer ${user.token}`)
        .send({
          field: 'name',
          old_value: user.name,
          new_value: 'Corrected Name',
          justification: 'Spelling error in original registration'
        })
      
      expect(rectificationRequest.status).toBe(200)
      
      // Verify data is updated
      const updatedUser = await getUserById(user.id)
      expect(updatedUser.name).toBe('Corrected Name')
      
      // Verify audit trail is maintained
      const auditLog = await getDataModificationLog(user.id)
      expect(auditLog).toContainEqual({
        field: 'name',
        old_value: user.name,
        new_value: 'Corrected Name',
        modification_type: 'gdpr_rectification',
        timestamp: expect.any(String),
        justification: 'Spelling error in original registration'
      })
    })
  })

  describe('Data Processing Restrictions', () => {
    it('should implement data processing restrictions when requested', async () => {
      const user = await createUserWithFullProfile()
      
      const restrictionRequest = await request
        .post('/api/gdpr/restrict-processing')
        .set('Authorization', `Bearer ${user.token}`)
        .send({
          processing_purposes: ['marketing', 'analytics'],
          reason: 'accuracy_disputed'
        })
      
      expect(restrictionRequest.status).toBe(200)
      
      // Verify processing restrictions are applied
      const userRestrictions = await getProcessingRestrictions(user.id)
      expect(userRestrictions).toContain('marketing')
      expect(userRestrictions).toContain('analytics')
      
      // Verify restricted processing is not performed
      await triggerMarketingCampaign()
      const marketingActivity = await getMarketingActivity(user.id)
      expect(marketingActivity).toHaveLength(0)
    })
  })
})
```

### Privacy Impact Assessment Testing
```typescript
describe('Data Protection Impact Assessment (DPIA)', () => {
  it('should identify high-risk data processing activities', async () => {
    const processingActivities = [
      {
        purpose: 'payment_processing',
        data_categories: ['financial_data', 'identity_data'],
        legal_basis: 'contract_performance',
        recipients: ['stripe', 'internal_team'],
        retention_period: '7_years',
        automated_decision_making: false
      },
      {
        purpose: 'behavioral_analytics',
        data_categories: ['behavioral_data', 'preferences'],
        legal_basis: 'legitimate_interest',
        recipients: ['analytics_team'],
        retention_period: '2_years',
        automated_decision_making: true
      }
    ]
    
    const dpiaAssessment = await assessDataProcessingRisk(processingActivities)
    
    expect(dpiaAssessment.payment_processing.risk_level).toBe('high')
    expect(dpiaAssessment.payment_processing.safeguards).toContain('encryption')
    expect(dpiaAssessment.payment_processing.safeguards).toContain('access_controls')
    
    expect(dpiaAssessment.behavioral_analytics.risk_level).toBe('medium')
    expect(dpiaAssessment.behavioral_analytics.requires_consent).toBe(true)
  })
})
```

## PCI DSS Compliance Testing

### Data Security Testing
```typescript
describe('PCI DSS Compliance', () => {
  describe('Requirement 1: Network Security Controls', () => {
    it('should enforce secure network configuration', async () => {
      // Test firewall rules
      const networkConfig = await getNetworkConfiguration()
      expect(networkConfig.firewall_enabled).toBe(true)
      expect(networkConfig.default_deny_policy).toBe(true)
      
      // Test unnecessary services are disabled
      const runningServices = await getRunningServices()
      const prohibitedServices = ['telnet', 'ftp', 'rsh', 'rlogin']
      prohibitedServices.forEach(service => {
        expect(runningServices).not.toContain(service)
      })
    })

    it('should implement network segmentation', async () => {
      const networkSegments = await getNetworkSegments()
      
      // Cardholder Data Environment (CDE) should be isolated
      expect(networkSegments.cde.isolated).toBe(true)
      expect(networkSegments.cde.access_controls).toBeDefined()
      
      // DMZ configuration
      expect(networkSegments.dmz.web_servers_isolated).toBe(true)
      expect(networkSegments.dmz.database_access_restricted).toBe(true)
    })
  })

  describe('Requirement 2: Default Passwords and Security Parameters', () => {
    it('should not use vendor default passwords', async () => {
      const systemAccounts = await getSystemAccounts()
      
      systemAccounts.forEach(account => {
        expect(account.uses_default_password).toBe(false)
        expect(account.password_changed_from_default).toBe(true)
      })
    })

    it('should implement secure system configuration standards', async () => {
      const systemConfig = await getSystemConfiguration()
      
      expect(systemConfig.unnecessary_services_disabled).toBe(true)
      expect(systemConfig.secure_protocols_only).toBe(true)
      expect(systemConfig.encryption_enabled).toBe(true)
      expect(systemConfig.audit_logging_enabled).toBe(true)
    })
  })

  describe('Requirement 3: Protect Stored Cardholder Data', () => {
    it('should not store sensitive authentication data', async () => {
      // Verify prohibited data is not stored
      const databaseScan = await scanDatabaseForSensitiveData()
      
      expect(databaseScan.full_pan_found).toBe(false)
      expect(databaseScan.cvv_found).toBe(false)
      expect(databaseScan.pin_data_found).toBe(false)
      expect(databaseScan.magnetic_stripe_data_found).toBe(false)
    })

    it('should encrypt stored cardholder data', async () => {
      // Test data-at-rest encryption
      const encryptionStatus = await checkDataEncryption()
      
      expect(encryptionStatus.database_encrypted).toBe(true)
      expect(encryptionStatus.file_system_encrypted).toBe(true)
      expect(encryptionStatus.backup_encrypted).toBe(true)
      
      // Verify encryption standards
      expect(encryptionStatus.encryption_algorithm).toMatch(/AES-256|RSA-2048/)
      expect(encryptionStatus.key_management_compliant).toBe(true)
    })

    it('should protect cryptographic keys', async () => {
      const keyManagement = await getKeyManagementStatus()
      
      expect(keyManagement.key_generation_secure).toBe(true)
      expect(keyManagement.key_distribution_secure).toBe(true)
      expect(keyManagement.key_storage_secure).toBe(true)
      expect(keyManagement.key_rotation_implemented).toBe(true)
      expect(keyManagement.key_destruction_secure).toBe(true)
    })
  })

  describe('Requirement 4: Encrypt Transmission of Cardholder Data', () => {
    it('should encrypt all cardholder data transmissions', async () => {
      const transmissionSecurity = await checkTransmissionSecurity()
      
      expect(transmissionSecurity.tls_version).toMatch(/TLS 1\.2|TLS 1\.3/)
      expect(transmissionSecurity.weak_ciphers_disabled).toBe(true)
      expect(transmissionSecurity.certificate_valid).toBe(true)
      expect(transmissionSecurity.perfect_forward_secrecy).toBe(true)
    })
  })

  describe('Requirement 6: Develop and Maintain Secure Systems', () => {
    it('should follow secure development practices', async () => {
      const developmentPractices = await auditDevelopmentPractices()
      
      expect(developmentPractices.security_code_review).toBe(true)
      expect(developmentPractices.vulnerability_testing).toBe(true)
      expect(developmentPractices.change_control_procedures).toBe(true)
      expect(developmentPractices.development_production_separation).toBe(true)
    })

    it('should maintain vulnerability management program', async () => {
      const vulnerabilityProgram = await getVulnerabilityProgramStatus()
      
      expect(vulnerabilityProgram.regular_scanning).toBe(true)
      expect(vulnerabilityProgram.critical_patch_timeline).toBe('within_30_days')
      expect(vulnerabilityProgram.high_patch_timeline).toBe('within_90_days')
    })
  })
})
```

### Payment Processing Security Testing
```typescript
describe('Payment Processing Security', () => {
  it('should tokenize payment data through Stripe', async () => {
    const paymentMethod = {
      type: 'card',
      card: {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2025,
        cvc: '123'
      }
    }
    
    const tokenResponse = await stripeClient.paymentMethods.create(paymentMethod)
    expect(tokenResponse.id).toMatch(/^pm_/)
    
    // Verify we never store actual card data
    const storedPayment = await getStoredPaymentMethod(tokenResponse.id)
    expect(storedPayment.card_number).toBeUndefined()
    expect(storedPayment.cvc).toBeUndefined()
    expect(storedPayment.stripe_token).toBe(tokenResponse.id)
  })

  it('should implement secure payment processing workflow', async () => {
    const booking = await createTestBooking()
    const paymentData = {
      amount: booking.total_amount,
      currency: 'usd',
      payment_method: 'pm_test_token',
      booking_id: booking.id
    }
    
    const paymentResponse = await processPayment(paymentData)
    
    expect(paymentResponse.status).toBe('succeeded')
    expect(paymentResponse.pci_compliant).toBe(true)
    
    // Verify payment audit trail
    const auditLog = await getPaymentAuditLog(booking.id)
    expect(auditLog).toContainEqual({
      action: 'payment_processed',
      amount: paymentData.amount,
      payment_method_masked: expect.stringMatching(/\*\*\*\*/)
    })
  })
})
```

## Accessibility Compliance Testing

### WCAG 2.1 AA Testing
```typescript
describe('WCAG 2.1 AA Compliance', () => {
  describe('Perceivable', () => {
    it('should provide text alternatives for images', async () => {
      await page.goto('/tours/meditation-retreat-bali')
      
      const images = await page.locator('img').all()
      for (const image of images) {
        const alt = await image.getAttribute('alt')
        const ariaLabel = await image.getAttribute('aria-label')
        const role = await image.getAttribute('role')
        
        // Decorative images should have empty alt or role="presentation"
        if (role === 'presentation' || alt === '') {
          expect(alt).toBe('')
        } else {
          // Content images must have descriptive alt text
          expect(alt || ariaLabel).toBeTruthy()
          expect((alt || ariaLabel).length).toBeGreaterThan(3)
        }
      }
    })

    it('should provide captions for video content', async () => {
      await page.goto('/tours/yoga-retreat-with-videos')
      
      const videos = await page.locator('video').all()
      for (const video of videos) {
        const tracks = await video.locator('track[kind="captions"]').count()
        expect(tracks).toBeGreaterThan(0)
        
        const trackSrc = await video.locator('track[kind="captions"]').first().getAttribute('src')
        expect(trackSrc).toMatch(/\.vtt$/)
      }
    })

    it('should maintain sufficient color contrast', async () => {
      await page.goto('/')
      
      // Use axe-core to check color contrast
      const a11yResults = await page.evaluate(() => {
        return new Promise((resolve) => {
          axe.run({
            tags: ['wcag2aa', 'wcag21aa'],
            rules: {
              'color-contrast': { enabled: true }
            }
          }, (err, results) => {
            resolve(results)
          })
        })
      })
      
      const contrastViolations = a11yResults.violations.filter(
        violation => violation.id === 'color-contrast'
      )
      
      expect(contrastViolations).toHaveLength(0)
    })
  })

  describe('Operable', () => {
    it('should be keyboard accessible', async () => {
      await page.goto('/explore')
      
      // Test tab navigation
      let focusableElements = 0
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Tab')
        const activeElement = await page.evaluate(() => document.activeElement.tagName)
        if (['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(activeElement)) {
          focusableElements++
        }
      }
      
      expect(focusableElements).toBeGreaterThan(5)
    })

    it('should have no keyboard traps', async () => {
      await page.goto('/tours/meditation-retreat-bali')
      
      // Open modal dialog
      await page.click('[data-testid="view-gallery"]')
      await expect(page.locator('[data-testid="image-modal"]')).toBeVisible()
      
      // Test escape key closes modal
      await page.keyboard.press('Escape')
      await expect(page.locator('[data-testid="image-modal"]')).not.toBeVisible()
      
      // Test tab cycling within modal when open
      await page.click('[data-testid="view-gallery"]')
      
      const modalFocusableElements = await page.locator('[data-testid="image-modal"] button, [data-testid="image-modal"] a').count()
      
      // Tab through all focusable elements in modal
      for (let i = 0; i < modalFocusableElements + 2; i++) {
        await page.keyboard.press('Tab')
        const focusedElement = await page.evaluate(() => {
          const modal = document.querySelector('[data-testid="image-modal"]')
          return modal?.contains(document.activeElement)
        })
        expect(focusedElement).toBe(true) // Focus should stay within modal
      }
    })
  })

  describe('Understandable', () => {
    it('should have proper heading hierarchy', async () => {
      await page.goto('/tours/meditation-retreat-bali')
      
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
      let previousLevel = 0
      
      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName)
        const currentLevel = parseInt(tagName.charAt(1))
        
        if (previousLevel > 0) {
          // Heading levels should not skip (e.g., h1 to h3)
          expect(currentLevel - previousLevel).toBeLessThanOrEqual(1)
        }
        
        previousLevel = currentLevel
      }
    })

    it('should have descriptive form labels', async () => {
      await page.goto('/contact')
      
      const formInputs = await page.locator('input, textarea, select').all()
      
      for (const input of formInputs) {
        const id = await input.getAttribute('id')
        const ariaLabel = await input.getAttribute('aria-label')
        const ariaLabelledBy = await input.getAttribute('aria-labelledby')
        
        if (id) {
          const labelCount = await page.locator(`label[for="${id}"]`).count()
          expect(labelCount > 0 || ariaLabel || ariaLabelledBy).toBeTruthy()
        } else {
          expect(ariaLabel || ariaLabelledBy).toBeTruthy()
        }
      }
    })
  })

  describe('Robust', () => {
    it('should have valid HTML structure', async () => {
      const pages = ['/', '/explore', '/tours/meditation-retreat-bali', '/contact']
      
      for (const pagePath of pages) {
        await page.goto(pagePath)
        
        // Check for HTML validation using axe-core
        const validationResults = await page.evaluate(() => {
          return new Promise((resolve) => {
            axe.run({
              tags: ['best-practice'],
              rules: {
                'valid-lang': { enabled: true },
                'html-has-lang': { enabled: true },
                'document-title': { enabled: true }
              }
            }, (err, results) => {
              resolve(results)
            })
          })
        })
        
        expect(validationResults.violations).toHaveLength(0)
      }
    })

    it('should work with assistive technologies', async () => {
      // Test ARIA attributes
      await page.goto('/')
      
      const ariaElements = await page.locator('[aria-label], [aria-labelledby], [aria-describedby], [role]').all()
      
      for (const element of ariaElements) {
        const ariaLabel = await element.getAttribute('aria-label')
        const ariaLabelledBy = await element.getAttribute('aria-labelledby')
        const ariaDescribedBy = await element.getAttribute('aria-describedby')
        const role = await element.getAttribute('role')
        
        if (ariaLabelledBy) {
          const labelElement = await page.locator(`#${ariaLabelledBy}`).count()
          expect(labelElement).toBeGreaterThan(0)
        }
        
        if (ariaDescribedBy) {
          const descElement = await page.locator(`#${ariaDescribedBy}`).count()
          expect(descElement).toBeGreaterThan(0)
        }
        
        if (role) {
          const validRoles = ['button', 'link', 'heading', 'banner', 'navigation', 'main', 'contentinfo', 'complementary', 'article', 'section']
          expect(validRoles).toContain(role)
        }
      }
    })
  })
})
```

## Multi-Currency Compliance Testing

```typescript
describe('Multi-Currency Compliance', () => {
  it('should handle currency conversion accurately', async () => {
    const baseTour = await createTour({ price: 1000, currency: 'USD' })
    
    const currencies = ['EUR', 'GBP', 'CAD', 'AUD']
    
    for (const currency of currencies) {
      const convertedPrice = await convertCurrency(baseTour.price, 'USD', currency)
      expect(convertedPrice.amount).toBeGreaterThan(0)
      expect(convertedPrice.currency).toBe(currency)
      expect(convertedPrice.exchange_rate).toBeGreaterThan(0)
      expect(convertedPrice.conversion_timestamp).toBeDefined()
    }
  })

  it('should comply with local tax requirements', async () => {
    const bookingScenarios = [
      { user_country: 'DE', tour_country: 'DE', expected_vat: 19 },
      { user_country: 'FR', tour_country: 'DE', expected_vat: 0 },
      { user_country: 'US', tour_country: 'US', expected_vat: 0 },
      { user_country: 'CA', tour_country: 'CA', expected_vat: 13 }
    ]
    
    for (const scenario of bookingScenarios) {
      const booking = await createBooking({
        user_country: scenario.user_country,
        tour_country: scenario.tour_country,
        amount: 1000
      })
      
      const taxCalculation = await calculateTax(booking)
      expect(taxCalculation.tax_rate).toBe(scenario.expected_vat)
    }
  })
})
```

## Compliance Monitoring & Reporting

### Automated Compliance Dashboard
```typescript
class ComplianceDashboard {
  static async generateComplianceReport(): Promise<ComplianceReport> {
    const gdprCompliance = await this.assessGDPRCompliance()
    const pciCompliance = await this.assessPCICompliance()
    const accessibilityCompliance = await this.assessAccessibilityCompliance()
    const dataRetentionCompliance = await this.assessDataRetentionCompliance()
    
    return {
      overall_score: this.calculateOverallScore([
        gdprCompliance,
        pciCompliance,
        accessibilityCompliance,
        dataRetentionCompliance
      ]),
      compliance_areas: {
        gdpr: gdprCompliance,
        pci_dss: pciCompliance,
        accessibility: accessibilityCompliance,
        data_retention: dataRetentionCompliance
      },
      action_items: this.generateActionItems(),
      next_audit_date: this.calculateNextAuditDate()
    }
  }
  
  static async monitorComplianceViolations() {
    const violations = await this.detectComplianceViolations()
    
    for (const violation of violations) {
      await this.alertComplianceTeam(violation)
      await this.logComplianceIncident(violation)
      
      if (violation.severity === 'critical') {
        await this.triggerEmergencyResponse(violation)
      }
    }
  }
}
```

This comprehensive compliance testing framework ensures that SoulTrip meets all regulatory requirements while maintaining user trust and avoiding regulatory penalties.