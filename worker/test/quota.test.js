import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AssistantQuota } from '../src/quota.js'

function createState(initial) {
  let queue = Promise.resolve()
  const state = {
    value: initial,
    alarm: null,
    storage: {
      get: async () => state.value,
      put: async (_key, value) => { state.value = value },
      setAlarm: async alarm => { state.alarm = alarm },
      deleteAll: async () => { state.value = undefined }
    },
    blockConcurrencyWhile: callback => {
      const result = queue.then(callback)
      queue = result.catch(() => {})
      return result
    }
  }
  return state
}

const reserve = async (quota, path = 'account') => (await quota.fetch(new Request(`https://quota/${path}`, { method: 'POST' }))).json()

test('atomically enforces the per-account minute limit during simultaneous requests', async () => {
  const state = createState()
  const quota = new AssistantQuota(state)
  const results = await Promise.all(Array.from({ length: 15 }, () => reserve(quota)))
  assert.equal(results.filter(result => result.allowed).length, 10)
  assert.equal(state.value.minuteCount, 10)
  assert.ok(results.find(result => !result.allowed).retryAfter > 0)
  assert.ok(state.alarm > Date.now())
  assert.deepEqual(Object.keys(state.value).sort(), ['day', 'dayCount', 'minute', 'minuteCount'])
})

test('enforces the separate global daily budget', async () => {
  const now = Date.now()
  const state = createState({ day: Math.floor(now / 86400000), minute: Math.floor(now / 60000), dayCount: 500, minuteCount: 1 })
  const result = await reserve(new AssistantQuota(state), 'global')
  assert.equal(result.allowed, false)
  assert.ok(result.retryAfter > 0)
  assert.ok(result.retryAfter <= 86400)
})

test('cleans up expired counter storage but preserves a new day bucket', async () => {
  const state = createState({ day: Math.floor(Date.now() / 86400000) - 1 })
  const quota = new AssistantQuota(state)
  await quota.alarm()
  assert.equal(state.value, undefined)
  await reserve(quota)
  await quota.alarm()
  assert.ok(state.value)
  assert.ok(state.alarm > Date.now())
})

test('rejects non-POST quota requests', async () => {
  assert.equal((await new AssistantQuota(createState()).fetch(new Request('https://quota/account'))).status, 405)
})
