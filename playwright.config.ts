/**
 * Playwright Configuration for Portal Talentos
 * Tests run against Firebase Emulator Suite (not production)
 */
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './playwright-test',
  fullyParallel: true,
  forbidOnly: process.env.CI ? true : false,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [['html'], ['list']],
  timeout: 30000,
  webServer: {
    command: 'npm run preview',
    port: 4173,
    reuseExistingServer: true,
    // Environment variables for the web server
    env: {
      VITE_FIREBASE_PROJECT_ID: 'portal-talentos-test',
      VITE_FIREBASE_API_KEY: 'placeholder',
      VITE_FIREBASE_AUTH_DOMAIN: 'portal-talentos-test.firebaseapp.com',
      VITE_FIREBASE_STORAGE_BUCKET: 'portal-talentos-test.firebasestorage.app',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
      VITE_FIREBASE_APP_ID: 'placeholder',
    },
  },
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    headless: process.env.CI ? true : false,
  },
})