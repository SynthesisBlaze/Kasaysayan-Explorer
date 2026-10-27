import { AssistantError, generateReply, validateMessages } from './assistant.js'
import { verifyFirebaseToken } from './auth.js'
export { AssistantQuota } from './quota.js'

const MAX_BODY_BYTES = 128 * 1024

async function readJson(request) {
  if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') {
    throw new AssistantError('invalid-argument', 'Send a JSON request.', 415)
  }
  const reader = request.body?.getReader()
  if (!reader) {
    throw new AssistantError('invalid-argument', 'Send a question.', 400)
  }
  const chunks = []
  let length = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        break
      }
      length += value.byteLength
      if (length > MAX_BODY_BYTES) {
        await reader.cancel()
        throw new AssistantError('invalid-argument', 'The request is too large.', 413)
      }
      chunks.push(value)
    }
    const bytes = new Uint8Array(length)
    let offset = 0
    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset += chunk.byteLength
    }
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch (error) {
    if (error instanceof AssistantError) {
      throw error
    }
    throw new AssistantError('invalid-argument', 'Send valid JSON.', 400)
  } finally {
    reader.releaseLock()
  }
}

async function reserveQuota(env, uid) {
  for (const [name, path] of [[`account:${uid}`, 'account'], ['global', 'global']]) {
    const id = env.ASSISTANT_QUOTA.idFromName(name)
    const response = await env.ASSISTANT_QUOTA.get(id).fetch(`https://quota/${path}`, { method: 'POST' })
    if (!response.ok) {
      throw new AssistantError('unavailable', 'The assistant usage check is unavailable. Please try again later.', 503)
    }
    const result = await response.json()
    if (result.allowed !== true) {
      const error = new AssistantError('resource-exhausted', 'The assistant usage limit has been reached. Please try again later.', 429)
      error.retryAfter = result.retryAfter
      throw error
    }
  }
}

export function createHandler({ verifyToken = verifyFirebaseToken } = {}) {
  return async (request, env) => {
    const origin = request.headers.get('Origin')
    const allowedOrigins = (env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean)
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin' }
    if (origin && !allowedOrigins.includes(origin)) {
      return Response.json({ error: { code: 'permission-denied', message: 'This app origin is not allowed.' } }, { status: 403, headers })
    }
    if (origin) {
      headers['Access-Control-Allow-Origin'] = origin
    }
    const json = (body, status = 200) => Response.json(body, { status, headers })
    if (new URL(request.url).pathname !== '/chat') {
      return json({ error: { code: 'not-found', message: 'Endpoint not found.' } }, 404)
    }
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...headers,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
          'Access-Control-Max-Age': '3600'
        }
      })
    }
    if (request.method !== 'POST') {
      headers['Allow'] = 'POST, OPTIONS'
      return json({ error: { code: 'invalid-argument', message: 'Use POST.' } }, 405)
    }

    try {
      if (!env.FIREBASE_PROJECT_ID || !env.AI || !env.AI_MODEL || !env.ASSISTANT_QUOTA) {
        throw new AssistantError('not-configured', 'The assistant is not configured yet.', 503)
      }
      const authorization = request.headers.get('Authorization') || ''
      const token = /^Bearer ([^\s]+)$/i.exec(authorization)?.[1]
      if (!token || token.length > 16384) {
        throw new AssistantError('unauthenticated', 'Sign in to your account to use the history assistant.', 401)
      }
      const uid = await verifyToken(token, env.FIREBASE_PROJECT_ID)
      const messages = validateMessages(await readJson(request))
      await reserveQuota(env, uid)
      return json(await generateReply(env.AI, env.AI_MODEL, messages))
    } catch (error) {
      const safe = error instanceof AssistantError ? error : new AssistantError('unavailable', 'The assistant is temporarily unavailable. Please try again later.', 503)
      if (Number.isFinite(safe.retryAfter) && safe.retryAfter > 0) {
        headers['Retry-After'] = String(Math.ceil(safe.retryAfter))
      }
      return json({ error: { code: safe.code, message: safe.message } }, safe.status)
    }
  }
}

export default { fetch: createHandler() }
