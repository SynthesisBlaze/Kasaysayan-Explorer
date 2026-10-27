import { inject, Injectable } from '@angular/core'
import { AngularFireAuth } from '@angular/fire/compat/auth'
import { environment } from '../../environments/environment'

export interface AssistantMessage {
  role: 'user' | 'model'
  text: string
}

export interface AssistantReply {
  text: string
  truncated: boolean
}

export const ASSISTANT_MESSAGE_MAX = 4000
const CONVERSATION_MAX = 24000

class AssistantRequestError extends Error {
  constructor(readonly code: string) {
    super(code)
  }
}

export function buildAssistantConversation(history: AssistantMessage[], question: string): AssistantMessage[] {
  const messages = history.slice(-18).map(({ role, text }) => ({ role, text }))
  while (messages.length && messages.reduce((total, message) => total + message.text.length, 0) + question.length > CONVERSATION_MAX) {
    messages.splice(0, 2)
  }
  return [...messages, { role: 'user', text: question }]
}

export function assistantErrorMessage(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
  switch (code) {
    case 'unauthenticated':
      return 'Your session has expired or you are signed out. Please sign in again.'
    case 'resource-exhausted':
      return 'The assistant usage limit or free AI allowance has been reached. Please try again later.'
    case 'deadline-exceeded':
      return 'The assistant took too long to reply. Please try again.'
    case 'unavailable':
      return 'The assistant could not be reached. Check your internet connection and try again later.'
    case 'not-configured':
    case 'not-found':
      return 'The assistant is not configured yet. Please contact the app administrator.'
    case 'permission-denied':
      return 'This app address is not allowed by the assistant. Please contact the app administrator.'
    case 'invalid-argument':
      return 'The conversation is too long or invalid. Shorten your question or start a new chat.'
    default:
      return 'Could not get an answer. Please try again later.'
  }
}

@Injectable({ providedIn: 'root' })
export class HistoryAssistantService {
  private auth = inject(AngularFireAuth)

  async ask(history: AssistantMessage[], question: string): Promise<AssistantReply> {
    const text = question.trim()
    if (!text || text.length > ASSISTANT_MESSAGE_MAX) {
      throw new Error(`Enter a question of up to ${ASSISTANT_MESSAGE_MAX} characters.`)
    }
    const endpoint = environment.assistant.endpoint.trim()
    if (!endpoint) {
      throw new Error(assistantErrorMessage({ code: 'not-configured' }))
    }
    let url: URL
    try {
      url = new URL(endpoint)
      const local = !environment.production && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password) {
        throw new Error('Invalid assistant URL')
      }
    } catch {
      throw new Error(assistantErrorMessage({ code: 'not-configured' }))
    }

    let timer: ReturnType<typeof setTimeout> | undefined
    const controller = new AbortController()
    try {
      const user = await this.auth.currentUser
      if (!user || user.isAnonymous) {
        throw new AssistantRequestError('unauthenticated')
      }
      const token = await user.getIdToken()
      timer = setTimeout(() => controller.abort(), 55000)
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ messages: buildAssistantConversation(history, text) }),
        signal: controller.signal,
        credentials: 'omit',
        redirect: 'error',
        cache: 'no-store'
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        const codes: Record<number, string> = {
          400: 'invalid-argument', 401: 'unauthenticated', 403: 'permission-denied',
          404: 'not-found', 413: 'invalid-argument', 429: 'resource-exhausted', 504: 'deadline-exceeded'
        }
        throw new AssistantRequestError(typeof data?.error?.code === 'string' ? data.error.code : codes[response.status] || 'unavailable')
      }
      const data: unknown = await response.json()
      if (!data || typeof data !== 'object' || !('text' in data) || typeof data.text !== 'string' ||
          !data.text.trim() || data.text.length > ASSISTANT_MESSAGE_MAX) {
        throw new AssistantRequestError('unavailable')
      }
      return { text: data.text, truncated: 'truncated' in data && data.truncated === true }
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error(assistantErrorMessage({ code: 'deadline-exceeded' }))
      }
      if (error instanceof TypeError) {
        throw new Error(assistantErrorMessage({ code: 'unavailable' }))
      }
      throw new Error(assistantErrorMessage(error))
    } finally {
      clearTimeout(timer)
    }
  }
}
