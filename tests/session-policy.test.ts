import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SESSION_IDLE_MS, sessionExpiry, sessionIsExpired } from '../server/utils/sessionPolicy'

test('activity extends expiry by seven days even after thirty days', () => {
  const login = Date.UTC(2026, 0, 1)
  let expiry = sessionExpiry(login)
  for (let day = 1; day <= 60; day++) {
    const now = login + day * 86400000
    assert.equal(sessionIsExpired(expiry, now), false)
    expiry = sessionExpiry(now)
    assert.equal(expiry.getTime(), now + SESSION_IDLE_MS)
  }
})

test('seven days without activity expires the session at the boundary', () => {
  const now = Date.UTC(2026, 0, 1)
  const expiry = sessionExpiry(now)
  assert.equal(sessionIsExpired(expiry, now + SESSION_IDLE_MS - 1), false)
  assert.equal(sessionIsExpired(expiry, now + SESSION_IDLE_MS), true)
  assert.equal(sessionIsExpired(expiry, now + SESSION_IDLE_MS + 1), true)
})
