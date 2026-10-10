import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const rules = readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8')

/**
 * CP2C.10 — Corrected privilege model.
 *
 * After CP2C.10, Firestore distinguishes admin vs superAdmin:
 *  - isAdmin()        = admin:true
 *  - isSuperAdmin()   = admin:true AND superAdmin:true
 *
 * superAdmin-only operations (management of admins, deletion of participants
 * and submissions) require BOTH claims. A normal admin (admin-only) is DENIED.
 * A user with superAdmin but no admin is DENIED (no accidental elevation).
 */
describe('superAdmin boundary in Firestore rules (CP2C.10 corrected)', () => {
  let env: any

  beforeEach(async () => {
    env = await initializeTestEnvironment({
      projectId: 'portal-talentos-test',
      firestore: { host: 'localhost', port: 9160, rules },
      auth: { host: 'localhost', port: 9161 },
    })
    await env.clearFirestore()
  })

  afterEach(async () => {
    await env.cleanup()
  })

  async function seed(path: string, data: object) {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(path).set(data)
    })
  }

  const pid = 'adminParticipant2024'
  const participantSeed = () => ({
    name: 'A', age: 25, phone: '1', email: 'a@x.com',
    group: 'admin', recoveryCode: 'ABCD', createdAt: new Date(),
  })

  // ---- Delete participants ----
  it('NORMAL admin (admin:true only) is DENIED deleting a participant', async () => {
    await seed(`/participants/${pid}`, participantSeed())
    const db = env.authenticatedContext('admin-uid', { admin: true }).firestore()
    await assertFails(db.doc(`/participants/${pid}`).delete())
  })

  it('SUPER admin (admin:true + superAdmin:true) CAN delete a participant', async () => {
    await seed(`/participants/${pid}`, participantSeed())
    const db = env.authenticatedContext('super-uid', { admin: true, superAdmin: true }).firestore()
    await assertSucceeds(db.doc(`/participants/${pid}`).delete())
  })

  it('User with superAdmin:true but NO admin:true is DENIED deleting a participant', async () => {
    await seed(`/participants/${pid}`, participantSeed())
    const db = env.authenticatedContext('super-no-admin', { superAdmin: true }).firestore()
    await assertFails(db.doc(`/participants/${pid}`).delete())
  })

  // ---- Delete resultAccess (CP3.0 alignment) ----
  const hash = 'aabbccddeeff0011223344556677889900aabbccddeeff00112233445566778866'

  it('NORMAL admin is DENIED deleting resultAccess', async () => {
    await seed(`/resultAccess/${hash}`, { participantId: pid, createdAt: new Date() })
    const db = env.authenticatedContext('admin-uid', { admin: true }).firestore()
    await assertFails(db.doc(`/resultAccess/${hash}`).delete())
  })

  it('SUPER admin CAN delete resultAccess', async () => {
    await seed(`/resultAccess/${hash}`, { participantId: pid, createdAt: new Date() })
    const db = env.authenticatedContext('super-uid', { admin: true, superAdmin: true }).firestore()
    await assertSucceeds(db.doc(`/resultAccess/${hash}`).delete())
  })

  it('User with superAdmin:true but NO admin:true is DENIED deleting resultAccess', async () => {
    await seed(`/resultAccess/${hash}`, { participantId: pid, createdAt: new Date() })
    const db = env.authenticatedContext('super-no-admin', { superAdmin: true }).firestore()
    await assertFails(db.doc(`/resultAccess/${hash}`).delete())
  })

  // ---- Delete submissions ----
  it('NORMAL admin is DENIED deleting submissions', async () => {
    await seed(`/participants/${pid}/submissions/aptitudes`, {
      testType: 'aptitudes', answers: { A: 1 }, scores: { A: 1 },
      dominant: 'A', completedAt: new Date(),
    })
    const db = env.authenticatedContext('admin-uid', { admin: true }).firestore()
    await assertFails(db.doc(`/participants/${pid}/submissions/aptitudes`).delete())
  })

  it('SUPER admin CAN delete submissions', async () => {
    await seed(`/participants/${pid}/submissions/aptitudes`, {
      testType: 'aptitudes', answers: { A: 1 }, scores: { A: 1 },
      dominant: 'A', completedAt: new Date(),
    })
    const db = env.authenticatedContext('super-uid', { admin: true, superAdmin: true }).firestore()
    await assertSucceeds(db.doc(`/participants/${pid}/submissions/aptitudes`).delete())
  })

  // ---- Management of admins: create / update / delete ----
  it('NORMAL admin is DENIED creating an admin', async () => {
    const db = env.authenticatedContext('admin-uid', { admin: true }).firestore()
    await assertFails(db.doc('/admins/another-admin').set(
      { name: 'Other', email: 'o@x.com', active: true, createdAt: new Date() },
    ))
  })

  it('NORMAL admin is DENIED updating (toggling) an admin', async () => {
    await seed('/admins/another-admin', {
      name: 'Other', email: 'o@x.com', active: true, createdAt: new Date(),
    })
    const db = env.authenticatedContext('admin-uid', { admin: true }).firestore()
    await assertFails(db.doc('/admins/another-admin').update({ active: false }))
  })

  it('NORMAL admin is DENIED deleting an admin', async () => {
    await seed('/admins/another-admin', {
      name: 'Other', email: 'o@x.com', active: true, createdAt: new Date(),
    })
    const db = env.authenticatedContext('admin-uid', { admin: true }).firestore()
    await assertFails(db.doc('/admins/another-admin').delete())
  })

  it('SUPER admin CAN create, toggle and delete an admin', async () => {
    const db = env.authenticatedContext('super-uid', { admin: true, superAdmin: true }).firestore()
    await assertSucceeds(db.doc('/admins/new-admin').set(
      { name: 'New', email: 'n@x.com', active: true, createdAt: new Date() },
    ))
    await assertSucceeds(db.doc('/admins/new-admin').update({ active: false }))
    await assertSucceeds(db.doc('/admins/new-admin').delete())
  })

  it('User with superAdmin:true but NO admin:true is DENIED creating an admin', async () => {
    const db = env.authenticatedContext('super-no-admin', { superAdmin: true }).firestore()
    await assertFails(db.doc('/admins/new-admin').set(
      { name: 'New', email: 'n@x.com', active: true, createdAt: new Date() },
    ))
  })

  // ---- Admin reads remain available to any admin (isAdmin) ----
  it('NORMAL admin CAN read participants and admins list (admin reads preserved)', async () => {
    await seed(`/participants/${pid}`, participantSeed())
    await seed('/admins/existing-admin', {
      name: 'E', email: 'e@x.com', active: true, createdAt: new Date(),
    })
    const db = env.authenticatedContext('admin-uid', { admin: true }).firestore()
    await assertSucceeds(db.doc(`/participants/${pid}`).get())
    await assertSucceeds(db.doc('/admins/existing-admin').get())
  })
})

/**
 * UI authorization logic (mirrors App.tsx):
 * superAdmin must NOT grant access by itself without admin:true.
 */
describe('UI authorization: superAdmin does not grant access without admin (CP2C.10)', () => {
  function resolveAccess(ctx: { claims: Record<string, unknown> }) {
    const claims = ctx.claims
    return {
      canEnterDashboard: claims.admin === true,
      canManageAdmins: claims.admin === true && claims.superAdmin === true,
      canDeleteRecords: claims.admin === true && claims.superAdmin === true,
    }
  }

  it('user with superAdmin:true but NO admin:true cannot enter the dashboard', () => {
    const r = resolveAccess({ claims: { superAdmin: true } })
    expect(r.canEnterDashboard).toBe(false)
    expect(r.canManageAdmins).toBe(false)
    expect(r.canDeleteRecords).toBe(false)
  })

  it('user with admin:true but NO superAdmin enters dashboard but lacks superAdmin ops', () => {
    const r = resolveAccess({ claims: { admin: true } })
    expect(r.canEnterDashboard).toBe(true)
    expect(r.canManageAdmins).toBe(false)
    expect(r.canDeleteRecords).toBe(false)
  })

  it('user with admin:true AND superAdmin:true gets full administration', () => {
    const r = resolveAccess({ claims: { admin: true, superAdmin: true } })
    expect(r.canEnterDashboard).toBe(true)
    expect(r.canManageAdmins).toBe(true)
    expect(r.canDeleteRecords).toBe(true)
  })
})