// Round 3: a stored sandbox of an earlier seed revision starts again from the sample data, so keys and records
// added since never read as missing; one of the current revision is kept.
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { setClockForTests } from '../sandbox/clock'
import { useApp, getData, STATE_VERSION } from './app'
import { signOut } from './session'
import { writeKey, STATE_KEY, SEED_REVISION } from './storage'
import { U } from '../test/fixtures'

beforeEach(async () => {
  setClockForTests('2026-10-08T10:00:00.000Z')
  signOut()
  await useApp.getState().resetSandbox()
})

afterAll(() => setClockForTests(null))

describe('seed revision', () => {
  it('reseeds a sandbox of this version stored before the current revision, with the round 3 contractor account', async () => {
    const data = getData()
    const { seedRevision: _r, ...older } = data
    const stale = { ...older, seededOn: 'stale', users: { [U.priya]: data.users[U.priya] } }
    writeKey('local', STATE_KEY, JSON.stringify({ state: stale, version: STATE_VERSION }))
    await useApp.persist.rehydrate()
    expect(getData().seedRevision).toBe(SEED_REVISION)
    expect(getData().seededOn).not.toBe('stale')
    expect(getData().users[U.kofi]).toBeTruthy()
  })

  it('keeps a sandbox of the current revision', async () => {
    const data = getData()
    writeKey('local', STATE_KEY, JSON.stringify({ state: { ...data, seededOn: '2026-10-01' }, version: STATE_VERSION }))
    await useApp.persist.rehydrate()
    expect(getData().seededOn).toBe('2026-10-01')
  })
})
