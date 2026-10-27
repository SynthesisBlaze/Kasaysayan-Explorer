import { ComponentFixture, TestBed } from '@angular/core/testing'
import { AngularFireAuth } from '@angular/fire/compat/auth'
import { BehaviorSubject } from 'rxjs'
import { AssistantReply, HistoryAssistantService } from '../services/history-assistant.service'
import { AssistantPage } from './assistant.page'

describe('AssistantPage', () => {
  let fixture: ComponentFixture<AssistantPage>
  let page: AssistantPage
  let authState: BehaviorSubject<{ uid: string; isAnonymous: boolean } | null>
  let assistant: jasmine.SpyObj<HistoryAssistantService>

  beforeEach(async () => {
    authState = new BehaviorSubject<{ uid: string; isAnonymous: boolean } | null>({ uid: 'member', isAnonymous: false })
    assistant = jasmine.createSpyObj<HistoryAssistantService>('HistoryAssistantService', ['ask'])
    await TestBed.configureTestingModule({
      imports: [AssistantPage],
      providers: [
        { provide: AngularFireAuth, useValue: { authState } },
        { provide: HistoryAssistantService, useValue: assistant }
      ]
    }).overrideComponent(AssistantPage, {
      set: {
        template: '',
        providers: [
          { provide: AngularFireAuth, useValue: { authState } },
          { provide: HistoryAssistantService, useValue: assistant }
        ]
      }
    }).compileComponents()
    fixture = TestBed.createComponent(AssistantPage)
    page = fixture.componentInstance
    fixture.detectChanges()
  })

  it('adds the question and reply and clears the composer', async () => {
    assistant.ask.and.resolveTo({ text: 'A history answer', truncated: false })
    page.prompt = '  What happened in Mactan?  '
    await page.send()
    expect(assistant.ask).toHaveBeenCalledOnceWith([], 'What happened in Mactan?')
    expect(page.messages.map(message => message.role)).toEqual(['user', 'model'])
    expect(page.prompt).toBe('')
    expect(page.busy).toBeFalse()
  })

  it('restores a failed question for retry without leaving an unmatched history message', async () => {
    assistant.ask.and.rejectWith(new Error('Please try again'))
    page.prompt = 'A question'
    await page.send()
    expect(page.messages).toEqual([])
    expect(page.prompt).toBe('A question')
    expect(page.error).toBe('Please try again')
    expect(page.canSend).toBeTrue()
  })

  it('does not send twice or restore an old account conversation after sign-out', async () => {
    let resolve!: (reply: AssistantReply) => void
    assistant.ask.and.returnValue(new Promise<AssistantReply>(done => { resolve = done }))
    page.prompt = 'A question'
    const pending = page.send()
    await page.send()
    expect(assistant.ask).toHaveBeenCalledTimes(1)
    authState.next({ uid: 'guest', isAnonymous: true })
    resolve({ text: 'A late reply', truncated: false })
    await pending
    expect(page.messages).toEqual([])
    expect(page.signedIn).toBeFalse()
    expect(page.canSend).toBeFalse()
  })

  it('ignores replies after the page is destroyed', async () => {
    let resolve!: (reply: AssistantReply) => void
    assistant.ask.and.returnValue(new Promise<AssistantReply>(done => { resolve = done }))
    page.prompt = 'A question'
    const pending = page.send()
    fixture.destroy()
    resolve({ text: 'A late reply', truncated: false })
    await pending
    expect(page.messages.some(message => message.role === 'model')).toBeFalse()
  })

  it('explains shortened answers and lets the learner start fresh', async () => {
    assistant.ask.and.resolveTo({ text: 'A shortened answer', truncated: true })
    page.prompt = 'A question'
    await page.send()
    expect(page.notice).toContain('shortened')
    page.newChat()
    expect(page.messages).toEqual([])
    expect(page.notice).toBe('')
    expect(page.error).toBe('')
  })
})
