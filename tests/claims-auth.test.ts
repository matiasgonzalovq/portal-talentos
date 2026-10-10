import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const rules = readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8')

describe('Firestore Admin Claims Authorization (CP2C.8)', () => {
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

  // 1. Admin with claim { admin: true } can read protected data
  it('ADMIN with claim admin:true can read protected collections', async () => {
    await seed('/participants/adminParticipant2024', {
      name: 'Admin', age: 25, phone: '1', email: 'a@x.com',
      group: 'admin', recoveryCode: 'ABCD', createdAt: new Date(),
    })
    const db = env.authenticatedContext('admin-uid', { admin: true }).firestore()
    await assertSucceeds(db.doc('/participants/adminParticipant2024').get())
  })

  // 2. User WITHOUT admin claim cannot read protected data
  it('User without admin claim:true cannot read protected data', async () => {
    await seed('/participants/normalParticipant024', {
      name: 'Normal', age: 25, phone: '1', email: 'n@x.com',
      group: 'u', recoveryCode: 'ABCD', createdAt: new Date(),
    })
    const db = env.authenticatedContext('normal-uid', { admin: false }).firestore()
    await assertFails(db.doc('/participants/normalParticipant024').get())
  })

  // 3. Unauthenticated cannot read protected data
  it('Unauthenticated user cannot read protected data', async () => {
    await seed('/participants/unauthParticipant024', {
      name: 'U', age: 25, phone: '1', email: 'u@x.com',
      group: 'u', recoveryCode: 'ABCD', createdAt: new Date(),
    })
    const db = env.unauthenticatedContext().firestore()
    await assertFails(db.doc('/participants/unauthParticipant024').get())
  })

  // 4. superAdmin with claims can delete; normal admin (no superAdmin) cannot
  it('superAdmin can delete, normal admin cannot delete', async () => {
    await seed('/participants/adminParticipant2024', {
      name: 'A', age: 25, phone: '1', email: 'a@x.com',
      group: 'admin', recoveryCode: 'ABCD', createdAt: new Date(),
    })
    const superDb = env.authenticatedContext('super-uid', { admin: true, superAdmin: true }).firestore()
    await assertSucceeds(superDb.doc('/participants/adminParticipant2024').delete())

    await seed('/participants/normalAdminParticipant', {
      name: 'NA', age: 25, phone: '1', email: 'na@x.com',
      group: 'admin', recoveryCode: 'ABCD', createdAt: new Date(),
    })
    // Normal admin (admin:true only) cannot delete -> denied
    const adminDb = env.authenticatedContext('admin-uid', { admin: true }).firestore()
    await assertFails(adminDb.doc('/participants/normalAdminParticipant').delete())

    await seed('/participants/normalParticipant024', {
      name: 'N', age: 25, phone: '1', email: 'n@x.com',
      group: 'u', recoveryCode: 'ABCD', createdAt: new Date(),
    })
    const normalDb = env.authenticatedContext('normal-uid', { admin: false }).firestore()
    await assertFails(normalDb.doc('/participants/normalParticipant024').delete())
  })
})

// --- UI claim-detection helper tests (App.tsx getIdTokenResult logic) ---
// These mirror the authorization decision made in the App: admin is granted
// only when token.claims.admin === true (email plays no role).
describe('Admin claim detection helper (mirrors App.tsx)', () => {
  function resolveAdminToken(claims: Record<string, unknown>) {
    // Same logic as App.tsx onAuthStateChanged with getIdTokenResult()
    return {
      admin: claims.admin === true,
      superAdmin: claims.superAdmin === true,
    }
  }

  it('token with admin:true yields admin access, no superAdmin', () => {
    const r = resolveAdminToken({ admin: true })
    expect(r.admin).toBe(true)
    expect(r.superAdmin).toBe(false)
  })

  it('token with admin:false yields no admin access', () => {
    expect(resolveAdminToken({ admin: false }).admin).toBe(false)
  })

  it('token without admin claim yields no admin access', () => {
    expect(resolveAdminToken({}).admin).toBe(false)
    expect(resolveAdminToken({ role: 'admin' }).admin).toBe(false)
  })

  it('token with superAdmin:true AND admin:true yields both', () => {
    const r = resolveAdminToken({ admin: true, superAdmin: true })
    expect(r.admin).toBe(true)
    expect(r.superAdmin).toBe(true)
  })

  it('email is NOT considered as an authorization criterion', () => {
    // Even if a user has an "admin-like" email, without the claim there is no access.
    const r = resolveAdminToken({ email: 'admin@example.com' })
    expect(r.admin).toBe(false)
  })
})