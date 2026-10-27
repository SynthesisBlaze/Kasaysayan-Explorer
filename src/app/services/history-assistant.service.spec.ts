import { fakeAsync, TestBed, tick } from '@angular/core/testing'
import { AngularFireAuth } from '@angular/fire/compat/auth'
import { environment } from '../../environments/environment'
import {
  AssistantMessage,
  HistoryAssistantService,
  assistantErrorMessage,
  buildAssistantConversation
} from './history-assistant.service'

describe('buildAssistantConversation', () => {
  const exchanges = (count: number, text = 'A history question'): AssistantMessage[] =>
    Array.from({ length: count * 2 }, (_, index) => ({ role: index % 2 ? 'model' : 'user', text }))

  it('sends a first question without previous messages', () => {
    expect(buildAssistantConversation([], 'Hello')).toEqual([{ role: 'user', text: 'Hello' }])
  })

  it('keeps only the latest nine complete exchanges without mutating the transcript', () => {
    const history = exchanges(12)
    const messages = buildAssistantConversation(history, 'A follow-up')
    expect(messages.length).toBe(19)
    expect(messages[0].role).toBe('user')
    expect(messages[17].role).toBe('model')
    expect(messages[18].text).toBe('A follow-up')
    expect(history.length).toBe(24)
  })

  it('removes complete exchanges to stay within the conversation character budget', () => {
    const messages = buildAssistantConversation(exchanges(9, 'x'.repeat(4000)), 'y'.repeat(4000))
    expect(messages.length % 2).toBe(1)
    expect(messages[0].role).toBe('user')
    expect(messages.reduce((length, message) => length + message.text.length, 0)).toBeLessThanOrEqual(24000)
  })
})

describe('assistantErrorMessage', () => {
  it('explains account, quota, network, and configuration errors', () => {
    expect(assistantErrorMessage({ code: 'unauthenticated' })).toContain('sign in again')
    expect(assistantErrorMessage({ code: 'resource-exhausted' })).toContain('free AI allowance')
    expect(assistantErrorMessage({ code: 'unavailable' })).toContain('internet connection')
    expect(assistantErrorMessage({ code: 'not-configured' })).toContain('not configured yet')
    expect(assistantErrorMessage({ code: 'permission-denied' })).toContain('app address')
  })

  it('does not expose raw errors', () => {
    expect(assistantErrorMessage(new Error('private token'))).not.toContain('private')
    expect(assistantErrorMessage(null)).toBe('Could not get an answer. Please try again later.')
  })
})

describe('HistoryAssistantService', () => {
  interface TestUser {
    isAnonymous: boolean
    getIdToken: jasmine.Spy
  }
  const auth = { currentUser: Promise.resolve<TestUser | null>(null) }
  const originalEndpoint = environment.assistant.endpoint
  const originalProduction = environment.production
  let service: HistoryAssistantService
  let fetchSpy: jasmine.Spy
  let user: TestUser

  beforeEach(() => {
    environment.assistant.endpoint = 'https://assistant.example.com/chat'
    user = { isAnonymous: false, getIdToken: jasmine.createSpy('getIdToken').and.resolveTo('test-id-token') }
    auth.currentUser = Promise.resolve(user)
    fetchSpy = spyOn(window, 'fetch')
    TestBed.configureTestingModule({ providers: [{ provide: AngularFireAuth, useValue: auth }] })
    service = TestBed.inject(HistoryAssistantService)
  })

  afterEach(() => {
    environment.assistant.endpoint = originalEndpoint
    environment.production = originalProduction
  })

  it('rejects empty and overlong questions before making a request', async () => {
    await expectAsync(service.ask([], '  ')).toBeRejectedWithError(/up to 4000 characters/)
    await expectAsync(service.ask([], 'x'.repeat(4001))).toBeRejectedWithError(/up to 4000 characters/)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('requires a registered account', async () => {
    auth.currentUser = Promise.resolve(null)
    await expectAsync(service.ask([], 'Hello')).toBeRejectedWithError(/sign in again/)
    auth.currentUser = Promise.resolve({ ...user, isAnonymous: true })
    await expectAsync(service.ask([], 'Hello')).toBeRejectedWithError(/sign in again/)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('rejects missing, insecure, credential-bearing, and malformed endpoints', async () => {
    for (const endpoint of ['', 'bad URL', 'http://external.example.com/chat', 'https://user:secret@example.com/chat']) {
      environment.assistant.endpoint = endpoint
      await expectAsync(service.ask([], 'Hello')).toBeRejectedWithError(/not configured yet/)
    }
    environment.production = true
    environment.assistant.endpoint = 'http://localhost:8787/chat'
    await expectAsync(service.ask([], 'Hello')).toBeRejectedWithError(/not configured yet/)
    expect(user.getIdToken).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('posts the Firebase ID token and bounded conversation to the Worker', async () => {
    fetchSpy.and.resolveTo(new Response(JSON.stringify({ text: 'A history answer', truncated: false })))
    const history: AssistantMessage[] = [{ role: 'user', text: 'First question' }, { role: 'model', text: 'First answer' }]
    expect(await service.ask(history, ' Follow-up ')).toEqual({ text: 'A history answer', truncated: false })
    expect(user.getIdToken).toHaveBeenCalledOnceWith()
    const [url, init] = fetchSpy.calls.mostRecent().args as [string, RequestInit]
    expect(url).toBe('https://assistant.example.com/chat')
    expect(init.headers).toEqual({ 'Content-Type': 'application/json', 'Authorization': 'Bearer test-id-token' })
    expect(init.redirect).toBe('error')
    expect(init.credentials).toBe('omit')
    expect(JSON.parse(String(init.body)).messages).toEqual([...history, { role: 'user', text: 'Follow-up' }])
  })

  it('maps Worker errors without displaying upstream details', async () => {
    fetchSpy.and.resolveTo(new Response(JSON.stringify({ error: { code: 'resource-exhausted', message: 'private upstream details' } }), { status: 429 }))
    await expectAsync(service.ask([], 'Hello')).toBeRejectedWithError(/free AI allowance/)
    fetchSpy.and.resolveTo(new Response('not JSON', { status: 401 }))
    await expectAsync(service.ask([], 'Hello')).toBeRejectedWithError(/sign in again/)
  })

  it('handles offline, unreadable, empty, and overlong replies', async () => {
    fetchSpy.and.rejectWith(new TypeError('Failed to fetch'))
    await expectAsync(service.ask([], 'Hello')).toBeRejectedWithError(/internet connection/)
    for (const body of ['not JSON', '{}', JSON.stringify({ text: '' }), JSON.stringify({ text: 'x'.repeat(4001) })]) {
      fetchSpy.and.resolveTo(new Response(body))
      await expectAsync(service.ask([], 'Hello')).toBeRejected()
    }
  })

  it('aborts slow requests and shows a retryable timeout', fakeAsync(() => {
    let message = ''
    fetchSpy.and.callFake((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    }))
    void service.ask([], 'Hello').catch(error => { message = error.message })
    tick()
    tick(55000)
    expect(message).toContain('took too long')
  }))
})
