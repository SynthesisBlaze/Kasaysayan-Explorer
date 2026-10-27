import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose'
import { verifyFirebaseToken } from '../src/auth.js'

const project = 'kasaysayan-explorer'
const { publicKey, privateKey } = await generateKeyPair('RS256')
const key = { ...await exportJWK(publicKey), kid: 'test-key', alg: 'RS256' }
const keys = createLocalJWKSet({ keys: [key] })
const now = Math.floor(Date.now() / 1000)
const claims = {
  sub: 'member-123', aud: project, iss: `https://securetoken.google.com/${project}`,
  iat: now - 10, exp: now + 3600, auth_time: now - 60, firebase: { sign_in_provider: 'password' }
}
const sign = payload => new SignJWT(payload).setProtectedHeader({ alg: 'RS256', kid: 'test-key' }).sign(privateKey)
const unauthenticated = error => error.code === 'unauthenticated' && error.status === 401

test('verifies a signed registered Firebase account token', async () => {
  assert.equal(await verifyFirebaseToken(await sign(claims), project, keys), 'member-123')
})

test('rejects expired, wrong-project, anonymous, missing, and future-dated claims', async () => {
  for (const overrides of [
    { exp: now - 30 }, { aud: 'another-project' }, { iss: 'https://attacker.example' },
    { sub: '' }, { sub: 'x'.repeat(129) }, { firebase: { sign_in_provider: 'anonymous' } },
    { firebase: null }, { iat: now + 3600 }, { auth_time: now + 3600 }, { exp: undefined }, { auth_time: undefined }
  ]) {
    await assert.rejects(verifyFirebaseToken(await sign({ ...claims, ...overrides }), project, keys), unauthenticated)
  }
})

test('rejects malformed and forged signatures', async () => {
  const other = await generateKeyPair('RS256')
  const forged = await new SignJWT(claims).setProtectedHeader({ alg: 'RS256', kid: 'test-key' }).sign(other.privateKey)
  await assert.rejects(verifyFirebaseToken(forged, project, keys), unauthenticated)
  const wrongAlgorithm = await new SignJWT(claims).setProtectedHeader({ alg: 'HS256', kid: 'test-key' }).sign(new Uint8Array(32))
  await assert.rejects(verifyFirebaseToken(wrongAlgorithm, project, keys), unauthenticated)
  await assert.rejects(verifyFirebaseToken('not.a.valid.jwt', project, keys), unauthenticated)
})

test('fails closed if key lookup is unavailable and requires project configuration', async () => {
  await assert.rejects(verifyFirebaseToken(await sign(claims), project, async () => { throw new TypeError('network failed') }), error => error.code === 'unavailable')
  await assert.rejects(verifyFirebaseToken('token', ''), error => error.code === 'not-configured')
})
