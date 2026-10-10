import { describe, it, expect, beforeEach } from 'vitest'
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load the production rules explicitly so the test does not depend on whatever
// ruleset the emulator happens to have loaded.
const rules = readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8')

describe('Firestore Rules Minimal', () => {
  let env: any

  beforeEach(async () => {
    env = await initializeTestEnvironment({
      projectId: 'portal-talentos-test',
      firestore: {
        host: 'localhost',
        port: 9160,
        rules,
      },
      auth: {
        host: 'localhost',
        port: 9161,
      },
    })
    await env.clearFirestore()
  })

  afterEach(async () => {
    await env.cleanup()
  })

  // Helper to seed data bypassing rules
  async function seed(path: string, data: object) {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(path).set(data)
    })
  }

  // === CREATE TESTS ===

  it('should allow admin create', async () => {
    const adminUser = env.authenticatedContext('admin-uid', { admin: true })
    const db = adminUser.firestore()

    await assertSucceeds(db.doc('/participants/adminParticipant2024').set({
      name: 'Admin User',
      age: 25,
      phone: '1234567890',
      email: 'admin@test.com',
      group: 'admin',
      recoveryCode: 'ABCD',
      createdAt: new Date(),
    }))
  })

  it('should allow normal user create', async () => {
    // Create is intentionally public in the rules (no auth required) to
    // support participant self-registration. Any valid structure may be created.
    const normalUser = env.authenticatedContext('normal-uid', { admin: false })
    const db = normalUser.firestore()

    await assertSucceeds(db.doc('/participants/normalParticipant024').set({
      name: 'Normal User',
      age: 25,
      phone: '1234567890',
      email: 'normal@test.com',
      group: 'user',
      recoveryCode: 'ABCD',
      createdAt: new Date(),
    }))
  })

  it('should allow unauthenticated create', async () => {
    // Create has no auth requirement in the rules (public self-registration).
    const unauth = env.unauthenticatedContext()
    const db = unauth.firestore()

    await assertSucceeds(db.doc('/participants/unauthParticipant024').set({
      name: 'Unauth User',
      age: 25,
      phone: '1234567890',
      email: 'unauth@test.com',
      group: 'user',
      recoveryCode: 'ABCD',
      createdAt: new Date(),
    }))
  })

  // === GET / READ TESTS ===

  it('should allow admin read participant', async () => {
    await seed('/participants/admin-participant-2024', {
      name: 'Admin User', age: 25, phone: '1234567890', email: 'admin@test.com',
      group: 'admin', recoveryCode: 'ABCD', createdAt: new Date(),
    })

    const adminUser = env.authenticatedContext('admin-uid', { admin: true })
    const db = adminUser.firestore()

    await assertSucceeds(db.doc('/participants/admin-participant-2024').get())
  })

  it('should deny normal user read participant', async () => {
    await seed('/participants/normal-participant-2024', {
      name: 'Normal User', age: 25, phone: '1234567890', email: 'normal@test.com',
      group: 'user', recoveryCode: 'ABCD', createdAt: new Date(),
    })

    const normalUser = env.authenticatedContext('normal-uid', { admin: false })
    const db = normalUser.firestore()

    await assertFails(db.doc('/participants/normal-participant-2024').get())
  })

  // === DELETE TESTS ===

  it('should allow superAdmin delete participant', async () => {
    await seed('/participants/admin-participant-2024', {
      name: 'Admin User', age: 25, phone: '1234567890', email: 'admin@test.com',
      group: 'admin', recoveryCode: 'ABCD', createdAt: new Date(),
    })

    const superUser = env.authenticatedContext('super-uid', { admin: true, superAdmin: true })
    const db = superUser.firestore()

    await assertSucceeds(db.doc('/participants/admin-participant-2024').delete())
  })

  it('should deny normal user delete participant', async () => {
    await seed('/participants/normal-participant-2024', {
      name: 'Normal User', age: 25, phone: '1234567890', email: 'normal@test.com',
      group: 'user', recoveryCode: 'ABCD', createdAt: new Date(),
    })

    const normalUser = env.authenticatedContext('normal-uid', { admin: false })
    const db = normalUser.firestore()

    await assertFails(db.doc('/participants/normal-participant-2024').delete())
  })

  // === SUBMISSIONS READ / DELETE TESTS ===
  // Submissions live at /participants/{participantId}/submissions/{testType}

  it('should allow admin read submission', async () => {
    await seed('/participants/admin-participant-2024/submissions/aptitudes', {
      testType: 'aptitudes', answers: { A: 1 }, scores: { A: 1 },
      dominant: 'A', completedAt: new Date(),
    })

    const adminUser = env.authenticatedContext('admin-uid', { admin: true })
    const db = adminUser.firestore()

    await assertSucceeds(db.doc('/participants/admin-participant-2024/submissions/aptitudes').get())
  })

  it('should deny normal user read submission', async () => {
    await seed('/participants/normal-participant-2024/submissions/aptitudes', {
      testType: 'aptitudes', answers: { A: 1 }, scores: { A: 1 },
      dominant: 'A', completedAt: new Date(),
    })

    const normalUser = env.authenticatedContext('normal-uid', { admin: false })
    const db = normalUser.firestore()

    await assertFails(db.doc('/participants/normal-participant-2024/submissions/aptitudes').get())
  })

  it('should allow superAdmin delete submission', async () => {
    await seed('/participants/admin-participant-2024/submissions/vak', {
      testType: 'vak', answers: { A: 1 }, scores: { A: 1 },
      dominant: 'A', completedAt: new Date(),
    })

    const superUser = env.authenticatedContext('super-uid', { admin: true, superAdmin: true })
    const db = superUser.firestore()

    await assertSucceeds(db.doc('/participants/admin-participant-2024/submissions/vak').delete())
  })

  it('should deny normal user delete submission', async () => {
    await seed('/participants/normal-participant-2024/submissions/vak', {
      testType: 'vak', answers: { A: 1 }, scores: { A: 1 },
      dominant: 'A', completedAt: new Date(),
    })

    const normalUser = env.authenticatedContext('normal-uid', { admin: false })
    const db = normalUser.firestore()

    await assertFails(db.doc('/participants/normal-participant-2024/submissions/vak').delete())
  })

  // === RESULTACCESS READ TESTS ===

  it('should allow admin read resultAccess', async () => {
    await seed('/resultAccess/aabbccddeeff0011223344556677889900aabbccddeeff00112233445566778899', {
      participantId: 'admin-participant-2024', createdAt: new Date(),
    })

    const adminUser = env.authenticatedContext('admin-uid', { admin: true })
    const db = adminUser.firestore()

    await assertSucceeds(db.doc('/resultAccess/aabbccddeeff0011223344556677889900aabbccddeeff00112233445566778899').get())
  })

  it('should deny normal user read resultAccess', async () => {
    await seed('/resultAccess/ffeeddccbbaa0099887766554433221100ffeeddccbbaa00998877665544332211', {
      participantId: 'admin-participant-2024', createdAt: new Date(),
    })

    const normalUser = env.authenticatedContext('normal-uid', { admin: false })
    const db = normalUser.firestore()

    await assertFails(db.doc('/resultAccess/ffeeddccbbaa0099887766554433221100ffeeddccbbaa00998877665544332211').get())
  })
})