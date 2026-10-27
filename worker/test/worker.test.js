import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AssistantError } from '../src/assistant.js'
import { createHandler } from '../src/index.js'

const origin = 'http://localhost:4200'
const body = JSON.stringify({ messages: [{ role: 'user', text: 'Why is Mactan important?' }] })
function setup() {
  const calls = { ai: [], quota: [], auth: [] }
  const env = {
    FIREBASE_PROJECT_ID: 'kasaysayan-explorer', AI_MODEL: '@cf/meta/llama-3.1-8b-instruct-fp8-fast',
    ALLOWED_ORIGINS: `${origin},https://localhost`,
    AI: { run: async (...args) => { calls.ai.push(args); return { response: 'A history answer' } } },
    ASSISTANT_QUOTA: {
      idFromName: name => name,
      get: name => ({ fetch: async url => { calls.quota.push({ name, url }); return Response.json({ allowed: true }) } })
    }
  }
  const handler = createHandler({ verifyToken: async (...args) => { calls.auth.push(args); return 'member-123' } })
  const request = (options = {}) => new Request('https://assistant.example/chat', {
    method: 'POST', headers: { Origin: origin, Authorization: 'Bearer signed-token', 'Content-Type': 'application/json' }, body, ...options
  })
  return { env, calls, handler, request }
}

test('verifies auth, reserves account/global budgets, and returns a no-store answer', async () => {
  const { env, calls, handler, request } = setup()
  const response = await handler(request(), env)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { text: 'A history answer', truncated: false })
  assert.deepEqual(calls.auth, [['signed-token', env.FIREBASE_PROJECT_ID]])
  assert.deepEqual(calls.quota.map(call => call.name), ['account:member-123', 'global'])
  assert.equal(calls.ai.length, 1)
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin)
  assert.equal(response.headers.get('Cache-Control'), 'no-store')
})

test('allows preflight without auth or AI but rejects foreign origins', async () => {
  const { env, calls, handler } = setup()
  const preflight = await handler(new Request('https://assistant.example/chat', { method: 'OPTIONS', headers: { Origin: origin } }), env)
  assert.equal(preflight.status, 204)
  assert.equal(preflight.headers.get('Access-Control-Allow-Headers'), 'Authorization, Content-Type')
  const denied = await handler(new Request('https://assistant.example/chat', { method: 'OPTIONS', headers: { Origin: 'https://attacker.example' } }), env)
  assert.equal(denied.status, 403)
  assert.equal(denied.headers.get('Access-Control-Allow-Origin'), null)
  assert.equal(calls.auth.length, 0)
  assert.equal(calls.ai.length, 0)
})

test('rejects missing tokens and token-verification failures before quota or AI', async () => {
  const { env, calls, handler, request } = setup()
  assert.equal((await handler(request({ headers: { Origin: origin, 'Content-Type': 'application/json' } }), env)).status, 401)
  const reject = createHandler({ verifyToken: async () => { throw new AssistantError('unauthenticated', 'Sign in again.', 401) } })
  assert.equal((await reject(request(), env)).status, 401)
  assert.equal(calls.quota.length, 0)
  assert.equal(calls.ai.length, 0)
})

test('rejects malformed JSON, oversized streamed bodies, and invalid conversations', async () => {
  const { env, calls, handler, request } = setup()
  for (const [content, status] of [['not JSON', 400], ['x'.repeat(131073), 413], ['{"messages":[]}', 400]]) {
    assert.equal((await handler(request({ body: content }), env)).status, status)
  }
  assert.equal((await handler(request({ headers: { Origin: origin, Authorization: 'Bearer token', 'Content-Type': 'text/plain' } }), env)).status, 415)
  assert.equal(calls.quota.length, 0)
  assert.equal(calls.ai.length, 0)
})

test('stops inference on account/global limits and quota service failures', async () => {
  for (const scope of ['account:member-123', 'global']) {
    const { env, calls, handler, request } = setup()
    env.ASSISTANT_QUOTA.get = name => ({ fetch: async () => Response.json(name === scope ? { allowed: false, retryAfter: 30 } : { allowed: true }) })
    const response = await handler(request(), env)
    assert.equal(response.status, 429)
    assert.equal(response.headers.get('Retry-After'), '30')
    assert.equal(calls.ai.length, 0)
  }
  const { env, calls, handler, request } = setup()
  env.ASSISTANT_QUOTA.get = () => ({ fetch: async () => new Response('', { status: 500 }) })
  assert.equal((await handler(request(), env)).status, 503)
  assert.equal(calls.ai.length, 0)
})

test('sanitizes unknown failures and preserves CORS on errors', async () => {
  const { env, handler, request } = setup()
  env.AI.run = async () => { throw new Error('private prompts and credentials') }
  const response = await handler(request(), env)
  assert.equal(response.status, 503)
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin)
  assert.ok(!(await response.text()).includes('private'))
})

test('rejects wrong paths, wrong methods, and missing deployment bindings', async () => {
  const { env, calls, handler, request } = setup()
  assert.equal((await handler(new Request('https://assistant.example/unknown'), env)).status, 404)
  const method = await handler(new Request('https://assistant.example/chat'), env)
  assert.equal(method.status, 405)
  assert.equal(method.headers.get('Allow'), 'POST, OPTIONS')
  delete env.AI
  assert.equal((await handler(request(), env)).status, 503)
  assert.equal(calls.ai.length, 0)
})
