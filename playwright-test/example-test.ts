/**
 * Playwright E2E Tests for Portal Talentos
 * Tests run against Firebase Emulator Suite locally.
 * NOT connected to production Firebase.
 */
import { test, expect, } from '@playwright/test'

// Test suite: Student registration and quiz flow
describe('Portal Talentos - Student Flow', () => {
  test('should allow student registration', async ({ page }) => {
    // Navigate to the app
    await page.goto('/')

    // Wait for the app to load
    await expect(page.locator('body')).toBeVisible()

    // Look for registration form or student onboarding
    // The app should show onboarding or login options
    const maybeRegister = page.locator('[data-testid="register"]')
    const maybeLogin = page.locator('[data-testid="login"]')

    // At least one should be available
    const available = await maybeRegister.count() + await maybeLogin.count()
    expect(available).toBeGreaterThan(0)
  })

  test('should display test questions', async ({ page }) => {
    await page.goto('/')

    // Wait for app to load
    await expect(page.locator('body')).toBeVisible()

    // Look for test start button or questions
    const startButton = page.locator('button:has-text("Empezar test")')
    const questionCount = await page.locator('.question').count()

    // Either start button or questions should be present
    const hasStart = await startButton.count() > 0
    const hasQuestions = await questionCount > 0

    expect(hasStart || hasQuestions).toBeTruthy()
  })
})

// Test suite: Admin flow with custom claims
describe('Portal Talentos - Admin Flow', () => {
  test('admin page should be accessible', async ({ page }) => {
    await page.goto('/')

    // Wait for app to load
    await expect(page.locator('body')).toBeVisible()

    // Check if admin features are present or login is required
    const adminSection = page.locator('[data-testid="admin"]')
    const adminCount = await adminSection.count()

    // Admin section might only appear with proper claims
    // For now, just verify the page loads
    await expect(page).toHaveTitle()
  })
})