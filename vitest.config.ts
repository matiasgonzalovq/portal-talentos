import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    // Firestore rules tests share a single local emulator (ports 9160/9161).
    // Running test files in parallel causes races on the shared emulator, so
    // we disable file parallelism.
    fileParallelism: false,
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
})